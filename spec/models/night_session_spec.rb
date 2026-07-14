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
    it { should validate_inclusion_of(:complexity_preference).in_array(NightSession::VALID_COMPLEXITY_PREFERENCES) }
    it { should validate_numericality_of(:time_budget_minutes).is_greater_than(0) }

    it "rejects an invalid complexity preference" do
      subject.complexity_preference = "Hard"
      expect(subject).not_to be_valid
      expect(subject.errors[:complexity_preference]).to include("is not included in the list")
    end

    it "rejects a non-positive time budget" do
      subject.time_budget_minutes = 0
      expect(subject).not_to be_valid
      expect(subject.errors[:time_budget_minutes]).to include("must be greater than 0")
    end

    it "persists default time budget and complexity preference" do
      expect(subject.time_budget_minutes).to eq(120)
      expect(subject.complexity_preference).to eq("Any")
      expect(subject).to be_valid
    end
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
