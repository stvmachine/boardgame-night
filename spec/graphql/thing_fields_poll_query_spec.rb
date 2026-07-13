# frozen_string_literal: true

require "rails_helper"

RSpec.describe "ThingFields poll query" do
  let(:alice) { User.create!(username: "alice", bgg_username: "bggalice", password: "password") }
  let(:gloomhaven) { BggThing.create!(objectid: 174_430, name: "Gloomhaven") }

  def create_poll_with_votes(thing)
    poll = BggPoll.create!(bgg_thing: thing, name: "suggested_numplayers", title: "User Suggested Number of Players", total_votes: 2000)
    BggPollResult.create!(bgg_poll: poll, player_count: 1, value: "Best", num_votes: 100)
    BggPollResult.create!(bgg_poll: poll, player_count: 2, value: "Best", num_votes: 500)
    BggPollResult.create!(bgg_poll: poll, player_count: 2, value: "Recommended", num_votes: 300)
    BggPollResult.create!(bgg_poll: poll, player_count: 3, value: "Best", num_votes: 200)
    BggPollResult.create!(bgg_poll: poll, player_count: 3, value: "Not Recommended", num_votes: 50)
    BggPollResult.create!(bgg_poll: poll, player_count: 4, value: "Best", num_votes: 50)
    poll
  end

  it "returns polls and bestPlayerCount for a thing with suggested_numplayers data" do
    create_poll_with_votes(gloomhaven)
    BggCollection.create!(user: alice, bgg_thing: gloomhaven)

    query = <<~GRAPHQL
      query {
        mergedCollection(usernames: ["bggalice"]) {
          items {
            name
            polls {
              name
              totalVotes
              results {
                playerCount
                value
                numVotes
              }
            }
            bestPlayerCount
          }
        }
      }
    GRAPHQL

    result = BoardgameNightSchema.execute(query)

    expect(result["errors"]).to be_nil
    item = result.dig("data", "mergedCollection", "items").first
    expect(item["name"]).to eq("Gloomhaven")
    expect(item["polls"].size).to eq(1)
    expect(item["polls"].first["name"]).to eq("suggested_numplayers")
    expect(item["polls"].first["results"].size).to eq(6)
    expect(item["bestPlayerCount"]).to eq(2)
  end

  it "returns empty polls and null bestPlayerCount for a thing without poll data" do
    other_game = BggThing.create!(objectid: 1, name: "Other Game")
    BggCollection.create!(user: alice, bgg_thing: other_game)

    query = <<~GRAPHQL
      query {
        mergedCollection(usernames: ["bggalice"]) {
          items {
            name
            polls {
              name
            }
            bestPlayerCount
          }
        }
      }
    GRAPHQL

    result = BoardgameNightSchema.execute(query)

    expect(result["errors"]).to be_nil
    item = result.dig("data", "mergedCollection", "items").find { |i| i["name"] == "Other Game" }
    expect(item["polls"]).to be_empty
    expect(item["bestPlayerCount"]).to be_nil
  end

  it "returns the lower player count when Best votes tie" do
    poll = BggPoll.create!(bgg_thing: gloomhaven, name: "suggested_numplayers", title: "User Suggested Number of Players", total_votes: 100)
    BggPollResult.create!(bgg_poll: poll, player_count: 2, value: "Best", num_votes: 300)
    BggPollResult.create!(bgg_poll: poll, player_count: 3, value: "Best", num_votes: 300)
    BggPollResult.create!(bgg_poll: poll, player_count: 4, value: "Best", num_votes: 100)
    BggCollection.create!(user: alice, bgg_thing: gloomhaven)

    query = <<~GRAPHQL
      query {
        mergedCollection(usernames: ["bggalice"]) {
          items {
            name
            bestPlayerCount
          }
        }
      }
    GRAPHQL

    result = BoardgameNightSchema.execute(query)

    expect(result["errors"]).to be_nil
    item = result.dig("data", "mergedCollection", "items").find { |i| i["name"] == "Gloomhaven" }
    expect(item["bestPlayerCount"]).to eq(2)
  end
end
