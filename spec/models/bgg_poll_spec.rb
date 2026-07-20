# frozen_string_literal: true

require "rails_helper"

RSpec.describe BggPoll, type: :model do
  describe "associations" do
    it { should belong_to(:bgg_thing) }
    it { should have_many(:bgg_poll_results).dependent(:destroy) }
  end

  describe "validations" do
    let(:thing) { BggThing.create!(objectid: 1, name: "Test Game") }
    subject { BggPoll.new(bgg_thing: thing, name: "suggested_numplayers") }

    it { should validate_presence_of(:name) }
  end

  describe "#results_for_player_count" do
    let(:thing) { BggThing.create!(objectid: 1, name: "Test Game") }
    let(:poll) { BggPoll.create!(bgg_thing: thing, name: "suggested_numplayers") }

    before do
      BggPollResult.create!(bgg_poll: poll, player_count: 2, value: "Best", num_votes: 50)
      BggPollResult.create!(bgg_poll: poll, player_count: 2, value: "Recommended", num_votes: 30)
      BggPollResult.create!(bgg_poll: poll, player_count: 3, value: "Best", num_votes: 10)
    end

    it "returns the associated results for the requested player count" do
      results = poll.results_for_player_count(2)
      expect(results.map(&:player_count).uniq).to eq([ 2 ])
      expect(results.map(&:value)).to contain_exactly("Best", "Recommended")
    end

    it "returns an empty array when no results exist for the requested player count" do
      expect(poll.results_for_player_count(4)).to eq([])
    end

    it "does not issue a per-count query when results are already loaded" do
      loaded_poll = BggPoll.includes(:bgg_poll_results).find(poll.id)
      query_count = count_queries { loaded_poll.results_for_player_count(2) }
      expect(query_count).to eq(0)
      expect(loaded_poll.results_for_player_count(2).size).to eq(2)
    end

    def count_queries
      queries = 0
      callback = ->(_name, _started, _finished, _unique_id, payload) { queries += 1 if payload[:name].present? }
      ActiveSupport::Notifications.subscribed(callback, "sql.active_record") { yield }
      queries
    end
  end
end
