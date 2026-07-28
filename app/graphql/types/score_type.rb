# frozen_string_literal: true

module Types
  class ScoreType < Types::BaseObject
    field :id, ID, null: false
    field :user, Types::UserType, null: false
    field :score, Int, null: false
    field :rank, Int, null: true
    field :created_at, GraphQL::Types::ISO8601DateTime, null: false

    def user
      dataloader.with(Loaders::UsersLoader).load(object.user_id)
    end
  end
end
