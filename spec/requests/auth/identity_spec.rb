# frozen_string_literal: true

require "rails_helper"

RSpec.describe "REST auth: identity + sudo + password", type: :request do
  let(:user) do
    User.create!(username: "alex", email: "alex@example.com", password: "password123",
                 provisional: false, verified: true)
  end

  describe "POST /identity/password_reset" do
    it "enqueues a reset mail for a verified user (202)" do
      expect {
        post "/identity/password_reset", params: { email: user.email }
      }.to have_enqueued_mail(UserMailer, :password_reset)
      expect(response).to have_http_status(:accepted)
    end

    it "still returns 202 for an unknown email (no enumeration) and sends nothing" do
      expect {
        post "/identity/password_reset", params: { email: "ghost@example.com" }
      }.not_to have_enqueued_mail(UserMailer, :password_reset)
      expect(response).to have_http_status(:accepted)
    end
  end

  describe "PATCH /identity/password_reset" do
    it "resets the password with a valid token" do
      token = user.generate_token_for(:password_reset)
      patch "/identity/password_reset",
            params: { sid: token, password: "brandnew123", password_confirmation: "brandnew123" }
      expect(response).to have_http_status(:no_content)
      expect(user.reload.authenticate("brandnew123")).to be_truthy
    end

    it "rejects an invalid token" do
      patch "/identity/password_reset", params: { sid: "garbage", password: "brandnew123" }
      expect(response).to have_http_status(:bad_request)
    end
  end

  describe "GET /identity/email_verification" do
    it "marks the user verified with a valid token" do
      user.update!(verified: false)
      token = user.generate_token_for(:email_verification)
      get "/identity/email_verification", params: { sid: token }
      expect(response).to have_http_status(:no_content)
      expect(user.reload.verified).to be true
    end
  end

  describe "POST /identity/email_verification (resend)" do
    it "re-sends the verification email to the signed-in user" do
      headers = sign_in_as(user)
      expect {
        post "/identity/email_verification", headers: headers
      }.to have_enqueued_mail(UserMailer, :email_verification)
      expect(response).to have_http_status(:accepted)
    end

    it "requires authentication" do
      post "/identity/email_verification"
      expect(response).to have_http_status(:unauthorized)
    end
  end

  describe "PATCH /identity/email (sudo-gated)" do
    it "changes the email, un-verifies, and re-sends verification when sudo is fresh" do
      headers = sign_in_as(user, sudo: true)
      expect {
        patch "/identity/email", params: { email: "new@example.com" }, headers: headers
      }.to have_enqueued_mail(UserMailer, :email_verification)

      expect(response).to have_http_status(:ok)
      expect(user.reload.email).to eq("new@example.com")
      expect(user.verified).to be false
    end

    it "returns 403 without a fresh sudo window" do
      headers = sign_in_as(user, sudo: false)
      patch "/identity/email", params: { email: "new@example.com" }, headers: headers
      expect(response).to have_http_status(:forbidden)
      expect(user.reload.email).to eq("alex@example.com")
    end
  end

  describe "sudo gating on PATCH /password" do
    it "returns 403 without a fresh sudo window" do
      headers = sign_in_as(user, sudo: false)
      patch "/password", params: { password: "changed123", password_confirmation: "changed123" }, headers: headers
      expect(response).to have_http_status(:forbidden)
      expect(response.parsed_body["error"]).to eq("sudo_required")
    end

    it "succeeds after POST /sudo re-authentication" do
      headers = sign_in_as(user, sudo: false)
      post "/sudo", params: { password: "password123" }, headers: headers
      expect(response).to have_http_status(:no_content)

      patch "/password", params: { password: "changed123", password_confirmation: "changed123" }, headers: headers
      expect(response).to have_http_status(:ok)
      expect(user.reload.authenticate("changed123")).to be_truthy
    end

    it "rejects sudo with a wrong password" do
      headers = sign_in_as(user, sudo: false)
      post "/sudo", params: { password: "wrong" }, headers: headers
      expect(response).to have_http_status(:unauthorized)
    end
  end
end
