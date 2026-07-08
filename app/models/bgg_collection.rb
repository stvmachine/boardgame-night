# frozen_string_literal: true

class BggCollection < ApplicationRecord
  belongs_to :user
  belongs_to :bgg_thing

  validates :user_id, uniqueness: { scope: :bgg_thing_id }
  validates :quantity, numericality: { greater_than_or_equal_to: 1 }
end
