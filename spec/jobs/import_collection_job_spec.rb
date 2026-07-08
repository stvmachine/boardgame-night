# frozen_string_literal: true

require "rails_helper"

RSpec.describe ImportCollectionJob, type: :job do
  include ActiveJob::TestHelper

  let(:user) { User.create!(username: "testuser", password: "password", bgg_username: "testuser") }

  after do
    clear_enqueued_jobs
    clear_performed_jobs
  end

  it "enqueues with default priority" do
    expect {
      described_class.perform_later(user)
    }.to have_enqueued_job(described_class).with(user)
  end

  it "executes without error" do
    collection = [{ id: 1, name: "Game A" }, { id: 2, name: "Game B" }]

    allow_any_instance_of(Bgg::CollectionFetcher).to receive(:fetch)
      .with("testuser")
      .and_return(collection)

    allow_any_instance_of(Bgg::CollectionPersister).to receive(:persist_collection!)
      .with(collection)
      .and_return({ added: 2, updated: 0, errors: [] })

    expect {
      perform_enqueued_jobs { described_class.perform_later(user) }
    }.not_to raise_error
  end

  it "discards on ResourceNotFound" do
    allow_any_instance_of(Bgg::CollectionFetcher).to receive(:fetch)
      .and_raise(Bgg::ResourceNotFound)

    expect {
      perform_enqueued_jobs { described_class.perform_later(user) }
    }.not_to raise_error
  end

  it "discards on DeserializationError (deleted user)" do
    # Enqueue the job while user exists, delete the user, then perform
    described_class.perform_later(user)
    user.destroy!
    expect {
      perform_enqueued_jobs
    }.not_to raise_error
  end
end
