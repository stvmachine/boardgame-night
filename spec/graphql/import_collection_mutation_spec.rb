# frozen_string_literal: true

require "rails_helper"

RSpec.describe "importCollection mutation" do
  let(:mutation) do
    <<~GRAPHQL
      mutation ImportCollection($username: String!) {
        importCollection(username: $username) {
          user {
            id
            username
            syncStatus {
              username
              status
              lastSyncedAt
              error
              gameCount
            }
          }
        }
      }
    GRAPHQL
  end

  it "creates a user and returns QUEUED sync status" do
    expect {
      BoardgameNightSchema.execute(mutation, variables: { username: "stevmachine" })
    }.to change(User, :count).by(1)

    user = User.find_by(bgg_username: "stevmachine")
    expect(user).to be_present
    expect(user.username).to eq("stevmachine")
  end

  it "enqueues a Bgg::ImportCollectionJob" do
    expect {
      BoardgameNightSchema.execute(mutation, variables: { username: "stevmachine" })
    }.to have_enqueued_job(Bgg::ImportCollectionJob).with("stevmachine")
  end

  it "rejects a re-import within the 15-minute cooldown window" do
    User.create!(
      username: "stevmachine",
      bgg_username: "stevmachine",
      password: "password",
      last_synced_at: 5.minutes.ago
    )

    result = BoardgameNightSchema.execute(mutation, variables: { username: "stevmachine" })

    expect(result["errors"]).to be_present
    expect(result["errors"].first["message"]).to match(/cooldown/i)
    expect(result["errors"].first["message"]).to match(/\d+ seconds remaining/)
  end

  it "allows import when the last sync was more than 15 minutes ago" do
    User.create!(
      username: "stevmachine",
      bgg_username: "stevmachine",
      password: "password",
      last_synced_at: 20.minutes.ago
    )

    expect {
      BoardgameNightSchema.execute(mutation, variables: { username: "stevmachine" })
    }.to have_enqueued_job(Bgg::ImportCollectionJob).with("stevmachine")
  end

  it "allows import when the user has never been synced" do
    User.create!(
      username: "stevmachine",
      bgg_username: "stevmachine",
      password: "password"
    )

    expect {
      BoardgameNightSchema.execute(mutation, variables: { username: "stevmachine" })
    }.to have_enqueued_job(Bgg::ImportCollectionJob).with("stevmachine")
  end

  it "returns the user with sync status QUEUED" do
    result = BoardgameNightSchema.execute(mutation, variables: { username: "stevmachine" })

    expect(result["errors"]).to be_nil
    user_data = result.dig("data", "importCollection", "user")
    expect(user_data["username"]).to eq("stevmachine")
    expect(user_data["syncStatus"]["status"]).to eq("QUEUED")
    expect(user_data["syncStatus"]["username"]).to eq("stevmachine")
  end

  it "rejects invalid BGG usernames" do
    result = BoardgameNightSchema.execute(mutation, variables: { username: "invalid username!" })

    expect(result["errors"]).to be_present
    expect(result["errors"].first["message"]).to match(/username/)
  end

  it "rejects empty usernames" do
    result = BoardgameNightSchema.execute(mutation, variables: { username: "" })

    expect(result["errors"]).to be_present
  end

  it "uses the existing user when already present" do
    User.create!(username: "stevmachine", bgg_username: "stevmachine", password: "password")

    expect {
      BoardgameNightSchema.execute(mutation, variables: { username: "stevmachine" })
    }.not_to change(User, :count)
  end
end
