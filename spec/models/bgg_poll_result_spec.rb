# frozen_string_literal: true

require "rails_helper"

RSpec.describe BggPollResult, type: :model do
  describe "associations" do
    it { should belong_to(:bgg_poll) }
  end

  describe "validations" do
    let(:thing) { BggThing.create!(objectid: 1, name: "Test Game") }
    let(:poll) { BggPoll.create!(bgg_thing: thing, name: "suggested_numplayers") }
    subject { BggPollResult.new(bgg_poll: poll, value: "Best") }

    it { should validate_presence_of(:value) }
    it { should validate_numericality_of(:num_votes).is_greater_than_or_equal_to(0) }
  end

  describe "category predicates" do
    let(:thing) { BggThing.create!(objectid: 1, name: "Test Game") }
    let(:poll) { BggPoll.create!(bgg_thing: thing, name: "suggested_numplayers") }

    it "#best? is true only for Best" do
      best = BggPollResult.new(bgg_poll: poll, value: "Best", num_votes: 1)
      rec = BggPollResult.new(bgg_poll: poll, value: "Recommended", num_votes: 1)
      not_rec = BggPollResult.new(bgg_poll: poll, value: "Not Recommended", num_votes: 1)

      expect(best).to be_best
      expect(rec).not_to be_best
      expect(not_rec).not_to be_best
    end

    it "#recommended? is true only for Recommended" do
      best = BggPollResult.new(bgg_poll: poll, value: "Best", num_votes: 1)
      rec = BggPollResult.new(bgg_poll: poll, value: "Recommended", num_votes: 1)
      not_rec = BggPollResult.new(bgg_poll: poll, value: "Not Recommended", num_votes: 1)

      expect(best).not_to be_recommended
      expect(rec).to be_recommended
      expect(not_rec).not_to be_recommended
    end

    it "#not_recommended? is true only for Not Recommended" do
      best = BggPollResult.new(bgg_poll: poll, value: "Best", num_votes: 1)
      rec = BggPollResult.new(bgg_poll: poll, value: "Recommended", num_votes: 1)
      not_rec = BggPollResult.new(bgg_poll: poll, value: "Not Recommended", num_votes: 1)

      expect(best).not_to be_not_recommended
      expect(rec).not_to be_not_recommended
      expect(not_rec).to be_not_recommended
    end
  end
end
