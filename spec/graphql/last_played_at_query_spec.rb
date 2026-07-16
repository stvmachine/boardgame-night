# frozen_string_literal: true

require "rails_helper"

RSpec.describe "lastPlayedAt scope isolation" do
  let(:alice) { User.create!(username: "alice", bgg_username: "bggalice", password: "password") }
  let(:bob) { User.create!(username: "bob", bgg_username: "bggbob", password: "password") }
  let(:member) { User.create!(username: "member", bgg_username: "bggmember", password: "password") }
  let(:outsider) { User.create!(username: "outsider", bgg_username: "bggoutsider", password: "password") }
  let(:group) { Group.create!(name: "Night Owls", owner: alice) }
  let(:other_group) { Group.create!(name: "Other Group", owner: alice) }
  let(:thing) { BggThing.create!(objectid: 1, name: "Game A") }

  before do
    GroupMembership.create!(user: alice, group: group, role: "owner")
    GroupMembership.create!(user: member, group: group, role: "member")
    GroupMembership.create!(user: alice, group: other_group, role: "owner")
    BggCollection.create!(user: alice, bgg_thing: thing)
    BggCollection.create!(user: member, bgg_thing: thing)
  end

  let(:isolated_query) do
    <<~GRAPHQL
      query {
        mergedCollection(usernames: ["bggalice"]) {
          items {
            id
            name
            objectid
            lastPlayedAt
          }
        }
        group(token: "#{group.invite_code}") {
          collection {
            items {
              id
              name
              objectid
              lastPlayedAt
            }
          }
        }
      }
    GRAPHQL
  end

  it "keeps merged and group scopes isolated in one operation" do
    user_session_date = Time.new(2026, 7, 10, 12, 0, 0, "+00:00")
    group_session_date = Time.new(2026, 7, 5, 12, 0, 0, "+00:00")

    NightSession.create!(group: other_group, host: alice, title: "User Scope Session", state: "completed", picked_game: thing, scheduled_at: user_session_date)
    NightSession.create!(group: group, host: alice, title: "Group Scope Session", state: "completed", picked_game: thing, scheduled_at: group_session_date)

    result = BoardgameNightSchema.execute(isolated_query, context: { current_user: alice })

    expect(result["errors"]).to be_nil
    merged_items = result.dig("data", "mergedCollection", "items")
    group_items = result.dig("data", "group", "collection", "items")

    expect(merged_items.size).to eq(1)
    expect(group_items.size).to eq(1)

    expect(merged_items.first["objectid"]).to eq("1")
    expect(group_items.first["objectid"]).to eq("1")
    expect(merged_items.first["lastPlayedAt"]).to eq("2026-07-10T12:00:00Z")
    expect(group_items.first["lastPlayedAt"]).to eq("2026-07-05T12:00:00Z")
  end

  it "keeps scoped dates isolated across schema multiplex" do
    user_session_date = Time.new(2026, 7, 10, 12, 0, 0, "+00:00")
    group_session_date = Time.new(2026, 7, 5, 12, 0, 0, "+00:00")

    NightSession.create!(group: other_group, host: alice, title: "User Scope Session", state: "completed", picked_game: thing, scheduled_at: user_session_date)
    NightSession.create!(group: group, host: alice, title: "Group Scope Session", state: "completed", picked_game: thing, scheduled_at: group_session_date)

    queries = [
      {
        query: "query { mergedCollection(usernames: [\"bggalice\"]) { items { id objectid lastPlayedAt } } }",
        context: { current_user: alice }
      },
      {
        query: "query { group(token: \"#{group.invite_code}\") { collection { items { id objectid lastPlayedAt } } } }",
        context: { current_user: member }
      }
    ]

    results = BoardgameNightSchema.multiplex(queries)

    expect(results).to be_an(Array)
    expect(results.size).to eq(2)

    merged_result = results[0]
    group_result = results[1]

    expect(merged_result["errors"]).to be_nil
    expect(group_result["errors"]).to be_nil

    expect(merged_result.dig("data", "mergedCollection", "items").first["lastPlayedAt"]).to eq("2026-07-10T12:00:00Z")
    expect(group_result.dig("data", "group", "collection", "items").first["lastPlayedAt"]).to eq("2026-07-05T12:00:00Z")
  end

  it "returns null lastPlayedAt for anonymous merged history" do
    NightSession.create!(group: other_group, host: alice, title: "User Scope Session", state: "completed", picked_game: thing, scheduled_at: Time.now)

    result = BoardgameNightSchema.execute(isolated_query)

    expect(result["errors"]).to be_nil
    merged_items = result.dig("data", "mergedCollection", "items")
    expect(merged_items.first["objectid"]).to eq("1")
    expect(merged_items.first["lastPlayedAt"]).to be_nil
  end

  it "returns an empty collection for outsiders with no history leakage" do
    result = BoardgameNightSchema.execute(
      <<~GRAPHQL,
        query {
          group(token: "#{group.invite_code}") {
            collection {
              items {
                id
                lastPlayedAt
              }
            }
          }
        }
      GRAPHQL
      context: { current_user: outsider }
    )

    expect(result["errors"]).to be_nil
    expect(result.dig("data", "group", "collection", "items")).to be_empty
  end

  it "excludes cancelled sessions from lastPlayedAt" do
    cancelled_date = Time.new(2026, 7, 10, 12, 0, 0, "+00:00")
    completed_date = Time.new(2026, 7, 8, 12, 0, 0, "+00:00")

    NightSession.create!(group: other_group, host: alice, title: "Cancelled", state: "cancelled", picked_game: thing, scheduled_at: cancelled_date)
    NightSession.create!(group: other_group, host: alice, title: "Completed", state: "completed", picked_game: thing, scheduled_at: completed_date)

    result = BoardgameNightSchema.execute(
      <<~GRAPHQL,
        query {
          mergedCollection(usernames: ["bggalice"]) {
            items { id lastPlayedAt }
          }
        }
      GRAPHQL
      context: { current_user: alice }
    )

    expect(result["errors"]).to be_nil
    expect(result.dig("data", "mergedCollection", "items").first["lastPlayedAt"]).to eq("2026-07-08T12:00:00Z")
  end

  it "does not increase last-played SQL count with item count" do
    5.times do |i|
      game = BggThing.create!(objectid: 100 + i, name: "Game #{i}")
      BggCollection.create!(user: alice, bgg_thing: game)
      NightSession.create!(group: other_group, host: alice, title: "Session #{i}", state: "completed", picked_game: game, scheduled_at: Time.now - i.days)
    end

    query = <<~GRAPHQL
      query {
        mergedCollection(usernames: ["bggalice"]) {
          items { id lastPlayedAt }
        }
      }
    GRAPHQL

    queries = 0
    subscriber = ActiveSupport::Notifications.subscribe("sql.active_record") { |*args| queries += 1 }

    result = BoardgameNightSchema.execute(query, context: { current_user: alice })

    ActiveSupport::Notifications.unsubscribe(subscriber)

    expect(result["errors"]).to be_nil
    expect(result.dig("data", "mergedCollection", "items").size).to eq(6)
    expect(queries).to be <= 8
  end

  it "does not call any BGG client method when resolving lastPlayedAt" do
    expect_any_instance_of(Bgg::Client).not_to receive(:hot)
    expect_any_instance_of(Bgg::Client).not_to receive(:thing)
    expect_any_instance_of(Bgg::Client).not_to receive(:collection)
    expect_any_instance_of(Bgg::Client).not_to receive(:search)

    NightSession.create!(group: other_group, host: alice, title: "Session", state: "completed", picked_game: thing, scheduled_at: Time.now)

    result = BoardgameNightSchema.execute(
      <<~GRAPHQL,
        query {
          mergedCollection(usernames: ["bggalice"]) {
            items { id lastPlayedAt }
          }
        }
      GRAPHQL
      context: { current_user: alice }
    )

    expect(result["errors"]).to be_nil
    expect(result.dig("data", "mergedCollection", "items").first["lastPlayedAt"]).to be_present
  end
end
