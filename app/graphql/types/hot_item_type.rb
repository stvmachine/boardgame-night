# frozen_string_literal: true

module Types
  class HotItemType < Types::BaseObject
    field :id, ID, null: false, description: "BGG thing ID for this hot item."
    field :rank, Integer, null: false, description: "Rank on the BGG hotness list."
    field :name, String, null: false, description: "Primary name of the game."
    field :year_published, Integer, null: true, description: "Year the game was published."
    field :thumbnail, String, null: true, description: "Thumbnail image URL."
    field :average, Float, null: true, description: "BGG average rating from persisted thing data."
    field :average_weight, Float, null: true, description: "BGG average weight from persisted thing data."
    field :min_players, Integer, null: true, description: "Minimum players from persisted thing data."
    field :max_players, Integer, null: true, description: "Maximum players from persisted thing data."
    field :min_playtime, Integer, null: true, description: "Minimum playtime in minutes from persisted thing data."
    field :max_playtime, Integer, null: true, description: "Maximum playtime in minutes from persisted thing data."

    def average
      thing.then { |t| t&.average }
    end

    def average_weight
      thing.then { |t| t&.average_weight }
    end

    def min_players
      thing.then { |t| t&.min_players }
    end

    def max_players
      thing.then { |t| t&.max_players }
    end

    def min_playtime
      thing.then { |t| t&.min_playtime }
    end

    def max_playtime
      thing.then { |t| t&.max_playtime }
    end

    private

    def thing
      dataloader.with(Loaders::HotItemThingLoader).load(object[:id])
    end
  end
end
