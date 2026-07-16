# frozen_string_literal: true

module Types
  class QueryType < Types::BaseObject
    # Add root-level fields here.
    # They will be entry points for queries on your schema.

    field :health, String, null: false, description: "Health check — proves the GraphQL endpoint is alive."

    field :merged_collection, Types::MergedCollectionType, null: false, description: "Merge and deduplicate the BGG collections for the given usernames." do
      argument :usernames, [ String ], required: true, description: "BGG usernames whose collections should be merged."
    end

    field :user, Types::UserType, null: true, description: "Look up a local user by their BGG username." do
      argument :username, String, required: true, description: "BGG username to look up."
    end

    field :hot_items, [ Types::HotItemType ], null: false, description: "The current BoardGameGeek hotness list."

    field :search, [ Types::SearchResultType ], null: false, description: "Search BoardGameGeek for games matching the query." do
      argument :query, String, required: true, description: "Search term."
    end

    field :current_user, Types::UserType, null: true, description: "The currently authenticated user, or null."

    field :my_groups, [ Types::GroupType ], null: false, description: "All groups the current user belongs to."

    field :dashboard_stats, Types::DashboardStatsType, null: true, description: "Dashboard counts for the signed-in user, or null when signed out."

    field :group, Types::GroupType, null: true, description: "Look up a group by its invite code, or by id if the current user is a member." do
      argument :token, String, required: true, description: "Invite code or group id."
    end

    field :night_session, Types::NightSessionType, null: true, description: "Look up a night session by id." do
      argument :id, ID, required: true, description: "Session id."
    end

    field :session_invite, Types::SessionInviteType, null: true, description: "Look up a session invite by its magic-link token." do
      argument :token, String, required: true, description: "Magic-link token from the invitation email."
    end

    def health
      "ok"
    end

    def merged_collection(usernames:)
      users = User.where(bgg_username: usernames)
      scope = context[:current_user] ? ScopedMergedThing::Scope.new(:user, context[:current_user].id) : nil
      {
        items: BggThing.merged_for_bgg_usernames(usernames),
        sync_statuses: usernames.map { |username| sync_status_for(username, users) },
        scope: scope
      }
    end

    def user(username:)
      User.find_by(bgg_username: username)
    end

    def current_user
      context[:current_user]
    end

    def dashboard_stats
      return nil unless context[:current_user]

      user = context[:current_user]
      {
        collection_count: user.bgg_things.distinct.count,
        group_count: distinct_group_count_for(user),
        session_count: distinct_session_count_for(user)
      }
    end

    def my_groups
      context[:current_user]&.groups || []
    end

    def group(token:)
      with_eager_load(Group).find_by(invite_code: token) ||
        context[:current_user]&.groups&.then { |scope| with_eager_load(scope) }&.find_by(id: token)
    end

    def night_session(id:)
      NightSession.find_by(id: id)
    end

    def session_invite(token:)
      return nil if token.blank?

      digest = Digest::SHA256.hexdigest(token)
      invite = InviteToken.find_by(token_digest: digest)
      return nil unless invite&.night_session_id.present?
      return nil if invite.expired?

      invite
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

    def distinct_group_count_for(user)
      Group
        .where("id IN (SELECT group_id FROM group_memberships WHERE user_id = ?) OR id IN (SELECT id FROM groups WHERE owner_id = ?)", user.id, user.id)
        .distinct
        .count
    end

    def distinct_session_count_for(user)
      NightSession
        .where("host_id = ? OR id IN (SELECT night_session_id FROM attendances WHERE user_id = ? AND response = ?)", user.id, user.id, "going")
        .where.not(state: "cancelled")
        .distinct
        .count
    end

    def with_eager_load(scope)
      scope.includes(
        :owner,
        { group_memberships: :user },
        { night_sessions: [ :host, { attendances: :user } ] }
      )
    end

    def sync_status_for(username, users)
      user = users.find { |u| u.bgg_username == username }
      synced = user && user.last_synced_at.present?
      status = synced ? "READY" : "QUEUED"
      SyncStatus.new(
        username: username,
        status: status,
        last_synced_at: user&.last_synced_at,
        error: nil,
        game_count: user&.bgg_collections&.count
      )
    end

    SyncStatus = Struct.new(:username, :status, :last_synced_at, :error, :game_count, keyword_init: true)
  end
end
