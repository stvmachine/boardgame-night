# frozen_string_literal: true

module Types
  class BggPlayType < Types::BaseObject
    field :id, ID, null: false
    field :bgg_play_id, Int, null: false
    field :bgg_game_objectid, Int, null: false
    field :game_name, String, null: true
    field :date, GraphQL::Types::ISO8601Date, null: false
    field :quantity, Int, null: false
    field :length_minutes, Int, null: false
    field :incomplete, Boolean, null: false
    field :now_in_stats, Boolean, null: false
    field :location, String, null: true
    field :comments, String, null: true
    field :user, Types::UserType, null: false
    field :players, [ Types::BggPlayPlayerType ], null: false
    field :player_count, Int, null: false
    field :winners_count, Int, null: false

    def players
      if object.association(:bgg_play_players).loaded?
        object.bgg_play_players
      else
        object.bgg_play_players.to_a
      end
    end

    def player_count
      players.size
    end

    def winners_count
      players.count(&:win)
    end
  end
end
