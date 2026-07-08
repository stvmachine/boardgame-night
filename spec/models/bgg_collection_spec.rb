# frozen_string_literal: true

require "rails_helper"

RSpec.describe BggCollection, type: :model do
  describe "associations" do
    it { should belong_to(:user) }
    it { should belong_to(:bgg_thing) }
  end

  describe "validations" do
    let(:user) { User.create!(username: "alice", password: "password") }
    let(:thing) { BggThing.create!(objectid: 1, name: "Test Game") }
    subject { BggCollection.new(user: user, bgg_thing: thing) }
    it { should validate_uniqueness_of(:user_id).scoped_to(:bgg_thing_id) }
    it { should validate_numericality_of(:quantity).is_greater_than_or_equal_to(1) }
  end
end
