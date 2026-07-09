# frozen_string_literal: true

class User < ApplicationRecord
  has_secure_password
  has_many :bgg_collections, dependent: :destroy
  has_many :bgg_things, through: :bgg_collections
  has_many :sessions, dependent: :destroy

  validates :username, presence: true, uniqueness: true
  validates :email, uniqueness: true, allow_nil: true
  validates :provisional, inclusion: { in: [true, false] }
  validates :invite_token, uniqueness: true, allow_nil: true

  def display_name
    return "Guest" if provisional?

    email.presence || "Guest"
  end
end
