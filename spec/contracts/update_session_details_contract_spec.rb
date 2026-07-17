# frozen_string_literal: true

require "rails_helper"

RSpec.describe UpdateSessionDetailsContract do
  let(:valid_payload) do
    {
      session_id: "session-123",
      title: "New title",
      description: "A description",
      scheduled_at: DateTime.now,
      location: "My place",
      capacity: 4
    }
  end

  it "validates a payload with all ordinary fields" do
    contract = described_class.new.call(valid_payload)
    expect(contract).to be_success
    expect(contract.to_h).to include(valid_payload)
  end

  it "validates a payload with a single ordinary field" do
    contract = described_class.new.call({ session_id: "session-123", title: "Only title" })
    expect(contract).to be_success
    expect(contract.to_h).to eq({ session_id: "session-123", title: "Only title" })
  end

  it "rejects a title longer than 200 characters" do
    contract = described_class.new.call({ session_id: "session-123", title: "x" * 201 })
    expect(contract).to be_failure
    expect(contract.errors.to_h).to have_key(:title)
  end

  it "rejects a description longer than 2000 characters" do
    contract = described_class.new.call({ session_id: "session-123", description: "x" * 2001 })
    expect(contract).to be_failure
    expect(contract.errors.to_h).to have_key(:description)
  end

  it "rejects a location longer than 200 characters" do
    contract = described_class.new.call({ session_id: "session-123", location: "x" * 201 })
    expect(contract).to be_failure
    expect(contract.errors.to_h).to have_key(:location)
  end

  it "rejects a non-positive capacity" do
    contract = described_class.new.call({ session_id: "session-123", capacity: 0 })
    expect(contract).to be_failure
    expect(contract.errors.to_h).to have_key(:capacity)
  end

  it "rejects an invalid scheduled_at value" do
    contract = described_class.new.call({ session_id: "session-123", scheduled_at: "not-a-datetime" })
    expect(contract).to be_failure
    expect(contract.errors.to_h).to have_key(:scheduled_at)
  end

  it "fails when only session_id is provided" do
    contract = described_class.new.call({ session_id: "session-123" })
    expect(contract).to be_failure
    expect(contract.errors.to_h.values.flatten).to include("at least one ordinary detail must be provided")
  end

  it "allows explicit nil for nullable fields" do
    contract = described_class.new.call({
      session_id: "session-123",
      description: nil,
      location: nil,
      scheduled_at: nil,
      capacity: nil
    })
    expect(contract).to be_success
    expect(contract.to_h).to eq({
      session_id: "session-123",
      description: nil,
      location: nil,
      scheduled_at: nil,
      capacity: nil
    })
  end

  it "does not include preference keys in validated output" do
    contract = described_class.new.call({
      session_id: "session-123",
      title: "Title",
      time_budget_minutes: 90,
      complexity_preference: "Medium"
    })
    expect(contract.to_h).not_to have_key(:time_budget_minutes)
    expect(contract.to_h).not_to have_key(:complexity_preference)
  end
end
