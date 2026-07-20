# frozen_string_literal: true

module Types
  class MergedThingType < Types::BaseObject
    include Types::ThingFields

    field :owners, [ Types::OwnerType ], null: false

    def owners
      dataloader.with(Loaders::OwnersLoader).load(object.id)
    end
  end
end
