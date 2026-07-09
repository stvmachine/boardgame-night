# frozen_string_literal: true

require "rails_helper"

RSpec.describe "acceptGroupInvite mutation" do
  let(:mutation) do
    <<~GRAPHQL
      mutation AcceptGroupInvite($token: String!) {
        acceptGroupInvite(token: $token) {
          group {
            id
            name
            members {
              id
              username
            }
          }
        }
      }
    GRAPHQL
  end

  let(:owner) { User.create!(username: "owner", email: "owner@example.com", password: "password") }
  let(:group) { Group.create!(name: "Night Owls", owner: owner) }

  before do
    GroupMembership.create!(user: owner, group: group, role: "owner")
  end

  def create_invite(email: "friend@example.com", role: "member", expires_at: 7.days.from_now)
    raw_token, digest = InviteToken.generate_raw_token
    [raw_token, InviteToken.create!(
      group: group,
      inviter: owner,
      email: email,
      role: role,
      token_digest: digest,
      status: "pending",
      expires_at: expires_at
    )]
  end

  it "creates a membership with the token role" do
    raw_token, _invite = create_invite(role: "admin")
    invitee = User.create!(username: "invitee", email: "invitee@example.com", password: "password")

    expect {
      result = BoardgameNightSchema.execute(mutation, variables: { token: raw_token }, context: { current_user: invitee })
      expect(result["errors"]).to be_nil
      data = result.dig("data", "acceptGroupInvite", "group")
      expect(data["members"].map { |m| m["username"] }).to include("invitee")
    }.to change(GroupMembership, :count).by(1)

    membership = GroupMembership.find_by(user: invitee, group: group)
    expect(membership.role).to eq("admin")
  end

  it "rejects an expired token" do
    raw_token, _invite = create_invite(expires_at: 1.minute.ago)
    invitee = User.create!(username: "invitee", email: "invitee@example.com", password: "password")

    result = BoardgameNightSchema.execute(mutation, variables: { token: raw_token }, context: { current_user: invitee })
    expect(result["errors"]).to be_present
    expect(result["errors"].first["message"]).to match(/Invite has expired/i)
  end

  it "rejects an already-used token" do
    raw_token, invite = create_invite
    invitee = User.create!(username: "invitee", email: "invitee@example.com", password: "password")
    invite.update!(status: "accepted", accepted_by: invitee, accepted_at: Time.current)

    result = BoardgameNightSchema.execute(mutation, variables: { token: raw_token }, context: { current_user: invitee })
    expect(result["errors"]).to be_present
    expect(result["errors"].first["message"]).to match(/Invite already used/i)
  end

  it "rejects a non-existent token" do
    invitee = User.create!(username: "invitee", email: "invitee@example.com", password: "password")

    result = BoardgameNightSchema.execute(mutation, variables: { token: "invalid-token" }, context: { current_user: invitee })
    expect(result["errors"]).to be_present
    expect(result["errors"].first["message"]).to match(/Invalid invite/i)
  end

  it "requires authentication" do
    raw_token, _invite = create_invite
    result = BoardgameNightSchema.execute(mutation, variables: { token: raw_token }, context: {})
    expect(result["errors"]).to be_present
  end

  it "rejects provisional users from joining" do
    raw_token, _invite = create_invite
    provisional = User.create!(username: "guest_abc123", email: "guest@example.com", provisional: true, password: "password")

    result = BoardgameNightSchema.execute(mutation, variables: { token: raw_token }, context: { current_user: provisional })
    expect(result["errors"]).to be_present
  end

  it "prevents double-acceptance races with atomic update" do
    raw_token, invite = create_invite
    invitee = User.create!(username: "invitee", email: "invitee@example.com", password: "password")

    BoardgameNightSchema.execute(mutation, variables: { token: raw_token }, context: { current_user: invitee })

    invitee2 = User.create!(username: "invitee2", email: "invitee2@example.com", password: "password")
    result = BoardgameNightSchema.execute(mutation, variables: { token: raw_token }, context: { current_user: invitee2 })
    expect(result["errors"]).to be_present
    expect(result["errors"].first["message"]).to match(/Invite already used/i)
  end
end
