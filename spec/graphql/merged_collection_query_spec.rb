# frozen_string_literal: true

require "rails_helper"

RSpec.describe "mergedCollection query" do
  let(:alice) { User.create!(username: "alice", bgg_username: "bggalice", password: "password") }
  let(:bob) { User.create!(username: "bob", bgg_username: "bggbob", password: "password") }
  let(:game) { BggThing.create!(objectid: 1, name: "Game A") }

  before do
    BggCollection.create!(user: alice, bgg_thing: game)
    BggCollection.create!(user: bob, bgg_thing: game)
  end

  it "returns a single deduplicated thing with both owners" do
    query = <<~GRAPHQL
      query {
        mergedCollection(usernames: ["bggalice", "bggbob"]) {
          items {
            id
            name
            owners {
              bggUsername
              avatar
            }
          }
          syncStatuses {
            username
            status
          }
        }
      }
    GRAPHQL

    result = BoardgameNightSchema.execute(query)

    expect(result["errors"]).to be_nil
    items = result.dig("data", "mergedCollection", "items")
    expect(items.size).to eq(1)
    expect(items.first["name"]).to eq("Game A")
    expect(items.first["owners"].map { |o| o["bggUsername"] }).to contain_exactly("bggalice", "bggbob")

    sync_statuses = result.dig("data", "mergedCollection", "syncStatuses")
    expect(sync_statuses.map { |s| s["username"] }).to contain_exactly("bggalice", "bggbob")
  end

  it "returns an empty collection when no usernames match" do
    query = <<~GRAPHQL
      query {
        mergedCollection(usernames: ["unknown"]) {
          items {
            id
          }
          syncStatuses {
            username
            status
          }
        }
      }
    GRAPHQL

    result = BoardgameNightSchema.execute(query)

    expect(result["errors"]).to be_nil
    expect(result.dig("data", "mergedCollection", "items")).to be_empty
    expect(result.dig("data", "mergedCollection", "syncStatuses").size).to eq(1)
  end
end

RSpec.describe "user query" do
  let(:alice) { User.create!(username: "alice", bgg_username: "bggalice", password: "password") }

  it "looks up a user by bgg_username" do
    query = <<~GRAPHQL
      query {
        user(username: "bggalice") {
          username
          avatar
        }
      }
    GRAPHQL

    result = BoardgameNightSchema.execute(query)

    expect(result["errors"]).to be_nil
    expect(result.dig("data", "user", "username")).to eq("alice")
    expect(result.dig("data", "user", "avatar")).to be_nil
  end

  it "returns nil for an unknown bgg_username" do
    query = <<~GRAPHQL
      query {
        user(username: "unknown") {
          username
        }
      }
    GRAPHQL

    result = BoardgameNightSchema.execute(query)

    expect(result["errors"]).to be_nil
    expect(result.dig("data", "user")).to be_nil
  end
end
