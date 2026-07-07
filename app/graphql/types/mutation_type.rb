# frozen_string_literal: true

module Types
  class MutationType < Types::BaseObject
    field :import_collection, mutation: Mutations::ImportCollection, description: "Enqueue a BGG collection import for a username and return the user with initial sync status."
  end
end
