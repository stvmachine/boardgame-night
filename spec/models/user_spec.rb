# frozen_string_literal: true

require "rails_helper"

RSpec.describe User, type: :model do
  describe "validations" do
    subject { User.new(username: "alice") }
    it { should validate_presence_of(:username) }
    it { should validate_uniqueness_of(:username) }
    it { should validate_uniqueness_of(:email).allow_nil }
  end

  describe "database columns" do
    it { should have_db_column(:bgg_avatar_url).of_type(:string) }
    it { should have_db_index(:bgg_username) }
  end

  describe "associations" do
    it { should have_many(:bgg_collections).dependent(:destroy) }
    it { should have_many(:bgg_things).through(:bgg_collections) }
  end
end
