# frozen_string_literal: true

require "rails_helper"

RSpec.describe Bgg::EnrichThingPollsJob, type: :job do
  subject(:job) { described_class.new }

  let(:username) { "stevmachine" }
  let(:client) { instance_double(Bgg::Client) }
  let(:persister) { class_double(Bgg::PollPersister) }
  let(:xml_doc) { Nokogiri::XML(file_fixture("stevmachine_thing.xml").read) }

  before do
    allow(Bgg::Client).to receive(:new).and_return(client)
    stub_const("Bgg::PollPersister", persister)
    allow(persister).to receive(:persist_from_thing_xml)
  end

  describe "#perform" do
    context "with a user whose things need poll enrichment" do
      let(:user) do
        User.create!(username: username, bgg_username: username, password: "password")
      end

      let!(:thing1) { BggThing.create!(objectid: 174_430, name: "Gloomhaven") }
      let!(:thing2) { BggThing.create!(objectid: 9209, name: "Another Game") }

      before do
        user.bgg_things << [thing1, thing2]

        allow(client).to receive(:thing).with([174_430, 9209]).and_return(xml_doc)
      end

      it "fetches thing details for games missing poll data" do
        expect(client).to receive(:thing).with([174_430, 9209]).and_return(xml_doc)
        job.perform(username)
      end

      it "persists poll data via PollPersister" do
        expect(persister).to receive(:persist_from_thing_xml).with(xml_doc)
        job.perform(username)
      end

      it "only fetches things with poll_data_fetched_at nil" do
        thing1.update!(poll_data_fetched_at: Time.current)

        expect(client).to receive(:thing).with([9209]).and_return(xml_doc)
        job.perform(username)
      end
    end

    context "with zero things needing enrichment" do
      let(:user) do
        User.create!(username: username, bgg_username: username, password: "password")
      end

      let!(:thing) do
        BggThing.create!(objectid: 174_430, name: "Gloomhaven", poll_data_fetched_at: Time.current)
      end

      before do
        user.bgg_things << thing
      end

      it "is a no-op and does not call PollPersister" do
        expect(client).not_to receive(:thing)
        expect(persister).not_to receive(:persist_from_thing_xml)

        expect { job.perform(username) }.not_to raise_error
      end
    end

    context "with missing user" do
      it "returns without error" do
        expect(client).not_to receive(:thing)
        expect(persister).not_to receive(:persist_from_thing_xml)

        expect { job.perform("nonexistent_user") }.not_to raise_error
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
