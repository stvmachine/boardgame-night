# frozen_string_literal: true

class BggPoll < ApplicationRecord
  belongs_to :bgg_thing
  has_many :bgg_poll_results, dependent: :destroy

  validates :name, presence: true
end
