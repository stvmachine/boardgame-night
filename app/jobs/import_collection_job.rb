# frozen_string_literal: true

class ImportCollectionJob < ApplicationJob
  queue_as :default

  # Limits concurrency to 1 BGG API job at a time (D-12, PITFALLS.md #2)
  limits_concurrency to: 1, key: "bgg_api"

  retry_on Bgg::NetworkError, wait: :polynomially_longer, attempts: 5
  retry_on Bgg::ServerError, wait: :polynomially_longer, attempts: 3
  retry_on Bgg::CollectionNotReadyError, wait: 10, attempts: 8
  discard_on Bgg::ResourceNotFound
  discard_on ActiveJob::DeserializationError

  def perform(user)
    fetcher = Bgg::CollectionFetcher.new
    persister = Bgg::CollectionPersister.new(user: user)
    collection = fetcher.fetch(user.bgg_username)
    result = persister.persist_collection!(collection)
    Rails.logger.info "ImportCollectionJob: imported #{result[:added]} games, " \
                       "#{result[:updated]} updated for user #{user.id} (#{user.bgg_username})"
    result
  end
end
