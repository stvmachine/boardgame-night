# frozen_string_literal: true

require "rails_helper"

RSpec.describe "signUp mutation" do
  let(:mutation) do
    <<~GRAPHQL
      mutation SignUp($email: String!, $password: String!, $username: String!) {
        signUp(email: $email, password: $password, username: $username) {
          token
          user {
            id
            username
            email
            isProvisional
            displayName
          }
        }
      }
    GRAPHQL
  end

  let(:valid_variables) do
    { email: "newuser@example.com", password: "securepass", username: "newuser" }
  end

  it "creates a non-provisional user and a session, returns a token" do
    expect {
      result = BoardgameNightSchema.execute(mutation, variables: valid_variables)
      expect(result["errors"]).to be_nil
      data = result.dig("data", "signUp")
      expect(data["token"]).to be_present
      expect(data["user"]["username"]).to eq("newuser")
      expect(data["user"]["email"]).to eq("newuser@example.com")
      expect(data["user"]["isProvisional"]).to be false
      expect(data["user"]["displayName"]).to eq("newuser@example.com")
    }.to change(User, :count).by(1).and change(Session, :count).by(1)

    user = User.find_by(username: "newuser")
    expect(user.provisional).to be false
    expect(user.sessions).not_to be_empty
  end

  it "returns an error for a duplicate email" do
    User.create!(username: "existing", email: "newuser@example.com", password: "password")

    result = BoardgameNightSchema.execute(mutation, variables: valid_variables)
    expect(result["errors"]).to be_present
  end

  it "returns an error for a duplicate username" do
    User.create!(username: "newuser", email: "other@example.com", password: "password")

    result = BoardgameNightSchema.execute(mutation, variables: valid_variables)
    expect(result["errors"]).to be_present
  end

  it "returns an error for a short password" do
    result = BoardgameNightSchema.execute(mutation, variables: {
      email: "short@example.com", password: "short", username: "shortuser"
    })
    expect(result["errors"]).to be_present
  end
end