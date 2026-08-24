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

  describe "#thing" do
    let(:rate_limiter) { instance_double(Bgg::RateLimiter) }

    before do
      allow(rate_limiter).to receive(:throttle).and_yield
    end

    def thing_xml_response(ids)
      items = ids.map do |id|
        %(<item type="boardgame" id="#{id}"><name type="primary" value="Game #{id}" /></item>)
      end.join

      <<~XML
        <?xml version="1.0" encoding="utf-8"?>
        <items termsofuse="https://boardgamegeek.com/xmlapi/termsofuse">
          #{items}
        </items>
      XML
    end

    it "fetches a single thing by ID and returns a Nokogiri doc with one item" do
      stub_request(:get, /boardgamegeek.com\/xmlapi2\/thing/)
        .with(query: hash_including(id: "174430", stats: "1"))
        .to_return(status: 200, body: thing_xml, headers: { "Content-Type" => "text/xml" })

      result = client.thing(174_430)

      expect(result).to be_a(Nokogiri::XML::Document)
      expect(result.css("items > item").length).to eq(1)
      expect(result.at_css("items > item")["id"]).to eq("174430")
    end

    it "batches 25 uncached IDs into 2 BGG requests" do
      ids = (1..25).to_a
      first_batch = ids[0...20]
      second_batch = ids[20...25]

      first_xml = thing_xml_response(first_batch)
      second_xml = thing_xml_response(second_batch)

      stub_request(:get, /boardgamegeek.com\/xmlapi2\/thing/)
        .with(query: hash_including(id: first_batch.join(",")))
        .to_return(status: 200, body: first_xml, headers: { "Content-Type" => "text/xml" })

      stub_request(:get, /boardgamegeek.com\/xmlapi2\/thing/)
        .with(query: hash_including(id: second_batch.join(",")))
        .to_return(status: 200, body: second_xml, headers: { "Content-Type" => "text/xml" })

      result = client.thing(ids)

      expect(result).to be_a(Nokogiri::XML::Document)
      expect(result.css("items > item").length).to eq(25)
      expect(result.css("items > item").map { |i| i["id"].to_i }).to eq(ids)
      expect(a_request(:get, /boardgamegeek.com\/xmlapi2\/thing/)).to have_been_made.twice
    end

    it "caches each returned item under bgg:thing:{id} for 1 hour" do
      stub_request(:get, /boardgamegeek.com\/xmlapi2\/thing/)
        .with(query: hash_including(id: "174430"))
        .to_return(status: 200, body: thing_xml, headers: { "Content-Type" => "text/xml" })

      client.thing(174_430)

      cached = Rails.cache.read("bgg:thing:174430")
      expect(cached).to be_present
      expect(cached).to include('<item type="boardgame" id="174430"')
    end

    it "serves a second request for the same IDs from cache with 0 additional BGG requests" do
      ids = (1..25).to_a
      first_batch = ids[0...20]
      second_batch = ids[20...25]

      first_xml = thing_xml_response(first_batch)
      second_xml = thing_xml_response(second_batch)

      stub_request(:get, /boardgamegeek.com\/xmlapi2\/thing/)
        .with(query: hash_including(id: first_batch.join(",")))
        .to_return(status: 200, body: first_xml, headers: { "Content-Type" => "text/xml" })

      stub_request(:get, /boardgamegeek.com\/xmlapi2\/thing/)
        .with(query: hash_including(id: second_batch.join(",")))
        .to_return(status: 200, body: second_xml, headers: { "Content-Type" => "text/xml" })

      client.thing(ids)
      client.thing(ids)

      expect(a_request(:get, /boardgamegeek.com\/xmlapi2\/thing/)).to have_been_made.twice
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

    it "raises Bgg::AccessDeniedError on 401 (BGG WAF block)" do
      stub_request(:get, /boardgamegeek.com\/xmlapi2\/thing/)
        .with(query: hash_including(id: "174430"))
        .to_return(status: 401, body: "")

      expect { client.thing(174430) }
        .to raise_error(Bgg::AccessDeniedError, /denied API access/i)
    end

    it "raises Bgg::AccessDeniedError on 403" do
      stub_request(:get, /boardgamegeek.com\/xmlapi2\/thing/)
        .with(query: hash_including(id: "174430"))
        .to_return(status: 403, body: "")

      expect { client.thing(174430) }.to raise_error(Bgg::AccessDeniedError)
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
