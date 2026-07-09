# frozen_string_literal: true

require "rails_helper"

RSpec.describe NightSession, type: :model do
  describe "validations" do
    subject do
      owner = User.create!(username: "alice", email: "alice@example.com", password: "password")
      group = Group.create!(name: "Night Owls", owner: owner)
      NightSession.new(title: "Friday Games", group: group, host: owner)
    end

    it { should validate_presence_of(:title) }
    it { should validate_presence_of(:state) }
    it { should validate_inclusion_of(:state).in_array(%w[draft invited picking completed]) }
  end

  describe "associations" do
    it { should belong_to(:group) }
    it { should belong_to(:host).class_name("User") }
    it { should have_many(:attendances).dependent(:destroy) }
    it { should have_many(:attendees).through(:attendances).source(:user) }
  end

  describe "state transition guards" do
    let(:owner) { User.create!(username: "alice", email: "alice@example.com", password: "password") }
    let(:group) { Group.create!(name: "Night Owls", owner: owner) }

    it "can schedule from draft" do
      session = NightSession.create!(title: "Draft", group: group, host: owner, state: "draft")
      expect(session.can_schedule?).to be true
    end

    it "cannot schedule from invited" do
      session = NightSession.create!(title: "Invited", group: group, host: owner, state: "invited")
      expect(session.can_schedule?).to be false
    end

    it "can start picking from invited" do
      session = NightSession.create!(title: "Picking", group: group, host: owner, state: "invited")
      expect(session.can_start_picking?).to be true
    end

    it "can complete from picking" do
      session = NightSession.create!(title: "Completed", group: group, host: owner, state: "picking")
      expect(session.can_complete?).to be true
    end
  end
end
