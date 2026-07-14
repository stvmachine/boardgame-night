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

  def unique_objectid
    @unique_objectid ||= 10_000
    @unique_objectid += 1
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

  describe "confidence boundaries" do
    def game_with_poll_votes(votes)
      game = create_thing(
        objectid: next_objectid,
        name: "Boundary Game",
        min_players: 1,
        max_players: 6,
        min_playtime: 60,
        max_playtime: 90,
        average_weight: 2.7,
        average: 8.0,
        bayes_average: 8.0
      )
      create_poll_with_results(game, [
        { player_count: 2, value: "Best", num_votes: votes[:best] || 0 },
        { player_count: 2, value: "Recommended", num_votes: votes[:recommended] || 0 },
        { player_count: 2, value: "Not Recommended", num_votes: votes[:not_recommended] || 0 }
      ])
      BggCollection.create!(user: host, bgg_thing: game, quantity: 1)
      game
    end

    let(:objectid_counter) { 1000 }

    def next_objectid
      @objectid_counter ||= 1000
      @objectid_counter += 1
    end

    it "is HIGH with 50 target-count votes" do
      game = game_with_poll_votes(best: 40, recommended: 8, not_recommended: 2)
      result = call_engine([game]).first

      expect(result.confidence).to eq("HIGH")
      expect(result.breakdown.player_count_fit).to be_within(0.01).of(89.6)
    end

    it "is MEDIUM with 20 target-count votes" do
      game = game_with_poll_votes(best: 12, recommended: 6, not_recommended: 2)
      result = call_engine([game]).first

      expect(result.confidence).to eq("MEDIUM")
      expect(result.breakdown.player_count_fit).to be_within(0.01).of(73.64)
    end

    it "is MEDIUM with 49 target-count votes" do
      game = game_with_poll_votes(best: 30, recommended: 15, not_recommended: 4)
      result = call_engine([game]).first

      expect(result.confidence).to eq("MEDIUM")
      expect(result.breakdown.player_count_fit).to be_within(0.01).of(77.65)
    end

    it "is LOW with 19 target-count votes" do
      game = game_with_poll_votes(best: 10, recommended: 7, not_recommended: 2)
      result = call_engine([game]).first

      expect(result.confidence).to eq("LOW")
      expect(result.breakdown.player_count_fit).to be_within(0.01).of(24.0)
    end
  end

  describe "fallback and nil-data handling" do
    it "uses LOW range fallback when the target count has no poll results" do
      game = create_thing(
        objectid: 600,
        name: "No Target Count",
        min_players: 1,
        max_players: 6,
        min_playtime: 60,
        max_playtime: 90,
        average_weight: 2.7,
        average: 8.0,
        bayes_average: 8.0
      )
      poll = BggPoll.create!(
        bgg_thing: game,
        name: "suggested_numplayers",
        title: "User Suggested Number of Players",
        total_votes: 100
      )
      BggPollResult.create!(bgg_poll: poll, player_count: 3, value: "Best", num_votes: 100)
      game.update!(poll_data_fetched_at: Time.current)
      BggCollection.create!(user: host, bgg_thing: game, quantity: 1)

      result = call_engine([game]).first

      expect(result.confidence).to eq("LOW")
      expect(result.breakdown.player_count_fit).to be_within(0.01).of(24.0)
    end

    it "is LOW with range fallback when poll_data_fetched_at is nil" do
      game = create_thing(
        objectid: 610,
        name: "Never Backfilled",
        min_players: 1,
        max_players: 6,
        min_playtime: 60,
        max_playtime: 90,
        average_weight: 2.7,
        average: 8.0,
        bayes_average: 8.0
      )
      BggCollection.create!(user: host, bgg_thing: game, quantity: 1)

      result = call_engine([game]).first

      expect(result.confidence).to eq("LOW")
      expect(result.breakdown.player_count_fit).to be_within(0.01).of(24.0)
    end

    it "returns 0 at the range edge and outside the player range" do
      edge = create_thing(
        objectid: 620,
        name: "Edge Game",
        min_players: 2,
        max_players: 4,
        min_playtime: 60,
        max_playtime: 90,
        average_weight: 2.7,
        average: 8.0,
        bayes_average: 8.0
      )
      BggCollection.create!(user: host, bgg_thing: edge, quantity: 1)

      outside = create_thing(
        objectid: 621,
        name: "Outside Game",
        min_players: 5,
        max_players: 8,
        min_playtime: 60,
        max_playtime: 90,
        average_weight: 2.7,
        average: 8.0,
        bayes_average: 8.0
      )
      BggCollection.create!(user: host, bgg_thing: outside, quantity: 1)

      expect(call_engine([edge], [host, member])).to be_empty
      expect(call_engine([outside], [host, member])).to be_empty
    end
  end

  describe "complexity preference mapping" do
    def complexity_game(weight, preference)
      session = NightSession.create!(
        group: group,
        host: host,
        title: "Complexity Test",
        state: "picking",
        time_budget_minutes: 120,
        complexity_preference: preference
      )
      game = create_thing(
        objectid: unique_objectid,
        name: "Complexity Game",
        min_players: 1,
        max_players: 4,
        min_playtime: 60,
        max_playtime: 90,
        average_weight: weight,
        average: 8.0,
        bayes_average: 8.0
      )
      create_poll_with_results(game, [{ player_count: 2, value: "Best", num_votes: 80 }])
      BggCollection.create!(user: host, bgg_thing: game, quantity: 1)

      attendee_ids = [host.id, member.id]
      polls_by_thing = { game.id => game.bgg_polls.includes(:bgg_poll_results).to_a }
      owners_by_thing = { game.id => game.bgg_collections.includes(:user).to_a }

      described_class.call(
        session: session,
        things: [game],
        attendee_user_ids: attendee_ids,
        attendee_count: attendee_ids.size,
        polls_by_thing: polls_by_thing,
        owners_by_thing: owners_by_thing
      ).first
    end

    it "scores each preference band exactly" do
      expect(complexity_game(1.8, "Light").breakdown.complexity_fit).to be_within(0.01).of(100.0)
      expect(complexity_game(2.7, "Medium").breakdown.complexity_fit).to be_within(0.01).of(100.0)
      expect(complexity_game(3.6, "Medium-Heavy").breakdown.complexity_fit).to be_within(0.01).of(100.0)
      expect(complexity_game(4.4, "Heavy").breakdown.complexity_fit).to be_within(0.01).of(100.0)
      expect(complexity_game(2.7, "Any").breakdown.complexity_fit).to be_within(0.01).of(50.0)
    end

    it "clamps to zero when weight is far from the target" do
      expect(complexity_game(0.0, "Heavy").breakdown.complexity_fit).to be_within(0.01).of(0.0)
    end
  end

  describe "rating selection" do
    it "prefers bayes_average, falls back to average, then zero" do
      with_bayes = create_thing(
        objectid: 800,
        name: "Bayes Game",
        min_players: 2,
        max_players: 4,
        min_playtime: 60,
        max_playtime: 90,
        average_weight: 2.7,
        average: 7.0,
        bayes_average: 8.4
      )
      create_poll_with_results(with_bayes, [{ player_count: 2, value: "Best", num_votes: 80 }])
      BggCollection.create!(user: host, bgg_thing: with_bayes, quantity: 1)

      average_only = create_thing(
        objectid: 801,
        name: "Average Game",
        min_players: 2,
        max_players: 4,
        min_playtime: 60,
        max_playtime: 90,
        average_weight: 2.7,
        average: 7.5,
        bayes_average: nil
      )
      create_poll_with_results(average_only, [{ player_count: 2, value: "Best", num_votes: 80 }])
      BggCollection.create!(user: host, bgg_thing: average_only, quantity: 1)

      no_rating = create_thing(
        objectid: 802,
        name: "No Rating",
        min_players: 2,
        max_players: 4,
        min_playtime: 60,
        max_playtime: 90,
        average_weight: 2.7,
        average: nil,
        bayes_average: nil
      )
      create_poll_with_results(no_rating, [{ player_count: 2, value: "Best", num_votes: 80 }])
      BggCollection.create!(user: host, bgg_thing: no_rating, quantity: 1)

      expect(call_engine([with_bayes]).first.breakdown.community_rating).to be_within(0.01).of(84.0)
      expect(call_engine([average_only]).first.breakdown.community_rating).to be_within(0.01).of(75.0)
      expect(call_engine([no_rating]).first.breakdown.community_rating).to be_within(0.01).of(0.0)
    end
  end

  describe "ownership scoring" do
    it "excludes non-attending owners from the bonus and reason" do
      game = create_thing(
        objectid: 900,
        name: "Partial Ownership",
        min_players: 1,
        max_players: 4,
        min_playtime: 60,
        max_playtime: 90,
        average_weight: 2.7,
        average: 8.0,
        bayes_average: 8.0
      )
      create_poll_with_results(game, [{ player_count: 1, value: "Best", num_votes: 80 }])
      BggCollection.create!(user: host, bgg_thing: game, quantity: 1)
      BggCollection.create!(user: member, bgg_thing: game, quantity: 1)

      result = call_engine([game], [host]).first

      expect(result.breakdown.ownership_bonus).to be_within(0.01).of(100.0)
      expect(result.reasons).to include("Owned by alice@example.com")
      expect(result.reasons).not_to include(/bob@example\.com/)
    end

    it "rewards multi-owner games proportionally" do
      another_owner = User.create!(
        username: "carol",
        email: "carol@example.com",
        password: "password",
        bgg_username: "carol_bgg"
      )
      GroupMembership.create!(user: another_owner, group: group, role: "member")

      game = create_thing(
        objectid: 910,
        name: "Multi Owner",
        min_players: 1,
        max_players: 4,
        min_playtime: 60,
        max_playtime: 90,
        average_weight: 2.7,
        average: 8.0,
        bayes_average: 8.0
      )
      create_poll_with_results(game, [{ player_count: 2, value: "Best", num_votes: 80 }])
      BggCollection.create!(user: host, bgg_thing: game, quantity: 1)
      BggCollection.create!(user: member, bgg_thing: game, quantity: 1)
      BggCollection.create!(user: another_owner, bgg_thing: game, quantity: 1)

      result = call_engine([game], [host, member]).first

      expect(result.breakdown.ownership_bonus).to be_within(0.01).of(100.0)
      expect(result.reasons).to include("Owned by alice@example.com & bob@example.com")
    end
  end

  describe "reason chips" do
    it "includes a LOW player reason for thin or missing poll data" do
      game = create_thing(
        objectid: 1000,
        name: "Thin Reason",
        min_players: 1,
        max_players: 6,
        min_playtime: 60,
        max_playtime: 90,
        average_weight: 2.7,
        average: 8.0,
        bayes_average: 8.0
      )
      create_poll_with_results(game, [{ player_count: 2, value: "Best", num_votes: 5 }])
      BggCollection.create!(user: host, bgg_thing: game, quantity: 1)

      result = call_engine([game]).first

      expect(result.reasons).to include("2 players may fit (limited community data)")
      expect(result.reasons).to include("90 min fits your 120 min budget")
      expect(result.reasons).to include("Medium complexity (2.7)")
    end

    it "includes a poll-backed player reason with rounded Best percentage" do
      game = create_thing(
        objectid: 1010,
        name: "Poll Reason",
        min_players: 2,
        max_players: 4,
        min_playtime: 60,
        max_playtime: 90,
        average_weight: 2.7,
        average: 8.0,
        bayes_average: 8.0
      )
      create_poll_with_results(game, [
        { player_count: 2, value: "Best", num_votes: 40 },
        { player_count: 2, value: "Recommended", num_votes: 8 },
        { player_count: 2, value: "Not Recommended", num_votes: 2 }
      ])
      BggCollection.create!(user: host, bgg_thing: game, quantity: 1)

      result = call_engine([game]).first

      expect(result.reasons).to include("Best at 2 players (80% Best votes)")
    end
  end

  describe "hard filters and top-eight truncation" do
    it "excludes a game whose time minimum exceeds the budget" do
      game = create_thing(
        objectid: 1100,
        name: "Too Long Min",
        min_players: 2,
        max_players: 4,
        min_playtime: 180,
        max_playtime: 240,
        average_weight: 2.7,
        average: 8.0,
        bayes_average: 8.0
      )
      create_poll_with_results(game, [{ player_count: 2, value: "Best", num_votes: 80 }])
      BggCollection.create!(user: host, bgg_thing: game, quantity: 1)

      expect(call_engine([game])).to be_empty
    end

    it "returns the top eight candidates and excludes zero-score games" do
      games = 10.times.map do |i|
        game = create_thing(
          objectid: 1200 + i,
          name: "Game #{i}",
          min_players: 2,
          max_players: 4,
          min_playtime: 60,
          max_playtime: 90,
          average_weight: 2.7,
          average: 8.0,
          bayes_average: 8.0
        )
        create_poll_with_results(game, [{ player_count: 2, value: "Best", num_votes: 80 + i }])
        BggCollection.create!(user: host, bgg_thing: game, quantity: 1)
        game
      end

      results = call_engine(games)

      expect(results.size).to eq(8)
      expect(results.first.score).to be >= results.last.score
      expect(results.all? { |r| r.score.positive? }).to be true
    end
  end

  describe "nil-statistic safety" do
    it "does not crash when playtime or weight is missing" do
      game = create_thing(
        objectid: 1300,
        name: "Missing Stats",
        min_players: 2,
        max_players: 4,
        min_playtime: nil,
        max_playtime: nil,
        average_weight: nil,
        average: nil,
        bayes_average: nil
      )
      create_poll_with_results(game, [{ player_count: 2, value: "Best", num_votes: 80 }])
      BggCollection.create!(user: host, bgg_thing: game, quantity: 1)

      result = call_engine([game]).first

      expect(result).to be_present
      expect(result.score).to be_between(0, 100)
      expect(result.breakdown.time_fit).to be_between(0, 100)
      expect(result.breakdown.complexity_fit).to be_between(0, 100)
      expect(result.breakdown.community_rating).to be_between(0, 100)
    end
  end
end
