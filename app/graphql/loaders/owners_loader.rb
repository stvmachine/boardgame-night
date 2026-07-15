# frozen_string_literal: true

module Loaders
  class OwnersLoader < GraphQL::Dataloader::Source
    def initialize(user_ids = nil)
      super()
      @user_ids = user_ids
    end

    def fetch(thing_ids)
      collections = BggCollection.where(bgg_thing_id: thing_ids)
      collections = collections.where(user_id: @user_ids) if @user_ids
      collections = collections.includes(:user).group_by(&:bgg_thing_id)

      thing_ids.map { |id| collections[id] || [] }
    end
  end
end
