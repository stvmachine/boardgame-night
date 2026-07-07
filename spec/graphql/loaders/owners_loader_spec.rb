# frozen_string_literal: true

require "rails_helper"

RSpec.describe Loaders::OwnersLoader do
  describe "#fetch" do
    let(:user1) { User.create!(username: "alice", bgg_username: "bggalice", password: "password") }
    let(:user2) { User.create!(username: "bob", bgg_username: "bggbob", password: "password") }
    let(:thing1) { BggThing.create!(objectid: 1, name: "Game A") }
    let(:thing2) { BggThing.create!(objectid: 2, name: "Game B") }

    before do
      BggCollection.create!(user: user1, bgg_thing: thing1)
      BggCollection.create!(user: user2, bgg_thing: thing1)
      BggCollection.create!(user: user1, bgg_thing: thing2)
    end

    it "returns owners in input order for each thing id" do
      result = Loaders::OwnersLoader.new.fetch([thing1.id, thing2.id])
      expect(result.size).to eq(2)
      expect(result[0].map(&:user)).to contain_exactly(user1, user2)
      expect(result[1].map(&:user)).to contain_exactly(user1)
    end

    it "returns an empty array for unknown thing ids" do
      result = Loaders::OwnersLoader.new.fetch([thing1.id, 99_999])
      expect(result[0]).not_to be_empty
      expect(result[1]).to be_empty
    end
  end
end
