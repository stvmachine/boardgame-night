# frozen_string_literal: true

module Mutations
  class ImportPlays < BaseMutation
    argument :username, String, required: true, description: "BGG username to import plays for"
    argument :max_pages, Integer, required: false, description: "Max pages to fetch (100 plays/page, default 10)"

    field :success, Boolean, null: false
    field :message, String, null: false

    def resolve(username:, max_pages: 10)
      raise GraphQL::ExecutionError, "Authentication required" unless context[:current_user]

      # Enqueue the import job — it shares the bgg_api concurrency lock
      Bgg::ImportPlaysJob.perform_later(username, max_pages: max_pages)

      { success: true, message: "Play import enqueued for '#{username}'" }
    end
  end
end
