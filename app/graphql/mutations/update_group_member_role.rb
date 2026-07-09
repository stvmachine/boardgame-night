# frozen_string_literal: true

module Mutations
  class UpdateGroupMemberRole < BaseMutation
    argument :group_id, ID, required: true
    argument :user_id, ID, required: true
    argument :role, String, required: true

    field :membership, Types::GroupMembershipType, null: false

    def resolve(group_id:, user_id:, role:)
      raise GraphQL::ExecutionError, "Authentication required" unless context[:current_user]

      contract = UpdateGroupMemberRoleContract.new.call(group_id: group_id, user_id: user_id, role: role)
      raise GraphQL::ExecutionError, contract.errors.to_h.to_json if contract.failure?

      group = Group.find_by(id: contract[:group_id])
      raise GraphQL::ExecutionError, "Group not found" unless group

      caller_membership = group.group_memberships.find_by(user_id: context[:current_user].id)
      unless caller_membership&.role == "owner"
        raise GraphQL::ExecutionError, "Only the group owner can change roles"
      end

      target_membership = group.group_memberships.find_by(user_id: contract[:user_id])
      raise GraphQL::ExecutionError, "Member not found" unless target_membership

      if target_membership.role == "owner"
        raise GraphQL::ExecutionError, "Cannot change the owner's role"
      end

      unless contract[:role].in?(%w[admin member])
        raise GraphQL::ExecutionError, "Role must be admin or member"
      end

      target_membership.update!(role: contract[:role])

      { membership: target_membership }
    end
  end
end
