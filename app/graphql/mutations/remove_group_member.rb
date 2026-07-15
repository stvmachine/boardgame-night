# frozen_string_literal: true

module Mutations
  class RemoveGroupMember < BaseMutation
    argument :group_id, ID, required: true
    argument :user_id, ID, required: true

    field :success, Boolean, null: false
    field :removed_membership_id, ID, null: true

    def resolve(group_id:, user_id:)
      raise GraphQL::ExecutionError, "Authentication required" unless context[:current_user]

      group = Group.find_by(id: group_id)
      raise GraphQL::ExecutionError, "Group not found" unless group

      unless authorized_to_manage?(group)
        raise GraphQL::ExecutionError, "Only group owners or admins can remove members"
      end

      target_membership = group.group_memberships.find_by(user_id: user_id)
      raise GraphQL::ExecutionError, "Member not found" unless target_membership

      if target_membership.role == "owner"
        raise GraphQL::ExecutionError, "Cannot remove the group owner"
      end

      if target_membership.user_id == context[:current_user].id
        raise GraphQL::ExecutionError, "Cannot remove yourself"
      end

      removed_id = target_membership.id.to_s
      target_membership.destroy!

      { success: true, removed_membership_id: removed_id }
    end

    private

    def authorized_to_manage?(group)
      return true if group.owner_id == context[:current_user].id

      caller_membership = group.group_memberships.find_by(user_id: context[:current_user].id)
      caller_membership&.role.in?(%w[owner admin])
    end
  end
end
