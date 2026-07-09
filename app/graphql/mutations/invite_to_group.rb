# frozen_string_literal: true

module Mutations
  class InviteToGroup < BaseMutation
    argument :group_id, ID, required: true
    argument :email, String, required: true
    argument :role, String, required: false

    field :invite_token, Types::SessionInviteType, null: false

    def resolve(group_id:, email:, role: nil)
      raise GraphQL::ExecutionError, "Authentication required" unless context[:current_user]

      contract = InviteToGroupContract.new.call(group_id: group_id, email: email, role: role)
      raise GraphQL::ExecutionError, contract.errors.to_h.to_json if contract.failure?

      group = Group.find_by(id: contract[:group_id])
      raise GraphQL::ExecutionError, "Group not found" unless group

      membership = group.group_memberships.find_by(user_id: context[:current_user].id)
      unless membership&.role.in?(%w[owner admin])
        raise GraphQL::ExecutionError, "Only group owners or admins can invite members"
      end

      raw_token, digest = InviteToken.generate_raw_token
      invite_token = InviteToken.create!(
        group: group,
        inviter: context[:current_user],
        email: contract[:email],
        role: contract[:role] || "member",
        token_digest: digest,
        status: "pending",
        expires_at: 7.days.from_now
      )
      invite_token.raw_token = raw_token

      InviteMailerJob.perform_later(invite_token.id, raw_token)

      { invite_token: invite_token }
    end
  end
end
