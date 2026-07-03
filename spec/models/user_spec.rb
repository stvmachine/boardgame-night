# frozen_string_literal: true

require "rails_helper"

RSpec.describe User, type: :model do
  describe "validations" do
    subject { User.new(username: "alice") }
    it { should validate_presence_of(:username) }
    it { should validate_uniqueness_of(:username) }
    it { should validate_uniqueness_of(:email).allow_nil }
  end

  describe "associations" do
    it { should have_many(:bgg_collections).dependent(:destroy) }
    it { should have_many(:bgg_things).through(:bgg_collections) }
  end
end
