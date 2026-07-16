# frozen_string_literal: true

module Types
  class MergedCollectionType < Types::BaseObject
    field :items, [ Types::MergedThingType ], null: false
    field :sync_statuses, [ Types::UserSyncStatusType ], null: false

    def items
      object[:items].map { |thing| ScopedMergedThing.new(thing, object[:scope]) }
    end
  end
end
