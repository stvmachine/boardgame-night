# frozen_string_literal: true

require "rails_helper"

RSpec.describe Group, type: :model do
  describe "validations" do
    subject do
      owner = User.create!(username: "alice", email: "alice@example.com", password: "password")
      Group.new(name: "Night Owls", owner: owner)
    end

    it { should validate_presence_of(:name) }
    it { should validate_uniqueness_of(:invite_code).allow_nil }
  end

  describe "associations" do
    it { should belong_to(:owner).class_name("User") }
    it { should have_many(:group_memberships).dependent(:destroy) }
    it { should have_many(:members).through(:group_memberships).source(:user) }
  end

  describe "invite_code generation" do
    it "generates a unique invite_code on create" do
      owner = User.create!(username: "owner", email: "owner@example.com", password: "password")
      group = Group.create!(name: "Game Night", owner: owner)

      expect(group.invite_code).to be_present
      expect(group.invite_code.length).to eq(12)
    end
  end

  describe "#member_ids" do
    it "returns the user ids of all group members" do
      owner = User.create!(username: "owner", email: "owner@example.com", password: "password")
      member = User.create!(username: "member", email: "member@example.com", password: "password")
      group = Group.create!(name: "Game Night", owner: owner)
      GroupMembership.create!(user: owner, group: group, role: "owner")
      GroupMembership.create!(user: member, group: group, role: "member")

      expect(group.member_ids).to contain_exactly(owner.id, member.id)
    end
  end
end
