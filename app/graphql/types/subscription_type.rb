# frozen_string_literal: true

module Types
  class SubscriptionType < Types::BaseObject
    field :collection_synced, subscription: Subscriptions::CollectionSynced, description: "Real-time sync status updates for a BGG username's collection import."
  end
end
