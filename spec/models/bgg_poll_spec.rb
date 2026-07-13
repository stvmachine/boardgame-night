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
end
