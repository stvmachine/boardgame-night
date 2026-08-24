# frozen_string_literal: true

require "rails_helper"

RSpec.describe "REST auth: registrations", type: :request do
  describe "POST /sign_up" do
    let(:valid) do
      { email: "new@example.com", password: "password123", username: "newbie", bgg_username: "newbie_bgg" }
    end

    it "creates a non-provisional user + session, returns a token, and sends verification" do
      expect {
        post "/sign_up", params: valid
      }.to change(User, :count).by(1).and change(Session, :count).by(1)
        .and have_enqueued_mail(UserMailer, :email_verification)

      expect(response).to have_http_status(:created)
      body = response.parsed_body
      expect(body["token"]).to be_present
      expect(body["user"]).to include("email" => "new@example.com", "bggUsername" => "newbie_bgg",
                                      "isProvisional" => false)

      user = User.find_by(email: "new@example.com")
      expect(user.provisional).to be false
      expect(user.verified).to be false
    end

    it "rejects a duplicate email with 422 and a field error" do
      User.create!(email: "new@example.com", password: "password123", provisional: false)
      expect { post "/sign_up", params: valid }.not_to change(User, :count)

      expect(response).to have_http_status(:unprocessable_content)
      expect(response.parsed_body["email"]).to include("is already taken")
    end

    it "rejects a short password with 422" do
      post "/sign_up", params: valid.merge(password: "short")
      expect(response).to have_http_status(:unprocessable_content)
      expect(response.parsed_body["password"]).to be_present
    end
  end
end
