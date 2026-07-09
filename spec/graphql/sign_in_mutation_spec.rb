# frozen_string_literal: true

require "rails_helper"

RSpec.describe "signIn mutation" do
  let(:mutation) do
    <<~GRAPHQL
      mutation SignIn($input: SignInInput!) {
        signIn(input: $input) {
          token
          user {
            id
            username
            email
            displayName
          }
        }
      }
    GRAPHQL
  end

  let!(:user) { User.create!(username: "alice", email: "alice@example.com", password: "password123") }

  it "returns a token and user with valid credentials" do
    result = BoardgameNightSchema.execute(mutation, variables: {
      input: { email: "alice@example.com", password: "password123" }
    })
    expect(result["errors"]).to be_nil
    data = result.dig("data", "signIn")
    expect(data["token"]).to be_present
    expect(data["user"]["username"]).to eq("alice")
    expect(data["user"]["email"]).to eq("alice@example.com")
  end

  it "creates a new session on login" do
    expect {
      BoardgameNightSchema.execute(mutation, variables: {
        input: { email: "alice@example.com", password: "password123" }
      })
    }.to change(Session, :count).by(1)
  end

  it "returns an error for an invalid password" do
    result = BoardgameNightSchema.execute(mutation, variables: {
      input: { email: "alice@example.com", password: "wrongpass" }
    })
    expect(result["errors"]).to be_present
    expect(result["errors"].first["message"]).to match(/invalid credentials/i)
  end

  it "returns the same error for a non-existent email (prevent enumeration)" do
    result = BoardgameNightSchema.execute(mutation, variables: {
      input: { email: "nobody@example.com", password: "password123" }
    })
    expect(result["errors"]).to be_present
    expect(result["errors"].first["message"]).to match(/invalid credentials/i)
  end
end