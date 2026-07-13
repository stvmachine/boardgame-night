# frozen_string_literal: true

require "rails_helper"

RSpec.describe Bgg::BackfillPollDataJob, type: :job do
  subject(:job) { described_class.new }

  let(:client) { instance_double(Bgg::Client) }
  let(:persister) { class_double(Bgg::PollPersister) }
  let(:xml_doc) { Nokogiri::XML(file_fixture("stevmachine_thing.xml").read) }

  before do
    allow(Bgg::Client).to receive(:new).and_return(client)
    stub_const("Bgg::PollPersister", persister)
    allow(persister).to receive(:persist_from_thing_xml)
  end

  describe "#perform" do
    context "with things needing poll data" do
      let!(:thing1) { BggThing.create!(objectid: 174_430, name: "Gloomhaven") }
      let!(:thing2) { BggThing.create!(objectid: 9209, name: "Another Game") }
      let!(:thing3) do
        BggThing.create!(objectid: 999, name: "Already Enriched", poll_data_fetched_at: Time.current)
      end

      before do
        allow(client).to receive(:thing).with([174_430, 9209]).and_return(xml_doc)
      end

      it "fetches things in batches of 20" do
        expect(client).to receive(:thing).with([174_430, 9209]).and_return(xml_doc)
        job.perform
      end

      it "persists poll data via PollPersister" do
        expect(persister).to receive(:persist_from_thing_xml).with(xml_doc)
        job.perform
      end

      it "skips things already enriched" do
        expect(client).not_to receive(:thing).with([999])
        job.perform
      end
    end

    context "when BGG omits a requested ID from the response" do
      let!(:thing1) { BggThing.create!(objectid: 174_430, name: "Gloomhaven") }
      let!(:thing2) { BggThing.create!(objectid: 9209, name: "Missing Game") }

      let(:partial_xml) do
        Nokogiri::XML(<<~XML)
          <?xml version="1.0" encoding="utf-8"?>
          <items termsofuse="https://boardgamegeek.com/xmlapi/termsofuse">
            <item type="boardgame" id="174430">
              <name type="primary" value="Gloomhaven" />
            </item>
          </items>
        XML
      end

      before do
        allow(client).to receive(:thing).with([174_430, 9209]).and_return(partial_xml)
        allow(Rails).to receive(:logger).and_return(Logger.new(File::NULL))
      end

      it "does not mark the missing thing as fetched" do
        job.perform

        expect(thing2.reload.poll_data_fetched_at).to be_nil
      end

      it "logs the missing IDs" do
        logger = instance_double(Logger, warn: nil)
        allow(Rails).to receive(:logger).and_return(logger)

        expect(logger).to receive(:warn).with(/9209/)
        job.perform
      end
    end

    context "with no things needing poll data" do
      it "is a no-op" do
        expect(client).not_to receive(:thing)
        expect(persister).not_to receive(:persist_from_thing_xml)

        expect { job.perform }.not_to raise_error
      end
    end
  end

  describe "retry/discard configuration" do
    it "retries on Bgg::NetworkError and Bgg::ServerError" do
      handlers = described_class.rescue_handlers.map { |klass, _| klass }

      expect(handlers).to include("Bgg::NetworkError")
      expect(handlers).to include("Bgg::ServerError")
    end

    it "discards on Bgg::ResourceNotFound" do
      handlers = described_class.rescue_handlers.map { |klass, _| klass }

      expect(handlers).to include("Bgg::ResourceNotFound")
    end

    it "discards on ActiveJob::DeserializationError" do
      handlers = described_class.rescue_handlers.map { |klass, _| klass }

      expect(handlers).to include("ActiveJob::DeserializationError")
    end
  end
end
