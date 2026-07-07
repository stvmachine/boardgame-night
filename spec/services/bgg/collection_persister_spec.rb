# frozen_string_literal: true

require "rails_helper"

RSpec.describe Bgg::CollectionPersister, type: :service do
  let(:user) { User.create!(username: "testuser", bgg_username: "testuser", password: "password") }
  let(:collection_xml) { File.read(Rails.root.join("spec/fixtures/files/stevmachine_collection.xml")) }
  let(:client) { instance_double(Bgg::Client, collection: Nokogiri::XML(collection_xml)) }
  subject { described_class.new(client: client, user: user) }

  describe "#fetch_and_persist!" do
    it "fetches collection from BGG and persists it" do
      result = subject.fetch_and_persist!
      expect(result[:added]).to be > 0
      expect(user.bgg_things.count).to eq(result[:added])
    end

    it "raises ArgumentError when user has no bgg_username" do
      user.update!(bgg_username: nil)
      expect { subject.fetch_and_persist! }.to raise_error(ArgumentError, /bgg_username/)
    end
  end

  describe "#persist_collection!" do
    it "persists all collection items (boardgames and expansions)" do
      collection = Bgg::Normalizer.normalize_collection(Nokogiri::XML(collection_xml))
      result = subject.persist_collection!(collection)
      expect(result[:added]).to eq(3) # 2 boardgames + 1 expansion from fixture
      expect(user.bgg_things.count).to eq(3)
    end

    it "upserts existing things without duplication" do
      # Pre-create a thing matching a fixture item (Gloomhaven, objectid 174430)
      BggThing.create!(objectid: 174430, name: "Old Name")
      collection = Bgg::Normalizer.normalize_collection(Nokogiri::XML(collection_xml))
      result = subject.persist_collection!(collection)
      # Should update Gloomhaven's name and not create a duplicate
      expect(user.bgg_things.where(objectid: 174430).count).to eq(1)
      expect(user.bgg_things.find_by(objectid: 174430).name).to eq("Gloomhaven")
    end

    it "persists BGG community statistics on things" do
      collection = Bgg::Normalizer.normalize_collection(Nokogiri::XML(collection_xml))
      subject.persist_collection!(collection)
      gloomhaven = BggThing.find_by(objectid: 174430)
      expect(gloomhaven.average).to eq(8.8)
      expect(gloomhaven.bayes_average).to eq(8.4)
      expect(gloomhaven.users_rated).to eq(30_000)
      expect(gloomhaven.average_weight).to eq(3.8)
    end

    it "handles empty collections" do
      empty_doc = Nokogiri::XML("<items></items>")
      collection = Bgg::Normalizer.normalize_collection(empty_doc)
      result = subject.persist_collection!(collection)
      expect(result[:added]).to eq(0)
    end
  end
end
