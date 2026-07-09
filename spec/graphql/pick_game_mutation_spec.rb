# frozen_string_literal: true

require "rails_helper"

RSpec.describe "pickGame mutation" do
  let(:mutation) do
    <<~GRAPHQL
      mutation PickGame($sessionId: ID!, $gameId: ID!) {
        pickGame(sessionId: $sessionId, gameId: $gameId) {
          session {
            id
            title
            state
            pickedGame {
              id
              name
            }
            attendeeCount
          }
        }
      }
    GRAPHQL
  end

  let(:owner) { User.create!(username: "alice", email: "alice@example.com", password: "password") }
  let(:member) { User.create!(username: "bob", email: "bob@example.com", password: "password") }
  let(:group) { Group.create!(name: "Night Owls", owner: owner) }
  let(:session) { NightSession.create!(title: "Friday Games", group: group, host: owner, state: "picking") }
  let(:context) { { current_user: owner } }
  let(:game) { BggThing.create!(objectid: 1, name: "Catan") }

  before do
    GroupMembership.create!(user: owner, group: group, role: "owner")
    GroupMembership.create!(user: member, group: group, role: "member")
    BggCollection.create!(user: member, bgg_thing: game, quantity: 1)
  end

  it "transitions a picking session to completed and sets picked_game_id" do
    result = BoardgameNightSchema.execute(
      mutation,
      variables: { sessionId: session.id.to_s, gameId: game.id.to_s },
      context: context
    )
    expect(result["errors"]).to be_nil
    data = result.dig("data", "pickGame", "session")
    expect(data["state"]).to eq("COMPLETED")
    expect(data["pickedGame"]["id"]).to eq(game.id.to_s)
    expect(data["pickedGame"]["name"]).to eq("Catan")
    expect(data["attendeeCount"]).to eq(0)
    expect(session.reload.state).to eq("completed")
    expect(session.picked_game_id).to eq(game.id)
  end

  it "requires authentication" do
    result = BoardgameNightSchema.execute(
      mutation,
      variables: { sessionId: session.id.to_s, gameId: game.id.to_s },
      context: {}
    )
    expect(result["errors"]).to be_present
    expect(result["errors"].first["message"]).to match(/Authentication required/i)
  end

  it "requires caller to be the session host" do
    other = User.create!(username: "carol", email: "carol@example.com", password: "password")
    GroupMembership.create!(user: other, group: group, role: "member")

    result = BoardgameNightSchema.execute(
      mutation,
      variables: { sessionId: session.id.to_s, gameId: game.id.to_s },
      context: { current_user: other }
    )
    expect(result["errors"]).to be_present
    expect(result["errors"].first["message"]).to match(/must be the session host/i)
  end

  it "returns an error when picking from a non-picking state" do
    session.update!(state: "invited")

    result = BoardgameNightSchema.execute(
      mutation,
      variables: { sessionId: session.id.to_s, gameId: game.id.to_s },
      context: context
    )
    expect(result["errors"]).to be_present
    expect(result["errors"].first["message"]).to match(/cannot pick a game from invited/i)
  end

  it "returns an error when the game is not in the group collection" do
    other_game = BggThing.create!(objectid: 2, name: "Unowned Game")

    result = BoardgameNightSchema.execute(
      mutation,
      variables: { sessionId: session.id.to_s, gameId: other_game.id.to_s },
      context: context
    )
    expect(result["errors"]).to be_present
    expect(result["errors"].first["message"]).to match(/Game is not in the group collection/i)
  end
end
