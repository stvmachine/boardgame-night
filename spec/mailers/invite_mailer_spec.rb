# frozen_string_literal: true

require "rails_helper"

RSpec.describe InviteMailer, type: :mailer do
  let(:owner) { User.create!(username: "owner", email: "owner@example.com", password: "password") }
  let(:group) { Group.create!(name: "Night Owls", owner: owner) }
  let(:raw_token) { "abc123" }

  describe "#group_invite" do
    let(:invite) do
      InviteToken.create!(
        group: group,
        inviter: owner,
        email: "friend@example.com",
        role: "member",
        token_digest: Digest::SHA256.hexdigest(raw_token),
        status: "pending",
        expires_at: 7.days.from_now
      )
    end

    it "sends an email with the magic link" do
      email = InviteMailer.group_invite(invite.id, raw_token)

      expect(email.to).to eq(["friend@example.com"])
      expect(email.subject).to eq("You've been invited to Night Owls")
      expect(email.body.encoded).to include("/invite/#{raw_token}")
      expect(email.body.encoded).to include("Join group")
    end
  end

  describe "#session_invite" do
    let(:session) do
      NightSession.create!(
        title: "Friday Games",
        group: group,
        host: owner,
        state: "draft"
      )
    end
    let(:session_invite) do
      InviteToken.create!(
        group: group,
        inviter: owner,
        email: "friend@example.com",
        night_session: session,
        role: "member",
        token_digest: Digest::SHA256.hexdigest(raw_token),
        status: "pending",
        expires_at: 7.days.from_now
      )
    end

    it "sends an email with the RSVP link" do
      email = InviteMailer.session_invite(session_invite.id, raw_token)

      expect(email.to).to eq(["friend@example.com"])
      expect(email.subject).to eq("You're invited to a board game night")
      expect(email.body.encoded).to include("/invite/#{raw_token}")
      expect(email.body.encoded).to include(session.title)
    end
  end
end
