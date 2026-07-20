# frozen_string_literal: true

require "rails_helper"

RSpec.describe "discovery queries" do
  let(:hot_xml) do
    <<~XML
      <?xml version="1.0" encoding="utf-8"?>
      <items termsofuse="https://boardgamegeek.com/xmlapi/termsofuse">
        <item id="174430" rank="1">
          <thumbnail value="https://cf.geekdo-images.com/ghotw/pic2437871_t.jpg" />
          <name value="Gloomhaven" />
          <yearpublished value="2017" />
        </item>
        <item id="161936" rank="2">
          <thumbnail value="https://cf.geekdo-images.com/pandemic/pic161936_t.jpg" />
          <name value="Pandemic Legacy: Season 1" />
          <yearpublished value="2015" />
        </item>
      </items>
    XML
  end

  let(:search_xml) do
    <<~XML
      <?xml version="1.0" encoding="utf-8"?>
      <items totalitems="1" termsofuse="https://boardgamegeek.com/xmlapi/termsofuse">
        <item type="boardgame" id="174430">
          <name type="primary" value="Gloomhaven" />
          <yearpublished value="2017" />
        </item>
      </items>
    XML
  end

  before do
    allow(Rails).to receive(:cache).and_return(ActiveSupport::Cache::MemoryStore.new)
  end

  describe "hotItems query" do
    let(:query) do
      <<~GRAPHQL
        query {
          hotItems {
            id
            rank
            name
            yearPublished
            thumbnail
          }
        }
      GRAPHQL
    end

    before do
      stub_request(:get, /boardgamegeek.com\/xmlapi2\/hot/)
        .with(query: hash_including(type: "boardgame"))
        .to_return(status: 200, body: hot_xml, headers: { "Content-Type" => "text/xml" })
    end

    it "returns the BGG hotness list" do
      result = BoardgameNightSchema.execute(query)

      expect(result["errors"]).to be_nil
      items = result.dig("data", "hotItems")
      expect(items.size).to eq(2)
      expect(items.first).to include(
        "id" => "174430",
        "rank" => 1,
        "name" => "Gloomhaven",
        "yearPublished" => 2017,
        "thumbnail" => "https://cf.geekdo-images.com/ghotw/pic2437871_t.jpg"
      )
    end

    it "caches the BGG response for 1 hour" do
      BoardgameNightSchema.execute(query)

      expect(Rails.cache.exist?("bgg/hot")).to be true
    end
  end

  describe "search query" do
    let(:query) do
      <<~GRAPHQL
        query Search($query: String!) {
          search(query: $query) {
            id
            name
            yearPublished
          }
        }
      GRAPHQL
    end

    before do
      stub_request(:get, /boardgamegeek.com\/xmlapi2\/search/)
        .with(query: hash_including(query: "gloomhaven", type: "boardgame"))
        .to_return(status: 200, body: search_xml, headers: { "Content-Type" => "text/xml" })
    end

    it "returns BGG search results" do
      result = BoardgameNightSchema.execute(query, variables: { query: "gloomhaven" })

      expect(result["errors"]).to be_nil
      items = result.dig("data", "search")
      expect(items.size).to eq(1)
      expect(items.first).to include(
        "id" => "174430",
        "name" => "Gloomhaven",
        "yearPublished" => 2017
      )
    end
  end

  describe "hotItems query enrichment" do
    let(:enriched_query) do
      <<~GRAPHQL
        query {
          hotItems {
            id
            rank
            name
            yearPublished
            thumbnail
            average
            averageWeight
            minPlayers
            maxPlayers
            minPlaytime
            maxPlaytime
          }
        }
      GRAPHQL
    end

    before do
      stub_request(:get, /boardgamegeek.com\/xmlapi2\/hot/)
        .with(query: hash_including(type: "boardgame"))
        .to_return(status: 200, body: hot_xml, headers: { "Content-Type" => "text/xml" })
    end

    def count_active_record_queries
      count = 0
      subscriber = ActiveSupport::Notifications.subscribe("sql.active_record") do |*|
        count += 1
      end
      yield
      count
    ensure
      ActiveSupport::Notifications.unsubscribe(subscriber)
    end

    it "returns persisted enrichment for a matching objectid" do
      BggThing.create!(
        objectid: 174_430,
        name: "Gloomhaven",
        average: 8.7,
        average_weight: 3.8,
        min_players: 1,
        max_players: 4,
        min_playtime: 60,
        max_playtime: 120
      )

      result = BoardgameNightSchema.execute(enriched_query)

      expect(result["errors"]).to be_nil
      items = result.dig("data", "hotItems")
      expect(items.first).to include(
        "id" => "174430",
        "average" => 8.7,
        "averageWeight" => 3.8,
        "minPlayers" => 1,
        "maxPlayers" => 4,
        "minPlaytime" => 60,
        "maxPlaytime" => 120
      )
    end

    it "returns null enrichment fields for an unmatched objectid" do
      result = BoardgameNightSchema.execute(enriched_query)

      expect(result["errors"]).to be_nil
      items = result.dig("data", "hotItems")
      expect(items.second).to include(
        "id" => "161936",
        "average" => nil,
        "averageWeight" => nil,
        "minPlayers" => nil,
        "maxPlayers" => nil,
        "minPlaytime" => nil,
        "maxPlaytime" => nil
      )
    end

    it "issues one persisted batch query for all enrichment fields" do
      BggThing.create!(
        objectid: 174_430,
        name: "Gloomhaven",
        average: 8.7,
        average_weight: 3.8,
        min_players: 1,
        max_players: 4,
        min_playtime: 60,
        max_playtime: 120
      )

      # Warm the hot list cache so the only SQL is the enrichment loader.
      BoardgameNightSchema.execute(enriched_query)
      Rails.cache.clear

      query_count = count_active_record_queries do
        BoardgameNightSchema.execute(enriched_query)
      end

      expect(query_count).to eq(1)
    end

    it "does not issue synchronous per-card BGG detail requests" do
      stub_request(:get, /boardgamegeek.com\/xmlapi2\/thing/)
        .to_return(status: 500, body: "should not be called")

      result = BoardgameNightSchema.execute(enriched_query)

      expect(result["errors"]).to be_nil
      expect(WebMock).not_to have_requested(:get, /boardgamegeek.com\/xmlapi2\/thing/)
    end
  end

  describe "ValidationResult type" do
    it "has the expected fields" do
      type = Types::ValidationResultType

      field_names = type.fields.keys
      expect(field_names).to include("valid", "username", "exists", "avatar")
    end
  end
end
