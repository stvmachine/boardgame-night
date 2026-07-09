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
        }
      }
    GRAPHQL
  end

  let(:owner) { User.create!(username: "owner", email: "owner@example.com", password: "password") }
  let(:member) { User.create!(username: "member", email: "member@example.com", password: "password") }
  let(:group) { Group.create!(name: "Night Owls", owner: owner) }

  before do
    GroupMembership.create!(user: owner, group: group, role: "owner")
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
    expect(data["collection"]["items"].map { |i| i["name"] }).to eq(["Catan"])
    expect(data["collection"]["syncStatuses"]).to be_present
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
end
