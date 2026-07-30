# frozen_string_literal: true

class Group < ApplicationRecord
  belongs_to :owner, class_name: "User", optional: true
  has_many :group_memberships, dependent: :destroy
  has_many :members, through: :group_memberships, source: :user
  has_many :night_sessions, dependent: :destroy
  has_many :invite_tokens, dependent: :destroy

  validates :name, presence: true
  validates :invite_code, uniqueness: true, allow_nil: true

  before_create :generate_invite_code

  def member_ids
    group_memberships.pluck(:user_id)
  end

  def anonymous_members
    val = self[:anonymous_bgg_usernames]
    return [] if val.blank?
    val.is_a?(String) ? JSON.parse(val) : val
  end

  def all_bgg_usernames
    anonymous_members + members.filter_map(&:bgg_username)
  end

  private

    def generate_invite_code
      return if invite_code.present?

      self.invite_code = loop do
        token = SecureRandom.alphanumeric(12).upcase
        break token unless self.class.exists?(invite_code: token)
      end
    end
end
