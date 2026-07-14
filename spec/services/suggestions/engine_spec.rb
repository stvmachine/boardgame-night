# frozen_string_literal: true

require "rails_helper"

RSpec.describe Suggestions::Engine do
  let(:host) do
    User.create!(username: "alice", email: "alice@example.com", password: "password", bgg_username: "alice_bgg")
  end
  let(:member) do
    User.create!(username: "bob", email: "bob@example.com", password: "password", bgg_username: "bob_bgg")
  end
  let(:group) { Group.create!(name: "Night Owls", owner: host) }

  let(:session) do
    NightSession.create!(
      group: group,
      host: host,
      title: "Friday Games",
      state: "picking",
      time_budget_minutes: 120,
      complexity_preference: "Medium"
    )
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

  def call_engine(things, attendees = [host, member])
    attendee_ids = attendees.map(&:id)
    attendee_count = attendee_ids.size
    polls_by_thing = things.to_h { |thing| [thing.id, thing.bgg_polls.includes(:bgg_poll_results).to_a] }
    owners_by_thing = things.to_h { |thing| [thing.id, thing.bgg_collections.includes(:user).to_a] }

    described_class.call(
      session: session,
      things: things,
      attendee_user_ids: attendee_ids,
      attendee_count: attendee_count,
      polls_by_thing: polls_by_thing,
      owners_by_thing: owners_by_thing
    )
  end

  before do
    GroupMembership.create!(user: host, group: group, role: "member")
    GroupMembership.create!(user: member, group: group, role: "member")
  end

  it "returns a weighted score with all five breakdown components" do
    game = create_thing(
      objectid: 100,
      name: "Great Game",
      min_players: 2,
      max_players: 5,
      min_playtime: 60,
      max_playtime: 90,
      average_weight: 2.7,
      average: 8.0,
      bayes_average: 8.0
    )
    create_poll_with_results(game, [
      { player_count: 2, value: "Best", num_votes: 80 },
      { player_count: 2, value: "Recommended", num_votes: 15 },
      { player_count: 2, value: "Not Recommended", num_votes: 5 }
    ])
    BggCollection.create!(user: host, bgg_thing: game, quantity: 1)
    BggCollection.create!(user: member, bgg_thing: game, quantity: 1)

    result = call_engine([game]).first

    expect(result).to be_present
    expect(result.score).to be_between(0, 100)
    expect(result.breakdown.player_count_fit).to be_between(0, 100)
    expect(result.breakdown.time_fit).to be_between(0, 100)
    expect(result.breakdown.complexity_fit).to be_between(0, 100)
    expect(result.breakdown.community_rating).to be_between(0, 100)
    expect(result.breakdown.ownership_bonus).to be_between(0, 100)
    expect(result.confidence).to eq("HIGH")
    expect(result.reasons).to be_an(Array)
    expect(result.reasons).not_to be_empty
  end

  it "ranks the better-fitting game first and caps at eight results" do
    perfect = create_thing(
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
    create_poll_with_results(perfect, [
      { player_count: 2, value: "Best", num_votes: 80 },
      { player_count: 2, value: "Recommended", num_votes: 15 },
      { player_count: 2, value: "Not Recommended", num_votes: 5 }
    ])
    BggCollection.create!(user: host, bgg_thing: perfect, quantity: 1)
    BggCollection.create!(user: member, bgg_thing: perfect, quantity: 1)

    weaker = create_thing(
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
    create_poll_with_results(weaker, [
      { player_count: 2, value: "Best", num_votes: 30 },
      { player_count: 2, value: "Recommended", num_votes: 15 },
      { player_count: 2, value: "Not Recommended", num_votes: 5 }
    ])
    BggCollection.create!(user: host, bgg_thing: weaker, quantity: 1)

    results = call_engine([weaker, perfect])

    expect(results.size).to eq(2)
    expect(results.first.thing.name).to eq("Perfect Game")
    expect(results.last.thing.name).to eq("Weaker Game")
    expect(results.first.score).to be > results.last.score
  end

  it "excludes games that do not fit the attendee count or time budget" do
    too_long = create_thing(
      objectid: 300,
      name: "Too Long",
      min_players: 2,
      max_players: 5,
      min_playtime: 180,
      max_playtime: 240,
      average_weight: 2.7,
      average: 8.0,
      bayes_average: 8.0
    )
    create_poll_with_results(too_long, [
      { player_count: 2, value: "Best", num_votes: 80 }
    ])
    BggCollection.create!(user: host, bgg_thing: too_long, quantity: 1)

    too_many_players = create_thing(
      objectid: 400,
      name: "Too Many Players",
      min_players: 5,
      max_players: 8,
      min_playtime: 60,
      max_playtime: 90,
      average_weight: 2.7,
      average: 8.0,
      bayes_average: 8.0
    )
    create_poll_with_results(too_many_players, [
      { player_count: 2, value: "Best", num_votes: 80 }
    ])
    BggCollection.create!(user: host, bgg_thing: too_many_players, quantity: 1)

    results = call_engine([too_long, too_many_players])

    expect(results).to be_empty
  end

  it "marks thin poll data as LOW confidence and uses the range fallback" do
    game = create_thing(
      objectid: 500,
      name: "Thin Poll Game",
      min_players: 1,
      max_players: 6,
      min_playtime: 60,
      max_playtime: 90,
      average_weight: 2.7,
      average: 8.0,
      bayes_average: 8.0
    )
    create_poll_with_results(game, [
      { player_count: 2, value: "Best", num_votes: 5 }
    ])
    BggCollection.create!(user: host, bgg_thing: game, quantity: 1)
    BggCollection.create!(user: member, bgg_thing: game, quantity: 1)

    result = call_engine([game]).first

    expect(result.confidence).to eq("LOW")
    expect(result.breakdown.player_count_fit).to be_between(0, 60)
  end

  it "returns a deterministic tie-breaker using objectid ascending" do
    a = create_thing(
      objectid: 100,
      name: "Game A",
      min_players: 2,
      max_players: 5,
      min_playtime: 60,
      max_playtime: 90,
      average_weight: 2.7,
      average: 8.0,
      bayes_average: 8.0
    )
    b = create_thing(
      objectid: 50,
      name: "Game B",
      min_players: 2,
      max_players: 5,
      min_playtime: 60,
      max_playtime: 90,
      average_weight: 2.7,
      average: 8.0,
      bayes_average: 8.0
    )
    [a, b].each do |game|
      create_poll_with_results(game, [
        { player_count: 2, value: "Best", num_votes: 80 }
      ])
      BggCollection.create!(user: host, bgg_thing: game, quantity: 1)
    end

    results = call_engine([a, b])

    expect(results.map { |r| r.thing.objectid }).to eq([50, 100])
  end
end
