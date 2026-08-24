# frozen_string_literal: true

module Bgg
  class Client
    BASE_URL = "https://boardgamegeek.com/xmlapi2/"
    USER_AGENT = "BoardgameNightRails/1.0 (boardgame-night-rails-vue)"

    attr_reader :rate_limiter, :conn

    def initialize(rate_limiter: Bgg::RateLimiter.new)
      @rate_limiter = rate_limiter
      @conn = build_connection
    end

    def thing(ids)
      ids = Array(ids).map(&:to_s).uniq
      cached_xmls = {}
      uncached_ids = []

      ids.each do |id|
        cached = Rails.cache.read(thing_cache_key(id))
        if cached
          cached_xmls[id] = cached
        else
          uncached_ids << id
        end
      end

      if uncached_ids.any?
        handle_faraday_errors do
          uncached_ids.each_slice(20) do |batch|
            doc = perform_request("thing", id: batch.join(","), stats: 1)
            doc.css("items > item").each do |item|
              Rails.cache.write(thing_cache_key(item["id"]), item.to_xml, expires_in: 1.hour)
              cached_xmls[item["id"]] = item.to_xml
            end
          end
        end
      end

      merge_item_xmls(cached_xmls.values)
    end

    def search(query, type: "boardgame", exact: false)
      params = { query: query, type: type }
      params[:exact] = 1 if exact

      handle_faraday_errors do
        perform_request("search", params)
      end
    end

    def user(username)
      handle_faraday_errors do
        perform_request("user", name: username)
      end
    end

    def hot(type: "boardgame")
      handle_faraday_errors do
        perform_request("hot", type: type)
      end
    end

    def plays(username:, page: 1)
      handle_faraday_errors do
        perform_request("plays", username: username, page: page)
      end
    end

    # Public — consumed by CollectionFetcher to abstract BGG's async collection
    # generation. Retries on 202 (BGG is still preparing the response) up to 5
    # times with 5-second backoff, then raises CollectionNotReadyError.
    def request_with_202_retry(endpoint, params)
      response = nil

      5.times do |attempt|
        begin
          rate_limiter.throttle do
            response = conn.get(endpoint.to_s, params)
            raise Bgg::QueuedResponse if response.status == 202
          end

          return parse_xml(response.body)
        rescue Bgg::QueuedResponse
          raise Bgg::CollectionNotReadyError if attempt >= 4
          sleep(5)
        rescue Faraday::ResourceNotFound => e
          raise Bgg::ResourceNotFound, e.message
        rescue Faraday::UnauthorizedError, Faraday::ForbiddenError => e
          raise Bgg::AccessDeniedError, access_denied_message(e)
        rescue Faraday::ClientError => e
          raise Bgg::ClientError, e.message
        rescue Faraday::ServerError => e
          raise Bgg::ServerError, e.message
        rescue Faraday::TimeoutError, Faraday::ConnectionFailed => e
          raise Bgg::NetworkError, e.message
        end
      end
    end

    def parse_xml(body)
      Nokogiri::XML(body) { |config| config.strict; config.nonet }
          rescue Nokogiri::XML::SyntaxError => e
            raise Bgg::ParseError, e.message
    end

    private

      def thing_cache_key(id)
        "bgg:thing:#{id}"
      end

      def merge_item_xmls(xml_strings)
        merged = Nokogiri::XML::Document.new
        root = merged.create_element("items")
        xml_strings.each do |xml|
          item = Nokogiri::XML(xml).at_css("item")
          root.add_child(item.dup) if item
        end
        merged.root = root
        merged
      end

      def build_connection
        Faraday.new(url: BASE_URL, request: { timeout: 10, open_timeout: 5 }) do |f|
          f.request :retry, max: 3, backoff_factor: 2, retry_statuses: [ 429, 502, 503 ]
          f.headers["User-Agent"] = USER_AGENT
          f.headers["Authorization"] = "Bearer #{ENV["BGG_TOKEN"]}" if ENV["BGG_TOKEN"].present?
          f.response :raise_error
          f.adapter :net_http
        end
      end

      def perform_request(endpoint, params)
        response = nil

        rate_limiter.throttle do
          response = conn.get(endpoint.to_s, params)
        end

        parse_xml(response.body)
      end

      def handle_faraday_errors
        yield
            rescue Faraday::ResourceNotFound => e
              raise Bgg::ResourceNotFound, e.message
            rescue Faraday::UnauthorizedError, Faraday::ForbiddenError => e
              raise Bgg::AccessDeniedError, access_denied_message(e)
            rescue Faraday::ClientError => e
              raise Bgg::ClientError, e.message
            rescue Faraday::ServerError => e
              raise Bgg::ServerError, e.message
            rescue Faraday::TimeoutError, Faraday::ConnectionFailed => e
              raise Bgg::NetworkError, e.message
      end

      def access_denied_message(error)
        status = error.response&.dig(:status)
        token_state =
          if ENV["BGG_TOKEN"].blank?
            "BGG_TOKEN is not set"
          elsif ENV["BGG_TOKEN"].start_with?("encrypted:")
            "BGG_TOKEN is still encrypted (dotenvx did not decrypt it — check DOTENV_PRIVATE_KEY_BGGEEK)"
          else
            "BGG_TOKEN is set but was rejected (expired or invalid registration)"
          end
        "BGG denied API access (HTTP #{status || "401/403"}). Since late 2025 the XML API " \
        "requires a registered Bearer token: #{token_state}. See " \
        "https://boardgamegeek.com/using_the_xml_api"
      end
  end
end
