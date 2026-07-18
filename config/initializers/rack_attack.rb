# frozen_string_literal: true

require "rack/attack"

Rack::Attack.cache.store = Rails.cache

# Throttle auth operations on /graphql: 5 requests per minute per IP.
# Development includes the deterministic E2E server, where every browser
# context signs in through localhost and would otherwise share one bucket.
unless Rails.env.development?
  Rack::Attack.throttle("graphql/auth", limit: 5, period: 60) do |req|
    next unless req.path == "/graphql" && req.post?

    body = req.body.read
    req.body.rewind

    body.include?("signIn") || body.include?("signUp") ? req.ip : nil
  end
end
