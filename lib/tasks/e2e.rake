# frozen_string_literal: true

namespace :e2e do
  desc "Seed the database with fixtures for end-to-end tests"
  task seed: :environment do
    ActiveRecord::Base.transaction do
      # Clean up any previous e2e fixture data so the task is idempotent
      User.where(bgg_username: ["e2e_alice", "e2e_bob"]).destroy_all

      alice = User.create!(
        username: "e2e_alice_user",
        bgg_username: "e2e_alice",
        password: "password"
      )
      bob = User.create!(
        username: "e2e_bob_user",
        bgg_username: "e2e_bob",
        password: "password"
      )

      wingspan = BggThing.find_or_create_by!(objectid: 123_456) do |thing|
        thing.name = "Wingspan"
        thing.year_published = 2019
        thing.min_players = 1
        thing.max_players = 5
        thing.min_playtime = 40
        thing.max_playtime = 70
        thing.average = 7.9
        thing.average_weight = 2.4
      end

      azul = BggThing.find_or_create_by!(objectid: 123_457) do |thing|
        thing.name = "Azul"
        thing.year_published = 2017
        thing.min_players = 2
        thing.max_players = 4
        thing.min_playtime = 30
        thing.max_playtime = 45
        thing.average = 7.7
        thing.average_weight = 1.8
      end

      gloomhaven = BggThing.find_or_create_by!(objectid: 123_458) do |thing|
        thing.name = "Gloomhaven"
        thing.year_published = 2017
        thing.min_players = 1
        thing.max_players = 4
        thing.min_playtime = 60
        thing.max_playtime = 120
        thing.average = 8.7
        thing.average_weight = 3.9
      end

      BggCollection.find_or_create_by!(user: alice, bgg_thing: wingspan)
      BggCollection.find_or_create_by!(user: alice, bgg_thing: azul)
      BggCollection.find_or_create_by!(user: bob, bgg_thing: wingspan)
      BggCollection.find_or_create_by!(user: bob, bgg_thing: gloomhaven)

      Rails.logger.info("Seeded e2e fixtures: alice (#{alice.bgg_username}), bob (#{bob.bgg_username})")
    end
  end
end
