# frozen_string_literal: true

module Mutations
  class UpdateGroupMemberRole < BaseMutation
    argument :group_id, ID, required: true
    argument :user_id, ID, required: true
    argument :role, String, required: true

    field :membership, Types::GroupMembershipType, null: false

    def resolve(group_id:, user_id:, role:)
      raise GraphQL::ExecutionError, "Authentication required" unless context[:current_user]

      normalized_role = role.to_s.downcase
      contract = UpdateGroupMemberRoleContract.new.call(group_id: group_id, user_id: user_id, role: normalized_role)
      raise GraphQL::ExecutionError, contract.errors.to_h.to_json if contract.failure?

      group = Group.find_by(id: contract[:group_id])
      raise GraphQL::ExecutionError, "Group not found" unless group

      unless authorized_as_owner?(group)
        raise GraphQL::ExecutionError, "Only the group owner can change roles"
      end

      target_membership = group.group_memberships.find_by(user_id: contract[:user_id])
      raise GraphQL::ExecutionError, "Member not found" unless target_membership

      if target_membership.role == "owner"
        raise GraphQL::ExecutionError, "Cannot change the owner's role"
      end

      target_membership.update!(role: contract[:role])

      { membership: target_membership }
    end

    private

    def authorized_as_owner?(group)
      return true if group.owner_id == context[:current_user].id

      caller_membership = group.group_memberships.find_by(user_id: context[:current_user].id)
      caller_membership&.role == "owner"
    end
  end
end
