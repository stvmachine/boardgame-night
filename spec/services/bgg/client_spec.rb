# frozen_string_literal: true

require "rails_helper"

RSpec.describe Bgg::Client, :bgg do
  subject(:client) { described_class.new(rate_limiter: rate_limiter) }

  let(:rate_limiter) { Bgg::RateLimiter.new }
  let(:cache) { ActiveSupport::Cache::MemoryStore.new }

  let(:collection_xml) do
    <<~XML
      <?xml version="1.0" encoding="utf-8"?>
      <items totalitems="1" termsofuse="https://boardgamegeek.com/xmlapi/termsofuse">
        <item objecttype="thing" objectid="174430" subtype="boardgame" collid="1001">
          <name objectid="174430" sortindex="1">Gloomhaven</name>
          <yearpublished value="2017" />
          <image>https://cf.geekdo-images.com/something/pic2437871.jpg</image>
          <thumbnail>https://cf.geekdo-images.com/something/pic2437871_t.jpg</thumbnail>
          <stats minplayers="1" maxplayers="4" minplaytime="60" maxplaytime="120" playingtime="90" numowned="50000">
            <rating value="8.8" />
          </stats>
          <status own="1" prevowned="0" fortrade="0" want="0" wanttoplay="0" wanttobuy="0" wishlist="0" preordered="0" lastmodified="2020-01-01" />
          <numplays>50</numplays>
        </item>
      </items>
    XML
  end

  let(:thing_xml) do
    <<~XML
      <?xml version="1.0" encoding="utf-8"?>
      <items termsofuse="https://boardgamegeek.com/xmlapi/termsofuse">
        <item type="boardgame" id="174430">
          <thumbnail>https://cf.geekdo-images.com/something/pic2437871_t.jpg</thumbnail>
          <image>https://cf.geekdo-images.com/something/pic2437871.jpg</image>
          <name type="primary" sortindex="1" value="Gloomhaven" />
          <yearpublished value="2017" />
          <minplayers value="1" />
          <maxplayers value="4" />
          <playingtime value="90" />
          <minplaytime value="60" />
          <maxplaytime value="120" />
          <minage value="12" />
          <statistics page="1">
            <ratings>
              <usersrated value="30000" />
              <average value="8.8" />
              <bayesaverage value="8.4" />
              <stddev value="1.5" />
              <median value="9.0" />
              <owned value="50000" />
              <averageweight value="3.8" />
            </ratings>
          </statistics>
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

  let(:hot_xml) do
    <<~XML
      <?xml version="1.0" encoding="utf-8"?>
      <items termsofuse="https://boardgamegeek.com/xmlapi/termsofuse">
        <item id="174430" rank="1">
          <thumbnail>https://cf.geekdo-images.com/something/pic2437871_t.jpg</thumbnail>
          <name value="Gloomhaven" />
          <yearpublished value="2017" />
        </item>
      </items>
    XML
  end

  let(:user_xml) do
    <<~XML
      <?xml version="1.0" encoding="utf-8"?>
      <items termsofuse="https://boardgamegeek.com/xmlapi/termsofuse">
        <user id="12345" name="stevmachine">
          <firstname>Steve</firstname>
          <lastname>Machine</lastname>
          <yearregistered value="2020" />
        </user>
      </items>
    XML
  end

  before do
    allow(Rails).to receive(:cache).and_return(cache)
  end

  describe "#collection" do
    it "caches the collection response and returns the cached doc on the next call" do
      different_xml = collection_xml.sub("Gloomhaven", "Different Game")

      stub_request(:get, /boardgamegeek.com\/xmlapi2\/collection/)
        .with(query: hash_including(username: "stevmachine"))
        .to_return(
          { status: 200, body: collection_xml, headers: { "Content-Type" => "text/xml" } },
          { status: 200, body: different_xml, headers: { "Content-Type" => "text/xml" } }
        )

      first_result = client.collection("stevmachine")
      second_result = client.collection("stevmachine")

      expect(first_result).to be_a(Nokogiri::XML::Document)
      expect(second_result).to be_a(Nokogiri::XML::Document)
      expect(second_result.at_css("name").text).to eq("Gloomhaven")
    end

    it "returns stale cache when the network request fails" do
      cache.write("bgg:collection:stevmachine", collection_xml)

      stub_request(:get, /boardgamegeek.com\/xmlapi2\/collection/)
        .with(query: hash_including(username: "stevmachine"))
        .to_return(status: 503, body: "")

      result = client.collection("stevmachine")

      expect(result).to be_a(Nokogiri::XML::Document)
      expect(result.at_css("name").text).to eq("Gloomhaven")
    end

    it "returns a Nokogiri::XML::Document on success" do
      stub_request(:get, /boardgamegeek.com\/xmlapi2\/collection/)
        .with(query: hash_including(username: "stevmachine"))
        .to_return(status: 200, body: collection_xml, headers: { "Content-Type" => "text/xml" })

      result = client.collection("stevmachine")
      expect(result).to be_a(Nokogiri::XML::Document)
    end

    it "retries on 202 and eventually succeeds" do
      stub_request(:get, /boardgamegeek.com\/xmlapi2\/collection/)
        .with(query: hash_including(username: "stevmachine"))
        .to_return(
          { status: 202, body: "", headers: {} },
          { status: 200, body: collection_xml, headers: { "Content-Type" => "text/xml" } }
        )

      allow(client).to receive(:sleep)

      result = client.collection("stevmachine")
      expect(result).to be_a(Nokogiri::XML::Document)
    end

    it "raises CollectionNotReadyError after exhausting 202 retries" do
      stub_request(:get, /boardgamegeek.com\/xmlapi2\/collection/)
        .with(query: hash_including(username: "stevmachine"))
        .to_return(status: 202, body: "", headers: {})

      allow(client).to receive(:sleep)

      expect { client.collection("stevmachine") }.to raise_error(Bgg::CollectionNotReadyError)
    end
  end

  describe "#thing" do
    it "fetches a single thing by ID" do
      stub_request(:get, /boardgamegeek.com\/xmlapi2\/thing/)
        .with(query: hash_including(id: "174430"))
        .to_return(status: 200, body: thing_xml, headers: { "Content-Type" => "text/xml" })

      result = client.thing(174430)
      expect(result).to be_a(Nokogiri::XML::Document)
    end

    it "fetches multiple things by array of IDs" do
      stub_request(:get, /boardgamegeek.com\/xmlapi2\/thing/)
        .with(query: hash_including(id: "174430,9209"))
        .to_return(status: 200, body: thing_xml, headers: { "Content-Type" => "text/xml" })

      result = client.thing([174430, 9209])
      expect(result).to be_a(Nokogiri::XML::Document)
    end
  end

  describe "#search" do
    it "searches with a query string" do
      stub_request(:get, /boardgamegeek.com\/xmlapi2\/search/)
        .with(query: hash_including(query: "gloomhaven"))
        .to_return(status: 200, body: search_xml, headers: { "Content-Type" => "text/xml" })

      result = client.search("gloomhaven")
      expect(result).to be_a(Nokogiri::XML::Document)
    end

    it "searches with exact match" do
      stub_request(:get, /boardgamegeek.com\/xmlapi2\/search/)
        .with(query: hash_including(query: "Gloomhaven", exact: "1"))
        .to_return(status: 200, body: search_xml, headers: { "Content-Type" => "text/xml" })

      result = client.search("Gloomhaven", exact: true)
      expect(result).to be_a(Nokogiri::XML::Document)
    end
  end

  describe "#user" do
    it "looks up a user by username" do
      stub_request(:get, /boardgamegeek.com\/xmlapi2\/user/)
        .with(query: hash_including(name: "stevmachine"))
        .to_return(status: 200, body: user_xml, headers: { "Content-Type" => "text/xml" })

      result = client.user("stevmachine")
      expect(result).to be_a(Nokogiri::XML::Document)
    end
  end

  describe "#user" do
    it "looks up a user by username" do
      stub_request(:get, /boardgamegeek.com\/xmlapi2\/user/)
        .with(query: hash_including(name: "stevmachine"))
        .to_return(status: 200, body: user_xml, headers: { "Content-Type" => "text/xml" })

      result = client.user("stevmachine")
      expect(result).to be_a(Nokogiri::XML::Document)
    end
  end

  describe "#hot" do
    it "fetches the BGG hotness list for board games" do
      stub_request(:get, /boardgamegeek.com\/xmlapi2\/hot/)
        .with(query: hash_including(type: "boardgame"))
        .to_return(status: 200, body: hot_xml, headers: { "Content-Type" => "text/xml" })

      result = client.hot
      expect(result).to be_a(Nokogiri::XML::Document)
      expect(result.at_css("item")["id"]).to eq("174430")
    end

    it "raises Bgg::ServerError on persistent 503" do
      stub_request(:get, /boardgamegeek.com\/xmlapi2\/hot/)
        .with(query: hash_including(type: "boardgame"))
        .to_return(status: 503, body: "")

      expect { client.hot }.to raise_error(Bgg::ServerError)
    end
  end

  describe "error handling" do
    it "raises Bgg::ResourceNotFound on 404" do
      stub_request(:get, /boardgamegeek.com\/xmlapi2\/user/)
        .with(query: hash_including(name: "nonexistent"))
        .to_return(status: 404, body: "")

      expect { client.user("nonexistent") }.to raise_error(Bgg::ResourceNotFound)
    end

    it "raises Bgg::ServerError on 503" do
      stub_request(:get, /boardgamegeek.com\/xmlapi2\/thing/)
        .with(query: hash_including(id: "174430"))
        .to_return(status: 503, body: "")

      expect { client.thing(174430) }.to raise_error(Bgg::ServerError)
    end

    it "raises Bgg::NetworkError on timeout", :focus_fast do
      stub_request(:get, /boardgamegeek.com\/xmlapi2\/thing/)
        .with(query: hash_including(id: "174430"))
        .to_timeout

      expect { client.thing(174430) }.to raise_error(Bgg::NetworkError)
    end
  end

  describe "#parse_xml" do
    it "raises Bgg::ParseError on invalid XML" do
      expect { client.parse_xml("not xml") }.to raise_error(Bgg::ParseError)
    end
  end
end
