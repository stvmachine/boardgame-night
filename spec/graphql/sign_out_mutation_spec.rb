# frozen_string_literal: true

require "rails_helper"

RSpec.describe "signOut mutation" do
  let(:mutation) do
    <<~GRAPHQL
      mutation {
        signOut {
          success
        }
      }
    GRAPHQL
  end

  let!(:user) { User.create!(username: "bob", email: "bob@example.com", password: "password123") }
  let!(:session) { Session.create!(user: user, expires_at: 30.days.from_now) }

  it "destroys the current session" do
    expect {
      result = BoardgameNightSchema.execute(mutation, context: {
        current_user: user, current_session: session
      })
      expect(result["errors"]).to be_nil
      expect(result.dig("data", "signOut", "success")).to be true
    }.to change(Session, :count).by(-1)
  end

  it "returns an error when not authenticated" do
    result = BoardgameNightSchema.execute(mutation, context: {
      current_user: nil, current_session: nil
    })
    expect(result["errors"]).to be_present
    expect(result["errors"].first["message"]).to match(/authentication required/i)
  end
end