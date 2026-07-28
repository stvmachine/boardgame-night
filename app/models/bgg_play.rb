# frozen_string_literal: true

class BggPlay < ApplicationRecord
  belongs_to :user
  has_many :bgg_play_players, dependent: :destroy

  validates :bgg_play_id, uniqueness: true
  validates :bgg_game_objectid, presence: true
  validates :date, presence: true
  validates :quantity, presence: true, numericality: { greater_than: 0 }
end
