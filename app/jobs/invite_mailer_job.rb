# frozen_string_literal: true

class InviteMailerJob < ApplicationJob
  queue_as :mailers

  retry_on StandardError, wait: :polynomially_longer, attempts: 3
  discard_on ActiveJob::DeserializationError

  def perform(invite_token_id, raw_token)
    invite_token = InviteToken.find(invite_token_id)

    if invite_token.night_session_id.present?
      InviteMailer.session_invite(invite_token_id, raw_token).deliver_now
    else
      InviteMailer.group_invite(invite_token_id, raw_token).deliver_now
    end
  end
end
