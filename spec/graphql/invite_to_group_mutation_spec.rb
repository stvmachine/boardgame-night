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

  describe "record owner without membership" do
    let(:owner_only) { User.create!(username: "owner_only", email: "owner_only@example.com", password: "password") }
    let(:group_owned) { Group.create!(name: "Solo", owner: owner_only) }

    # No owner membership — legacy record owner path

    it "can invite as MEMBER" do
      expect {
        result = BoardgameNightSchema.execute(
          mutation,
          variables: { groupId: group_owned.id, email: "friend@example.com", role: "member" },
          context: { current_user: owner_only }
        )
        expect(result["errors"]).to be_nil
        data = result.dig("data", "inviteToGroup", "inviteToken")
        expect(data["role"]).to eq("MEMBER")
      }.to change(InviteToken, :count).by(1).and have_enqueued_job(InviteMailerJob)
    end

    it "can invite as ADMIN" do
      expect {
        result = BoardgameNightSchema.execute(
          mutation,
          variables: { groupId: group_owned.id, email: "friend@example.com", role: "admin" },
          context: { current_user: owner_only }
        )
        expect(result["errors"]).to be_nil
        data = result.dig("data", "inviteToGroup", "inviteToken")
        expect(data["role"]).to eq("ADMIN")
      }.to change(InviteToken, :count).by(1).and have_enqueued_job(InviteMailerJob)
    end
  end

  describe "owner with membership" do
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

    it "defaults role to member" do
      result = BoardgameNightSchema.execute(
        mutation,
        variables: { groupId: group.id, email: "friend@example.com" },
        context: { current_user: owner }
      )
      expect(result.dig("data", "inviteToGroup", "inviteToken", "role")).to eq("MEMBER")
    end

    it "can invite as ADMIN" do
      expect {
        result = BoardgameNightSchema.execute(
          mutation,
          variables: { groupId: group.id, email: "admin_invite@example.com", role: "admin" },
          context: { current_user: owner }
        )
        expect(result["errors"]).to be_nil
        expect(result.dig("data", "inviteToGroup", "inviteToken", "role")).to eq("ADMIN")
      }.to change(InviteToken, :count).by(1).and have_enqueued_job(InviteMailerJob)
    end

    it "can invite as MEMBER" do
      expect {
        result = BoardgameNightSchema.execute(
          mutation,
          variables: { groupId: group.id, email: "member_invite@example.com", role: "member" },
          context: { current_user: owner }
        )
        expect(result["errors"]).to be_nil
        expect(result.dig("data", "inviteToGroup", "inviteToken", "role")).to eq("MEMBER")
      }.to change(InviteToken, :count).by(1).and have_enqueued_job(InviteMailerJob)
    end
  end

  describe "admin" do
    it "can invite as MEMBER" do
      expect {
        result = BoardgameNightSchema.execute(
          mutation,
          variables: { groupId: group.id, email: "friend@example.com", role: "member" },
          context: { current_user: admin }
        )
        expect(result["errors"]).to be_nil
        expect(result.dig("data", "inviteToGroup", "inviteToken", "role")).to eq("MEMBER")
      }.to change(InviteToken, :count).by(1).and have_enqueued_job(InviteMailerJob)
    end

    it "allows admins to invite with default role (member)" do
      expect {
        result = BoardgameNightSchema.execute(
          mutation,
          variables: { groupId: group.id, email: "friend@example.com" },
          context: { current_user: admin }
        )
        expect(result["errors"]).to be_nil
      }.to change(InviteToken, :count).by(1).and have_enqueued_job(InviteMailerJob)
    end

    it "rejects admin escalation - cannot invite with ADMIN role" do
      expect {
        result = BoardgameNightSchema.execute(
          mutation,
          variables: { groupId: group.id, email: "friend@example.com", role: "admin" },
          context: { current_user: admin }
        )
        expect(result["errors"]).to be_present
        expect(result["errors"].first["message"]).to match(/admin/i)
      }.to change(InviteToken, :count).by(0)
       .and have_enqueued_job(InviteMailerJob).exactly(0).times
    end
  end

  describe "ordinary member" do
    it "is rejected from inviting" do
      expect {
        result = BoardgameNightSchema.execute(
          mutation,
          variables: { groupId: group.id, email: "friend@example.com" },
          context: { current_user: member }
        )
        expect(result["errors"]).to be_present
      }.to change(InviteToken, :count).by(0)
       .and have_enqueued_job(InviteMailerJob).exactly(0).times
    end
  end

  describe "unauthenticated" do
    it "requires authentication" do
      expect {
        result = BoardgameNightSchema.execute(
          mutation,
          variables: { groupId: group.id, email: "friend@example.com" },
          context: {}
        )
        expect(result["errors"]).to be_present
      }.to change(InviteToken, :count).by(0)
       .and have_enqueued_job(InviteMailerJob).exactly(0).times
    end
  end

  describe "invalid input" do
    it "validates email format - creates no token or job" do
      expect {
        result = BoardgameNightSchema.execute(
          mutation,
          variables: { groupId: group.id, email: "not-an-email" },
          context: { current_user: owner }
        )
        expect(result["errors"]).to be_present
      }.to change(InviteToken, :count).by(0)
       .and have_enqueued_job(InviteMailerJob).exactly(0).times
    end

    it "rejects invalid role - creates no token or job" do
      expect {
        result = BoardgameNightSchema.execute(
          mutation,
          variables: { groupId: group.id, email: "friend@example.com", role: "superadmin" },
          context: { current_user: owner }
        )
        expect(result["errors"]).to be_present
      }.to change(InviteToken, :count).by(0)
       .and have_enqueued_job(InviteMailerJob).exactly(0).times
    end
  end
end
