# frozen_string_literal: true

require "webmock/rspec"

RSpec.configure do |config|
  config.before(:each, :bgg) do
    WebMock.disable_net_connect!(allow_localhost: true)
  end

  config.after(:each, :bgg) do
    WebMock.allow_net_connect!
  end
end
