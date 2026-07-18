# frozen_string_literal: true

require "rails_helper"

RSpec.describe "updateSessionDetails mutation" do
  let(:mutation) do
    <<~GRAPHQL
      mutation UpdateSessionDetails($sessionId: ID!, $title: String, $description: String, $scheduledAt: ISO8601DateTime, $location: String, $capacity: Int) {
        updateSessionDetails(sessionId: $sessionId, title: $title, description: $description, scheduledAt: $scheduledAt, location: $location, capacity: $capacity) {
          session {
            id
            title
            description
            state
            scheduledAt
            location
            capacity
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

  it "updates ordinary details in picking state without changing state or preferences" do
    session = NightSession.create!(
      title: "Picking Night",
      group: group,
      host: owner,
      state: "picking",
      time_budget_minutes: 120,
      complexity_preference: "Any"
    )

    result = BoardgameNightSchema.execute(
      mutation,
      variables: {
        sessionId: session.id.to_s,
        title: "Updated Picking Night",
        location: "Bob's place",
        capacity: 4
      },
      context: context
    )

    expect(result["errors"]).to be_nil
    data = result.dig("data", "updateSessionDetails", "session")
    expect(data["title"]).to eq("Updated Picking Night")
    expect(data["location"]).to eq("Bob's place")
    expect(data["capacity"]).to eq(4)
    expect(data["state"]).to eq("PICKING")
    expect(data["timeBudgetMinutes"]).to eq(120)
    expect(data["complexityPreference"]).to eq("Any")
    expect(session.reload.state).to eq("picking")
  end

  it "updates ordinary details in draft state" do
    session = NightSession.create!(title: "Draft", group: group, host: owner, state: "draft")

    result = BoardgameNightSchema.execute(
      mutation,
      variables: {
        sessionId: session.id.to_s,
        title: "Updated Draft",
        description: "New description"
      },
      context: context
    )

    expect(result["errors"]).to be_nil
    data = result.dig("data", "updateSessionDetails", "session")
    expect(data["title"]).to eq("Updated Draft")
    expect(data["description"]).to eq("New description")
    expect(data["state"]).to eq("DRAFT")
  end

  it "updates ordinary details in invited state" do
    session = NightSession.create!(title: "Invited", group: group, host: owner, state: "invited")

    result = BoardgameNightSchema.execute(
      mutation,
      variables: {
        sessionId: session.id.to_s,
        location: "Alice's place",
        capacity: 6
      },
      context: context
    )

    expect(result["errors"]).to be_nil
    data = result.dig("data", "updateSessionDetails", "session")
    expect(data["location"]).to eq("Alice's place")
    expect(data["capacity"]).to eq(6)
    expect(data["state"]).to eq("INVITED")
  end

  it "leaves omitted fields unchanged" do
    session = NightSession.create!(
      title: "Unchanged",
      description: "Original description",
      group: group,
      host: owner,
      state: "picking",
      location: "Original place",
      capacity: 5,
      time_budget_minutes: 90,
      complexity_preference: "Medium"
    )

    result = BoardgameNightSchema.execute(
      mutation,
      variables: {
        sessionId: session.id.to_s,
        title: "Only title changed"
      },
      context: context
    )

    expect(result["errors"]).to be_nil
    data = result.dig("data", "updateSessionDetails", "session")
    expect(data["title"]).to eq("Only title changed")
    expect(data["description"]).to eq("Original description")
    expect(data["location"]).to eq("Original place")
    expect(data["capacity"]).to eq(5)
    expect(data["timeBudgetMinutes"]).to eq(90)
    expect(data["complexityPreference"]).to eq("Medium")
  end

  it "allows explicit null to clear nullable fields" do
    session = NightSession.create!(
      title: "Clearable",
      description: "Will be cleared",
      group: group,
      host: owner,
      state: "picking",
      location: "Will be cleared",
      capacity: 4,
      scheduled_at: DateTime.parse("2026-07-20T19:00:00Z")
    )

    result = BoardgameNightSchema.execute(
      mutation,
      variables: {
        sessionId: session.id.to_s,
        description: nil,
        scheduledAt: nil,
        location: nil,
        capacity: nil
      },
      context: context
    )

    expect(result["errors"]).to be_nil
    data = result.dig("data", "updateSessionDetails", "session")
    expect(data["description"]).to be_nil
    expect(data["scheduledAt"]).to be_nil
    expect(data["location"]).to be_nil
    expect(data["capacity"]).to be_nil
    expect(data["state"]).to eq("PICKING")
  end

  it "requires authentication" do
    session = NightSession.create!(title: "Draft", group: group, host: owner, state: "draft")

    result = BoardgameNightSchema.execute(
      mutation,
      variables: { sessionId: session.id.to_s, title: "Hacked" },
      context: {}
    )

    expect(result["errors"]).to be_present
    expect(result["errors"].first["message"]).to match(/Authentication required/i)
    expect(session.reload.title).to eq("Draft")
  end

  it "requires caller to be the session host" do
    session = NightSession.create!(title: "Draft", group: group, host: owner, state: "draft")

    result = BoardgameNightSchema.execute(
      mutation,
      variables: { sessionId: session.id.to_s, title: "Hacked" },
      context: { current_user: member }
    )

    expect(result["errors"]).to be_present
    expect(result["errors"].first["message"]).to match(/must be the session host/i)
    expect(session.reload.title).to eq("Draft")
  end

  it "returns an error for a missing session" do
    result = BoardgameNightSchema.execute(
      mutation,
      variables: { sessionId: "nonexistent", title: "Missing" },
      context: context
    )

    expect(result["errors"]).to be_present
    expect(result["errors"].first["message"]).to match(/Session not found/i)
  end

  it "rejects updates for completed sessions" do
    session = NightSession.create!(title: "Completed", group: group, host: owner, state: "completed")

    result = BoardgameNightSchema.execute(
      mutation,
      variables: { sessionId: session.id.to_s, title: "Hacked" },
      context: context
    )

    expect(result["errors"]).to be_present
    expect(result["errors"].first["message"]).to match(/cannot be updated from completed/i)
    expect(session.reload.title).to eq("Completed")
  end

  it "rejects updates for cancelled sessions" do
    session = NightSession.create!(title: "Cancelled", group: group, host: owner, state: "cancelled")

    result = BoardgameNightSchema.execute(
      mutation,
      variables: { sessionId: session.id.to_s, title: "Hacked" },
      context: context
    )

    expect(result["errors"]).to be_present
    expect(result["errors"].first["message"]).to match(/cannot be updated from cancelled/i)
    expect(session.reload.title).to eq("Cancelled")
  end

  it "rejects an empty update" do
    session = NightSession.create!(title: "No-op", group: group, host: owner, state: "picking")

    result = BoardgameNightSchema.execute(
      mutation,
      variables: { sessionId: session.id.to_s },
      context: context
    )

    expect(result["errors"]).to be_present
    expect(result["errors"].first["message"]).to match(/at least one ordinary detail/i)
    expect(session.reload.title).to eq("No-op")
  end

  it "rejects an invalid title length" do
    session = NightSession.create!(title: "Draft", group: group, host: owner, state: "draft")

    result = BoardgameNightSchema.execute(
      mutation,
      variables: { sessionId: session.id.to_s, title: "x" * 201 },
      context: context
    )

    expect(result["errors"]).to be_present
    expect(result["errors"].first["message"]).to match(/title/i)
    expect(session.reload.title).to eq("Draft")
  end

  it "exposes only the allowed arguments" do
    field = BoardgameNightSchema.mutation.fields["updateSessionDetails"]
    expect(field).to be_present
    argument_names = field.arguments.keys
    expect(argument_names).to contain_exactly("sessionId", "title", "description", "scheduledAt", "location", "capacity")
  end

  it "rejects time budget and complexity preference arguments" do
    session = NightSession.create!(title: "Draft", group: group, host: owner, state: "draft")

    result = BoardgameNightSchema.execute(
      <<~GRAPHQL,
        mutation {
          updateSessionDetails(sessionId: "#{session.id}", title: "Safe title", timeBudgetMinutes: 90) {
            session { id }
          }
        }
      GRAPHQL
      context: context
    )

    expect(result["errors"]).to be_present
    expect(result["errors"].first["message"]).to match(/timeBudgetMinutes/i)
    expect(session.reload.title).to eq("Draft")
  end
end
