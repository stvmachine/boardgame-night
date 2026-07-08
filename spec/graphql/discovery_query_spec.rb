# frozen_string_literal: true

require "rails_helper"

RSpec.describe "discovery queries" do
  let(:hot_xml) do
    <<~XML
      <?xml version="1.0" encoding="utf-8"?>
      <items termsofuse="https://boardgamegeek.com/xmlapi/termsofuse">
        <item id="174430" rank="1">
          <thumbnail>https://cf.geekdo-images.com/ghotw/pic2437871_t.jpg</thumbnail>
          <name value="Gloomhaven" />
          <yearpublished value="2017" />
        </item>
        <item id="161936" rank="2">
          <thumbnail>https://cf.geekdo-images.com/pandemic/pic161936_t.jpg</thumbnail>
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

  describe "ValidationResult type" do
    it "has the expected fields" do
      type = Types::ValidationResultType

      field_names = type.fields.keys
      expect(field_names).to include("valid", "username", "exists", "avatar")
    end
  end
end
