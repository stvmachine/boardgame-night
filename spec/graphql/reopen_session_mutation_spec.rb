# frozen_string_literal: true

require "rails_helper"

RSpec.describe "reopenSession mutation" do
  let(:mutation) do
    <<~GRAPHQL
      mutation ReopenSession($sessionId: ID!) {
        reopenSession(sessionId: $sessionId) {
          session {
            id
            title
            state
            previousState
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

  %w[draft invited picking].each do |previous_state|
    it "reopens a cancelled session back to #{previous_state}" do
      session = NightSession.create!(
        title: "Friday Games",
        group: group,
        host: owner,
        state: "cancelled",
        previous_state: previous_state
      )

      result = BoardgameNightSchema.execute(
        mutation,
        variables: { sessionId: session.id.to_s },
        context: context
      )
      expect(result["errors"]).to be_nil
      data = result.dig("data", "reopenSession", "session")
      expect(data["state"]).to eq(previous_state.upcase)
      expect(data["previousState"]).to be_nil
      expect(session.reload.state).to eq(previous_state)
      expect(session.previous_state).to be_nil
    end
  end

  it "reopens to draft when previous_state is unknown" do
    session = NightSession.create!(
      title: "Friday Games",
      group: group,
      host: owner,
      state: "cancelled"
    )

    result = BoardgameNightSchema.execute(
      mutation,
      variables: { sessionId: session.id.to_s },
      context: context
    )
    expect(result["errors"]).to be_nil
    data = result.dig("data", "reopenSession", "session")
    expect(data["state"]).to eq("DRAFT")
    expect(session.reload.state).to eq("draft")
  end

  it "returns an error when reopening a non-cancelled session" do
    session = NightSession.create!(title: "Friday Games", group: group, host: owner, state: "invited")

    result = BoardgameNightSchema.execute(
      mutation,
      variables: { sessionId: session.id.to_s },
      context: context
    )
    expect(result["errors"]).to be_present
    expect(result["errors"].first["message"]).to match(/cannot be reopened from invited/i)
    expect(session.reload.state).to eq("invited")
  end

  it "requires authentication" do
    session = NightSession.create!(title: "Friday Games", group: group, host: owner, state: "cancelled")

    result = BoardgameNightSchema.execute(
      mutation,
      variables: { sessionId: session.id.to_s },
      context: {}
    )
    expect(result["errors"]).to be_present
    expect(result["errors"].first["message"]).to match(/Authentication required/i)
  end

  it "requires caller to be the session host" do
    session = NightSession.create!(title: "Friday Games", group: group, host: owner, state: "cancelled")
    other = User.create!(username: "carol", email: "carol@example.com", password: "password")
    GroupMembership.create!(user: other, group: group, role: "member")

    result = BoardgameNightSchema.execute(
      mutation,
      variables: { sessionId: session.id.to_s },
      context: { current_user: other }
    )
    expect(result["errors"]).to be_present
    expect(result["errors"].first["message"]).to match(/must be the session host/i)
  end
end
