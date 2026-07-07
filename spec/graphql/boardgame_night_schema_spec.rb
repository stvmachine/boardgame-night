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

  describe "collection surface types" do
    it "loads the required types" do
      expect(described_class.types.keys).to include(
        "Thing",
        "MergedThing",
        "MergedCollection",
        "Owner",
        "User",
        "UserSyncStatus",
        "SyncStatus"
      )
    end

    it "exposes SyncStatus enum values" do
      enum = described_class.types["SyncStatus"]
      expect(enum.values.keys).to include("QUEUED", "SYNCING", "READY", "ERROR")
    end
  end

  describe "introspection disabled in production" do
    it "rejects an introspection query when introspection entry points are disabled" do
      # Create a subclass with introspection disabled to simulate production mode
      production_schema = Class.new(BoardgameNightSchema) do
        disable_introspection_entry_points
      end

      query = "{ __schema { types { name } } }"
      result = production_schema.execute(query)
      expect(result["errors"]).to be_present
      expect(result["errors"].first["message"]).to match(/__schema|introspection/i)
    end

    it "has the disable_introspection_entry_points guard in the schema source" do
      schema_file = Rails.root.join("app/graphql/boardgame_night_schema.rb").read
      guard_pattern = /disable_introspection_entry_points\s+unless\s+Rails\.env\.development\?\s*\|\|\s*Rails\.env\.test\?/
      expect(schema_file).to match(guard_pattern)
    end
  end
end
