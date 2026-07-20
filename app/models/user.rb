# frozen_string_literal: true

class User < ApplicationRecord
  has_secure_password
  has_many :bgg_collections, dependent: :destroy
  has_many :bgg_things, through: :bgg_collections
  has_many :sessions, dependent: :destroy
  has_many :group_memberships, dependent: :destroy
  has_many :groups, through: :group_memberships
  has_many :owned_groups, class_name: "Group", foreign_key: :owner_id, dependent: :destroy

  validates :username, presence: true, uniqueness: true
  validates :email, uniqueness: true, allow_nil: true
  validates :provisional, inclusion: { in: [ true, false ] }
  validates :invite_token, uniqueness: true, allow_nil: true

  def display_name
    return nickname if nickname.present?
    return "Guest" if provisional?

    email.presence || "Guest"
  end
end
