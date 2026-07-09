# frozen_string_literal: true

class InviteMailer < ApplicationMailer
  def group_invite(invite_token_id, raw_token)
    invite_token = InviteToken.find(invite_token_id)
    @group = invite_token.group
    @raw_token = raw_token
    @invitee_email = invite_token.email

    mail(to: invite_token.email, subject: "You've been invited to #{invite_token.group.name}")
  end
end
