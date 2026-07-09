# frozen_string_literal: true

class GroupMembership < ApplicationRecord
  belongs_to :user
  belongs_to :group

  validates :user_id, uniqueness: { scope: :group_id }
  validates :role, presence: true, inclusion: { in: %w[owner admin member] }
  validate :user_must_not_be_provisional

  private

  def user_must_not_be_provisional
    return unless user&.provisional?

    errors.add(:user, "Provisional users cannot join groups")
  end
end
