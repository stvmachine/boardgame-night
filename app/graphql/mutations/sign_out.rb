# frozen_string_literal: true

module Mutations
  class SignOut < BaseMutation
    field :success, Boolean, null: false

    def resolve
      raise GraphQL::ExecutionError, "Authentication required" unless context[:current_session]

      context[:current_session].destroy
      { success: true }
    end
  end
end