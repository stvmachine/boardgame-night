# frozen_string_literal: true

class InviteToken < ApplicationRecord
  attr_accessor :raw_token

  belongs_to :group
  belongs_to :inviter, class_name: "User"
  belongs_to :accepted_by, class_name: "User", optional: true
  belongs_to :night_session, optional: true

  validates :email, presence: true
  validates :token_digest, presence: true, uniqueness: true
  validates :status, inclusion: { in: %w[pending accepted rsvped expired] }
  validates :role, inclusion: { in: %w[member admin] }, allow_nil: true

  scope :pending, -> { where(status: "pending") }
  scope :not_expired, -> { where("expires_at > ?", Time.current) }

  def self.generate_raw_token
    raw_token = SecureRandom.hex(32)
    digest = Digest::SHA256.hexdigest(raw_token)
    [ raw_token, digest ]
  end

  def expired?
    expires_at < Time.current
  end

  def token
    raw_token
  end
end
