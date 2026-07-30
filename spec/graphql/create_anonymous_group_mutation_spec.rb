# frozen_string_literal: true

require "rails_helper"

RSpec.describe "createAnonymousGroup mutation" do
  let(:mutation) do
    <<~GRAPHQL
      mutation CreateAnonymousGroup($name: String!, $bggUsernames: [String!]!) {
        createAnonymousGroup(name: $name, bggUsernames: $bggUsernames) {
          group {
            id
            name
            inviteCode
            anonymousBggUsernames
            owner {
              id
            }
          }
        }
      }
    GRAPHQL
  end

  let(:query) do
    <<~GRAPHQL
      query Group($token: String!) {
        group(token: $token) {
          id
          name
          inviteCode
          anonymousBggUsernames
          collection {
            items { id name }
            syncStatuses { username status }
          }
          collectionSpotlight(limit: 4) { id name }
        }
      }
    GRAPHQL
  end

  it "creates a group without an owner and returns an invite code" do
    result = BoardgameNightSchema.execute(
      mutation,
      variables: { name: "Quick Night", bggUsernames: ["alice", "bob"] },
    )

    expect(result["errors"]).to be_nil
    data = result.dig("data", "createAnonymousGroup", "group")
    expect(data["name"]).to eq("Quick Night")
    expect(data["anonymousBggUsernames"]).to contain_exactly("alice", "bob")
    expect(data["inviteCode"]).to be_present
    expect(data["inviteCode"].length).to eq(12)
    expect(data["owner"]).to be_nil
  end

  it "returns validation errors when no usernames are provided" do
    result = BoardgameNightSchema.execute(
      mutation,
      variables: { name: "Quick Night", bggUsernames: [] },
    )

    expect(result.dig("data", "createAnonymousGroup")).to be_nil
    expect(result["errors"]).to be_present
    expect(result["errors"].first["message"]).to include("bgg_usernames")
  end

  it "returns validation errors when too many usernames are provided" do
    result = BoardgameNightSchema.execute(
      mutation,
      variables: { name: "Quick Night", bggUsernames: ["a", "b", "c"] },
    )

    expect(result.dig("data", "createAnonymousGroup")).to be_nil
    expect(result["errors"]).to be_present
    expect(result["errors"].first["message"]).to include("bgg_usernames")
  end

  it "returns validation errors for an invalid username format" do
    result = BoardgameNightSchema.execute(
      mutation,
      variables: { name: "Quick Night", bggUsernames: ["bad name!"] },
    )

    expect(result.dig("data", "createAnonymousGroup")).to be_nil
    expect(result["errors"]).to be_present
    expect(result["errors"].first["message"]).to include("bgg_usernames")
  end

  it "can be fetched by invite code and exposes the anonymous usernames" do
    result = BoardgameNightSchema.execute(
      mutation,
      variables: { name: "Quick Night", bggUsernames: ["alice"] },
    )

    invite_code = result.dig("data", "createAnonymousGroup", "group", "inviteCode")

    result = BoardgameNightSchema.execute(query, variables: { token: invite_code })

    expect(result["errors"]).to be_nil
    data = result.dig("data", "group")
    expect(data["name"]).to eq("Quick Night")
    expect(data["anonymousBggUsernames"]).to contain_exactly("alice")
    expect(data["collection"]["items"]).to eq([])
    expect(data["collection"]["syncStatuses"].map { |s| s["username"] }).to contain_exactly("alice")
    expect(data["collectionSpotlight"]).to eq([])
  end
end
