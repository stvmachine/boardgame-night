# frozen_string_literal: true

require "rack/attack"

Rack::Attack.cache.store = Rails.cache

# Throttle auth operations on /graphql: 5 requests per minute per IP.
# Development includes the deterministic E2E server, where every browser
# context signs in through localhost and would otherwise share one bucket.
# Skip throttling in local envs (development + test): the deterministic E2E
# server and request specs drive many auth calls from one localhost IP and would
# otherwise share/exhaust a single bucket.
unless Rails.env.local?
  # GraphQL auth still covers the surviving auth-gated mutations
  # (upgradeToAccount, bindBggUsername).
  Rack::Attack.throttle("graphql/auth", limit: 5, period: 60) do |req|
    next unless req.path == "/graphql" && req.post?

    body = req.body.read
    req.body.rewind

    body.include?("upgradeToAccount") || body.include?("bindBggUsername") ? req.ip : nil
  end

  # REST auth entry points and the email-bomb vectors (verification / reset).
  Rack::Attack.throttle("rest/auth", limit: 5, period: 60) do |req|
    if req.post? && [ "/sign_in", "/sign_up", "/sudo",
                      "/identity/email_verification", "/identity/password_reset" ].include?(req.path)
      req.ip
    end
  end
end
