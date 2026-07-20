# frozen_string_literal: true

require "rails_helper"

RSpec.describe Loaders::UsersLoader do
  describe "#fetch" do
    let!(:user1) { User.create!(username: "alice", bgg_username: "bggalice", password: "password") }
    let!(:user2) { User.create!(username: "bob", bgg_username: "bggbob", password: "password") }

    it "returns users in input order for each bgg_username" do
      result = Loaders::UsersLoader.new.fetch([ "bggalice", "bggbob" ])
      expect(result).to eq([ user1, user2 ])
    end

    it "returns nil for unknown usernames" do
      result = Loaders::UsersLoader.new.fetch([ "bggalice", "missing" ])
      expect(result).to eq([ user1, nil ])
    end
  end
end
