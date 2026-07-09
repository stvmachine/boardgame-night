# frozen_string_literal: true

require "rails_helper"

RSpec.describe "inviteToGroup mutation" do
  let(:mutation) do
    <<~GRAPHQL
      mutation InviteToGroup($groupId: ID!, $email: String!, $role: String) {
        inviteToGroup(groupId: $groupId, email: $email, role: $role) {
          inviteToken {
            id
            token
            status
            email
            role
            expiresAt
          }
        }
      }
    GRAPHQL
  end

  let(:owner) { User.create!(username: "owner", email: "owner@example.com", password: "password") }
  let(:admin) { User.create!(username: "admin", email: "admin@example.com", password: "password") }
  let(:member) { User.create!(username: "member", email: "member@example.com", password: "password") }
  let(:group) { Group.create!(name: "Night Owls", owner: owner) }

  before do
    GroupMembership.create!(user: owner, group: group, role: "owner")
    GroupMembership.create!(user: admin, group: group, role: "admin")
    GroupMembership.create!(user: member, group: group, role: "member")
  end

  it "creates an invite token and enqueues a mailer job" do
    expect {
      result = BoardgameNightSchema.execute(
        mutation,
        variables: { groupId: group.id, email: "friend@example.com", role: "admin" },
        context: { current_user: owner }
      )
      expect(result["errors"]).to be_nil
      data = result.dig("data", "inviteToGroup", "inviteToken")
      expect(data["status"]).to eq("pending")
      expect(data["email"]).to eq("friend@example.com")
      expect(data["role"]).to eq("ADMIN")
      expect(data["token"]).to be_present
    }.to change(InviteToken, :count).by(1).and have_enqueued_job(InviteMailerJob)
  end

  it "allows admins to invite" do
    result = BoardgameNightSchema.execute(
      mutation,
      variables: { groupId: group.id, email: "friend@example.com" },
      context: { current_user: admin }
    )
    expect(result["errors"]).to be_nil
  end

  it "requires authentication" do
    result = BoardgameNightSchema.execute(
      mutation,
      variables: { groupId: group.id, email: "friend@example.com" },
      context: {}
    )
    expect(result["errors"]).to be_present
  end

  it "rejects members from inviting" do
    result = BoardgameNightSchema.execute(
      mutation,
      variables: { groupId: group.id, email: "friend@example.com" },
      context: { current_user: member }
    )
    expect(result["errors"]).to be_present
  end

  it "validates email format" do
    result = BoardgameNightSchema.execute(
      mutation,
      variables: { groupId: group.id, email: "not-an-email" },
      context: { current_user: owner }
    )
    expect(result["errors"]).to be_present
  end

  it "defaults role to member" do
    result = BoardgameNightSchema.execute(
      mutation,
      variables: { groupId: group.id, email: "friend@example.com" },
      context: { current_user: owner }
    )
    expect(result.dig("data", "inviteToGroup", "inviteToken", "role")).to eq("MEMBER")
  end
end
