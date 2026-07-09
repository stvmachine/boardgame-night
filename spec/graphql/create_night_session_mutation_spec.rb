# frozen_string_literal: true

require "rails_helper"

RSpec.describe "createNightSession mutation" do
  let(:mutation) do
    <<~GRAPHQL
      mutation CreateNightSession($title: String!, $groupId: ID!, $scheduledAt: ISO8601DateTime, $location: String, $capacity: Int) {
        createNightSession(title: $title, groupId: $groupId, scheduledAt: $scheduledAt, location: $location, capacity: $capacity) {
          session {
            id
            title
            state
            scheduledAt
            location
            capacity
            host {
              id
              username
            }
            group {
              id
              name
            }
          }
        }
      }
    GRAPHQL
  end

  let(:owner) { User.create!(username: "alice", email: "alice@example.com", password: "password") }
  let(:group) { Group.create!(name: "Night Owls", owner: owner) }
  let(:context) { { current_user: owner } }

  it "creates a session in draft state" do
    expect {
      result = BoardgameNightSchema.execute(
        mutation,
        variables: {
          title: "Friday Games",
          groupId: group.id.to_s,
          scheduledAt: "2026-07-15T19:00:00Z",
          location: "Alice's place",
          capacity: 6
        },
        context: context
      )
      expect(result["errors"]).to be_nil
      data = result.dig("data", "createNightSession", "session")
      expect(data["title"]).to eq("Friday Games")
      expect(data["state"]).to eq("DRAFT")
      expect(data["scheduledAt"]).to eq("2026-07-15T19:00:00Z")
      expect(data["location"]).to eq("Alice's place")
      expect(data["capacity"]).to eq(6)
      expect(data["host"]["username"]).to eq("alice")
      expect(data["group"]["name"]).to eq("Night Owls")
    }.to change(NightSession, :count).by(1)
  end

  it "requires authentication" do
    result = BoardgameNightSchema.execute(
      mutation,
      variables: { title: "Friday Games", groupId: group.id.to_s },
      context: {}
    )
    expect(result["errors"]).to be_present
    expect(result["errors"].first["message"]).to match(/Authentication required/i)
  end

  it "requires caller to be owner or admin of the group" do
    member = User.create!(username: "bob", email: "bob@example.com", password: "password")
    GroupMembership.create!(user: member, group: group, role: "member")

    result = BoardgameNightSchema.execute(
      mutation,
      variables: { title: "Friday Games", groupId: group.id.to_s },
      context: { current_user: member }
    )
    expect(result["errors"]).to be_present
    expect(result["errors"].first["message"]).to match(/must be an owner or admin/i)
  end

  it "returns a validation error for a blank title" do
    result = BoardgameNightSchema.execute(
      mutation,
      variables: { title: "", groupId: group.id.to_s },
      context: context
    )
    expect(result["errors"]).to be_present
  end

  it "allows optional fields to be omitted" do
    result = BoardgameNightSchema.execute(
      mutation,
      variables: { title: "Casual Night", groupId: group.id.to_s },
      context: context
    )
    expect(result["errors"]).to be_nil
    data = result.dig("data", "createNightSession", "session")
    expect(data["title"]).to eq("Casual Night")
    expect(data["state"]).to eq("DRAFT")
    expect(data["scheduledAt"]).to be_nil
    expect(data["location"]).to be_nil
    expect(data["capacity"]).to be_nil
  end
end
