# frozen_string_literal: true

module Types
  class UserSyncStatusType < Types::BaseObject
    field :username, String, null: false
    field :status, Types::SyncStatusEnum, null: false
    field :last_synced_at, GraphQL::Types::ISO8601DateTime, null: true
    field :error, String, null: true
    field :game_count, Integer, null: true
  end
end
