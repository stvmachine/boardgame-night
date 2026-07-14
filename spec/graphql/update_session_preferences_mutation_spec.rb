# frozen_string_literal: true

require "rails_helper"

RSpec.describe "updateSessionPreferences mutation" do
  let(:mutation) do
    <<~GRAPHQL
      mutation UpdateSessionPreferences($sessionId: ID!, $timeBudgetMinutes: Int, $complexityPreference: String) {
        updateSessionPreferences(sessionId: $sessionId, timeBudgetMinutes: $timeBudgetMinutes, complexityPreference: $complexityPreference) {
          session {
            id
            state
            timeBudgetMinutes
            complexityPreference
          }
        }
      }
    GRAPHQL
  end

  let(:owner) { User.create!(username: "alice", email: "alice@example.com", password: "password") }
  let(:member) { User.create!(username: "bob", email: "bob@example.com", password: "password") }
  let(:group) { Group.create!(name: "Night Owls", owner: owner) }
  let(:context) { { current_user: owner } }

  before do
    GroupMembership.create!(user: owner, group: group, role: "owner")
    GroupMembership.create!(user: member, group: group, role: "member")
  end

  it "updates preferences in draft state" do
    session = NightSession.create!(title: "Draft", group: group, host: owner, state: "draft", time_budget_minutes: 120, complexity_preference: "Any")

    result = BoardgameNightSchema.execute(
      mutation,
      variables: { sessionId: session.id.to_s, timeBudgetMinutes: 90, complexityPreference: "Medium" },
      context: context
    )
    expect(result["errors"]).to be_nil
    data = result.dig("data", "updateSessionPreferences", "session")
    expect(data["timeBudgetMinutes"]).to eq(90)
    expect(data["complexityPreference"]).to eq("Medium")
    expect(data["state"]).to eq("DRAFT")
  end

  it "updates preferences in invited state" do
    session = NightSession.create!(title: "Invited", group: group, host: owner, state: "invited", time_budget_minutes: 120, complexity_preference: "Any")

    result = BoardgameNightSchema.execute(
      mutation,
      variables: { sessionId: session.id.to_s, timeBudgetMinutes: 60, complexityPreference: "Light" },
      context: context
    )
    expect(result["errors"]).to be_nil
    data = result.dig("data", "updateSessionPreferences", "session")
    expect(data["timeBudgetMinutes"]).to eq(60)
    expect(data["complexityPreference"]).to eq("Light")
  end

  it "updates only the supplied preference" do
    session = NightSession.create!(title: "Partial", group: group, host: owner, state: "draft", time_budget_minutes: 120, complexity_preference: "Any")

    result = BoardgameNightSchema.execute(
      mutation,
      variables: { sessionId: session.id.to_s, timeBudgetMinutes: 75 },
      context: context
    )
    expect(result["errors"]).to be_nil
    data = result.dig("data", "updateSessionPreferences", "session")
    expect(data["timeBudgetMinutes"]).to eq(75)
    expect(data["complexityPreference"]).to eq("Any")
  end

  it "requires authentication" do
    session = NightSession.create!(title: "Draft", group: group, host: owner, state: "draft")

    result = BoardgameNightSchema.execute(
      mutation,
      variables: { sessionId: session.id.to_s, timeBudgetMinutes: 90 },
      context: {}
    )
    expect(result["errors"]).to be_present
    expect(result["errors"].first["message"]).to match(/Authentication required/i)
    expect(session.reload.time_budget_minutes).to eq(120)
  end

  it "requires caller to be the session host" do
    session = NightSession.create!(title: "Draft", group: group, host: owner, state: "draft")

    result = BoardgameNightSchema.execute(
      mutation,
      variables: { sessionId: session.id.to_s, timeBudgetMinutes: 90 },
      context: { current_user: member }
    )
    expect(result["errors"]).to be_present
    expect(result["errors"].first["message"]).to match(/must be the session host/i)
    expect(session.reload.time_budget_minutes).to eq(120)
  end

  it "rejects an empty update" do
    session = NightSession.create!(title: "Draft", group: group, host: owner, state: "draft")

    result = BoardgameNightSchema.execute(
      mutation,
      variables: { sessionId: session.id.to_s },
      context: context
    )
    expect(result["errors"]).to be_present
    expect(result["errors"].first["message"]).to match(/at least one preference/i)
    expect(session.reload.time_budget_minutes).to eq(120)
    expect(session.complexity_preference).to eq("Any")
  end

  it "rejects a non-positive time budget" do
    session = NightSession.create!(title: "Draft", group: group, host: owner, state: "draft")

    result = BoardgameNightSchema.execute(
      mutation,
      variables: { sessionId: session.id.to_s, timeBudgetMinutes: 0 },
      context: context
    )
    expect(result["errors"]).to be_present
    expect(result["errors"].first["message"]).to match(/time_budget_minutes/i)
    expect(session.reload.time_budget_minutes).to eq(120)
  end

  it "rejects an unrecognized complexity preference" do
    session = NightSession.create!(title: "Draft", group: group, host: owner, state: "draft")

    result = BoardgameNightSchema.execute(
      mutation,
      variables: { sessionId: session.id.to_s, complexityPreference: "Hard" },
      context: context
    )
    expect(result["errors"]).to be_present
    expect(result["errors"].first["message"]).to match(/complexity_preference/i)
    expect(session.reload.complexity_preference).to eq("Any")
  end

  it "returns an error for a missing session" do
    result = BoardgameNightSchema.execute(
      mutation,
      variables: { sessionId: "nonexistent", timeBudgetMinutes: 90 },
      context: context
    )
    expect(result["errors"]).to be_present
    expect(result["errors"].first["message"]).to match(/Session not found/i)
  end

  it "rejects updates once picking has started" do
    session = NightSession.create!(title: "Picking", group: group, host: owner, state: "picking")

    result = BoardgameNightSchema.execute(
      mutation,
      variables: { sessionId: session.id.to_s, timeBudgetMinutes: 90 },
      context: context
    )
    expect(result["errors"]).to be_present
    expect(result["errors"].first["message"]).to match(/cannot be updated once picking/i)
    expect(session.reload.time_budget_minutes).to eq(120)
  end

  it "rejects updates for completed sessions" do
    session = NightSession.create!(title: "Completed", group: group, host: owner, state: "completed")

    result = BoardgameNightSchema.execute(
      mutation,
      variables: { sessionId: session.id.to_s, timeBudgetMinutes: 90 },
      context: context
    )
    expect(result["errors"]).to be_present
    expect(result["errors"].first["message"]).to match(/cannot be updated once picking/i)
  end

  it "rejects updates for cancelled sessions" do
    session = NightSession.create!(title: "Cancelled", group: group, host: owner, state: "cancelled")

    result = BoardgameNightSchema.execute(
      mutation,
      variables: { sessionId: session.id.to_s, timeBudgetMinutes: 90 },
      context: context
    )
    expect(result["errors"]).to be_present
    expect(result["errors"].first["message"]).to match(/cannot be updated once picking/i)
  end
end
