# frozen_string_literal: true

module Types
  class GroupType < Types::BaseObject
    field :id, ID, null: false
    field :name, String, null: false
    field :description, String, null: true
    field :invite_code, String, null: true
    field :owner, Types::UserType, null: false
    field :members, [ Types::UserType ], null: false
    field :memberships, [ Types::GroupMembershipType ], null: false
    field :collection, Types::MergedCollectionType, null: false
    field :my_role, Types::GroupRoleEnum, null: true
    field :sessions, [ Types::NightSessionType ], null: false
    field :collection_spotlight, [ Types::GroupSpotlightThingType ], null: false do
      argument :limit, Integer, required: false, default_value: 4
    end

    def memberships
      object.group_memberships.includes(:user).to_a
    end

    def collection
      return { items: [], sync_statuses: [] } unless viewer_role

      {
        items: BggThing.merged_for_users(object.member_ids),
        sync_statuses: object.members.map { |user| sync_status_for(user) }
      }
    end

    def collection_spotlight(limit: 4)
      return [] unless viewer_role

      clamped = limit.clamp(1, 12)
      member_ids = object.group_memberships.map(&:user_id)
      return [] if member_ids.empty?

      things = BggThing
        .select("bgg_things.*, COUNT(DISTINCT bgg_collections.user_id) AS owner_count")
        .joins(:bgg_collections)
        .where(bgg_collections: { user_id: member_ids })
        .group("bgg_things.id")
        .order(Arel.sql("owner_count DESC, bgg_things.average DESC, LOWER(bgg_things.name) ASC, bgg_things.id ASC"))
        .limit(clamped)

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
        if object.owner_id == context[:current_user]&.id
          "OWNER"
        else
          membership = object.group_memberships.find { |m| m.user_id == context[:current_user]&.id }
          membership&.role&.upcase
        end
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
