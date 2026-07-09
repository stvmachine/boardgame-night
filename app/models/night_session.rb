# frozen_string_literal: true

class NightSession < ApplicationRecord
  belongs_to :group
  belongs_to :host, class_name: "User"
  belongs_to :picked_game, class_name: "BggThing", optional: true
  has_many :attendances, dependent: :destroy
  has_many :attendees, through: :attendances, source: :user
  has_many :invite_tokens, dependent: :destroy

  validates :title, presence: true
  validates :state, presence: true, inclusion: { in: %w[draft invited picking completed] }
  validates :group, presence: true
  validates :host, presence: true

  def can_schedule?
    state == "draft"
  end

  def can_start_picking?
    state == "invited"
  end

  def can_complete?
    state == "picking"
  end
end
