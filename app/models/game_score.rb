# frozen_string_literal: true

class GameScore < ApplicationRecord
  belongs_to :night_session
  belongs_to :user

  validates :user_id, uniqueness: { scope: :night_session_id }
  validates :score, presence: true, numericality: { greater_than_or_equal_to: 0 }
  validates :rank, numericality: { greater_than: 0 }, allow_nil: true
end
