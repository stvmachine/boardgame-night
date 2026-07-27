# frozen_string_literal: true

module Types
  class UserType < Types::BaseObject
    field :id, ID, null: false
    field :username, String, null: true
    field :email, String, null: true
    field :bgg_username, String, null: true
    field :avatar, String, null: true
    field :is_provisional, Boolean, null: false
    field :display_name, String, null: false
    field :sync_status, Types::UserSyncStatusType, null: false

    def avatar
      object.bgg_avatar_url
    end

    def is_provisional
      object.provisional?
    end

    def display_name
      object.display_name
    end

    def email
      object.provisional? ? nil : object.email
    end

    def sync_status
      status = if context[:sync_status_for_username] == object.bgg_username
        "QUEUED"
      elsif object.bgg_collections.any?
        "READY"
      else
        "QUEUED"
      end

      SyncStatus.new(
        username: object.bgg_username,
        status: status,
        last_synced_at: object.last_synced_at,
        error: nil,
        game_count: object.bgg_collections.count
      )
    end

    SyncStatus = Struct.new(:username, :status, :last_synced_at, :error, :game_count, keyword_init: true)
  end
end
