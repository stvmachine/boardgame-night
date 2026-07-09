# frozen_string_literal: true

require "rails_helper"

RSpec.describe "scheduleSession mutation" do
  let(:mutation) do
    <<~GRAPHQL
      mutation ScheduleSession($sessionId: ID!, $scheduledAt: ISO8601DateTime, $location: String, $capacity: Int) {
        scheduleSession(sessionId: $sessionId, scheduledAt: $scheduledAt, location: $location, capacity: $capacity) {
          session {
            id
            title
            state
            scheduledAt
            location
            capacity
          }
          invitesSent
        }
      }
    GRAPHQL
  end

  let(:owner) { User.create!(username: "alice", email: "alice@example.com", password: "password") }
  let(:member) { User.create!(username: "bob", email: "bob@example.com", password: "password") }
  let(:group) { Group.create!(name: "Night Owls", owner: owner) }
  let(:session) { NightSession.create!(title: "Friday Games", group: group, host: owner, state: "draft") }
  let(:context) { { current_user: owner } }

  before do
    GroupMembership.create!(user: owner, group: group, role: "owner")
    GroupMembership.create!(user: member, group: group, role: "member")
  end

  it "transitions a draft session to invited and creates invite tokens" do
    expect {
      result = BoardgameNightSchema.execute(
        mutation,
        variables: {
          sessionId: session.id.to_s,
          scheduledAt: "2026-07-15T19:00:00Z",
          location: "Alice's place",
          capacity: 6
        },
        context: context
      )
      expect(result["errors"]).to be_nil
      data = result.dig("data", "scheduleSession")
      expect(data["session"]["state"]).to eq("INVITED")
      expect(data["session"]["scheduledAt"]).to eq("2026-07-15T19:00:00Z")
      expect(data["session"]["location"]).to eq("Alice's place")
      expect(data["session"]["capacity"]).to eq(6)
      expect(data["invitesSent"]).to eq(1)
    }.to change(InviteToken, :count).by(1)
      .and change { session.reload.state }.from("draft").to("invited")
  end

  it "enqueues an InviteMailerJob for each invite" do
    expect {
      BoardgameNightSchema.execute(
        mutation,
        variables: { sessionId: session.id.to_s, scheduledAt: "2026-07-15T19:00:00Z" },
        context: context
      )
    }.to have_enqueued_job(InviteMailerJob).exactly(:once)
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

  it "returns an error when scheduling from a non-draft state" do
    session.update!(state: "invited")

    result = BoardgameNightSchema.execute(
      mutation,
      variables: { sessionId: session.id.to_s },
      context: context
    )
    expect(result["errors"]).to be_present
    expect(result["errors"].first["message"]).to match(/cannot be scheduled from invited/i)
  end

  it "skips the host when creating invites" do
    another_member = User.create!(username: "dave", email: "dave@example.com", password: "password")
    GroupMembership.create!(user: another_member, group: group, role: "member")

    result = BoardgameNightSchema.execute(
      mutation,
      variables: { sessionId: session.id.to_s },
      context: context
    )
    expect(result["errors"]).to be_nil
    data = result.dig("data", "scheduleSession")
    expect(data["invitesSent"]).to eq(2)
  end
end
