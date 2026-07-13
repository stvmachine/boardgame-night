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
end
