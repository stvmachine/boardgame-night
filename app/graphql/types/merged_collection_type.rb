# frozen_string_literal: true

module Types
  class MergedCollectionType < Types::BaseObject
    field :items, [Types::MergedThingType], null: false
    field :sync_statuses, [Types::UserSyncStatusType], null: false
  end
end
