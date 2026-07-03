# frozen_string_literal: true

require "rails_helper"

RSpec.describe Bgg::RateLimiter, :bgg do
  include ActiveSupport::Testing::TimeHelpers
  subject(:rate_limiter) { described_class.new }

  let(:cache) { ActiveSupport::Cache::MemoryStore.new }

  before do
    allow(Rails).to receive(:cache).and_return(cache)
  end

  describe "#throttle" do
    it "allows immediate first call" do
      expect { |b| rate_limiter.throttle(&b) }.to yield_control
    end

    it "blocks second call within 5s interval" do
      rate_limiter.throttle { "first" }

      expect(rate_limiter).to receive(:sleep).with(a_value_within(0.5).of(5.0))
      rate_limiter.throttle { "second" }
    end

    it "allows subsequent call after 5s interval passes" do
      rate_limiter.throttle { "first" }

      travel_to(Time.current + 6.seconds) do
        expect(rate_limiter).not_to receive(:sleep)
        expect { |b| rate_limiter.throttle(&b) }.to yield_control
      end
    end

    it "writes current time to cache after call" do
      now = Time.current

      travel_to(now) do
        rate_limiter.throttle { "ok" }
      end

      stored = cache.read("bgg:last_request_at")
      expect(stored).to be_within(1).of(now.to_f)
    end
  end
end
