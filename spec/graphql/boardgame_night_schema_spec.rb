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

  describe "suggestion engine contract" do
    it "loads Suggestion, SuggestionBreakdown, and ConfidenceLevel types" do
      expect(described_class.types.keys).to include(
        "Suggestion",
        "SuggestionBreakdown",
        "ConfidenceLevel"
      )
    end

    it "exposes exactly HIGH, MEDIUM, and LOW confidence values" do
      enum = described_class.types["ConfidenceLevel"]
      expect(enum.values.keys).to contain_exactly("HIGH", "MEDIUM", "LOW")
    end

    it "exposes NightSession preference and suggestion fields with correct types" do
      night_session = described_class.types["NightSession"]
      fields = night_session.fields

      time_budget = fields["timeBudgetMinutes"]
      expect(time_budget.type.non_null?).to be true
      expect(time_budget.type.unwrap.graphql_name).to eq("Int")

      complexity = fields["complexityPreference"]
      expect(complexity.type.non_null?).to be true
      expect(complexity.type.unwrap.graphql_name).to eq("String")

      suggestions = fields["suggestions"]
      expect(suggestions.type.list?).to be true
      expect(suggestions.type.non_null?).to be false
      expect(suggestions.type.of_type.non_null?).to be true
      expect(suggestions.type.unwrap.graphql_name).to eq("Suggestion")
    end

    it "exposes Suggestion fields with correct types" do
      suggestion = described_class.types["Suggestion"]
      fields = suggestion.fields

      expect(fields["thing"].type.non_null?).to be true
      expect(fields["thing"].type.unwrap.graphql_name).to eq("MergedThing")

      expect(fields["score"].type.non_null?).to be true
      expect(fields["score"].type.unwrap.graphql_name).to eq("Float")

      expect(fields["breakdown"].type.non_null?).to be true
      expect(fields["breakdown"].type.unwrap.graphql_name).to eq("SuggestionBreakdown")

      expect(fields["confidence"].type.non_null?).to be true
      expect(fields["confidence"].type.unwrap.graphql_name).to eq("ConfidenceLevel")

      reasons = fields["reasons"]
      expect(reasons.type.non_null?).to be true
      expect(reasons.type.of_type.list?).to be true
      expect(reasons.type.of_type.of_type.non_null?).to be true
      expect(reasons.type.unwrap.graphql_name).to eq("String")
    end

    it "exposes all five non-null Float breakdown fields" do
      breakdown = described_class.types["SuggestionBreakdown"]
      %w[playerCountFit timeFit complexityFit communityRating ownershipBonus].each do |name|
        field = breakdown.fields[name]
        expect(field).to be_present, "expected #{name} field on SuggestionBreakdown"
        expect(field.type.non_null?).to(be(true), "expected #{name} to be non-null")
        expect(field.type.unwrap.graphql_name).to(eq("Float"), "expected #{name} to be Float")
      end
    end

    it "registers updateSessionPreferences on the Mutation root" do
      mutation = described_class.types["Mutation"]
      field = mutation.fields["updateSessionPreferences"]
      expect(field).to be_present
      expect(field.type.unwrap.graphql_name).to eq("UpdateSessionPreferencesPayload")
    end

    it "proves the suggestion reachability chain from Query through NightSession" do
      query = described_class.types["Query"]
      night_session_field = query.fields["nightSession"]
      expect(night_session_field.type.unwrap.graphql_name).to eq("NightSession")

      night_session = described_class.types["NightSession"]
      suggestions_field = night_session.fields["suggestions"]
      expect(suggestions_field.type.unwrap.graphql_name).to eq("Suggestion")

      suggestion = described_class.types["Suggestion"]
      expect(suggestion.fields["breakdown"].type.unwrap.graphql_name).to eq("SuggestionBreakdown")
      expect(suggestion.fields["confidence"].type.unwrap.graphql_name).to eq("ConfidenceLevel")
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
