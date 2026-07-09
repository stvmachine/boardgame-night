# frozen_string_literal: true

module Mutations
  class BindBggUsername < BaseMutation
    argument :username, String, required: true

    field :user, Types::UserType, null: false

    def resolve(username:)
      raise GraphQL::ExecutionError, "Authentication required" unless context[:current_user]

      contract = BindBggUsernameContract.new.call(username: username)
      raise GraphQL::ExecutionError, contract.errors.to_h.to_json if contract.failure?

      bgg_username = contract[:username]
      user_doc = Bgg::Client.new.user(bgg_username)
      user_node = user_doc.at_css("user")
      exists = user_node.present? && user_node["id"].to_s.present?

      raise GraphQL::ExecutionError, "BGG user not found" unless exists

      context[:current_user].update!(bgg_username: bgg_username)
      { user: context[:current_user] }
    end
  end
end