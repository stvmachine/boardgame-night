# frozen_string_literal: true

require "rails_helper"

RSpec.describe "NightSession suggestions query", type: :request do
  let(:host) do
    User.create!(username: "alice", email: "alice@example.com", password: "password", bgg_username: "alice_bgg")
  end
  let(:member) do
    User.create!(username: "bob", email: "bob@example.com", password: "password", bgg_username: "bob_bgg")
  end
  let(:group) { Group.create!(name: "Night Owls", owner: host) }
  let(:bearer_token) { Session.create!(user: host, expires_at: 1.day.from_now).token }

  let(:query) do
    <<~GRAPHQL
      query NightSessionSuggestions($id: ID!) {
        nightSession(id: $id) {
          timeBudgetMinutes
          complexityPreference
          suggestions {
            thing {
              id
              name
              owners {
                bggUsername
              }
            }
            score
            breakdown {
              playerCountFit
              timeFit
              complexityFit
              communityRating
              ownershipBonus
            }
            confidence
            reasons
          }
        }
      }
    GRAPHQL
  end

  def create_poll_with_results(thing, results)
    poll = BggPoll.create!(
      bgg_thing: thing,
      name: "suggested_numplayers",
      title: "User Suggested Number of Players",
      total_votes: results.sum { |r| r[:num_votes] }
    )
    results.each do |result|
      BggPollResult.create!(
        bgg_poll: poll,
        player_count: result[:player_count],
        value: result[:value],
        num_votes: result[:num_votes]
      )
    end
    thing.update!(poll_data_fetched_at: Time.current)
    poll
  end

  def create_thing(attrs)
    BggThing.create!(
      objectid: attrs[:objectid],
      name: attrs[:name],
      min_players: attrs[:min_players],
      max_players: attrs[:max_players],
      min_playtime: attrs[:min_playtime],
      max_playtime: attrs[:max_playtime],
      average_weight: attrs[:average_weight],
      average: attrs[:average],
      bayes_average: attrs[:bayes_average],
      poll_data_fetched_at: Time.current
    )
  end

  before do
    GroupMembership.create!(user: host, group: group, role: "member")
    GroupMembership.create!(user: member, group: group, role: "member")
  end

  it "returns ranked, explainable suggestions for a picking session" do
    # Better fit: perfect at 4 players, fits time budget, matches complexity, owned by both attendees
    perfect_game = create_thing(
      objectid: 100,
      name: "Perfect Game",
      min_players: 2,
      max_players: 5,
      min_playtime: 60,
      max_playtime: 90,
      average_weight: 2.7,
      average: 8.0,
      bayes_average: 8.0
    )
    create_poll_with_results(perfect_game, [
      { player_count: 2, value: "Best", num_votes: 80 },
      { player_count: 2, value: "Recommended", num_votes: 15 },
      { player_count: 2, value: "Not Recommended", num_votes: 5 }
    ])
    BggCollection.create!(user: host, bgg_thing: perfect_game, quantity: 1)
    BggCollection.create!(user: member, bgg_thing: perfect_game, quantity: 1)

    # Lower fit: good player count but less strong poll, longer time, owned by only one attendee
    weaker_game = create_thing(
      objectid: 200,
      name: "Weaker Game",
      min_players: 2,
      max_players: 6,
      min_playtime: 90,
      max_playtime: 150,
      average_weight: 3.5,
      average: 7.0,
      bayes_average: 7.0
    )
    create_poll_with_results(weaker_game, [
      { player_count: 2, value: "Best", num_votes: 30 },
      { player_count: 2, value: "Recommended", num_votes: 15 },
      { player_count: 2, value: "Not Recommended", num_votes: 5 }
    ])
    BggCollection.create!(user: host, bgg_thing: weaker_game, quantity: 1)

    session = NightSession.create!(
      group: group,
      host: host,
      title: "Friday Games",
      state: "picking",
      time_budget_minutes: 120,
      complexity_preference: "Medium"
    )
    Attendance.create!(night_session: session, user: host, response: "going")
    Attendance.create!(night_session: session, user: member, response: "going")

    post graphql_path,
         params: { query: query, variables: { id: session.id.to_s } }.to_json,
         headers: { "Authorization" => "Bearer #{bearer_token}", "Content-Type" => "application/json" }

    expect(response).to have_http_status(:ok)
    json = response.parsed_body
    expect(json["errors"]).to be_nil

    data = json.dig("data", "nightSession")
    expect(data["timeBudgetMinutes"]).to eq(120)
    expect(data["complexityPreference"]).to eq("Medium")

    suggestions = data["suggestions"]
    expect(suggestions.size).to be >= 2
    expect(suggestions.size).to be <= 8

    expect(suggestions.first["thing"]["name"]).to eq("Perfect Game")
    expect(suggestions.last["thing"]["name"]).to eq("Weaker Game")

    suggestions.each do |suggestion|
      expect(suggestion["score"]).to be_between(0, 100)
      %w[playerCountFit timeFit complexityFit communityRating ownershipBonus].each do |field|
        expect(suggestion["breakdown"][field]).to be_between(0, 100)
      end
      expect(suggestion["confidence"]).to be_present
      expect(suggestion["reasons"]).to be_an(Array)
      expect(suggestion["reasons"]).not_to be_empty
    end
  end
end
