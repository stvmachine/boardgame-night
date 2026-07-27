# frozen_string_literal: true

module FakerHelpers
  # Counter for unique objectids
  def next_objectid
    @_next_objectid ||= 100_000
    @_next_objectid += 1
  end

  # Creates a User with Faker data
  def create_test_user(**overrides)
    defaults = {
      username: Faker::Internet.unique.username(specifier: 3..20, separators: %w[_]),
      email: Faker::Internet.unique.email,
      password: "password",
      bgg_username: Faker::Internet.unique.username(specifier: 3..15, separators: %w[_])
    }
    User.create!(defaults.merge(overrides))
  end

  # Creates a Group with Faker data, with owner auto-added as member
  def create_test_group(owner:, **overrides)
    group = Group.create!(
      name: Faker::App.name,
      description: Faker::Lorem.sentence(word_count: 6),
      owner: owner,
      **overrides
    )
    GroupMembership.find_or_create_by!(user: owner, group: group) { |m| m.role = "owner" }
    group
  end

  # Creates a BggThing (board game) with realistic data
  def create_test_game(**overrides)
    defaults = {
      objectid: next_objectid,
      name: Faker::Game.unique.title,
      year_published: rand(2000..2025),
      min_players: rand(1..3),
      max_players: rand(4..8),
      min_playtime: [15, 30, 45, 60].sample,
      max_playtime: [45, 60, 90, 120, 180].sample,
      average: (rand * 3 + 5.5).round(1),
      average_weight: (rand * 3 + 1.0).round(1),
      poll_data_fetched_at: Time.current
    }
    BggThing.create!(defaults.merge(overrides))
  end

  # Creates a BggPoll with results for suggested_numplayers
  def create_test_poll(thing, results:)
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
    thing.update!(poll_data_fetched_at: Time.current) unless thing.poll_data_fetched_at?
    poll
  end

  # Creates a NightSession with Faker data
  def create_test_session(group:, host:, state: "draft", **overrides)
    defaults = {
      title: "#{Faker::Lorem.word.capitalize} #{%w[Games Night Fun Showdown].sample}",
      state: state,
      time_budget_minutes: [60, 90, 120, 180].sample,
      complexity_preference: NightSession::VALID_COMPLEXITY_PREFERENCES.sample
    }
    defaults[:scheduled_at] = rand(1..14).days.from_now if %w[invited picking completed cancelled].include?(state)
    defaults[:location] = Faker::Address.city if %w[invited picking completed cancelled].include?(state)
    NightSession.create!(defaults.merge(group: group, host: host).merge(overrides))
  end

  # Creates a BggCollection link
  def create_test_collection(user:, bgg_thing:, quantity: 1)
    BggCollection.find_or_create_by!(user: user, bgg_thing: bgg_thing) { |c| c.quantity = quantity }
  end

  # Creates an Attendance record
  def create_test_attendance(session:, user:, response: "going")
    Attendance.find_or_create_by!(night_session: session, user: user) { |a| a.response = response }
  end

  # Sets up a complete game scenario: multiple users in a group, each with
  # BGG collections, a session, and poll data.
  def setup_game_night_scenario(member_count: 2, game_count: 4)
    host = create_test_user
    members = Array.new(member_count) { create_test_user }
    group = create_test_group(owner: host)
    members.each { |m| GroupMembership.find_or_create_by!(user: m, group: group) { |gm| gm.role = "member" } }

    games = Array.new(game_count) do
      game = create_test_game
      (members + [host]).each do |user|
        create_test_collection(user: user, bgg_thing: game) if rand < 0.6
      end
      create_test_poll(game, results: [
        { player_count: rand(1..4), value: "Best", num_votes: rand(40..100) },
        { player_count: rand(1..4), value: "Recommended", num_votes: rand(10..40) },
        { player_count: rand(1..4), value: "Not Recommended", num_votes: rand(0..15) }
      ])
      game
    end

    session = create_test_session(group: group, host: host, state: "picking")
    (members + [host]).each { |u| create_test_attendance(session: session, user: u) }

    {
      host: host,
      members: members,
      group: group,
      games: games,
      session: session
    }
  end
end
