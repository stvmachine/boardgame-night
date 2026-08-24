# frozen_string_literal: true

require "rails_helper"

RSpec.describe "REST auth: sessions", type: :request do
  let!(:user) do
    User.create!(username: "alex", email: "alex@example.com", password: "password123",
                 bgg_username: "alex_bgg", provisional: false, verified: true)
  end

  describe "POST /sign_in" do
    it "returns a token + user for valid credentials and creates a session" do
      expect {
        post "/sign_in", params: { email: "alex@example.com", password: "password123" }
      }.to change(user.sessions, :count).by(1)

      expect(response).to have_http_status(:created)
      body = response.parsed_body
      expect(body["token"]).to be_present
      expect(body["sessionId"]).to be_present
      expect(body["user"]).to include("id" => user.id.to_s, "email" => "alex@example.com",
                                      "bggUsername" => "alex_bgg", "isProvisional" => false)
      expect(body["user"]).not_to have_key("password_digest")
    end

    it "the returned token resolves the user in the auth layer" do
      post "/sign_in", params: { email: "alex@example.com", password: "password123" }
      token = response.parsed_body["token"]
      expect(Session.active.find_by(token: token)&.user).to eq(user)
    end

    it "rejects a wrong password with 401 and no session" do
      expect {
        post "/sign_in", params: { email: "alex@example.com", password: "wrong" }
      }.not_to change(Session, :count)
      expect(response).to have_http_status(:unauthorized)
      expect(response.parsed_body["error"]).to eq("Invalid credentials")
    end

    it "returns the same 401 for an unknown email (no enumeration)" do
      post "/sign_in", params: { email: "nobody@example.com", password: "password123" }
      expect(response).to have_http_status(:unauthorized)
      expect(response.parsed_body["error"]).to eq("Invalid credentials")
    end
  end

  describe "GET /sessions" do
    it "requires authentication" do
      get "/sessions"
      expect(response).to have_http_status(:unauthorized)
    end

    it "lists the current user's active sessions and flags the current one" do
      headers = sign_in_as(user)
      user.sessions.create!(expires_at: 30.days.from_now) # a second device

      get "/sessions", headers: headers
      expect(response).to have_http_status(:ok)
      body = response.parsed_body
      expect(body.length).to eq(2)
      expect(body.count { |s| s["current"] }).to eq(1)
    end
  end

  describe "DELETE /sessions/:id" do
    it "revokes a session so its token stops authorizing" do
      revoked = user.sessions.create!(expires_at: 30.days.from_now)
      headers = sign_in_as(user)

      delete "/sessions/#{revoked.id}", headers: headers
      expect(response).to have_http_status(:no_content)
      expect(Session.active.find_by(token: revoked.token)).to be_nil
    end
  end
end
