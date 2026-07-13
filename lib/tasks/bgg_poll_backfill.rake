# frozen_string_literal: true

namespace :bgg do
  desc "Backfill BGG poll data for all BggThing records missing it"
  task backfill_polls: :environment do
    Bgg::BackfillPollDataJob.perform_later
  end
end
