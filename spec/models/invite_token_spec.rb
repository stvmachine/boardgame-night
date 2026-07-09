# frozen_string_literal: true

require "rails_helper"

RSpec.describe InviteToken, type: :model do
  describe "validations" do
    subject do
      owner = User.create!(username: "owner", email: "owner@example.com", password: "password")
      group = Group.create!(name: "Night Owls", owner: owner)
      raw_token, digest = InviteToken.generate_raw_token
      InviteToken.new(
        group: group,
        inviter: owner,
        email: "friend@example.com",
        token_digest: digest,
        status: "pending",
        expires_at: 7.days.from_now
      )
    end

    it { should validate_presence_of(:email) }
    it { should validate_presence_of(:token_digest) }
    it { should validate_uniqueness_of(:token_digest) }
    it { should validate_inclusion_of(:status).in_array(%w[pending accepted rsvped expired]) }
    it { should validate_inclusion_of(:role).in_array(%w[member admin]).allow_nil }
  end

  describe "associations" do
    it { should belong_to(:group) }
    it { should belong_to(:inviter).class_name("User") }
    it { should belong_to(:accepted_by).class_name("User").optional }
  end

  describe ".generate_raw_token" do
    it "returns a raw token and its SHA-256 digest" do
      raw_token, digest = InviteToken.generate_raw_token
      expect(raw_token.length).to eq(64)
      expect(digest).to eq(Digest::SHA256.hexdigest(raw_token))
      expect(digest.length).to eq(64)
    end
  end

  describe "#expired?" do
    it "returns true when expires_at is in the past" do
      owner = User.create!(username: "owner", email: "owner@example.com", password: "password")
      group = Group.create!(name: "Night Owls", owner: owner)
      token = InviteToken.create!(
        group: group,
        inviter: owner,
        email: "friend@example.com",
        token_digest: "a" * 64,
        status: "pending",
        expires_at: 1.minute.ago
      )

      expect(token).to be_expired
    end

    it "returns false when expires_at is in the future" do
      owner = User.create!(username: "owner", email: "owner@example.com", password: "password")
      group = Group.create!(name: "Night Owls", owner: owner)
      token = InviteToken.create!(
        group: group,
        inviter: owner,
        email: "friend@example.com",
        token_digest: "a" * 64,
        status: "pending",
        expires_at: 1.day.from_now
      )

      expect(token).not_to be_expired
    end
  end
end
