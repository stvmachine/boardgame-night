# frozen_string_literal: true

class Group < ApplicationRecord
  belongs_to :owner, class_name: "User"
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

  private

  def generate_invite_code
    return if invite_code.present?

    self.invite_code = loop do
      token = SecureRandom.alphanumeric(12).upcase
      break token unless self.class.exists?(invite_code: token)
    end
  end
end
