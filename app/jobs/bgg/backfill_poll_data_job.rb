# frozen_string_literal: true

module Bgg
  class BackfillPollDataJob < ApplicationJob
    queue_as :bgg_imports

    limits_concurrency to: 1, key: "bgg_api", duration: 5.minutes

    retry_on Bgg::NetworkError, wait: :polynomially_longer, attempts: 5
    retry_on Bgg::ServerError, wait: :polynomially_longer, attempts: 5

    discard_on Bgg::ResourceNotFound
    discard_on ActiveJob::DeserializationError

    def perform
      client = Bgg::Client.new

      BggThing.where(poll_data_fetched_at: nil).find_in_batches(batch_size: 20) do |things|
        objectids = things.map(&:objectid)

        begin
          doc = client.thing(objectids)
          Bgg::PollPersister.persist_from_thing_xml(doc)
          log_missing_ids(objectids, doc)
        rescue Bgg::ResourceNotFound => e
          Rails.logger.warn("[Bgg::BackfillPollDataJob] Resource not found for batch #{objectids.join(',')}: #{e.message}")
        end
      end
    end

    private

      def log_missing_ids(requested_objectids, doc)
        returned_ids = doc.css("items > item").map { |item| item["id"].to_i }
        missing = requested_objectids - returned_ids
        return if missing.empty?

        Rails.logger.warn("[Bgg::BackfillPollDataJob] Missing from BGG response: #{missing.join(',')}")
      end
  end
end
