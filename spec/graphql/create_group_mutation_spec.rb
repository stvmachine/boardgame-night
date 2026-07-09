# frozen_string_literal: true

require "rails_helper"

RSpec.describe "createGroup mutation" do
  let(:mutation) do
    <<~GRAPHQL
      mutation CreateGroup($name: String!, $description: String) {
        createGroup(name: $name, description: $description) {
          group {
            id
            name
            description
            inviteCode
            myRole
            owner {
              id
              username
            }
            members {
              id
              username
            }
          }
        }
      }
    GRAPHQL
  end

  let(:user) { User.create!(username: "alice", email: "alice@example.com", password: "password") }
  let(:context) { { current_user: user } }

  it "creates a group and makes the caller the owner" do
    expect {
      result = BoardgameNightSchema.execute(mutation, variables: { name: "Night Owls", description: "Fun times" }, context: context)
      expect(result["errors"]).to be_nil
      data = result.dig("data", "createGroup", "group")
      expect(data["name"]).to eq("Night Owls")
      expect(data["description"]).to eq("Fun times")
      expect(data["inviteCode"]).to be_present
      expect(data["myRole"]).to eq("OWNER")
      expect(data["owner"]["username"]).to eq("alice")
      expect(data["members"].map { |m| m["username"] }).to eq(["alice"])
    }.to change(Group, :count).by(1).and change(GroupMembership, :count).by(1)
  end

  it "requires authentication" do
    result = BoardgameNightSchema.execute(mutation, variables: { name: "Night Owls" }, context: {})
    expect(result["errors"]).to be_present
    expect(result["errors"].first["message"]).to match(/Authentication required/i)
  end

  it "returns an error for a blank name" do
    result = BoardgameNightSchema.execute(mutation, variables: { name: "" }, context: context)
    expect(result["errors"]).to be_present
  end

  it "allows description to be omitted" do
    result = BoardgameNightSchema.execute(mutation, variables: { name: "No Description" }, context: context)
    expect(result["errors"]).to be_nil
    data = result.dig("data", "createGroup", "group")
    expect(data["description"]).to be_nil
  end
end
