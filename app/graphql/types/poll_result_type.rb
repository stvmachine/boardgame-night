# frozen_string_literal: true

module Types
  class PollResultType < Types::BaseObject
    field :id, ID, null: false
    field :player_count, Integer, null: true
    field :value, String, null: false
    field :num_votes, Integer, null: false
  end
end
