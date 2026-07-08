# frozen_string_literal: true

require "rails_helper"

RSpec.describe Bgg::CollectionFetcher, type: :service do
  subject(:fetcher) { described_class.new(client: client, normalizer: normalizer) }
  let(:client) { instance_double(Bgg::Client) }
  let(:normalizer) { double("normalizer") }
  let(:username) { "stevmachine" }

  let(:boardgames_fixture) do
    Nokogiri::XML(File.read(file_fixture("stevmachine_boardgames.xml")))
  end

  let(:expansions_fixture) do
    Nokogiri::XML(File.read(file_fixture("stevmachine_expansions.xml")))
  end

  let(:merged_fixture) do
    Nokogiri::XML(File.read(file_fixture("stevmachine_collection.xml")))
  end

  let(:normalized_result) do
    [
      { object_id: "174430", name: "Gloomhaven", subtype: "boardgame" },
      { object_id: "9209", name: "Ticket to Ride", subtype: "boardgame" },
      { object_id: "260300", name: "Gloomhaven: Forgotten Circles", subtype: "boardgameexpansion" }
    ]
  end

  describe "#fetch" do
    context "when workaround succeeds" do
      before do
        allow(client).to receive(:request_with_202_retry)
          .with(:collection, hash_including(excludesubtype: "boardgameexpansion"))
          .and_return(boardgames_fixture)

        allow(client).to receive(:request_with_202_retry)
          .with(:collection, hash_including(subtype: "boardgameexpansion"))
          .and_return(expansions_fixture)

        allow(normalizer).to receive(:normalize_collection)
          .and_return(normalized_result)
      end

      it "makes two API calls (base games + expansions)" do
        expect(client).to receive(:request_with_202_retry)
          .with(:collection, hash_including(excludesubtype: "boardgameexpansion"))
        expect(client).to receive(:request_with_202_retry)
          .with(:collection, hash_including(subtype: "boardgameexpansion"))
        fetcher.fetch(username)
      end

      it "returns normalized collection array" do
        result = fetcher.fetch(username)
        expect(result).to eq(normalized_result)
      end

      it "merges items into correct total count" do
        allow(normalizer).to receive(:normalize_collection) do |doc|
          items_count = doc.css("item").length
          expect(items_count).to eq(3) # 2 boardgames + 1 expansion from fixture
          normalized_result
        end
        fetcher.fetch(username)
      end
    end

    context "when workaround fails with client error" do
      before do
        allow(client).to receive(:request_with_202_retry)
          .with(:collection, hash_including(excludesubtype: "boardgameexpansion"))
          .and_raise(Bgg::ClientError, "BGG returned 502")

        # Fallback stub: only matches calls WITHOUT :excludesubtype or :subtype
        # (workaround calls have one of these keys, fallback call has neither)
        allow(client).to receive(:request_with_202_retry)
          .with(:collection, hash_excluding(:excludesubtype, :subtype))
          .and_return(merged_fixture)

        allow(normalizer).to receive(:normalize_collection)
          .with(an_instance_of(Nokogiri::XML::Document))
          .and_return(normalized_result)
      end

      it "falls back to single call" do
        expect(client).to receive(:request_with_202_retry)
          .with(:collection, hash_excluding(:excludesubtype, :subtype))
        fetcher.fetch(username)
      end

      it "returns normalized result from fallback" do
        result = fetcher.fetch(username)
        expect(result).to eq(normalized_result)
      end

      it "logs a warning" do
        expect(Rails.logger).to receive(:warn).with(/falling back/i)
        fetcher.fetch(username)
      end
    end

    context "when workaround fails with network error" do
      before do
        allow(client).to receive(:request_with_202_retry)
          .with(:collection, hash_including(excludesubtype: "boardgameexpansion"))
          .and_raise(Bgg::NetworkError, "Connection timeout")

        # Fallback stub: only matches calls WITHOUT :excludesubtype or :subtype
        allow(client).to receive(:request_with_202_retry)
          .with(:collection, hash_excluding(:excludesubtype, :subtype))
          .and_return(merged_fixture)

        allow(normalizer).to receive(:normalize_collection)
          .with(an_instance_of(Nokogiri::XML::Document))
          .and_return(normalized_result)
      end

      it "falls back on network errors" do
        result = fetcher.fetch(username)
        expect(result).to eq(normalized_result)
      end
    end

    context "when both workaround AND fallback fail" do
      before do
        allow(client).to receive(:request_with_202_retry)
          .and_raise(Bgg::NetworkError, "BGG unreachable")
      end

      it "re-raises the error" do
        expect { fetcher.fetch(username) }.to raise_error(Bgg::NetworkError)
      end
    end
  end
end
