# frozen_string_literal: true

module Bgg
  class PollPersister
    def self.persist_from_thing_xml(xml_doc)
      xml_doc.css("items > item").each do |item|
        persist_item(item)
      end
    end

    def self.persist_item(item)
      thing = BggThing.find_by(objectid: item["id"].to_i)
      return unless thing

      poll_data = Bgg::Normalizer.normalize_polls(item)
      return mark_fetched_without_poll(thing) unless poll_data

      poll = thing.bgg_polls.find_or_initialize_by(name: poll_data[:name])
      poll.update!(
        title: poll_data[:title],
        total_votes: poll_data[:total_votes]
      )

      poll_data[:results].each do |result|
        result[:votes].each do |vote|
          poll_result = poll.bgg_poll_results.find_or_initialize_by(
            player_count: result[:player_count],
            value: vote[:value]
          )
          poll_result.num_votes = vote[:num_votes]
          poll_result.save!
        end
      end

      thing.update!(
        poll_data_fetched_at: Time.current,
        poll_data_error: nil
      )
    rescue StandardError => e
      Rails.logger.error("[Bgg::PollPersister] Failed to persist poll for thing #{thing&.objectid}: #{e.message}")
      thing&.update!(
        poll_data_fetched_at: Time.current,
        poll_data_error: e.message
      )
      raise
    end

    def self.mark_fetched_without_poll(thing)
      thing.update!(
        poll_data_fetched_at: Time.current,
        poll_data_error: nil
      )
    end
  end
end
