# frozen_string_literal: true

module Types
  module ThingFields
    extend ActiveSupport::Concern

    included do
      field :id, GraphQL::Types::ID, null: false
      field :name, GraphQL::Types::String, null: false
      field :year_published, GraphQL::Types::Int, null: true
      field :min_players, GraphQL::Types::Int, null: true
      field :max_players, GraphQL::Types::Int, null: true
      field :min_playtime, GraphQL::Types::Int, null: true
      field :max_playtime, GraphQL::Types::Int, null: true
      field :min_age, GraphQL::Types::Int, null: true
      field :image, GraphQL::Types::String, null: true
      field :thumbnail, GraphQL::Types::String, null: true
      field :description, GraphQL::Types::String, null: true
      field :average, GraphQL::Types::Float, null: true
      field :bayes_average, GraphQL::Types::Float, null: true
      field :users_rated, GraphQL::Types::Int, null: true
      field :average_weight, GraphQL::Types::Float, null: true
      field :is_expansion, GraphQL::Types::Boolean, null: false
      field :polls, [ Types::PollType ], null: false
      field :best_player_count, GraphQL::Types::Int, null: true
    end

    def polls
      dataloader.with(Loaders::PollsLoader).load(object.id)
    end

    def best_player_count
      dataloader.with(Loaders::PollsLoader).load(object.id).then do |polls|
        suggested = polls.find { |p| p.name == "suggested_numplayers" }
        next nil unless suggested

        best = suggested.bgg_poll_results.select { |r| r.value == "Best" }
        next nil if best.empty?

        # max votes, then lower player count on ties (A1)
        best.max_by { |r| [ r.num_votes, -r.player_count.to_i ] }&.player_count
      end
    end
  end
end
