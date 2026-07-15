# frozen_string_literal: true

require "rails_helper"

RSpec.describe "group member management mutations" do
  let(:remove_mutation) do
    <<~GRAPHQL
      mutation RemoveGroupMember($groupId: ID!, $userId: ID!) {
        removeGroupMember(groupId: $groupId, userId: $userId) {
          success
          removedMembershipId
        }
      }
    GRAPHQL
  end

  let(:update_role_mutation) do
    <<~GRAPHQL
      mutation UpdateGroupMemberRole($groupId: ID!, $userId: ID!, $role: String!) {
        updateGroupMemberRole(groupId: $groupId, userId: $userId, role: $role) {
          membership {
            id
            role
          }
        }
      }
    GRAPHQL
  end

  let(:owner) { User.create!(username: "owner", email: "owner@example.com", password: "password") }
  let(:admin) { User.create!(username: "admin", email: "admin@example.com", password: "password") }
  let(:member) { User.create!(username: "member", email: "member@example.com", password: "password") }
  let(:other_member) { User.create!(username: "other", email: "other@example.com", password: "password") }
  let(:outsider) { User.create!(username: "outsider", email: "outsider@example.com", password: "password") }
  let(:group) { Group.create!(name: "Night Owls", owner: owner) }
  let!(:owner_membership) { GroupMembership.create!(user: owner, group: group, role: "owner") }
  let!(:admin_membership) { GroupMembership.create!(user: admin, group: group, role: "admin") }
  let!(:member_membership) { GroupMembership.create!(user: member, group: group, role: "member") }
  let!(:other_membership) { GroupMembership.create!(user: other_member, group: group, role: "member") }

  def execute_remove(caller:, target_user:, group_id: group.id)
    BoardgameNightSchema.execute(
      remove_mutation,
      variables: { groupId: group_id, userId: target_user.id },
      context: { current_user: caller }
    )
  end

  def execute_update_role(caller:, target_user:, role:, group_id: group.id)
    BoardgameNightSchema.execute(
      update_role_mutation,
      variables: { groupId: group_id, userId: target_user.id, role: role },
      context: { current_user: caller }
    )
  end

  describe "removeGroupMember" do
    it "allows an owner to remove a member" do
      result = execute_remove(caller: owner, target_user: member)

      expect(result["errors"]).to be_nil
      data = result.dig("data", "removeGroupMember")
      expect(data["success"]).to be true
      expect(data["removedMembershipId"]).to eq(member_membership.id.to_s)
      expect(GroupMembership.exists?(member_membership.id)).to be false
    end

    it "allows an owner to remove an admin" do
      result = execute_remove(caller: owner, target_user: admin)

      expect(result["errors"]).to be_nil
      expect(result.dig("data", "removeGroupMember", "removedMembershipId")).to eq(admin_membership.id.to_s)
      expect(GroupMembership.exists?(admin_membership.id)).to be false
    end

    it "allows an admin to remove a member" do
      result = execute_remove(caller: admin, target_user: member)

      expect(result["errors"]).to be_nil
      expect(result.dig("data", "removeGroupMember", "removedMembershipId")).to eq(member_membership.id.to_s)
      expect(GroupMembership.exists?(member_membership.id)).to be false
    end

    it "allows an admin to remove another admin" do
      other_admin = User.create!(username: "other_admin", email: "other_admin@example.com", password: "password")
      other_admin_membership = GroupMembership.create!(user: other_admin, group: group, role: "admin")

      result = execute_remove(caller: admin, target_user: other_admin)

      expect(result["errors"]).to be_nil
      expect(result.dig("data", "removeGroupMember", "removedMembershipId")).to eq(other_admin_membership.id.to_s)
      expect(GroupMembership.exists?(other_admin_membership.id)).to be false
    end

    it "rejects a member from removing anyone" do
      result = execute_remove(caller: member, target_user: other_member)

      expect(result["errors"]).to be_present
      expect(GroupMembership.exists?(other_membership.id)).to be true
    end

    it "requires authentication" do
      result = BoardgameNightSchema.execute(
        remove_mutation,
        variables: { groupId: group.id, userId: member.id },
        context: {}
      )

      expect(result["errors"]).to be_present
      expect(GroupMembership.exists?(member_membership.id)).to be true
    end

    it "rejects self-removal" do
      result = execute_remove(caller: member, target_user: member)

      expect(result["errors"]).to be_present
      expect(GroupMembership.exists?(member_membership.id)).to be true
    end

    it "rejects removing the group owner" do
      result = execute_remove(caller: admin, target_user: owner)

      expect(result["errors"]).to be_present
      expect(GroupMembership.exists?(owner_membership.id)).to be true
    end

    it "rejects a target outside the supplied group" do
      other_group = Group.create!(name: "Other Group", owner: outsider)
      other_group_membership = GroupMembership.create!(user: other_member, group: other_group, role: "member")

      result = execute_remove(caller: owner, target_user: other_member, group_id: group.id)

      expect(result["errors"]).to be_present
      expect(GroupMembership.exists?(other_group_membership.id)).to be true
    end

    it "allows a legacy record owner without membership to remove a member" do
      owner_membership.destroy
      group.reload

      result = execute_remove(caller: owner, target_user: member)

      expect(result["errors"]).to be_nil
      expect(result.dig("data", "removeGroupMember", "removedMembershipId")).to eq(member_membership.id.to_s)
      expect(GroupMembership.exists?(member_membership.id)).to be false
    end
  end

  describe "updateGroupMemberRole" do
    it "allows an owner to change a member to admin" do
      result = execute_update_role(caller: owner, target_user: member, role: "ADMIN")

      expect(result["errors"]).to be_nil
      data = result.dig("data", "updateGroupMemberRole", "membership")
      expect(data["role"]).to eq("ADMIN")
      expect(member_membership.reload.role).to eq("admin")
    end

    it "allows an owner to change an admin to member" do
      result = execute_update_role(caller: owner, target_user: admin, role: "MEMBER")

      expect(result["errors"]).to be_nil
      expect(result.dig("data", "updateGroupMemberRole", "membership", "role")).to eq("MEMBER")
      expect(admin_membership.reload.role).to eq("member")
    end

    it "rejects a member from changing roles" do
      result = execute_update_role(caller: member, target_user: other_member, role: "ADMIN")

      expect(result["errors"]).to be_present
      expect(other_membership.reload.role).to eq("member")
    end

    it "rejects an admin from changing roles" do
      result = execute_update_role(caller: admin, target_user: member, role: "ADMIN")

      expect(result["errors"]).to be_present
      expect(member_membership.reload.role).to eq("member")
    end

    it "rejects changing the owner's role" do
      result = execute_update_role(caller: owner, target_user: owner, role: "MEMBER")

      expect(result["errors"]).to be_present
      expect(owner_membership.reload.role).to eq("owner")
    end

    it "rejects invalid role values" do
      result = execute_update_role(caller: owner, target_user: member, role: "OWNER")

      expect(result["errors"]).to be_present
      expect(member_membership.reload.role).to eq("member")
    end

    it "allows a legacy record owner without membership to change roles" do
      owner_membership.destroy
      group.reload

      result = execute_update_role(caller: owner, target_user: member, role: "ADMIN")

      expect(result["errors"]).to be_nil
      expect(result.dig("data", "updateGroupMemberRole", "membership", "role")).to eq("ADMIN")
      expect(member_membership.reload.role).to eq("admin")
    end
  end
end
