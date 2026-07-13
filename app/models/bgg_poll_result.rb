# frozen_string_literal: true

class BggPollResult < ApplicationRecord
  belongs_to :bgg_poll

  validates :value, presence: true
  validates :num_votes, numericality: { greater_than_or_equal_to: 0 }
end
