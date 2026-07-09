# frozen_string_literal: true

require "rails_helper"

RSpec.describe Attendance, type: :model do
  describe "validations" do
    subject do
      owner = User.create!(username: "alice", email: "alice@example.com", password: "password")
      group = Group.create!(name: "Night Owls", owner: owner)
      session = NightSession.create!(title: "Friday Games", group: group, host: owner, state: "draft")
      Attendance.new(night_session: session, user: owner, response: "going")
    end

    it { should validate_uniqueness_of(:user_id).scoped_to(:night_session_id) }
    it { should validate_inclusion_of(:response).in_array(%w[going not_going]) }
  end

  describe "associations" do
    it { should belong_to(:night_session) }
    it { should belong_to(:user) }
  end
end
