# frozen_string_literal: true

module Types
  class BggPlayPlayerType < Types::BaseObject
    field :id, ID, null: false
    field :bgg_username, String, null: true
    field :name, String, null: false
    field :score, Int, null: true
    field :rating, Int, null: true
    field :win, Boolean, null: false
    field :new_player, Boolean, null: false
    field :color, String, null: true
    field :start_position, String, null: true
  end
end
