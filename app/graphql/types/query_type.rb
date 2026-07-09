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

    field :hot_items, [Types::HotItemType], null: false, description: "The current BoardGameGeek hotness list."

    field :search, [Types::SearchResultType], null: false, description: "Search BoardGameGeek for games matching the query." do
      argument :query, String, required: true, description: "Search term."
    end

    field :current_user, Types::UserType, null: true, description: "The currently authenticated user, or null."

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

    def current_user
      context[:current_user]
    end

    def hot_items
      Rails.cache.fetch("bgg/hot", expires_in: 1.hour) do
        Bgg::Client.new.hot.css("item").map do |item|
          {
            id: item["id"],
            rank: item["rank"].to_i,
            name: item.at_css("name")&.[]("value"),
            year_published: item.at_css("yearpublished")&.[]("value")&.to_i,
            thumbnail: item.at_css("thumbnail")&.text
          }
        end
      end
    end

    def search(query:)
      Bgg::Search.call(query).map do |result|
        {
          id: result.id,
          name: result.name,
          year_published: result.year_published
        }
      end
    end

    private

    def sync_status_for(username, users)
      user = users.find { |u| u.bgg_username == username }
      SyncStatus.new(
        username: username,
        status: "READY",
        last_synced_at: user&.last_synced_at,
        error: nil,
        game_count: user&.bgg_collections&.count
      )
    end

    SyncStatus = Struct.new(:username, :status, :last_synced_at, :error, :game_count, keyword_init: true)
  end
end
