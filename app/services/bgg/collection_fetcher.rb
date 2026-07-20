# frozen_string_literal: true

# Bgg::CollectionFetcher handles the two-call expansion workaround for BGG
# collection fetches. BGG has a known bug where boardgame expansions are
# returned with the wrong subtype when using subtype=boardgame. To work
# around this, we make two calls:
#   1. excludesubtype=boardgameexpansion → base games only (correct subtype)
#   2. subtype=boardgameexpansion → expansions only (correct subtype)
#
# Results are merged into a single normalized collection array.
# Falls back to a single subtype=boardgame call if the workaround fails.
#
# Ported from bgg-graphql-proxy/src/datasources/bggDataSource.ts:
# getUserCollectionWithExpansionWorkaround() + getUserCollectionFallback()
module Bgg
  class CollectionFetcher
    def initialize(client: nil, normalizer: nil)
      @client = client || Bgg::Client.new
      @normalizer = normalizer || Bgg::Normalizer
    end

    # Fetches a user's full collection (base games + expansions merged).
    #
    # Results are cached with a stale-while-revalidate pattern (30-minute TTL).
    # If the cache is fresh, the cached normalized collection is returned without
    # hitting the BGG API. If the cache is expired, a fresh fetch is attempted;
    # on failure, the stale cached value is served instead.
    #
    # Returns a normalized collection array from Bgg::Normalizer:
    #   Array of item hashes
    #
    # Raises Bgg::CollectionNotReadyError if BGG returns 202 after 5 retries
    #   and no stale cache is available.
    # Raises Bgg::InvalidUsernameError if the user doesn't exist.
    # Raises Bgg::NetworkError on transport failures when no stale cache exists.
    def fetch(username)
      cache_key = "bgg:collection:#{username}"
      stale_cache = Rails.cache.read(cache_key)

      Rails.cache.fetch(cache_key, expires_in: 30.minutes) do
        fetch_with_fallback(username)
      end
    rescue => e
      raise e if stale_cache.nil?

      stale_cache
    end

    private

      # Fetch with two-call expansion workaround, falling back to single call on error.
      def fetch_with_fallback(username)
        merged_doc = fetch_with_workaround(username)
        @normalizer.normalize_collection(merged_doc)
      rescue Bgg::ClientError, Bgg::ServerError, Bgg::NetworkError => e
        message = "[Bgg::CollectionFetcher] Workaround failed for '#{username}': #{e.message}. Falling back to single call."
        Rails.logger.warn(message)
        fallback(username)
      end

    private

      # Two-call expansion workaround (D-09, BGG-05):
      # BGG bug: expansions come back tagged as base games.
      # Fix: two calls — one excluding expansions, one only expansions — then merge.
      def fetch_with_workaround(username)
        # Call 1: Base games (excluding expansions)
        boardgames_doc = @client.request_with_202_retry(:collection,
          username: username,
          excludesubtype: "boardgameexpansion",
          own: 1,
          stats: 1
        )

        # Call 2: Expansions only
        expansions_doc = @client.request_with_202_retry(:collection,
          username: username,
          subtype: "boardgameexpansion",
          own: 1,
          stats: 1
        )

        merge_docs(boardgames_doc, expansions_doc)
      end

      # Fallback — single call with no subtype filter
      def fallback(username)
        doc = @client.request_with_202_retry(:collection,
          username: username,
          own: 1,
          stats: 1
        )
        @normalizer.normalize_collection(doc)
      end

      # Merges two Nokogiri documents into one combined document.
      # Takes all <item> elements from both docs and creates a new <items> root.
      def merge_docs(doc_a, doc_b)
        boardgame_items = doc_a.css("item")
        expansion_items = doc_b.css("item")

        total_count = boardgame_items.length + expansion_items.length

        merged = Nokogiri::XML::Document.new
        root = merged.create_element("items")
        root["totalitems"] = total_count.to_s
        root["pubdate"] = doc_a.at_css("items")&.attr("pubdate") ||
                          doc_b.at_css("items")&.attr("pubdate") || ""

        all_items = boardgame_items + expansion_items
        all_items.each { |item| root.add_child(item.dup) }
        merged.root = root
        merged
      end
  end
end
