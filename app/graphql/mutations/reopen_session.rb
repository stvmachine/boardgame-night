# frozen_string_literal: true

module Mutations
  class ReopenSession < BaseMutation
    argument :session_id, ID, required: true, description: "ID of the cancelled session to reopen"

    field :session, Types::NightSessionType, null: false, description: "The reopened session"

    def resolve(session_id:)
      raise GraphQL::ExecutionError, "Authentication required" unless context[:current_user]

      contract = SessionStateTransitionContract.new.call(session_id: session_id)
      raise GraphQL::ExecutionError, contract.errors.to_h.to_json if contract.failure?

      session = NightSession.find_by(id: contract[:session_id])
      raise GraphQL::ExecutionError, "Session not found" unless session

      unless session.host_id == context[:current_user].id
        raise GraphQL::ExecutionError, "You must be the session host to reopen this session"
      end

      unless session.can_reopen?
        raise GraphQL::ExecutionError, "Session cannot be reopened from #{session.state}"
      end

      session.update!(state: session.previous_state || "draft", previous_state: nil)

      { session: session }
    end
  end
end
