# frozen_string_literal: true

require "rails_helper"

RSpec.describe Bgg::PollPersister, type: :service do
  let(:thing_xml) { file_fixture("stevmachine_thing.xml").read }
  let(:doc) { Nokogiri::XML(thing_xml) }

  describe ".persist_from_thing_xml" do
    it "persists a BggPoll and BggPollResults for each player count" do
      thing = BggThing.create!(objectid: 174_430, name: "Gloomhaven")

      described_class.persist_from_thing_xml(doc)

      poll = thing.bgg_polls.find_by(name: "suggested_numplayers")
      expect(poll).to be_present
      expect(poll.title).to eq("User Suggested Number of Players")
      expect(poll.total_votes).to eq(2000)
      expect(poll.bgg_poll_results.count).to eq(12) # 4 player counts × 3 vote values
      expect(poll.bgg_poll_results.where(value: "Best").count).to eq(4)
    end

    it "stamps poll_data_fetched_at on the thing" do
      thing = BggThing.create!(objectid: 174_430, name: "Gloomhaven")

      described_class.persist_from_thing_xml(doc)

      expect(thing.reload.poll_data_fetched_at).not_to be_nil
    end

    it "sets poll_data_fetched_at even when the thing has no suggested_numplayers poll" do
      thing = BggThing.create!(objectid: 999_999, name: "No Poll Game")
      no_poll_xml = Nokogiri::XML(<<~XML)
        <?xml version="1.0" encoding="utf-8"?>
        <items>
          <item type="boardgame" id="999999">
            <name type="primary" value="No Poll Game" />
          </item>
        </items>
      XML

      described_class.persist_from_thing_xml(no_poll_xml)

      expect(thing.reload.poll_data_fetched_at).not_to be_nil
      expect(thing.bgg_polls.count).to eq(0)
    end

    it "does not duplicate rows when re-run" do
      thing = BggThing.create!(objectid: 174_430, name: "Gloomhaven")

      described_class.persist_from_thing_xml(doc)
      described_class.persist_from_thing_xml(doc)

      poll = thing.bgg_polls.find_by(name: "suggested_numplayers")
      expect(poll.bgg_poll_results.count).to eq(12)
    end
  end
end
