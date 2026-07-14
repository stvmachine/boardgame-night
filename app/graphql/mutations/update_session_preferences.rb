# frozen_string_literal: true

module Mutations
  class UpdateSessionPreferences < BaseMutation
    argument :session_id, ID, required: true
    argument :time_budget_minutes, Integer, required: false
    argument :complexity_preference, String, required: false

    field :session, Types::NightSessionType, null: false

    def resolve(session_id:, time_budget_minutes: nil, complexity_preference: nil)
      raise GraphQL::ExecutionError, "Authentication required" unless context[:current_user]

      contract_payload = { session_id: session_id }
      contract_payload[:time_budget_minutes] = time_budget_minutes unless time_budget_minutes.nil?
      contract_payload[:complexity_preference] = complexity_preference unless complexity_preference.nil?

      contract = UpdateSessionPreferencesContract.new.call(contract_payload)
      raise GraphQL::ExecutionError, contract.errors.to_h.to_json if contract.failure?

      session = NightSession.find_by(id: session_id)
      raise GraphQL::ExecutionError, "Session not found" unless session

      unless session.host_id == context[:current_user].id
        raise GraphQL::ExecutionError, "You must be the session host to update preferences"
      end

      unless %w[draft invited].include?(session.state)
        raise GraphQL::ExecutionError, "Preferences cannot be updated once picking has started"
      end

      preference_updates = {}
      preference_updates[:time_budget_minutes] = contract[:time_budget_minutes] unless time_budget_minutes.nil?
      preference_updates[:complexity_preference] = contract[:complexity_preference] unless complexity_preference.nil?
      session.update!(preference_updates)

      { session: session }
    end
  end
end
