# frozen_string_literal: true

module Mutations
  class UpdateSessionDetails < BaseMutation
    argument :session_id, ID, required: true
    argument :title, String, required: false
    argument :description, String, required: false
    argument :scheduled_at, GraphQL::Types::ISO8601DateTime, required: false
    argument :location, String, required: false
    argument :capacity, Integer, required: false

    field :session, Types::NightSessionType, null: false

    def resolve(session_id:, title: nil, description: nil, scheduled_at: nil, location: nil, capacity: nil)
      raise GraphQL::ExecutionError, "Authentication required" unless context[:current_user]

      provided_keys = context[:current_arguments]&.argument_values&.keys || []
      contract_payload = { session_id: session_id }
      contract_payload[:title] = title if provided_keys.include?(:title)
      contract_payload[:description] = description if provided_keys.include?(:description)
      contract_payload[:scheduled_at] = parse_datetime(scheduled_at) if provided_keys.include?(:scheduled_at)
      contract_payload[:location] = location if provided_keys.include?(:location)
      contract_payload[:capacity] = capacity if provided_keys.include?(:capacity)

      contract = UpdateSessionDetailsContract.new.call(contract_payload)
      raise GraphQL::ExecutionError, contract.errors.to_h.to_json if contract.failure?

      session = NightSession.find_by(id: contract[:session_id])
      raise GraphQL::ExecutionError, "Session not found" unless session

      unless session.host_id == context[:current_user].id
        raise GraphQL::ExecutionError, "You must be the session host to update details"
      end

      unless %w[draft invited picking].include?(session.state)
        raise GraphQL::ExecutionError, "Session details cannot be updated from #{session.state}"
      end

      updates = {}
      updates[:title] = contract[:title] if provided_keys.include?(:title)
      updates[:description] = contract[:description] if provided_keys.include?(:description)
      updates[:scheduled_at] = contract[:scheduled_at] if provided_keys.include?(:scheduled_at)
      updates[:location] = contract[:location] if provided_keys.include?(:location)
      updates[:capacity] = contract[:capacity] if provided_keys.include?(:capacity)
      session.update!(updates)

      { session: session }
    end

    private

    def parse_datetime(value)
      return nil if value.nil?
      return value.to_datetime if value.respond_to?(:to_datetime)

      Time.parse(value).to_datetime
    end
  end
end
