# frozen_string_literal: true

require "rails_helper"

RSpec.describe BggThing, type: :model do
  describe "validations" do
    subject { BggThing.new(objectid: 123, name: "Test Game") }
    it { should validate_presence_of(:objectid) }
    it { should validate_uniqueness_of(:objectid) }
    it { should validate_presence_of(:name) }
  end

  describe "associations" do
    it { should have_many(:bgg_collections).dependent(:destroy) }
    it { should have_many(:users).through(:bgg_collections) }
  end

  describe ".merged_for_users" do
    let(:user1) { User.create!(username: "alice", password: "password") }
    let(:user2) { User.create!(username: "bob", password: "password") }
    let(:thing1) { BggThing.create!(objectid: 1, name: "Game A") }
    let(:thing2) { BggThing.create!(objectid: 2, name: "Game B") }

    before do
      BggCollection.create!(user: user1, bgg_thing: thing1)
      BggCollection.create!(user: user2, bgg_thing: thing1)
      BggCollection.create!(user: user1, bgg_thing: thing2)
    end

    it "returns deduplicated things for the given user_ids" do
      result = BggThing.merged_for_users([ user1.id, user2.id ])
      expect(result).to include(thing1, thing2)
      expect(result.size).to eq(2)
    end

    it "returns only things owned by the specified users" do
      result = BggThing.merged_for_users([ user2.id ])
      expect(result).to include(thing1)
      expect(result).not_to include(thing2)
    end

    it "returns empty when user_ids is empty" do
      expect(BggThing.merged_for_users([])).to be_empty
    end
  end

  describe ".merged_for_bgg_usernames" do
    let(:user1) { User.create!(username: "alice", bgg_username: "bggalice", password: "password") }
    let(:user2) { User.create!(username: "bob", bgg_username: "bggbob", password: "password") }
    let(:thing1) { BggThing.create!(objectid: 1, name: "Game A") }
    let(:thing2) { BggThing.create!(objectid: 2, name: "Game B") }

    before do
      BggCollection.create!(user: user1, bgg_thing: thing1)
      BggCollection.create!(user: user2, bgg_thing: thing1)
      BggCollection.create!(user: user1, bgg_thing: thing2)
    end

    it "returns deduplicated things for the given BGG usernames" do
      result = BggThing.merged_for_bgg_usernames([ "bggalice", "bggbob" ])
      expect(result).to include(thing1, thing2)
      expect(result.size).to eq(2)
    end

    it "returns only things owned by the specified BGG usernames" do
      result = BggThing.merged_for_bgg_usernames([ "bggbob" ])
      expect(result).to include(thing1)
      expect(result).not_to include(thing2)
    end

    it "returns empty when usernames is empty" do
      expect(BggThing.merged_for_bgg_usernames([])).to be_empty
    end
  end
end
