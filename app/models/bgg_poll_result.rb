# frozen_string_literal: true

class BggPollResult < ApplicationRecord
  belongs_to :bgg_poll

  validates :value, presence: true
  validates :num_votes, numericality: { greater_than_or_equal_to: 0 }

  def best?
    value == "Best"
  end

  def recommended?
    value == "Recommended"
  end

  def not_recommended?
    value == "Not Recommended"
  end
end
