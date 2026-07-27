# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Game night full lifecycle", type: :request do
  include FakerHelpers

  let(:host) { create_test_user }
  let(:member) { create_test_user }
  let(:group) do
    g = create_test_group(owner: host)
    GroupMembership.find_or_create_by!(user: member, group: g) { |m| m.role = "member" }
    g
  end
  let(:game) { create_test_game }
  let(:token) { Session.create!(user: host, expires_at: 1.day.from_now).token }
  let(:headers) { { "Authorization" => "Bearer #{token}", "Content-Type" => "application/json" } }

  let(:create_mutation) do
    <<~GRAPHQL
      mutation CreateNightSession($groupId: ID!, $title: String!) {
        createNightSession(groupId: $groupId, title: $title) {
          session { id title state }
        }
      }
    GRAPHQL
  end

  let(:schedule_mutation) do
    <<~GRAPHQL
      mutation ScheduleSession($sessionId: ID!, $scheduledAt: ISO8601DateTime!, $location: String!, $capacity: Int) {
        scheduleSession(sessionId: $sessionId, scheduledAt: $scheduledAt, location: $location, capacity: $capacity) {
          session { id state scheduledAt location capacity }
        }
      }
    GRAPHQL
  end

  let(:start_picking_mutation) do
    <<~GRAPHQL
      mutation StartPicking($sessionId: ID!) {
        startPicking(sessionId: $sessionId) {
          session { id state }
        }
      }
    GRAPHQL
  end

  let(:pick_game_mutation) do
    <<~GRAPHQL
      mutation PickGame($sessionId: ID!, $gameId: ID!) {
        pickGame(sessionId: $sessionId, gameId: $gameId) {
          session { id state pickedGame { id name } }
        }
      }
    GRAPHQL
  end

  def graphql_post(query, variables:, auth: true)
    post "/graphql",
      params: { query: query, variables: variables }.to_json,
      headers: auth ? headers : { "Content-Type" => "application/json" }
  end

  def graphql_data
    JSON.parse(response.body).dig("data")
  end

  def graphql_errors
    JSON.parse(response.body).dig("errors")
  end

  it "completes the full lifecycle: create → schedule → start picking → pick game" do
    # Step 1: Create the session (DRAFT)
    graphql_post(create_mutation, variables: { groupId: group.id.to_s, title: "Friday Night Games" })
    expect(graphql_errors).to be_nil
    session_id = graphql_data.dig("createNightSession", "session", "id")
    expect(graphql_data.dig("createNightSession", "session", "state")).to eq("DRAFT")

    # Step 2: Schedule the session (DRAFT → INVITED)
    graphql_post(schedule_mutation, variables: {
      sessionId: session_id,
      scheduledAt: 3.days.from_now.iso8601,
      location: Faker::Address.full_address,
      capacity: 6
    })
    expect(graphql_errors).to be_nil
    expect(graphql_data.dig("scheduleSession", "session", "state")).to eq("INVITED")

    # Step 3: Start picking (INVITED → PICKING)
    graphql_post(start_picking_mutation, variables: { sessionId: session_id })
    expect(graphql_errors).to be_nil
    expect(graphql_data.dig("startPicking", "session", "state")).to eq("PICKING")

    # Step 4: Pick a game (PICKING → COMPLETED)
    create_test_collection(user: member, bgg_thing: game)
    graphql_post(pick_game_mutation, variables: { sessionId: session_id, gameId: game.id.to_s })
    expect(graphql_errors).to be_nil
    data = graphql_data.dig("pickGame", "session")
    expect(data["state"]).to eq("COMPLETED")
    expect(data["pickedGame"]["name"]).to eq(game.name)
  end

  it "blocks state transitions from invalid states" do
    graphql_post(create_mutation, variables: { groupId: group.id.to_s, title: "Test" })
    session_id = graphql_data.dig("createNightSession", "session", "id")

    # Try to start picking from draft (should fail — must schedule first)
    graphql_post(start_picking_mutation, variables: { sessionId: session_id })
    expect(response).to have_http_status(:success)
    expect(graphql_errors).to be_present
    expect(graphql_errors.first["message"]).to match(/cannot start picking/i)
  end

  it "prevents non-hosts from performing host-only actions" do
    graphql_post(create_mutation, variables: { groupId: group.id.to_s, title: "Test" })
    session_id = graphql_data.dig("createNightSession", "session", "id")

    member_token = Session.create!(user: member, expires_at: 1.day.from_now).token
    member_headers = { "Authorization" => "Bearer #{member_token}", "Content-Type" => "application/json" }

    post "/graphql",
      params: { query: schedule_mutation, variables: {
        sessionId: session_id,
        scheduledAt: 3.days.from_now.iso8601,
        location: "Somewhere",
        capacity: 4
      }}.to_json,
      headers: member_headers

    expect(graphql_errors).to be_present
    expect(graphql_errors.first["message"]).to match(/must be the session host/i)
  end

  it "prevents picking a game not in the group collection" do
    graphql_post(create_mutation, variables: { groupId: group.id.to_s, title: "Test" })
    session_id = graphql_data.dig("createNightSession", "session", "id")

    graphql_post(schedule_mutation, variables: {
      sessionId: session_id, scheduledAt: 3.days.from_now.iso8601, location: "Home", capacity: 4
    })
    graphql_post(start_picking_mutation, variables: { sessionId: session_id })

    unowned_game = create_test_game
    graphql_post(pick_game_mutation, variables: { sessionId: session_id, gameId: unowned_game.id.to_s })
    expect(graphql_errors).to be_present
    expect(graphql_errors.first["message"]).to match(/Game is not in the group collection/i)
  end

  it "allows cancelling and reopening a session" do
    graphql_post(create_mutation, variables: { groupId: group.id.to_s, title: "Test" })
    session_id = graphql_data.dig("createNightSession", "session", "id")

    cancel_mutation = <<~GRAPHQL
      mutation CancelSession($sessionId: ID!) {
        cancelSession(sessionId: $sessionId) {
          session { id state }
        }
      }
    GRAPHQL
    graphql_post(cancel_mutation, variables: { sessionId: session_id })
    expect(graphql_errors).to be_nil
    expect(graphql_data.dig("cancelSession", "session", "state")).to eq("CANCELLED")

    reopen_mutation = <<~GRAPHQL
      mutation ReopenSession($sessionId: ID!) {
        reopenSession(sessionId: $sessionId) {
          session { id state }
        }
      }
    GRAPHQL
    graphql_post(reopen_mutation, variables: { sessionId: session_id })
    expect(graphql_errors).to be_nil
    expect(graphql_data.dig("reopenSession", "session", "state")).to eq("DRAFT")
  end

  it "rejects unauthenticated requests" do
    post "/graphql",
      params: { query: create_mutation, variables: { groupId: group.id.to_s, title: "Test" }}.to_json,
      headers: { "Content-Type" => "application/json" }

    expect(graphql_errors).to be_present
    expect(graphql_errors.first["message"]).to match(/Authentication required/i)
  end
end
