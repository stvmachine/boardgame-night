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
    end
  end
end
