# frozen_string_literal: true

class NightSession < ApplicationRecord
  belongs_to :group
  belongs_to :host, class_name: "User"
  belongs_to :picked_game, class_name: "BggThing", optional: true
  has_many :attendances, dependent: :destroy
  has_many :attendees, through: :attendances, source: :user
  has_many :invite_tokens, dependent: :destroy

  VALID_COMPLEXITY_PREFERENCES = %w[Light Medium Medium-Heavy Heavy Any].freeze

  validates :title, presence: true
  validates :state, presence: true, inclusion: { in: %w[draft invited picking completed cancelled] }
  validates :group, presence: true
  validates :host, presence: true
  validates :complexity_preference, inclusion: { in: VALID_COMPLEXITY_PREFERENCES }
  validates :time_budget_minutes, numericality: { greater_than: 0 }

  def can_schedule?
    state == "draft"
  end

  def can_start_picking?
    state == "invited"
  end

  def can_complete?
    state == "picking"
  end

  def can_cancel?
    %w[draft invited picking].include?(state)
  end

  def can_reopen?
    state == "cancelled"
  end
end
