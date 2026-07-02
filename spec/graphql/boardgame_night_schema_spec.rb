# frozen_string_literal: true

require "rails_helper"

RSpec.describe BoardgameNightSchema do
  describe "health query" do
    it "returns ok" do
      query = "{ health }"
      result = described_class.execute(query)
      expect(result["data"]).to eq("health" => "ok")
    end
  end

  describe "multiplex (Apollo batch)" do
    it "returns an array of two multiplexed results" do
      queries = [
        { query: "{ health }" },
        { query: "{ health }" }
      ]
      results = described_class.multiplex(queries)
      expect(results).to be_an(Array)
      expect(results.size).to eq(2)
      expect(results[0]["data"]).to eq("health" => "ok")
      expect(results[1]["data"]).to eq("health" => "ok")
    end
  end

  describe "introspection disabled in production" do
    it "rejects an introspection query when env is non-dev/non-test" do
      # Stash the original env so we can restore after the test
      original_rails_env = Rails.env
      # Disable the development/test guard by temporarily switching env
      allow(Rails).to receive(:env).and_return(ActiveSupport::StringInquirer.new("production"))

      query = "{ __schema { types { name } } }"
      result = described_class.execute(query)
      expect(result["errors"]).to be_present
      expect(result["errors"].first["message"]).to include("introspection")
    ensure
      # Restore env by re-allowing Rails.env
      allow(Rails).to receive(:env).and_return(original_rails_env)
    end
  end
end
