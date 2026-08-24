# frozen_string_literal: true

# Request-spec helpers for the REST auth endpoints. Mints a real DB-backed
# session token (the same mechanism that authorizes GraphQL + ActionCable) and
# returns the Authorization header hash.
module AuthHelpers
  def sign_in_as(user, sudo: false)
    session = user.sessions.create!(expires_at: 30.days.from_now)
    session.update!(sudo_at: sudo ? Time.current : 1.hour.ago)
    auth_headers(session.token)
  end

  def auth_headers(token)
    { "Authorization" => "Bearer #{token}" }
  end
end

RSpec.configure do |config|
  config.include AuthHelpers, type: :request
end
