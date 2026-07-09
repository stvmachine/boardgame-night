# frozen_string_literal: true

require "rails_helper"

RSpec.describe Session, type: :model do
  let(:user) { User.create!(username: "testuser", email: "test@example.com", password: "password123") }

  describe "associations" do
    it { should belong_to(:user) }
  end

  describe "validations" do
    it { should validate_presence_of(:user) }
    it { should validate_presence_of(:expires_at) }
  end

  describe "has_secure_token" do
    it "generates a token on create" do
      session = Session.create!(user: user, expires_at: 30.days.from_now)
      expect(session.token).to be_present
      expect(session.token.length).to be >= 24 # CSPRNG tokens are long
    end

    it "generates unique tokens" do
      session1 = Session.create!(user: user, expires_at: 30.days.from_now)
      session2 = Session.create!(user: user, expires_at: 30.days.from_now)
      expect(session1.token).not_to eq(session2.token)
    end
  end

  describe ".active scope" do
    it "includes unexpired sessions" do
      active = Session.create!(user: user, expires_at: 30.days.from_now)
      expect(Session.active).to include(active)
    end

    it "excludes expired sessions" do
      expired = Session.create!(user: user, expires_at: 1.hour.ago)
      expect(Session.active).not_to include(expired)
    end
  end

  describe "token uniqueness" do
    it { should have_db_index(:token).unique(true) }
  end
end