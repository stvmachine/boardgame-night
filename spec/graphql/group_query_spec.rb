# frozen_string_literal: true

require "rails_helper"

RSpec.describe "group query" do
  let(:query) do
    <<~GRAPHQL
      query Group($token: String!) {
        group(token: $token) {
          id
          name
          inviteCode
          description
          myRole
          collection {
            items {
              id
              name
              owners {
                bggUsername
              }
            }
            syncStatuses {
              username
              status
              gameCount
            }
          }
          members {
            id
            username
            displayName
          }
          owner {
            id
            username
          }
          sessions {
            id
            title
            state
            scheduledAt
            attendeeCount
            attendances {
              id
              response
              user {
                id
              }
            }
          }
        }
      }
    GRAPHQL
  end

  let(:owner) { User.create!(username: "owner", email: "owner@example.com", password: "password") }
  let(:admin) { User.create!(username: "admin", email: "admin@example.com", password: "password") }
  let(:member) { User.create!(username: "member", email: "member@example.com", password: "password") }
  let(:outsider) { User.create!(username: "outsider", email: "outsider@example.com", password: "password") }
  let(:group) { Group.create!(name: "Night Owls", owner: owner) }

  before do
    GroupMembership.create!(user: owner, group: group, role: "owner")
    GroupMembership.create!(user: admin, group: group, role: "admin")
    GroupMembership.create!(user: member, group: group, role: "member")
  end

  it "returns a group by invite_code" do
    result = BoardgameNightSchema.execute(query, variables: { token: group.invite_code }, context: { current_user: owner })
    expect(result["errors"]).to be_nil
    data = result.dig("data", "group")
    expect(data["name"]).to eq("Night Owls")
    expect(data["inviteCode"]).to eq(group.invite_code)
  end

  it "returns the merged collection for members" do
    thing = BggThing.create!(objectid: "12345", name: "Catan")
    BggCollection.create!(user: owner, bgg_thing: thing, quantity: 1)

    result = BoardgameNightSchema.execute(query, variables: { token: group.invite_code }, context: { current_user: owner })
    expect(result["errors"]).to be_nil
    data = result.dig("data", "group")
    expect(data["collection"]["items"].map { |i| i["name"] }).to eq([ "Catan" ])
    expect(data["collection"]["syncStatuses"]).to be_present
  end

  it "returns no collection for outsiders" do
    thing = BggThing.create!(objectid: "12345", name: "Catan")
    BggCollection.create!(user: owner, bgg_thing: thing, quantity: 1)

    result = BoardgameNightSchema.execute(query, variables: { token: group.invite_code }, context: { current_user: outsider })
    expect(result["errors"]).to be_nil
    data = result.dig("data", "group")
    expect(data["collection"]["items"]).to eq([])
    expect(data["collection"]["syncStatuses"]).to eq([])
  end

  it "returns myRole for a member" do
    result = BoardgameNightSchema.execute(query, variables: { token: group.invite_code }, context: { current_user: owner })
    expect(result.dig("data", "group", "myRole")).to eq("OWNER")
  end

  it "returns null for non-members looking up by an unknown token" do
    result = BoardgameNightSchema.execute(query, variables: { token: "unknown-token" }, context: { current_user: member })
    expect(result["errors"]).to be_nil
    expect(result.dig("data", "group")).to be_nil
  end

  describe "sessions" do
    let!(:picking_session) do
      NightSession.create!(group: group, host: owner, title: "Picking", state: "picking", scheduled_at: 2.days.from_now)
    end
    let!(:invited_later) do
      NightSession.create!(group: group, host: owner, title: "Invited Later", state: "invited", scheduled_at: 2.days.from_now)
    end
    let!(:invited_earlier) do
      NightSession.create!(group: group, host: owner, title: "Invited Earlier", state: "invited", scheduled_at: 6.hours.from_now)
    end
    let!(:dated_draft) do
      NightSession.create!(group: group, host: owner, title: "Dated Draft", state: "draft", scheduled_at: 3.days.from_now)
    end
    let!(:undated_draft) do
      NightSession.create!(group: group, host: owner, title: "Undated Draft", state: "draft", scheduled_at: nil)
    end
    let!(:completed_session) do
      NightSession.create!(group: group, host: owner, title: "Completed", state: "completed", scheduled_at: 1.day.from_now)
    end
    let!(:cancelled_session) do
      NightSession.create!(group: group, host: owner, title: "Cancelled", state: "cancelled", scheduled_at: 1.day.from_now)
    end

    def session_ids(result)
      result.dig("data", "group", "sessions").map { |s| s["id"] }
    end

    it "returns sessions in the expected order for owners" do
      result = BoardgameNightSchema.execute(query, variables: { token: group.invite_code }, context: { current_user: owner })
      expect(result["errors"]).to be_nil
      expect(session_ids(result)).to eq([
        picking_session.id.to_s,
        invited_earlier.id.to_s,
        invited_later.id.to_s,
        dated_draft.id.to_s,
        undated_draft.id.to_s
      ])
    end

    it "returns the same order for admins" do
      result = BoardgameNightSchema.execute(query, variables: { token: group.invite_code }, context: { current_user: admin })
      expect(result["errors"]).to be_nil
      expect(session_ids(result)).to eq([
        picking_session.id.to_s,
        invited_earlier.id.to_s,
        invited_later.id.to_s,
        dated_draft.id.to_s,
        undated_draft.id.to_s
      ])
    end

    it "hides draft sessions from ordinary members" do
      result = BoardgameNightSchema.execute(query, variables: { token: group.invite_code }, context: { current_user: member })
      expect(result["errors"]).to be_nil
      expect(session_ids(result)).to eq([
        picking_session.id.to_s,
        invited_earlier.id.to_s,
        invited_later.id.to_s
      ])
    end

    it "returns no sessions for outsiders even with a valid invite code" do
      result = BoardgameNightSchema.execute(query, variables: { token: group.invite_code }, context: { current_user: outsider })
      expect(result["errors"]).to be_nil
      expect(result.dig("data", "group", "sessions")).to eq([])
    end

    it "excludes completed and cancelled sessions from everyone" do
      result = BoardgameNightSchema.execute(query, variables: { token: group.invite_code }, context: { current_user: owner })
      returned_ids = session_ids(result)
      expect(returned_ids).not_to include(completed_session.id.to_s)
      expect(returned_ids).not_to include(cancelled_session.id.to_s)
    end

    it "preserves nil scheduledAt for undated drafts" do
      result = BoardgameNightSchema.execute(query, variables: { token: group.invite_code }, context: { current_user: owner })
      undated = result.dig("data", "group", "sessions").find { |s| s["id"] == undated_draft.id.to_s }
      expect(undated["scheduledAt"]).to be_nil
    end

    it "counts only confirmed-going attendees" do
      going_user = User.create!(username: "going", email: "going@example.com", password: "password")
      not_going_user = User.create!(username: "notgoing", email: "notgoing@example.com", password: "password")
      GroupMembership.create!(user: going_user, group: group, role: "member")
      GroupMembership.create!(user: not_going_user, group: group, role: "member")

      Attendance.create!(night_session: picking_session, user: going_user, response: "going")
      Attendance.create!(night_session: picking_session, user: not_going_user, response: "not_going")

      result = BoardgameNightSchema.execute(query, variables: { token: group.invite_code }, context: { current_user: owner })
      session = result.dig("data", "group", "sessions").find { |s| s["id"] == picking_session.id.to_s }
      expect(session["attendeeCount"]).to eq(1)
    end

    it "does not produce N+1 queries for sessions and attendances" do
      sessions_query = <<~GRAPHQL
        query Group($token: String!) {
          group(token: $token) {
            id
            myRole
            sessions {
              id
              title
              state
              scheduledAt
              attendeeCount
              attendances {
                id
                response
                user { id }
              }
            }
          }
        }
      GRAPHQL

      3.times do |i|
        user = User.create!(username: "attendee#{i}", email: "attendee#{i}@example.com", password: "password")
        GroupMembership.create!(user: user, group: group, role: "member")
        session = NightSession.create!(group: group, host: owner, title: "Session #{i}", state: "invited", scheduled_at: (i + 1).days.from_now)
        Attendance.create!(night_session: session, user: user, response: "going")
      end

      queries = 0
      subscriber = ActiveSupport::Notifications.subscribe("sql.active_record") { |*args| queries += 1 }

      result = BoardgameNightSchema.execute(sessions_query, variables: { token: group.invite_code }, context: { current_user: owner })

      ActiveSupport::Notifications.unsubscribe(subscriber)

      expect(result["errors"]).to be_nil
      expect(result.dig("data", "group", "sessions").size).to be >= 3
      expect(queries).to be <= 10
    end
  end

  describe "collectionSpotlight" do
    let(:spotlight_query) do
      <<~GRAPHQL
        query GroupSpotlight($token: String!, $limit: Int) {
          group(token: $token) {
            id
            collectionSpotlight(limit: $limit) {
              id
              objectid
              name
              thumbnail
              average
              owners { bggUsername }
            }
          }
        }
      GRAPHQL
    end

    def spotlight(result)
      result.dig("data", "group", "collectionSpotlight")
    end

    it "orders multi-owner games before single-owner games" do
      multi = BggThing.create!(objectid: "100", name: "Shared Game", average: 7.0)
      single = BggThing.create!(objectid: "101", name: "Solo Game", average: 8.5)
      BggCollection.create!(user: owner, bgg_thing: multi, quantity: 1)
      BggCollection.create!(user: admin, bgg_thing: multi, quantity: 1)
      BggCollection.create!(user: owner, bgg_thing: single, quantity: 1)

      result = BoardgameNightSchema.execute(spotlight_query, variables: { token: group.invite_code, limit: 4 }, context: { current_user: owner })
      expect(result["errors"]).to be_nil
      names = spotlight(result).map { |g| g["name"] }
      expect(names).to eq([ "Shared Game", "Solo Game" ])
    end

    it "breaks ties by average descending, then name case-insensitive ascending, then id ascending" do
      game_a = BggThing.create!(objectid: "200", name: "Alpha", average: 8.5)
      game_b = BggThing.create!(objectid: "201", name: "beta", average: 8.5)
      game_c = BggThing.create!(objectid: "202", name: "Gamma", average: 7.0)
      BggCollection.create!(user: owner, bgg_thing: game_a, quantity: 1)
      BggCollection.create!(user: owner, bgg_thing: game_b, quantity: 1)
      BggCollection.create!(user: owner, bgg_thing: game_c, quantity: 1)

      result = BoardgameNightSchema.execute(spotlight_query, variables: { token: group.invite_code, limit: 4 }, context: { current_user: owner })
      expect(result["errors"]).to be_nil
      names = spotlight(result).map { |g| g["name"] }
      expect(names).to eq([ "Alpha", "beta", "Gamma" ])
    end

    it "returns at most four items" do
      5.times do |i|
        game = BggThing.create!(objectid: "300#{i}", name: "Game #{i}", average: 8.0 - i)
        BggCollection.create!(user: owner, bgg_thing: game, quantity: 1)
      end

      result = BoardgameNightSchema.execute(spotlight_query, variables: { token: group.invite_code, limit: 4 }, context: { current_user: owner })
      expect(result["errors"]).to be_nil
      expect(spotlight(result).size).to eq(4)
    end

    it "fills remaining slots with single-owner games when fewer than four multi-owner games exist" do
      multi = BggThing.create!(objectid: "400", name: "Multi Owner", average: 9.0)
      single_a = BggThing.create!(objectid: "401", name: "Single A", average: 8.0)
      single_b = BggThing.create!(objectid: "402", name: "Single B", average: 7.0)
      single_c = BggThing.create!(objectid: "403", name: "Single C", average: 6.0)
      BggCollection.create!(user: owner, bgg_thing: multi, quantity: 1)
      BggCollection.create!(user: admin, bgg_thing: multi, quantity: 1)
      [ single_a, single_b, single_c ].each do |game|
        BggCollection.create!(user: owner, bgg_thing: game, quantity: 1)
      end

      result = BoardgameNightSchema.execute(spotlight_query, variables: { token: group.invite_code, limit: 4 }, context: { current_user: owner })
      expect(result["errors"]).to be_nil
      names = spotlight(result).map { |g| g["name"] }
      expect(names).to eq([ "Multi Owner", "Single A", "Single B", "Single C" ])
    end

    it "returns an empty array when the group collection is empty" do
      result = BoardgameNightSchema.execute(spotlight_query, variables: { token: group.invite_code, limit: 4 }, context: { current_user: owner })
      expect(result["errors"]).to be_nil
      expect(spotlight(result)).to eq([])
    end

    it "clamps limits below 1 to 1" do
      game = BggThing.create!(objectid: "500", name: "Only Game", average: 8.0)
      BggCollection.create!(user: owner, bgg_thing: game, quantity: 1)

      result = BoardgameNightSchema.execute(spotlight_query, variables: { token: group.invite_code, limit: 0 }, context: { current_user: owner })
      expect(result["errors"]).to be_nil
      expect(spotlight(result).size).to eq(1)
      expect(spotlight(result).first["name"]).to eq("Only Game")
    end

    it "clamps limits above 12 to 12" do
      15.times do |i|
        game = BggThing.create!(objectid: "600#{i}", name: "Filler #{i}", average: 8.0 - (i / 100.0))
        BggCollection.create!(user: owner, bgg_thing: game, quantity: 1)
      end

      result = BoardgameNightSchema.execute(spotlight_query, variables: { token: group.invite_code, limit: 100 }, context: { current_user: owner })
      expect(result["errors"]).to be_nil
      expect(spotlight(result).size).to eq(12)
    end

    it "returns no spotlight for outsiders" do
      game = BggThing.create!(objectid: "700", name: "Secret Game", average: 8.0)
      BggCollection.create!(user: owner, bgg_thing: game, quantity: 1)

      result = BoardgameNightSchema.execute(spotlight_query, variables: { token: group.invite_code, limit: 4 }, context: { current_user: outsider })
      expect(result["errors"]).to be_nil
      expect(spotlight(result)).to eq([])
    end

    it "returns objectid (BGG numeric id) distinct from DB auto-increment id" do
      game = BggThing.create!(objectid: 99_999, name: "BGG Game", average: 7.0)
      BggCollection.create!(user: owner, bgg_thing: game, quantity: 1)

      result = BoardgameNightSchema.execute(spotlight_query, variables: { token: group.invite_code, limit: 4 }, context: { current_user: owner })
      expect(result["errors"]).to be_nil
      entry = spotlight(result).first
      expect(entry["objectid"]).to eq("99999")
      expect(entry["id"]).not_to eq("99999")
    end

    it "excludes out-of-group owners from spotlight attribution" do
      out_group_user = User.create!(username: "outsider_owner", email: "outsider_owner@example.com", password: "password")
      game = BggThing.create!(objectid: "800", name: "Cross-Group Game", average: 8.0)
      BggCollection.create!(user: owner, bgg_thing: game, quantity: 1)
      BggCollection.create!(user: out_group_user, bgg_thing: game, quantity: 1)

      result = BoardgameNightSchema.execute(spotlight_query, variables: { token: group.invite_code, limit: 4 }, context: { current_user: owner })
      expect(result["errors"]).to be_nil
      owners = spotlight(result).first["owners"].map { |o| o["bggUsername"] }
      expect(owners).to contain_exactly("owner")
      expect(owners).not_to include("outsider_owner")
    end
  end
end
