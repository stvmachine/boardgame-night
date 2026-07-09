# frozen_string_literal: true

require "rails_helper"

RSpec.describe GroupMembership, type: :model do
  describe "validations" do
    subject do
      owner = User.create!(username: "owner", email: "owner@example.com", password: "password")
      group = Group.create!(name: "Night Owls", owner: owner)
      GroupMembership.new(user: owner, group: group, role: "owner")
    end

    it { should validate_uniqueness_of(:user_id).scoped_to(:group_id) }
    it { should validate_inclusion_of(:role).in_array(%w[owner admin member]) }
  end

  describe "associations" do
    it { should belong_to(:user) }
    it { should belong_to(:group) }
  end

  describe "provisional user guard" do
    it "allows full users to join a group" do
      user = User.create!(username: "alice", email: "alice@example.com", password: "password")
      group = Group.create!(name: "Night Owls", owner: user)
      membership = GroupMembership.new(user: user, group: group, role: "owner")

      expect(membership).to be_valid
    end

    it "rejects provisional users" do
      owner = User.create!(username: "owner", email: "owner@example.com", password: "password")
      provisional = User.create!(username: "guest_abc123", provisional: true, password: "password")
      group = Group.create!(name: "Night Owls", owner: owner)
      membership = GroupMembership.new(user: provisional, group: group, role: "member")

      expect(membership).not_to be_valid
      expect(membership.errors[:user]).to include("Provisional users cannot join groups")
    end
  end
end
