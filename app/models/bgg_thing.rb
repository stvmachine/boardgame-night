# frozen_string_literal: true

class BggThing < ApplicationRecord
  has_many :bgg_collections, dependent: :destroy
  has_many :users, through: :bgg_collections

  validates :objectid, presence: true, uniqueness: true
  validates :name, presence: true

  scope :merged_for_users, ->(user_ids) {
    joins(:bgg_collections)
      .where(bgg_collections: { user_id: user_ids })
      .distinct
  }

  scope :merged_for_bgg_usernames, ->(bgg_usernames) {
    joins(:bgg_collections, :users)
      .where(users: { bgg_username: bgg_usernames })
      .distinct
  }
end
