# frozen_string_literal: true

class BggPoll < ApplicationRecord
  belongs_to :bgg_thing
  has_many :bgg_poll_results, dependent: :destroy

  validates :name, presence: true

  def results_for_player_count(count)
    bgg_poll_results.select { |result| result.player_count == count }
  end
end
