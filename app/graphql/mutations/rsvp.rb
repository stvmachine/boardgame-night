# frozen_string_literal: true

module Mutations
  class Rsvp < BaseMutation
    argument :token, String, required: true
    argument :response, String, required: true
    argument :nickname, String, required: false

    field :attendance, Types::AttendanceType, null: false
    field :session, Types::NightSessionType, null: false

    def resolve(token:, response:, nickname: nil)
      contract = RsvpContract.new.call(token: token, response: response, nickname: nickname)
      raise GraphQL::ExecutionError, contract.errors.to_h.to_json if contract.failure?

      digest = Digest::SHA256.hexdigest(contract[:token])
      invite = InviteToken.find_by(token_digest: digest)
      raise GraphQL::ExecutionError, "Invalid invite" unless invite
      raise GraphQL::ExecutionError, "Invite has expired" if invite.expired?

      updated = InviteToken.where(id: invite.id, status: "pending").update_all(
        status: "rsvped",
        accepted_at: Time.current
      )
      raise GraphQL::ExecutionError, "Invite already used" if updated == 0

      user = User.find_by(email: invite.email) || create_provisional_user(invite.email, contract[:nickname])
      unless user.persisted?
        raise GraphQL::ExecutionError, user.errors.full_messages.join(", ")
      end

      if contract[:nickname].present?
        user.update!(nickname: contract[:nickname])
      end

      attendance = Attendance.find_or_initialize_by(night_session: invite.night_session, user: user)
      attendance.assign_attributes(
        response: contract[:response],
        responded_at: Time.current
      )
      attendance.save!

      { attendance: attendance, session: invite.night_session }
    end

    private

    def create_provisional_user(email, nickname)
      User.create!(
        email: email,
        username: "guest_#{SecureRandom.hex(6)}",
        nickname: nickname,
        provisional: true,
        password: SecureRandom.hex(16)
      )
    end
  end
end
