# frozen_string_literal: true

require "rails_helper"

RSpec.describe "cancelSession mutation" do
  let(:mutation) do
    <<~GRAPHQL
      mutation CancelSession($sessionId: ID!) {
        cancelSession(sessionId: $sessionId) {
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

  %w[draft invited picking].each do |state|
    it "cancels a #{state} session and stores previous_state" do
      session = NightSession.create!(title: "Friday Games", group: group, host: owner, state: state)

      result = BoardgameNightSchema.execute(
        mutation,
        variables: { sessionId: session.id.to_s },
        context: context
      )
      expect(result["errors"]).to be_nil
      data = result.dig("data", "cancelSession", "session")
      expect(data["state"]).to eq("CANCELLED")
      expect(data["previousState"]).to eq(state)
      expect(session.reload.state).to eq("cancelled")
      expect(session.previous_state).to eq(state)
    end
  end

  it "returns an error when cancelling a completed session" do
    session = NightSession.create!(title: "Friday Games", group: group, host: owner, state: "completed")

    result = BoardgameNightSchema.execute(
      mutation,
      variables: { sessionId: session.id.to_s },
      context: context
    )
    expect(result["errors"]).to be_present
    expect(result["errors"].first["message"]).to match(/cannot be cancelled from completed/i)
    expect(session.reload.state).to eq("completed")
  end

  it "requires authentication" do
    session = NightSession.create!(title: "Friday Games", group: group, host: owner, state: "draft")

    result = BoardgameNightSchema.execute(
      mutation,
      variables: { sessionId: session.id.to_s },
      context: {}
    )
    expect(result["errors"]).to be_present
    expect(result["errors"].first["message"]).to match(/Authentication required/i)
  end

  it "requires caller to be the session host" do
    session = NightSession.create!(title: "Friday Games", group: group, host: owner, state: "draft")
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
