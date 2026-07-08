# frozen_string_literal: true

module Loaders
  class OwnersLoader < GraphQL::Dataloader::Source
    def fetch(thing_ids)
      collections = BggCollection
        .where(bgg_thing_id: thing_ids)
        .includes(:user)
        .group_by(&:bgg_thing_id)

      thing_ids.map { |id| collections[id] || [] }
    end
  end
end
