# frozen_string_literal: true

require "rails_helper"

class TestPollSchema < GraphQL::Schema
  class Query < GraphQL::Schema::Object
    field :poll, Types::PollType, null: true

    def poll
      context[:poll]
    end
  end

  query(Query)
end

RSpec.describe Types::PollType do
  let(:thing) { BggThing.create!(objectid: 174_430, name: "Gloomhaven") }
  let(:poll) do
    BggPoll.create!(bgg_thing: thing, name: "suggested_numplayers", title: "User Suggested Number of Players", total_votes: 2000)
  end

  before do
    BggPollResult.create!(bgg_poll: poll, player_count: 1, value: "Best", num_votes: 100)
    BggPollResult.create!(bgg_poll: poll, player_count: 2, value: "Recommended", num_votes: 300)
  end

  it "exposes name, title, totalVotes, and results" do
    query = <<~GRAPHQL
      {
        poll {
          name
          title
          totalVotes
          results {
            playerCount
            value
            numVotes
          }
        }
      }
    GRAPHQL

    result = TestPollSchema.execute(query, context: { poll: poll })

    expect(result["errors"]).to be_nil
    poll_data = result.dig("data", "poll")
    expect(poll_data["name"]).to eq("suggested_numplayers")
    expect(poll_data["title"]).to eq("User Suggested Number of Players")
    expect(poll_data["totalVotes"]).to eq(2000)
    expect(poll_data["results"]).to contain_exactly(
      { "playerCount" => 1, "value" => "Best", "numVotes" => 100 },
      { "playerCount" => 2, "value" => "Recommended", "numVotes" => 300 }
    )
  end
end
