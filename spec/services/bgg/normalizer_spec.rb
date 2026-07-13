# frozen_string_literal: true

require "rails_helper"

RSpec.describe Bgg::Normalizer do
  describe ".normalize_collection" do
    context "with multiple items" do
      let(:xml) { Nokogiri::XML(file_fixture("stevmachine_collection.xml").read) }
      let(:result) { described_class.normalize_collection(xml) }

      it "extracts all items" do
        expect(result.length).to eq(3)
      end

      it "parses boardgame fields correctly" do
        gloomhaven = result.first
        expect(gloomhaven[:id]).to eq(174430)
        expect(gloomhaven[:name]).to eq("Gloomhaven")
        expect(gloomhaven[:year_published]).to eq(2017)
        expect(gloomhaven[:subtype]).to eq("boardgame")
      end

      it "parses stats for each item" do
        gloomhaven = result.first
        expect(gloomhaven[:stats][:min_players]).to eq(1)
        expect(gloomhaven[:stats][:max_players]).to eq(4)
        expect(gloomhaven[:stats][:playing_time]).to eq(90)
        expect(gloomhaven[:stats][:min_playtime]).to eq(60)
        expect(gloomhaven[:stats][:max_playtime]).to eq(120)
        expect(gloomhaven[:stats][:num_owned]).to eq(50_000)
        expect(gloomhaven[:stats][:rating]).to eq(8.8)
      end

      it "exposes BGG community statistics under stats" do
        gloomhaven = result.first
        expect(gloomhaven[:stats][:users_rated]).to eq(30_000)
        expect(gloomhaven[:stats][:average]).to eq(8.8)
        expect(gloomhaven[:stats][:bayes_average]).to eq(8.4)
        expect(gloomhaven[:stats][:average_weight]).to eq(3.8)
        expect(gloomhaven[:stats][:num_comments]).to be_nil
      end

      it "includes expansions with correct subtype" do
        expansion = result.last
        expect(expansion[:subtype]).to eq("boardgameexpansion")
        expect(expansion[:name]).to eq("Gloomhaven: Forgotten Circles")
      end

      it "returns image and thumbnail URLs" do
        gloomhaven = result.first
        expect(gloomhaven[:image]).to match(/https?:\/\//)
        expect(gloomhaven[:thumbnail]).to match(/https?:\/\//)
      end
    end

    context "with a single item" do
      let(:single_item_xml) do
        Nokogiri::XML(<<~XML)
          <?xml version="1.0" encoding="utf-8"?>
          <items totalitems="1" termsofuse="https://boardgamegeek.com/xmlapi/termsofuse">
            <item objecttype="thing" objectid="174430" subtype="boardgame" collid="1001">
              <name objectid="174430" sortindex="1">Gloomhaven</name>
              <yearpublished value="2017" />
              <thumbnail>https://example.com/t.jpg</thumbnail>
              <image>https://example.com/i.jpg</image>
              <stats minplayers="1" maxplayers="4" minplaytime="60" maxplaytime="120" playingtime="90" numowned="50000">
                <rating value="8.8" />
              </stats>
              <status own="1" lastmodified="2020-01-01" />
              <numplays>50</numplays>
            </item>
          </items>
        XML
      end

      it "returns an array with one element" do
        result = described_class.normalize_collection(single_item_xml)
        expect(result).to be_an(Array)
        expect(result.length).to eq(1)
        expect(result.first[:id]).to eq(174430)
      end
    end
  end

  describe ".normalize_thing" do
    context "with full thing data" do
      let(:xml) { Nokogiri::XML(file_fixture("stevmachine_thing.xml").read) }
      let(:result) { described_class.normalize_thing(xml) }

      it "extracts the thing id and type" do
        expect(result[:id]).to eq(174_430)
        expect(result[:type]).to eq("boardgame")
      end

      it "extracts the primary name" do
        expect(result[:name]).to eq("Gloomhaven")
      end

      it "extracts alternate names" do
        expect(result[:alternate_names]).to include("Gloomhaven (2017)")
      end

      it "extracts description" do
        expect(result[:description]).to start_with("Gloomhaven is a game")
      end

      it "extracts numeric fields" do
        expect(result[:year_published]).to eq(2017)
        expect(result[:min_players]).to eq(1)
        expect(result[:max_players]).to eq(4)
        expect(result[:playing_time]).to eq(90)
        expect(result[:min_playtime]).to eq(60)
        expect(result[:max_playtime]).to eq(120)
        expect(result[:min_age]).to eq(12)
      end

      it "extracts image and thumbnail" do
        expect(result[:thumbnail]).to match(/https?:\/\//)
        expect(result[:image]).to match(/https?:\/\//)
      end

      it "extracts statistics" do
        expect(result[:statistics][:average_rating]).to eq(8.8)
        expect(result[:statistics][:bayes_average]).to eq(8.4)
        expect(result[:statistics][:users_rated]).to eq(30_000)
        expect(result[:statistics][:owned]).to eq(50_000)
        expect(result[:statistics][:average_weight]).to eq(3.8)
      end
    end

    context "with missing optional fields" do
      let(:minimal_xml) do
        Nokogiri::XML(<<~XML)
          <?xml version="1.0" encoding="utf-8"?>
          <items termsofuse="https://boardgamegeek.com/xmlapi/termsofuse">
            <item type="boardgame" id="99999">
              <name type="primary" value="Mystery Game" />
              <yearpublished value="2024" />
              <minplayers value="2" />
              <maxplayers value="4" />
            </item>
          </items>
        XML
      end

      it "returns nil for missing fields instead of crashing" do
        result = described_class.normalize_thing(minimal_xml)
        expect(result[:description]).to be_nil
        expect(result[:image]).to be_nil
        expect(result[:thumbnail]).to be_nil
        expect(result[:min_age]).to be_nil
        expect(result[:playing_time]).to be_nil
        expect(result[:statistics]).to eq({
          users_rated: nil,
          average_rating: nil,
          bayes_average: nil,
          stddev: nil,
          median: nil,
          owned: nil,
          average_weight: nil
        })
      end

      it "still extracts present fields" do
        result = described_class.normalize_thing(minimal_xml)
        expect(result[:id]).to eq(99_999)
        expect(result[:name]).to eq("Mystery Game")
        expect(result[:year_published]).to eq(2024)
        expect(result[:max_players]).to eq(4)
      end
    end

    context "with nil xml" do
      it "returns nil when there is no item element" do
        empty_xml = Nokogiri::XML("<items></items>")
        expect(described_class.normalize_thing(empty_xml)).to be_nil
      end
    end
  end

  describe ".normalize_polls" do
    context "with full thing data" do
      let(:xml) { Nokogiri::XML(file_fixture("stevmachine_thing.xml").read) }
      let(:item) { xml.at_css("items > item") }
      let(:result) { described_class.normalize_polls(item) }

      it "extracts poll name and title" do
        expect(result[:name]).to eq("suggested_numplayers")
        expect(result[:title]).to eq("User Suggested Number of Players")
      end

      it "extracts total votes as an integer" do
        expect(result[:total_votes]).to eq(2000)
      end

      it "returns results for each player count" do
        expect(result[:results].length).to eq(4)
        expect(result[:results].map { |r| r[:player_count] }).to eq([1, 2, 3, 4])
      end

      it "extracts Best/Recommended/Not Recommended votes" do
        first_result = result[:results].first
        expect(first_result[:votes].map { |v| v[:value] }).to eq(
          ["Best", "Recommended", "Not Recommended"]
        )
        best_vote = first_result[:votes].find { |v| v[:value] == "Best" }
        expect(best_vote[:num_votes]).to eq(100)
      end
    end

    context "when the item has no suggested_numplayers poll" do
      it "returns nil" do
        minimal_xml = Nokogiri::XML(<<~XML)
          <?xml version="1.0" encoding="utf-8"?>
          <items>
            <item type="boardgame" id="99999">
              <name type="primary" value="Mystery Game" />
            </item>
          </items>
        XML
        item = minimal_xml.at_css("items > item")
        expect(described_class.normalize_polls(item)).to be_nil
      end
    end
  end

  describe ".parse_player_count" do
    it "returns integer for numeric player count" do
      expect(described_class.parse_player_count("4")).to eq(4)
    end

    it "returns nil for nil input" do
      expect(described_class.parse_player_count(nil)).to be_nil
    end

    it "returns integer part for '4+'" do
      expect(described_class.parse_player_count("4+")).to eq(4)
    end
  end
end
