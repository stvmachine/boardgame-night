# frozen_string_literal: true

module Bgg
  class EnrichThingPollsJob < ApplicationJob
    queue_as :bgg_imports

    limits_concurrency to: 1, key: "bgg_api", duration: 5.minutes

    retry_on Bgg::NetworkError, wait: :polynomially_longer, attempts: 5
    retry_on Bgg::ServerError, wait: :polynomially_longer, attempts: 5

    discard_on Bgg::ResourceNotFound
    discard_on ActiveJob::DeserializationError

    def perform(username)
      user = User.find_by(bgg_username: username)
      return unless user

      thing_ids = user.bgg_things.where(poll_data_fetched_at: nil).pluck(:objectid)
      if thing_ids.empty?
        Rails.logger.info("[Bgg::EnrichThingPollsJob] No things needing enrichment for '#{username}'")
        return
      end

      client = Bgg::Client.new
      thing_ids.each_slice(20) do |batch|
        begin
          doc = client.thing(batch)
          Bgg::PollPersister.persist_from_thing_xml(doc)
        rescue Bgg::ResourceNotFound => e
          Rails.logger.warn("[Bgg::EnrichThingPollsJob] Resource not found for batch #{batch.join(',')}: #{e.message}")
        end
      end
    end
  end
end
