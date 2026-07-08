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

    def collection(username)
      cache_key = "bgg:collection:#{username}"
      stale_cache = Rails.cache.read(cache_key)

      cached_value = begin
        Rails.cache.fetch(cache_key, expires_in: 30.minutes) do
          request_with_202_retry(:collection, username: username, own: 1, stats: 1).to_xml
        end
      rescue => e
        raise e if stale_cache.nil?

        stale_cache
      end

      cached_value.is_a?(Nokogiri::XML::Document) ? cached_value : parse_xml(cached_value)
    end

    def thing(ids)
      handle_faraday_errors do
        perform_request("thing", id: Array(ids).join(","), stats: 1)
      end
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
      Nokogiri::XML(body) { |config| config.strict }
    rescue Nokogiri::XML::SyntaxError => e
      raise Bgg::ParseError, e.message
    end

    private

    def build_connection
      Faraday.new(url: BASE_URL, request: { timeout: 10, open_timeout: 5 }) do |f|
        f.request :retry, max: 3, backoff_factor: 2, retry_statuses: [429, 502, 503]
        f.headers["User-Agent"] = USER_AGENT
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
    rescue Faraday::ClientError => e
      raise Bgg::ClientError, e.message
    rescue Faraday::ServerError => e
      raise Bgg::ServerError, e.message
    rescue Faraday::TimeoutError, Faraday::ConnectionFailed => e
      raise Bgg::NetworkError, e.message
    end
  end
end
