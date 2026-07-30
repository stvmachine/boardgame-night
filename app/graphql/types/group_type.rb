# frozen_string_literal: true

module Types
  class GroupType < Types::BaseObject
    field :id, ID, null: false
    field :name, String, null: false
    field :description, String, null: true
    field :invite_code, String, null: true
    field :owner, Types::UserType, null: true
    field :anonymous_bgg_usernames, [ String ], null: false
    field :members, [ Types::UserType ], null: false
    field :memberships, [ Types::GroupMembershipType ], null: false
    field :collection, Types::MergedCollectionType, null: false
    field :my_role, Types::GroupRoleEnum, null: true
    field :sessions, [ Types::NightSessionType ], null: false
    field :past_sessions, [ Types::NightSessionType ], null: false
    field :collection_total_count, Integer, null: false
    field :collection_spotlight, [ Types::GroupSpotlightThingType ], null: false do
      argument :limit, Integer, required: false, default_value: 4
    end

    def memberships
      object.group_memberships.includes(:user).to_a
    end

    def anonymous_bgg_usernames
      object.anonymous_members
    end

    def collection
      return { items: [], sync_statuses: [], scope: nil } unless viewer_role || object.anonymous_bgg_usernames.present?

      bgg_usernames = object.all_bgg_usernames

      {
        items: BggThing.merged_for_bgg_usernames(bgg_usernames),
        sync_statuses: build_sync_statuses(bgg_usernames),
        scope: ScopedMergedThing::Scope.new(:group, object.id)
      }
    end

    def past_sessions
      return [] unless viewer_role

      completed = %w[completed cancelled]
      object.night_sessions
        .select { |s| completed.include?(s.state) }
        .sort_by { |s| [ -(s.scheduled_at || s.created_at).to_i, s.id ] }
    end

    def collection_total_count
      return 0 unless viewer_role || object.anonymous_bgg_usernames.present?

      BggThing.merged_for_bgg_usernames(object.all_bgg_usernames).distinct.count
    end

    def collection_spotlight(limit: 4)
      return [] unless viewer_role || object.anonymous_bgg_usernames.present?

      clamped = limit.clamp(1, 12)
      bgg_usernames = object.all_bgg_usernames
      return [] if bgg_usernames.empty?

      things = BggThing
        .select("bgg_things.*, COUNT(DISTINCT bgg_collections.user_id) AS owner_count")
        .joins(:bgg_collections, :users)
        .where(users: { bgg_username: bgg_usernames })
        .group("bgg_things.id")
        .order(Arel.sql("owner_count DESC, bgg_things.average DESC, LOWER(bgg_things.name) ASC, bgg_things.id ASC"))
        .limit(clamped)

      member_ids = object.member_ids
      things.map { |thing| Types::GroupSpotlightThing.new(thing, member_ids) }
    end

    def my_role
      viewer_role
    end

    def sessions
      return [] unless viewer_role

      visible = %w[invited picking]
      visible << "draft" if viewer_role.in?(%w[OWNER ADMIN])

      object.night_sessions
        .select { |s| visible.include?(s.state) }
        .sort_by do |s|
          state_order = case s.state
          when "picking" then 0
          when "invited" then 1
          when "draft"   then 2
          else 3
          end
          date_key = if s.state == "draft" && s.scheduled_at.nil?
            Float::INFINITY
          else
            (s.scheduled_at || Time.at(0)).to_i
          end
          [ state_order, date_key, s.created_at, s.id ]
        end
    end

    private

      def viewer_role
        @viewer_role ||= begin
          current_user = context[:current_user]
          return nil unless current_user

          if object.owner_id == current_user.id
            "OWNER"
          else
            membership = object.group_memberships.find { |m| m.user_id == current_user.id }
            membership&.role&.upcase
          end
        end
      end

      def build_sync_statuses(bgg_usernames)
        users_by_username = User.where(bgg_username: bgg_usernames).index_by(&:bgg_username)
        bgg_usernames.map do |username|
          user = users_by_username[username]
          SyncStatus.new(
            username: username,
            status: user && user.bgg_collections.any? ? "READY" : "QUEUED",
            last_synced_at: user&.last_synced_at,
            error: nil,
            game_count: user&.bgg_collections&.count
          )
        end
      end

      def sync_status_for(user)
        SyncStatus.new(
          username: user.bgg_username || user.username,
          status: user.bgg_collections.any? ? "READY" : "QUEUED",
          last_synced_at: user.last_synced_at,
          error: nil,
          game_count: user.bgg_collections.count
        )
      end

      SyncStatus = Struct.new(:username, :status, :last_synced_at, :error, :game_count, keyword_init: true)
  end
end
