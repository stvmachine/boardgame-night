# frozen_string_literal: true

require "rails_helper"

RSpec.describe "bindBggUsername mutation" do
  let(:mutation) do
    <<~GRAPHQL
      mutation BindBggUsername($username: String!) {
        bindBggUsername(username: $username) {
          user {
            id
            username
            bggUsername
          }
        }
      }
    GRAPHQL
  end

  let!(:user) { User.create!(username: "carol", email: "carol@example.com", password: "password123") }
  let!(:session) { Session.create!(user: user, expires_at: 30.days.from_now) }
  let(:context) { { current_user: user, current_session: session } }
  let(:valid_vars) { { username: "stevmachine" } }

  before do
    # Stub Bgg::Client#user to return a Nokogiri node indicating the user exists
    xml = Nokogiri::XML(%(<user id="12345"><name>stevmachine</name></user>))
    bgg_client = instance_double(Bgg::Client)
    allow(bgg_client).to receive(:user).with("stevmachine").and_return(xml)
    allow(Bgg::Client).to receive(:new).and_return(bgg_client)
  end

  it "binds a valid BGG username to the user" do
    expect {
      result = BoardgameNightSchema.execute(mutation, variables: valid_vars, context: context)
      expect(result["errors"]).to be_nil
      expect(result.dig("data", "bindBggUsername", "user", "bggUsername")).to eq("stevmachine")
    }.to change { user.reload.bgg_username }.from(nil).to("stevmachine")
  end

  it "returns an error when not authenticated" do
    result = BoardgameNightSchema.execute(mutation, variables: valid_vars,
      context: { current_user: nil, current_session: nil })
    expect(result["errors"]).to be_present
    expect(result["errors"].first["message"]).to match(/authentication required/i)
  end

  it "returns an error when BGG user does not exist" do
    xml = Nokogiri::XML(%(<user id=""></user>))
    bgg_client = instance_double(Bgg::Client)
    allow(bgg_client).to receive(:user).with("nobodybgg").and_return(xml)
    allow(Bgg::Client).to receive(:new).and_return(bgg_client)

    result = BoardgameNightSchema.execute(mutation, variables: { username: "nobodybgg" },
      context: context)
    expect(result["errors"]).to be_present
    expect(result["errors"].first["message"]).to match(/bgg user not found/i)
  end

  it "returns an error for an invalid username format" do
    result = BoardgameNightSchema.execute(mutation, variables: { username: "invalid name!" },
      context: context)
    expect(result["errors"]).to be_present
  end
end