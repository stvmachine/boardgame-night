# frozen_string_literal: true

namespace :e2e do
  desc "Seed the database with fixtures for end-to-end tests"
  task seed: :environment do
    ActiveRecord::Base.transaction do
      # Clean up any previous e2e fixture data so the task is idempotent
      User.where(bgg_username: ["e2e_alice", "e2e_bob"]).destroy_all
      Group.where(name: "e2e Night Owls").destroy_all

      alice = User.create!(
        username: "e2e_alice_user",
        email: "e2e_alice@example.com",
        bgg_username: "e2e_alice",
        password: "password"
      )
      bob = User.create!(
        username: "e2e_bob_user",
        email: "e2e_bob@example.com",
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

      cascadia = BggThing.find_or_create_by!(objectid: 123_459) do |thing|
        thing.name = "Cascadia"
        thing.year_published = 2021
        thing.min_players = 1
        thing.max_players = 4
        thing.min_playtime = 30
        thing.max_playtime = 45
        thing.average = 8.0
        thing.average_weight = 1.9
      end

      BggCollection.find_or_create_by!(user: alice, bgg_thing: wingspan)
      BggCollection.find_or_create_by!(user: alice, bgg_thing: azul)
      BggCollection.find_or_create_by!(user: alice, bgg_thing: cascadia)
      BggCollection.find_or_create_by!(user: bob, bgg_thing: wingspan)
      BggCollection.find_or_create_by!(user: bob, bgg_thing: gloomhaven)
      BggCollection.find_or_create_by!(user: bob, bgg_thing: cascadia)

      group = Group.create!(
        name: "e2e Night Owls",
        description: "End-to-end test group for the Night Owls",
        owner: alice,
        invite_code: "E2ENIGHTOWLS"
      )
      GroupMembership.find_or_create_by!(user: alice, group: group) do |m|
        m.role = "owner"
      end
      GroupMembership.find_or_create_by!(user: bob, group: group) do |m|
        m.role = "member"
      end

      invited_session = NightSession.find_or_create_by!(
        title: "e2e Friday Games",
        group: group,
        host: alice
      ) do |s|
        s.state = "invited"
        s.scheduled_at = 7.days.from_now
        s.location = "Alice's place"
        s.capacity = 6
      end
      invited_session.update!(state: "invited", scheduled_at: 7.days.from_now)

      picking_session = NightSession.find_or_create_by!(
        title: "e2e Picking Night",
        group: group,
        host: alice
      ) do |s|
        s.state = "picking"
        s.scheduled_at = 3.days.from_now
        s.location = "Alice's place"
        s.capacity = 5
      end
      picking_session.update!(state: "picking", scheduled_at: 3.days.from_now)

      draft_session = NightSession.find_or_create_by!(
        title: "e2e Draft Night",
        group: group,
        host: alice
      ) do |s|
        s.state = "draft"
        s.scheduled_at = nil
        s.location = "TBD"
        s.capacity = 4
      end
      draft_session.update!(state: "draft", scheduled_at: nil)

      completed_session = NightSession.find_or_create_by!(
        title: "e2e Completed Night",
        group: group,
        host: alice
      ) do |s|
        s.state = "completed"
        s.scheduled_at = 1.day.ago
        s.location = "Alice's place"
        s.capacity = 6
      end
      completed_session.update!(state: "completed", scheduled_at: 1.day.ago)

      cancelled_session = NightSession.find_or_create_by!(
        title: "e2e Cancelled Night",
        group: group,
        host: alice
      ) do |s|
        s.state = "cancelled"
        s.scheduled_at = 2.days.from_now
        s.location = "Alice's place"
        s.capacity = 6
      end
      cancelled_session.update!(state: "cancelled", scheduled_at: 2.days.from_now)

      Attendance.find_or_create_by!(night_session: picking_session, user: bob) do |a|
        a.response = "going"
      end

      raw_token = "e2e_session_invite_token"
      digest = Digest::SHA256.hexdigest(raw_token)
      InviteToken.where(night_session: invited_session).destroy_all
      InviteToken.create!(
        group: group,
        inviter: alice,
        email: "e2e_guest@example.com",
        night_session: invited_session,
        token_digest: digest,
        status: "pending",
        expires_at: 7.days.from_now
      )

      session_fixture_path = Rails.root.join("tests", "e2e", "fixtures", "e2e_session.json")
      File.write(session_fixture_path, JSON.pretty_generate({ session_id: invited_session.id.to_s, invite_token: raw_token }))

      group_fixture_path = Rails.root.join("tests", "e2e", "fixtures", "e2e_group.json")
      File.write(group_fixture_path, JSON.pretty_generate({
        group_id: group.id.to_s,
        invite_code: group.invite_code,
        owner_email: alice.email,
        member_email: bob.email,
        session_ids: {
          picking: picking_session.id.to_s,
          invited: invited_session.id.to_s,
          draft: draft_session.id.to_s,
          completed: completed_session.id.to_s,
          cancelled: cancelled_session.id.to_s
        }
      }))

      Rails.logger.info("Seeded e2e fixtures: alice (#{alice.bgg_username}), bob (#{bob.bgg_username}), group #{group.id}, sessions #{[invited_session, picking_session, draft_session, completed_session, cancelled_session].map(&:id).join(", ")}")
    end
  end
end
