# frozen_string_literal: true

module Loaders
  class PollsLoader < GraphQL::Dataloader::Source
    def fetch(thing_ids)
      polls = BggPoll
        .where(bgg_thing_id: thing_ids)
        .includes(:bgg_poll_results)
        .group_by(&:bgg_thing_id)

      thing_ids.map { |id| polls[id] || [] }
    end
  end
end
