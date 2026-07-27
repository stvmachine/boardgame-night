# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Game suggestions with group collections", type: :request do
  include FakerHelpers

  let(:host) { create_test_user }
  let(:member_a) { create_test_user }
  let(:member_b) { create_test_user }
  let(:group) do
    g = create_test_group(owner: host)
    GroupMembership.find_or_create_by!(user: member_a, group: g) { |m| m.role = "member" }
    GroupMembership.find_or_create_by!(user: member_b, group: g) { |m| m.role = "member" }
    g
  end
  let(:token) { Session.create!(user: host, expires_at: 1.day.from_now).token }
  let(:headers) { { "Authorization" => "Bearer #{token}", "Content-Type" => "application/json" } }

  let(:query) do
    <<~GRAPHQL
      query NightSessionSuggestions($id: ID!) {
        nightSession(id: $id) {
          attendeeCount
          suggestions {
            thing { id name objectid }
            score
            breakdown { playerCountFit timeFit complexityFit communityRating ownershipBonus }
            confidence
            reasons
          }
        }
      }
    GRAPHQL
  end

  def graphql_post(query_str, variables:)
    post "/graphql",
      params: { query: query_str, variables: variables }.to_json,
      headers: headers
  end

  def graphql_data
    JSON.parse(response.body).dig("data")
  end

  def graphql_errors
    JSON.parse(response.body).dig("errors")
  end

  def create_thing_with_poll(attrs, poll_results:)
    thing = create_test_game(**attrs)
    create_test_poll(thing, results: poll_results)
    thing
  end

  def create_attendee_session(user_ids:)
    session = create_test_session(group: group, host: host, state: "picking")
    user_ids.each do |uid|
      create_test_attendance(session: session, user: User.find(uid))
    end
    session
  end

  def suggestions_for(session)
    graphql_post(query, variables: { id: session.id.to_s })
    expect(graphql_errors).to be_nil
    graphql_data.dig("nightSession", "suggestions")
  end

  context "with a shared collection across members" do
    let!(:game_a) do
      create_thing_with_poll(
        { name: "Catan", min_players: 2, max_players: 4, min_playtime: 60, max_playtime: 120, average: 7.0, average_weight: 2.3 },
        poll_results: [
          { player_count: 3, value: "Best", num_votes: 80 },
          { player_count: 3, value: "Recommended", num_votes: 15 },
          { player_count: 3, value: "Not Recommended", num_votes: 5 }
        ]
      )
    end
    let!(:game_b) do
      create_thing_with_poll(
        { name: "Ticket to Ride", min_players: 2, max_players: 5, min_playtime: 30, max_playtime: 60, average: 7.4, average_weight: 1.9 },
        poll_results: [
          { player_count: 3, value: "Best", num_votes: 90 },
          { player_count: 3, value: "Recommended", num_votes: 8 },
          { player_count: 3, value: "Not Recommended", num_votes: 2 }
        ]
      )
    end

    before do
      create_test_collection(user: host, bgg_thing: game_a)
      create_test_collection(user: member_a, bgg_thing: game_a)
      create_test_collection(user: member_a, bgg_thing: game_b)
      create_test_collection(user: member_b, bgg_thing: game_b)
    end

    it "returns suggestions ranked by score from the merged group collection" do
      session = create_attendee_session(user_ids: [host.id, member_a.id, member_b.id])
      results = suggestions_for(session)

      expect(results).to be_an(Array)
      expect(results.length).to be >= 1
      expect(results.first["thing"]["name"]).to eq("Ticket to Ride")
      expect(results.first["score"]).to be > results.last["score"]
    end

    it "includes ownership bonus when attendees own the game" do
      session = create_attendee_session(user_ids: [host.id, member_a.id, member_b.id])
      results = suggestions_for(session)

      catan_result = results.find { |r| r["thing"]["name"] == "Catan" }
      expect(catan_result).to be_present
      expect(catan_result["breakdown"]["ownershipBonus"]).to be > 0
    end

    it "provides confidence levels based on poll data" do
      session = create_attendee_session(user_ids: [host.id, member_a.id])
      results = suggestions_for(session)

      results.each do |r|
        expect(%w[HIGH MEDIUM LOW]).to include(r["confidence"])
      end
    end
  end

  context "when a game exceeds the time budget" do
    let!(:long_game) do
      create_thing_with_poll(
        { name: "Gloomhaven", min_players: 1, max_players: 4, min_playtime: 120, max_playtime: 240, average: 8.7, average_weight: 3.9 },
        poll_results: [
          { player_count: 1, value: "Best", num_votes: 70 },
          { player_count: 1, value: "Recommended", num_votes: 20 },
          { player_count: 1, value: "Not Recommended", num_votes: 10 }
        ]
      )
    end
    let!(:short_game) do
      create_thing_with_poll(
        { name: "Love Letter", min_players: 1, max_players: 6, min_playtime: 10, max_playtime: 20, average: 7.0, average_weight: 1.2 },
        poll_results: [
          { player_count: 1, value: "Best", num_votes: 50 },
          { player_count: 1, value: "Recommended", num_votes: 30 },
          { player_count: 1, value: "Not Recommended", num_votes: 20 }
        ]
      )
    end

    before do
      create_test_collection(user: host, bgg_thing: long_game)
      create_test_collection(user: host, bgg_thing: short_game)
    end

    it "excludes games that exceed the session time budget" do
      session = create_test_session(group: group, host: host, state: "picking", time_budget_minutes: 60)
      create_test_attendance(session: session, user: host)

      results = suggestions_for(session)
      game_names = results.map { |r| r["thing"]["name"] }

      expect(game_names).not_to include("Gloomhaven")
      expect(game_names).to include("Love Letter")
    end
  end

  context "when no games fit the attendee count" do
    let!(:two_player_only) do
      create_thing_with_poll(
        { name: "7 Wonders Duel", min_players: 2, max_players: 2, min_playtime: 30, max_playtime: 45, average: 8.0, average_weight: 2.3 },
        poll_results: [
          { player_count: 2, value: "Best", num_votes: 95 },
          { player_count: 2, value: "Recommended", num_votes: 4 },
          { player_count: 2, value: "Not Recommended", num_votes: 1 }
        ]
      )
    end

    before do
      create_test_collection(user: host, bgg_thing: two_player_only)
    end

    it "returns no suggestions when attendee count is out of range" do
      session = create_test_session(group: group, host: host, state: "picking")
      create_test_attendance(session: session, user: host)
      create_test_attendance(session: session, user: member_a)
      create_test_attendance(session: session, user: member_b)

      results = suggestions_for(session)
      expect(results).to be_empty
    end
  end

  context "with a large merged collection" do
    it "returns at most 8 suggestions" do
      session = create_test_session(group: group, host: host, state: "picking")
      create_test_attendance(session: session, user: host)
      create_test_attendance(session: session, user: member_a)

      15.times do
        game = create_test_game(min_players: 2, max_players: 4, min_playtime: 30, max_playtime: 60)
        create_test_poll(game, results: [
          { player_count: 2, value: "Best", num_votes: rand(30..100) },
          { player_count: 2, value: "Recommended", num_votes: rand(5..30) },
          { player_count: 2, value: "Not Recommended", num_votes: rand(0..10) }
        ])
        create_test_collection(user: host, bgg_thing: game)
      end

      results = suggestions_for(session)
      expect(results.length).to eq(8)
    end
  end

  context "requires authentication" do
    it "returns an error for unauthenticated requests" do
      session = create_test_session(group: group, host: host, state: "picking")

      post "/graphql",
        params: { query: query, variables: { id: session.id.to_s }}.to_json,
        headers: { "Content-Type" => "application/json" }

      expect(graphql_errors).to be_present
    end
  end

  context "requires group membership" do
    it "returns an error for non-members" do
      outsider = create_test_user
      session = create_test_session(group: group, host: host, state: "picking")

      outsider_token = Session.create!(user: outsider, expires_at: 1.day.from_now).token
      post "/graphql",
        params: { query: query, variables: { id: session.id.to_s }}.to_json,
        headers: { "Authorization" => "Bearer #{outsider_token}", "Content-Type" => "application/json" }

      expect(graphql_errors).to be_present
      expect(graphql_errors.first["message"]).to eq("Unauthorized")
    end
  end
end
