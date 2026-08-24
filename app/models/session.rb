# frozen_string_literal: true

class Session < ApplicationRecord
  belongs_to :user

  has_secure_token :token

  validates :user, presence: true
  validates :expires_at, presence: true

  scope :active, -> { where("expires_at > ?", Time.current) }

  # Stamp request metadata (a-zero "trackable") and start the sudo window when a
  # session is minted. Guarded with ||= so callers can set these explicitly.
  before_create do
    self.user_agent ||= Current.user_agent
    self.ip_address ||= Current.ip_address
    self.sudo_at    ||= Time.current
  end

  # A session is "sudo" (recently re-authenticated) for a short window, gating
  # sensitive changes like password/email updates.
  SUDO_WINDOW = 30.minutes

  def sudo?
    sudo_at.present? && sudo_at > SUDO_WINDOW.ago
  end
end
