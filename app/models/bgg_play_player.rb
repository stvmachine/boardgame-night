# frozen_string_literal: true

class BggPlayPlayer < ApplicationRecord
  belongs_to :bgg_play

  validates :name, presence: true
end
