# frozen_string_literal: true

module Mutations
  class RemoveGroupMember < BaseMutation
    argument :group_id, ID, required: true
    argument :user_id, ID, required: true

    field :success, Boolean, null: false

    def resolve(group_id:, user_id:)
      raise GraphQL::ExecutionError, "Authentication required" unless context[:current_user]

      group = Group.find_by(id: group_id)
      raise GraphQL::ExecutionError, "Group not found" unless group

      caller_membership = group.group_memberships.find_by(user_id: context[:current_user].id)
      unless caller_membership&.role.in?(%w[owner admin])
        raise GraphQL::ExecutionError, "Only group owners or admins can remove members"
      end

      target_membership = group.group_memberships.find_by(user_id: user_id)
      raise GraphQL::ExecutionError, "Member not found" unless target_membership

      if target_membership.role == "owner"
        raise GraphQL::ExecutionError, "Cannot remove the group owner"
      end

      target_membership.destroy!

      { success: true }
    end
  end
end
