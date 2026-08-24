# frozen_string_literal: true

require "rails_helper"

RSpec.describe "REST auth: activity log (trackable)", type: :request do
  let!(:user) do
    User.create!(username: "alex", email: "alex@example.com", password: "password123",
                 provisional: false, verified: true)
  end

  it "records a signed_in event and lists it with request metadata" do
    expect {
      post "/sign_in", params: { email: "alex@example.com", password: "password123" }
    }.to change(user.events, :count).by(1)

    token = response.parsed_body["token"]
    get "/authentications/events", headers: { "Authorization" => "Bearer #{token}" }

    expect(response).to have_http_status(:ok)
    body = response.parsed_body
    expect(body.first).to include("action" => "signed_in")
    expect(body.first).to have_key("ipAddress")
    expect(body.first).to have_key("userAgent")
  end

  it "requires authentication" do
    get "/authentications/events"
    expect(response).to have_http_status(:unauthorized)
  end
end
