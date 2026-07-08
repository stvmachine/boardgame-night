# frozen_string_literal: true

module Types
  class HotItemType < Types::BaseObject
    field :id, ID, null: false, description: "BGG thing ID for this hot item."
    field :rank, Integer, null: false, description: "Rank on the BGG hotness list."
    field :name, String, null: false, description: "Primary name of the game."
    field :year_published, Integer, null: true, description: "Year the game was published."
    field :thumbnail, String, null: true, description: "Thumbnail image URL."
  end
end
