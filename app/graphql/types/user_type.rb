# frozen_string_literal: true

module Types
  class UserType < Types::BaseObject
    field :id, ID, null: false
    field :username, String, null: false
    field :avatar, String, null: true
    field :sync_status, Types::UserSyncStatusType, null: false

    def avatar
      object.bgg_avatar_url
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
        last_synced_at: status == "READY" ? Time.current : nil,
        error: nil,
        game_count: object.bgg_collections.count
      )
    end

    SyncStatus = Struct.new(:username, :status, :last_synced_at, :error, :game_count, keyword_init: true)
  end
end
