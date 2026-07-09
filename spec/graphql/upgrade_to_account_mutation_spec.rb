# frozen_string_literal: true

require "rails_helper"

RSpec.describe "upgradeToAccount mutation" do
  let(:mutation) do
    <<~GRAPHQL
      mutation UpgradeToAccount($email: String!, $password: String!, $bggUsername: String) {
        upgradeToAccount(email: $email, password: $password, bggUsername: $bggUsername) {
          token
          user {
            id
            username
            email
            isProvisional
          }
        }
      }
    GRAPHQL
  end

  let(:provisional_user) do
    User.create!(
      username: "guest_abcdef",
      email: "guest@example.com",
      password: SecureRandom.hex(16),
      provisional: true
    )
  end

  it "converts a provisional user to a full account" do
    result = BoardgameNightSchema.execute(
      mutation,
      variables: { email: "new@example.com", password: "password123", bggUsername: "newbgg" },
      context: { current_user: provisional_user }
    )
    expect(result["errors"]).to be_nil
    data = result.dig("data", "upgradeToAccount")
    expect(data["token"]).to be_present
    expect(data["user"]["email"]).to eq("new@example.com")
    expect(data["user"]["isProvisional"]).to be false

    provisional_user.reload
    expect(provisional_user.provisional?).to be false
    expect(provisional_user.email).to eq("new@example.com")
    expect(provisional_user.authenticate("password123")).to eq(provisional_user)
  end

  it "requires authentication" do
    result = BoardgameNightSchema.execute(
      mutation,
      variables: { email: "new@example.com", password: "password123" },
      context: {}
    )
    expect(result["errors"]).to be_present
    expect(result["errors"].first["message"]).to match(/Authentication required/i)
  end

  it "rejects an already-full account" do
    full_user = User.create!(username: "full", email: "full@example.com", password: "password", provisional: false)

    result = BoardgameNightSchema.execute(
      mutation,
      variables: { email: "new@example.com", password: "password123" },
      context: { current_user: full_user }
    )
    expect(result["errors"]).to be_present
    expect(result["errors"].first["message"]).to match(/Account already exists/i)
  end

  it "returns a validation error for a short password" do
    result = BoardgameNightSchema.execute(
      mutation,
      variables: { email: "new@example.com", password: "short" },
      context: { current_user: provisional_user }
    )
    expect(result["errors"]).to be_present
  end
end
