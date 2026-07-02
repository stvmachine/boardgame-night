# frozen_string_literal: true

module Types
  class QueryType < Types::BaseObject
    # Add root-level fields here.
    # They will be entry points for queries on your schema.

    field :health, String, null: false, description: "Health check — proves the GraphQL endpoint is alive."

    def health
      "ok"
    end
  end
end
