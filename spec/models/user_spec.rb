# frozen_string_literal: true

require "rails_helper"

RSpec.describe User, type: :model do
  describe "validations" do
    subject { User.new(username: "alice") }
    it { should validate_presence_of(:username) }
    it { should validate_uniqueness_of(:username) }
    it { should validate_uniqueness_of(:email).allow_nil }
    it { should validate_inclusion_of(:provisional).in_array([ true, false ]) }
    it { should validate_uniqueness_of(:invite_token).allow_nil }
  end

  describe "database columns" do
    it { should have_db_column(:bgg_avatar_url).of_type(:string) }
    it { should have_db_index(:bgg_username) }
    it { should have_db_column(:provisional).of_type(:boolean).with_options(default: false) }
    it { should have_db_column(:invite_token).of_type(:string) }
  end

  describe "associations" do
    it { should have_many(:bgg_collections).dependent(:destroy) }
    it { should have_many(:bgg_things).through(:bgg_collections) }
    it { should have_many(:sessions).dependent(:destroy) }
  end

  describe "#display_name" do
    it "returns email for full users with email" do
      user = User.new(username: "alice", email: "alice@example.com", provisional: false)
      expect(user.display_name).to eq("alice@example.com")
    end

    it "returns 'Guest' for provisional users" do
      user = User.new(username: "guest_abc123", provisional: true)
      expect(user.display_name).to eq("Guest")
    end

    it "returns 'Guest' for provisional users even with email" do
      user = User.new(username: "guest_abc123", email: "temp@example.com", provisional: true)
      expect(user.display_name).to eq("Guest")
    end
  end

  describe "#provisional" do
    it "defaults to false" do
      user = User.new(username: "alice")
      expect(user.provisional).to be false
    end
  end
end
