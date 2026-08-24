# frozen_string_literal: true

class Current < ActiveSupport::CurrentAttributes
  attribute :session, :user
  # Request metadata captured by the Authentication concern and stamped onto
  # new Session/Event records (a-zero "trackable"). Not delegated to :session
  # because the concern assigns Current.user directly.
  attribute :user_agent, :ip_address
end
