# frozen_string_literal: true

require "rails_helper"

RSpec.describe "startPicking mutation" do
  let(:mutation) do
    <<~GRAPHQL
      mutation StartPicking($sessionId: ID!) {
        startPicking(sessionId: $sessionId) {
          session {
            id
            title
            state
          }
        }
      }
    GRAPHQL
  end

  let(:owner) { User.create!(username: "alice", email: "alice@example.com", password: "password") }
  let(:member) { User.create!(username: "bob", email: "bob@example.com", password: "password") }
  let(:group) { Group.create!(name: "Night Owls", owner: owner) }
  let(:session) { NightSession.create!(title: "Friday Games", group: group, host: owner, state: "invited") }
  let(:context) { { current_user: owner } }

  before do
    GroupMembership.create!(user: owner, group: group, role: "owner")
    GroupMembership.create!(user: member, group: group, role: "member")
  end

  it "transitions an invited session to picking" do
    result = BoardgameNightSchema.execute(
      mutation,
      variables: { sessionId: session.id.to_s },
      context: context
    )
    expect(result["errors"]).to be_nil
    data = result.dig("data", "startPicking", "session")
    expect(data["state"]).to eq("PICKING")
    expect(session.reload.state).to eq("picking")
  end

  it "requires authentication" do
    result = BoardgameNightSchema.execute(
      mutation,
      variables: { sessionId: session.id.to_s },
      context: {}
    )
    expect(result["errors"]).to be_present
    expect(result["errors"].first["message"]).to match(/Authentication required/i)
  end

  it "requires caller to be the session host" do
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

  it "returns an error when starting picking from a non-invited state" do
    session.update!(state: "draft")

    result = BoardgameNightSchema.execute(
      mutation,
      variables: { sessionId: session.id.to_s },
      context: context
    )
    expect(result["errors"]).to be_present
    expect(result["errors"].first["message"]).to match(/cannot start picking from draft/i)
  end
end
