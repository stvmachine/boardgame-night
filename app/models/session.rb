# frozen_string_literal: true

class Session < ApplicationRecord
  belongs_to :user

  has_secure_token :token

  validates :user, presence: true
  validates :expires_at, presence: true

  scope :active, -> { where("expires_at > ?", Time.current) }
end