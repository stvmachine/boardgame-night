# frozen_string_literal: true

module Types
  class GroupSpotlightThing
    attr_reader :thing, :member_ids

    def initialize(thing, member_ids)
      @thing = thing
      @member_ids = member_ids.sort.freeze
    end

    delegate :id, :name, :thumbnail, :average, to: :thing
  end

  class GroupSpotlightThingType < Types::BaseObject
    field :id, ID, null: false
    field :name, String, null: false
    field :thumbnail, String, null: true
    field :average, GraphQL::Types::Float, null: true
    field :owners, [Types::OwnerType], null: false

    def owners
      dataloader.with(Loaders::OwnersLoader, object.member_ids).load(object.thing.id)
    end
  end
end
