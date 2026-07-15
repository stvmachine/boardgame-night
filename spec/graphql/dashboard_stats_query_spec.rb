# frozen_string_literal: true

require "rails_helper"

RSpec.describe "dashboardStats query" do
  let(:alice) { User.create!(username: "alice", bgg_username: "bggalice", password: "password") }
  let(:bob) { User.create!(username: "bob", bgg_username: "bggbob", password: "password") }
  let(:carol) { User.create!(username: "carol", bgg_username: "bggcarol", password: "password") }

  let(:base_game) { BggThing.create!(objectid: 1, name: "Base Game") }
  let(:expansion) { BggThing.create!(objectid: 2, name: "Expansion") }

  let!(:group) do
    Group.create!(name: "Night Owls", owner: alice).tap do |g|
      GroupMembership.create!(user: alice, group: g, role: "owner")
      GroupMembership.create!(user: bob, group: g, role: "member")
    end
  end

  let!(:other_group) do
    Group.create!(name: "Other Group", owner: bob).tap do |g|
      GroupMembership.create!(user: bob, group: g, role: "owner")
    end
  end

  def run_query(context = {})
    query = <<~GRAPHQL
      query {
        dashboardStats {
          collectionCount
          groupCount
          sessionCount
        }
      }
    GRAPHQL
    BoardgameNightSchema.execute(query, context: context)
  end

  it "returns null when signed out" do
    result = run_query({})

    expect(result["errors"]).to be_nil
    expect(result.dig("data", "dashboardStats")).to be_nil
  end

  it "counts all distinct games including expansions" do
    BggCollection.create!(user: alice, bgg_thing: base_game)
    BggCollection.create!(user: alice, bgg_thing: expansion)

    result = run_query({ current_user: alice })

    expect(result.dig("data", "dashboardStats", "collectionCount")).to eq(2)
  end

  it "deduplicates duplicate collection rows" do
    BggCollection.create!(user: alice, bgg_thing: base_game)

    result = run_query({ current_user: alice })

    expect(result.dig("data", "dashboardStats", "collectionCount")).to eq(1)
  end

  it "counts distinct owned and membership groups" do
    result = run_query({ current_user: alice })

    expect(result.dig("data", "dashboardStats", "groupCount")).to eq(1)
  end

  it "includes owned groups even without a membership" do
    # bob is owner of other_group and a member of group
    result = run_query({ current_user: bob })

    expect(result.dig("data", "dashboardStats", "groupCount")).to eq(2)
  end

  it "counts distinct non-cancelled hosted or going sessions" do
    hosted_session = NightSession.create!(title: "Hosted", group: group, host: alice, state: "invited", time_budget_minutes: 60)
    going_session = NightSession.create!(title: "Going", group: group, host: bob, state: "invited", time_budget_minutes: 60)
    Attendance.create!(night_session: going_session, user: alice, response: "going")
    not_going_session = NightSession.create!(title: "Not Going", group: group, host: bob, state: "invited", time_budget_minutes: 60)
    Attendance.create!(night_session: not_going_session, user: alice, response: "not_going")
    cancelled_session = NightSession.create!(title: "Cancelled", group: group, host: alice, state: "cancelled", time_budget_minutes: 60)

    result = run_query({ current_user: alice })

    expect(result.dig("data", "dashboardStats", "sessionCount")).to eq(2)
  end

  it "does not leak data across users" do
    BggCollection.create!(user: alice, bgg_thing: base_game)
    Group.create!(name: "Carol Group", owner: carol)
    NightSession.create!(title: "Carol Session", group: other_group, host: carol, state: "invited", time_budget_minutes: 60)

    result = run_query({ current_user: alice })

    stats = result.dig("data", "dashboardStats")
    expect(stats["collectionCount"]).to eq(1)
    expect(stats["groupCount"]).to eq(1)
    expect(stats["sessionCount"]).to eq(0)
  end
end
