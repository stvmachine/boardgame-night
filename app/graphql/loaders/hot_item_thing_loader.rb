# frozen_string_literal: true

module Loaders
  class HotItemThingLoader < GraphQL::Dataloader::Source
    def fetch(objectids)
      things = BggThing.where(objectid: objectids.map(&:to_i)).index_by(&:objectid)
      objectids.map { |id| things[id.to_i] }
    end
  end
end
