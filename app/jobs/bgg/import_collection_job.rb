# frozen_string_literal: true

# Bgg::ImportCollectionJob orchestrates the BGG collection import pipeline.
#
# Flow:
#   1. Validate username against BGG API (via Bgg::Client#user)
#   2. Fetch collection via Bgg::CollectionFetcher (two-call expansion workaround)
#   3. Persist to database via Bgg::CollectionPersister
#
# Enqueued via: Bgg::ImportCollectionJob.perform_later("stevmachine")
#
# Concurrency: limits_concurrency to: 1, key: "bgg_api" — only 1 BGG job at a time.
# See RESEARCH.md Pitfall 2 and config/queue.yml for Solid Queue setup.
class Bgg::ImportCollectionJob < ApplicationJob
  queue_as :bgg_imports

  # D-11: Global concurrency 1 for all BGG jobs across all users.
  # Prevents hammering the BGG API when multiple users trigger imports.
  # The 5-minute duration ensures lock expiry if a worker crashes mid-job.
  limits_concurrency to: 1, key: "bgg_api", duration: 5.minutes

  # D-12: Transient failures — retry with polynomial backoff
  # Faraday::TimeoutError covers both open_timeout and read_timeout
  retry_on Faraday::TimeoutError, wait: :polynomially_longer, attempts: 5
  # Faraday::ServerError covers 5xx responses (BGG maintenance, overload)
  retry_on Faraday::ServerError, wait: :polynomially_longer, attempts: 5
  # Bgg::CollectionNotReadyError: BGG kept returning 202 after 5 retries
  retry_on Bgg::CollectionNotReadyError, wait: 30.seconds, attempts: 3

  # D-12: Permanent failures — discard immediately (no retry)
  # Faraday::ResourceNotFound = BGG returned 404 (invalid endpoint)
  discard_on Faraday::ResourceNotFound
  # InvalidUsernameError = BGG confirmed user doesn't exist
  discard_on Bgg::InvalidUsernameError
  # Deserialization error = job payload corrupted
  discard_on ActiveJob::DeserializationError

  # D-13: Main entry point — enqueued via perform_later(username)
  #
  # All steps happen inside the concurrency lock. The rate limiter
  # inside Bgg::Client prevents exceeding BGG's 1-req/5s limit.
  def perform(username)
    # Step 1: Validate user exists on BGG
    validate_user!(username)

    # Step 2: Fetch collection (two-call workaround with fallback)
    collection = Bgg::CollectionFetcher.new.fetch(username)

    # Step 3: Persist to database via existing CollectionPersister
    user = User.find_by(bgg_username: username)
    if user
      result = Bgg::CollectionPersister.new(user: user).persist_collection!(collection)
      Rails.logger.info("[Bgg::ImportCollectionJob] Successfully imported #{result[:added]} games, " \
                        "#{result[:updated]} updated for '#{username}'")
    else
      Rails.logger.warn("[Bgg::ImportCollectionJob] Collection fetched for '#{username}' " \
                        "but no local user record found — skipping persist")
    end
  end

  private

  def validate_user!(username)
    client = Bgg::Client.new
    user_doc = client.user(username)

    # BGG returns <user id="..." name="..."> for valid usernames
    # Invalid usernames return an empty response or error
    user_node = user_doc.at_css("user")
    if user_node.nil? || user_node.attr("id").to_s.empty?
      raise Bgg::InvalidUsernameError,
        "BGG user '#{username}' not found or invalid"
    end

    Rails.logger.debug("[Bgg::ImportCollectionJob] Validated user '#{username}' " \
                       "(BGG ID: #{user_node.attr('id')})")
  end
end
