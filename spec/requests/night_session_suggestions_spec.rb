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

  it "returns null for authorized non-picking states and [] for picking with no going attendees" do
    [ :draft, :invited, :completed, :cancelled ].each do |state|
      session = NightSession.create!(
        group: group,
        host: host,
        title: "#{state} Session",
        state: state.to_s,
        time_budget_minutes: 120,
        complexity_preference: "Medium"
      )
      Attendance.create!(night_session: session, user: host, response: "going")

      post graphql_path,
           params: { query: query, variables: { id: session.id.to_s } }.to_json,
           headers: { "Authorization" => "Bearer #{bearer_token}", "Content-Type" => "application/json" }

      data = response.parsed_body.dig("data", "nightSession")
      expect(data["suggestions"]).to be_nil
    end

    empty_picking = NightSession.create!(
      group: group,
      host: host,
      title: "Empty Picking",
      state: "picking",
      time_budget_minutes: 120,
      complexity_preference: "Medium"
    )

    post graphql_path,
         params: { query: query, variables: { id: empty_picking.id.to_s } }.to_json,
         headers: { "Authorization" => "Bearer #{bearer_token}", "Content-Type" => "application/json" }

    data = response.parsed_body.dig("data", "nightSession")
    expect(data["suggestions"]).to eq([])
  end

  it "rejects unauthenticated requests with a GraphQL error" do
    session = NightSession.create!(
      group: group,
      host: host,
      title: "Picking Session",
      state: "picking",
      time_budget_minutes: 120,
      complexity_preference: "Medium"
    )
    Attendance.create!(night_session: session, user: host, response: "going")

    post graphql_path,
         params: { query: query, variables: { id: session.id.to_s } }.to_json,
         headers: { "Content-Type" => "application/json" }

    expect(response).to have_http_status(:ok)
    json = response.parsed_body
    expect(json["errors"]).to be_present
    expect(json.dig("data", "nightSession", "suggestions")).to be_nil
  end

  it "rejects authenticated outsiders with a GraphQL error" do
    outsider = User.create!(
      username: "outsider",
      email: "outsider@example.com",
      password: "password"
    )
    outsider_token = Session.create!(user: outsider, expires_at: 1.day.from_now).token

    session = NightSession.create!(
      group: group,
      host: host,
      title: "Picking Session",
      state: "picking",
      time_budget_minutes: 120,
      complexity_preference: "Medium"
    )
    Attendance.create!(night_session: session, user: host, response: "going")

    post graphql_path,
         params: { query: query, variables: { id: session.id.to_s } }.to_json,
         headers: { "Authorization" => "Bearer #{outsider_token}", "Content-Type" => "application/json" }

    expect(response).to have_http_status(:ok)
    json = response.parsed_body
    expect(json["errors"]).to be_present
    expect(json.dig("data", "nightSession", "suggestions")).to be_nil
  end

  it "allows group members to query suggestions" do
    member_token = Session.create!(user: member, expires_at: 1.day.from_now).token

    game = create_thing(
      objectid: 5000,
      name: "Member Game",
      min_players: 2,
      max_players: 4,
      min_playtime: 60,
      max_playtime: 90,
      average_weight: 2.7,
      average: 8.0,
      bayes_average: 8.0
    )
    create_poll_with_results(game, [
      { player_count: 2, value: "Best", num_votes: 80 }
    ])
    BggCollection.create!(user: host, bgg_thing: game, quantity: 1)

    session = NightSession.create!(
      group: group,
      host: host,
      title: "Picking Session",
      state: "picking",
      time_budget_minutes: 120,
      complexity_preference: "Medium"
    )
    Attendance.create!(night_session: session, user: host, response: "going")
    Attendance.create!(night_session: session, user: member, response: "going")

    post graphql_path,
         params: { query: query, variables: { id: session.id.to_s } }.to_json,
         headers: { "Authorization" => "Bearer #{member_token}", "Content-Type" => "application/json" }

    expect(response).to have_http_status(:ok)
    json = response.parsed_body
    expect(json["errors"]).to be_nil
    expect(json.dig("data", "nightSession", "suggestions")).to be_present
  end

  it "excludes a game owned only by a Not Going member" do
    member_game = create_thing(
      objectid: 5100,
      name: "Member Only Game",
      min_players: 1,
      max_players: 1,
      min_playtime: 60,
      max_playtime: 90,
      average_weight: 2.7,
      average: 8.0,
      bayes_average: 8.0
    )
    create_poll_with_results(member_game, [
      { player_count: 1, value: "Best", num_votes: 80 }
    ])
    BggCollection.create!(user: member, bgg_thing: member_game, quantity: 1)

    host_game = create_thing(
      objectid: 5200,
      name: "Host Game",
      min_players: 1,
      max_players: 1,
      min_playtime: 60,
      max_playtime: 90,
      average_weight: 2.7,
      average: 8.0,
      bayes_average: 8.0
    )
    create_poll_with_results(host_game, [
      { player_count: 1, value: "Best", num_votes: 80 }
    ])
    BggCollection.create!(user: host, bgg_thing: host_game, quantity: 1)

    session = NightSession.create!(
      group: group,
      host: host,
      title: "Picking Session",
      state: "picking",
      time_budget_minutes: 120,
      complexity_preference: "Medium"
    )
    Attendance.create!(night_session: session, user: host, response: "going")
    Attendance.create!(night_session: session, user: member, response: "not_going")

    post graphql_path,
         params: { query: query, variables: { id: session.id.to_s } }.to_json,
         headers: { "Authorization" => "Bearer #{bearer_token}", "Content-Type" => "application/json" }

    expect(response).to have_http_status(:ok)
    json = response.parsed_body
    expect(json["errors"]).to be_nil

    suggestion_names = json.dig("data", "nightSession", "suggestions").map { |s| s["thing"]["name"] }
    expect(suggestion_names).to include("Host Game")
    expect(suggestion_names).not_to include("Member Only Game")
  end

  it "batch-loads polls and owners and never constructs Bgg::Client" do
    allow(Bgg::Client).to receive(:new).and_raise("Bgg::Client should not be constructed")

    games = 5.times.map do |i|
      game = create_thing(
        objectid: 6000 + i,
        name: "Batch Game #{i}",
        min_players: 2,
        max_players: 4,
        min_playtime: 60,
        max_playtime: 90,
        average_weight: 2.7,
        average: 8.0,
        bayes_average: 8.0
      )
      create_poll_with_results(game, [
        { player_count: 2, value: "Best", num_votes: 80 + i }
      ])
      BggCollection.create!(user: host, bgg_thing: game, quantity: 1)
      game
    end

    session = NightSession.create!(
      group: group,
      host: host,
      title: "Picking Session",
      state: "picking",
      time_budget_minutes: 120,
      complexity_preference: "Medium"
    )
    Attendance.create!(night_session: session, user: host, response: "going")
    Attendance.create!(night_session: session, user: member, response: "going")

    query_log = []
    callback = ->(_name, _started, _finished, _unique_id, payload) {
      query_log << payload[:sql] if payload[:sql].present? && !payload[:name].in?([ "SCHEMA", "TRANSACTION" ])
    }

    ActiveSupport::Notifications.subscribed(callback, "sql.active_record") do
      post graphql_path,
           params: { query: query, variables: { id: session.id.to_s } }.to_json,
           headers: { "Authorization" => "Bearer #{bearer_token}", "Content-Type" => "application/json" }
    end

    expect(response).to have_http_status(:ok)
    json = response.parsed_body
    expect(json["errors"]).to be_nil
    expect(json.dig("data", "nightSession", "suggestions").size).to eq(games.size)

    poll_queries = query_log.select { |sql| sql.include?('SELECT "bgg_polls"') }
    owner_queries = query_log.select { |sql| sql.include?('SELECT "bgg_collections"') }
    expect(poll_queries.size).to eq(1)
    expect(owner_queries.size).to eq(1)
  end
end
