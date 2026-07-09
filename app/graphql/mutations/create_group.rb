# frozen_string_literal: true

module Mutations
  class CreateGroup < BaseMutation
    argument :name, String, required: true
    argument :description, String, required: false

    field :group, Types::GroupType, null: false

    def resolve(name:, description: nil)
      raise GraphQL::ExecutionError, "Authentication required" unless context[:current_user]

      contract = CreateGroupContract.new.call(name: name, description: description)
      raise GraphQL::ExecutionError, contract.errors.to_h.to_json if contract.failure?

      group = Group.create!(name: contract[:name], description: contract[:description], owner: context[:current_user])
      GroupMembership.create!(user: context[:current_user], group: group, role: "owner")

      { group: group }
    end
  end
end
