# frozen_string_literal: true

module Mutations
  class CreateAnonymousGroup < BaseMutation
    argument :name, String, required: true
    argument :bgg_usernames, [ String ], required: true

    field :group, Types::GroupType, null: false

    def resolve(name:, bgg_usernames:)
      contract = CreateAnonymousGroupContract.new.call(name: name, bgg_usernames: bgg_usernames)
      raise GraphQL::ExecutionError, contract.errors.to_h.to_json if contract.failure?

      group = Group.create!(
        name: contract[:name],
        owner: nil,
        anonymous_bgg_usernames: contract[:bgg_usernames].to_json
      )

      { group: group }
    end
  end
end
