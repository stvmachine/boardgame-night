# frozen_string_literal: true

module Types
  class QueryType < Types::BaseObject
    # Add root-level fields here.
    # They will be entry points for queries on your schema.

    field :health, String, null: false, description: "Health check — proves the GraphQL endpoint is alive."

    field :merged_collection, Types::MergedCollectionType, null: false, description: "Merge and deduplicate the BGG collections for the given usernames." do
      argument :usernames, [String], required: true, description: "BGG usernames whose collections should be merged."
    end

    field :user, Types::UserType, null: true, description: "Look up a local user by their BGG username." do
      argument :username, String, required: true, description: "BGG username to look up."
    end

    def health
      "ok"
    end

    def merged_collection(usernames:)
      users = User.where(bgg_username: usernames)
      {
        items: BggThing.merged_for_bgg_usernames(usernames),
        sync_statuses: usernames.map { |username| sync_status_for(username, users) }
      }
    end

    def user(username:)
      User.find_by(bgg_username: username)
    end

    private

    def sync_status_for(username, users)
      user = users.find { |u| u.bgg_username == username }
      SyncStatus.new(
        username: username,
        status: "READY",
        last_synced_at: Time.current,
        error: nil,
        game_count: user&.bgg_collections&.count
      )
    end

    SyncStatus = Struct.new(:username, :status, :last_synced_at, :error, :game_count, keyword_init: true)
  end
end
