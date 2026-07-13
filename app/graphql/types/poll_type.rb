# frozen_string_literal: true

module Types
  class PollType < Types::BaseObject
    field :id, ID, null: false
    field :name, String, null: false
    field :title, String, null: true
    field :total_votes, Integer, null: true
    field :results, [ Types::PollResultType ], null: false

    def results
      object.bgg_poll_results
    end
  end
end
