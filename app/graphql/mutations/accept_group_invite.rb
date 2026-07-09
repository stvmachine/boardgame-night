# frozen_string_literal: true

module Mutations
  class AcceptGroupInvite < BaseMutation
    argument :token, String, required: true

    field :group, Types::GroupType, null: false

    def resolve(token:)
      raise GraphQL::ExecutionError, "Authentication required" unless context[:current_user]

      contract = AcceptGroupInviteContract.new.call(token: token)
      raise GraphQL::ExecutionError, contract.errors.to_h.to_json if contract.failure?

      digest = Digest::SHA256.hexdigest(contract[:token])
      invite = InviteToken.find_by(token_digest: digest)
      raise GraphQL::ExecutionError, "Invalid invite" unless invite

      raise GraphQL::ExecutionError, "Invite has expired" if invite.expired?

      updated = InviteToken.where(id: invite.id, status: "pending").update_all(
        status: "accepted",
        accepted_by_id: context[:current_user].id,
        accepted_at: Time.current
      )
      raise GraphQL::ExecutionError, "Invite already used" if updated == 0

      begin
        GroupMembership.create!(
          user: context[:current_user],
          group: invite.group,
          role: invite.role || "member"
        )
      rescue ActiveRecord::RecordInvalid => e
        raise GraphQL::ExecutionError, e.message
      end

      { group: invite.group }
    end
  end
end
