# frozen_string_literal: true

module Mutations
  class StartPicking < BaseMutation
    argument :session_id, ID, required: true, description: "ID of the session to start picking for"

    field :session, Types::NightSessionType, null: false, description: "The updated session"

    def resolve(session_id:)
      raise GraphQL::ExecutionError, "Authentication required" unless context[:current_user]

      contract = SessionStateTransitionContract.new.call(session_id: session_id)
      raise GraphQL::ExecutionError, contract.errors.to_h.to_json if contract.failure?

      session = NightSession.find_by(id: contract[:session_id])
      raise GraphQL::ExecutionError, "Session not found" unless session

      unless session.host_id == context[:current_user].id
        raise GraphQL::ExecutionError, "You must be the session host to start picking"
      end

      unless session.can_start_picking?
        raise GraphQL::ExecutionError, "Session cannot start picking from #{session.state}"
      end

      session.update!(state: "picking")

      { session: session }
    end
  end
end
