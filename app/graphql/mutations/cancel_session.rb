# frozen_string_literal: true

module Mutations
  class CancelSession < BaseMutation
    argument :session_id, ID, required: true, description: "ID of the session to cancel"

    field :session, Types::NightSessionType, null: false, description: "The cancelled session"

    def resolve(session_id:)
      raise GraphQL::ExecutionError, "Authentication required" unless context[:current_user]

      contract = SessionStateTransitionContract.new.call(session_id: session_id)
      raise GraphQL::ExecutionError, contract.errors.to_h.to_json if contract.failure?

      session = NightSession.find_by(id: contract[:session_id])
      raise GraphQL::ExecutionError, "Session not found" unless session

      unless session.host_id == context[:current_user].id
        raise GraphQL::ExecutionError, "You must be the session host to cancel this session"
      end

      unless session.can_cancel?
        raise GraphQL::ExecutionError, "Session cannot be cancelled from #{session.state}"
      end

      session.update!(previous_state: session.state, state: "cancelled")

      { session: session }
    end
  end
end
