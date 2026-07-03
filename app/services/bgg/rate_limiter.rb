# frozen_string_literal: true

module Bgg
  class RateLimiter
    MINIMUM_INTERVAL = 5

    CACHE_KEY = "bgg:last_request_at"

    def throttle
      last_request_at = Rails.cache.read(CACHE_KEY)

      if last_request_at
        elapsed = Time.now.to_f - last_request_at.to_f
        if elapsed < MINIMUM_INTERVAL
          sleep(MINIMUM_INTERVAL - elapsed)
        end
      end

      Rails.cache.write(CACHE_KEY, Time.now.to_f)
      yield
    end
  end
end
