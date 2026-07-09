# frozen_string_literal: true

require "rails_helper"

RSpec.describe "rsvp mutation" do
  let(:mutation) do
    <<~GRAPHQL
      mutation Rsvp($token: String!, $response: String!, $nickname: String) {
        rsvp(token: $token, response: $response, nickname: $nickname) {
          attendance {
            id
            response
            user {
              id
              username
              displayName
              isProvisional
            }
          }
          session {
            id
            title
            attendeeCount
          }
        }
      }
    GRAPHQL
  end

  let(:owner) { User.create!(username: "alice", email: "alice@example.com", password: "password") }
  let(:group) { Group.create!(name: "Night Owls", owner: owner) }
  let(:session) { NightSession.create!(title: "Friday Games", group: group, host: owner, state: "invited") }
  let(:raw_token) { "abc123def456" }
  let(:invite) do
    InviteToken.create!(
      group: group,
      inviter: owner,
      email: "friend@example.com",
      night_session: session,
      token_digest: Digest::SHA256.hexdigest(raw_token),
      status: "pending",
      expires_at: 7.days.from_now
    )
  end

  it "creates a provisional user and a going attendance for a valid token" do
    invite

    expect {
      result = BoardgameNightSchema.execute(
        mutation,
        variables: { token: raw_token, response: "going", nickname: "Friendly Guest" },
        context: {}
      )
      expect(result["errors"]).to be_nil
      data = result.dig("data", "rsvp")
      expect(data["attendance"]["response"]).to eq("going")
      expect(data["attendance"]["user"]["isProvisional"]).to be true
      expect(data["attendance"]["user"]["displayName"]).to eq("Friendly Guest")
      expect(data["session"]["attendeeCount"]).to eq(1)
    }.to change(User, :count).by(1).and change(Attendance, :count).by(1)

    invite.reload
    expect(invite.status).to eq("rsvped")
  end

  it "creates a not_going attendance without increasing attendee count" do
    invite

    result = BoardgameNightSchema.execute(
      mutation,
      variables: { token: raw_token, response: "not_going" },
      context: {}
    )
    expect(result["errors"]).to be_nil
    data = result.dig("data", "rsvp")
    expect(data["attendance"]["response"]).to eq("not_going")
    expect(data["session"]["attendeeCount"]).to eq(0)
  end

  it "returns an error for an expired token" do
    invite.update!(expires_at: 1.minute.ago)

    result = BoardgameNightSchema.execute(
      mutation,
      variables: { token: raw_token, response: "going" },
      context: {}
    )
    expect(result["errors"]).to be_present
    expect(result["errors"].first["message"]).to match(/Invite has expired/i)
  end

  it "returns an error for an already-used token" do
    invite.update!(status: "rsvped")

    result = BoardgameNightSchema.execute(
      mutation,
      variables: { token: raw_token, response: "going" },
      context: {}
    )
    expect(result["errors"]).to be_present
    expect(result["errors"].first["message"]).to match(/Invite already used/i)
  end

  it "returns an error for a non-existent token" do
    result = BoardgameNightSchema.execute(
      mutation,
      variables: { token: "not-a-real-token", response: "going" },
      context: {}
    )
    expect(result["errors"]).to be_present
    expect(result["errors"].first["message"]).to match(/Invalid invite/i)
  end

  it "reuses an existing user when the email already exists" do
    existing = User.create!(username: "existing", email: "friend@example.com", password: "password")
    invite

    expect {
      result = BoardgameNightSchema.execute(
        mutation,
        variables: { token: raw_token, response: "going" },
        context: {}
      )
      expect(result["errors"]).to be_nil
      data = result.dig("data", "rsvp")
      expect(data["attendance"]["user"]["id"]).to eq(existing.id.to_s)
    }.not_to change(User, :count)
  end

  it "returns an error for an invalid response" do
    result = BoardgameNightSchema.execute(
      mutation,
      variables: { token: raw_token, response: "maybe" },
      context: {}
    )
    expect(result["errors"]).to be_present
  end
end
