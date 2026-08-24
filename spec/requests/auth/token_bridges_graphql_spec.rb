# frozen_string_literal: true

require "rails_helper"

# The load-bearing guarantee of this migration: the bearer token minted by the
# REST auth endpoints is the same credential that authorizes the GraphQL API.
RSpec.describe "REST token authorizes GraphQL", type: :request do
  let!(:user) do
    User.create!(username: "alex", email: "alex@example.com", password: "password123",
                 bgg_username: "alex_bgg", provisional: false, verified: true)
  end

  it "resolves currentUser on /graphql using a token from POST /sign_in" do
    post "/sign_in", params: { email: "alex@example.com", password: "password123" }
    token = response.parsed_body["token"]
    expect(token).to be_present

    post "/graphql",
         params: { query: "{ currentUser { id email bggUsername } }" },
         headers: { "Authorization" => "Bearer #{token}" }

    expect(response).to have_http_status(:ok)
    data = response.parsed_body.dig("data", "currentUser")
    expect(data).to include("id" => user.id.to_s, "email" => "alex@example.com",
                            "bggUsername" => "alex_bgg")
  end

  it "stops authorizing GraphQL after the session is revoked" do
    session = user.sessions.create!(expires_at: 30.days.from_now)

    delete "/sessions/#{session.id}", headers: { "Authorization" => "Bearer #{session.token}" }
    expect(response).to have_http_status(:no_content)

    post "/graphql",
         params: { query: "{ currentUser { id } }" },
         headers: { "Authorization" => "Bearer #{session.token}" }

    expect(response.parsed_body.dig("data", "currentUser")).to be_nil
  end
end
