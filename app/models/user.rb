# frozen_string_literal: true

class User < ApplicationRecord
  has_secure_password
  has_many :bgg_collections, dependent: :destroy
  has_many :bgg_things, through: :bgg_collections
  has_many :sessions, dependent: :destroy
  has_many :group_memberships, dependent: :destroy
  has_many :groups, through: :group_memberships
  has_many :owned_groups, class_name: "Group", foreign_key: :owner_id, dependent: :destroy

  has_many :events, dependent: :destroy

  validates :email, uniqueness: true, allow_nil: true
  validates :provisional, inclusion: { in: [ true, false ] }
  validates :invite_token, uniqueness: true, allow_nil: true

  # Short-lived, stateless tokens for email verification and password reset
  # (a-zero). The password_reset token embeds the password salt so it is
  # invalidated the moment the password changes.
  generates_token_for :email_verification, expires_in: 2.days do
    email
  end
  generates_token_for :password_reset, expires_in: 20.minutes do
    password_salt&.last(10)
  end

  # Changing the email un-verifies the account until the new address is confirmed.
  # Only on update — on create, `verified` is set explicitly by the caller.
  before_validation on: :update, if: -> { will_save_change_to_email? } do
    self.verified = false
  end

  # Changing the password revokes every OTHER session (keep the current one so the
  # user who just changed it stays signed in).
  after_update if: -> { saved_change_to_password_digest? } do
    sessions.where.not(id: Current.session&.id).delete_all
  end

  def display_name
    return nickname if nickname.present?
    return "Guest" if provisional?

    email.presence || "Guest"
  end
end
