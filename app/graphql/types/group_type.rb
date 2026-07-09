# frozen_string_literal: true

module Types
  class GroupType < Types::BaseObject
    field :id, ID, null: false
    field :name, String, null: false
    field :description, String, null: true
    field :invite_code, String, null: true
    field :owner, Types::UserType, null: false
    field :members, [Types::UserType], null: false
    field :collection, Types::MergedCollectionType, null: false
    field :my_role, Types::GroupRoleEnum, null: true

    def collection
      {
        items: BggThing.merged_for_users(object.member_ids),
        sync_statuses: object.members.map { |user| sync_status_for(user) }
      }
    end

    def my_role
      membership = object.group_memberships.find_by(user_id: context[:current_user]&.id)
      membership&.role&.upcase
    end

    private

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
