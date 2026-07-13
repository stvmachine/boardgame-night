# frozen_string_literal: true

require "rails_helper"

RSpec.describe Loaders::PollsLoader do
  describe "#fetch" do
    let(:thing1) { BggThing.create!(objectid: 1, name: "Game A") }
    let(:thing2) { BggThing.create!(objectid: 2, name: "Game B") }

    before do
      poll1 = BggPoll.create!(bgg_thing: thing1, name: "suggested_numplayers", title: "User Suggested Number of Players", total_votes: 2000)
      BggPollResult.create!(bgg_poll: poll1, player_count: 1, value: "Best", num_votes: 100)
      BggPollResult.create!(bgg_poll: poll1, player_count: 2, value: "Best", num_votes: 500)
      BggPollResult.create!(bgg_poll: poll1, player_count: 3, value: "Recommended", num_votes: 300)

      poll2 = BggPoll.create!(bgg_thing: thing2, name: "suggested_numplayers", title: "User Suggested Number of Players", total_votes: 500)
      BggPollResult.create!(bgg_poll: poll2, player_count: 1, value: "Best", num_votes: 50)
      BggPollResult.create!(bgg_poll: poll2, player_count: 2, value: "Not Recommended", num_votes: 10)
    end

    it "returns polls in input order for each thing id" do
      result = Loaders::PollsLoader.new.fetch([thing1.id, thing2.id])
      expect(result.size).to eq(2)
      expect(result[0]).to all(be_a(BggPoll))
      expect(result[0].first.name).to eq("suggested_numplayers")
      expect(result[0].first.bgg_poll_results.size).to eq(3)
      expect(result[1].first.bgg_poll_results.size).to eq(2)
    end

    it "returns an empty array for unknown thing ids" do
      result = Loaders::PollsLoader.new.fetch([thing1.id, 999_999])
      expect(result[0]).not_to be_empty
      expect(result[1]).to be_empty
    end

    it "issues a constant number of SQL queries regardless of thing count" do
      counts = []
      subscriber = ActiveSupport::Notifications.subscribe("sql.active_record") do |*|
        counts << 1
      end

      Loaders::PollsLoader.new.fetch([thing1.id, thing2.id])

      ActiveSupport::Notifications.unsubscribe(subscriber)
      # One query for bgg_polls and one for bgg_poll_results via includes.
      expect(counts.count).to be <= 2
    end
  end
end
