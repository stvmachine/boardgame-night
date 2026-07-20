# frozen_string_literal: true

module Mutations
  class CreateNightSession < BaseMutation
    argument :title, String, required: true
    argument :description, String, required: false
    argument :group_id, ID, required: true
    argument :scheduled_at, GraphQL::Types::ISO8601DateTime, required: false
    argument :location, String, required: false
    argument :capacity, Integer, required: false

    argument :time_budget_minutes, Integer, required: false
    argument :complexity_preference, String, required: false

    field :session, Types::NightSessionType, null: false

    def resolve(title:, group_id:, description: nil, scheduled_at: nil, location: nil, capacity: nil, time_budget_minutes: nil, complexity_preference: nil)
      raise GraphQL::ExecutionError, "Authentication required" unless context[:current_user]

      scheduled_at = parse_datetime(scheduled_at)

      contract_payload = {
        title: title,
        group_id: group_id,
        description: description,
        scheduled_at: scheduled_at,
        location: location,
        capacity: capacity
      }
      contract_payload[:time_budget_minutes] = time_budget_minutes unless time_budget_minutes.nil?
      contract_payload[:complexity_preference] = complexity_preference unless complexity_preference.nil?

      contract = CreateNightSessionContract.new.call(contract_payload)
      raise GraphQL::ExecutionError, contract.errors.to_h.to_json if contract.failure?

      group = Group.find_by(id: group_id)
      raise GraphQL::ExecutionError, "Group not found" unless group

      membership = group.group_memberships.find_by(user_id: context[:current_user].id)
      unless group.owner_id == context[:current_user].id || (membership && %w[owner admin].include?(membership.role))
        raise GraphQL::ExecutionError, "You must be an owner or admin of the group to create a session"
      end

      session_attrs = {
        title: contract[:title],
        description: contract[:description],
        group: group,
        host: context[:current_user],
        scheduled_at: contract[:scheduled_at],
        location: contract[:location],
        capacity: contract[:capacity],
        state: "draft"
      }
      session_attrs[:time_budget_minutes] = contract[:time_budget_minutes] unless contract[:time_budget_minutes].nil?
      session_attrs[:complexity_preference] = contract[:complexity_preference] unless contract[:complexity_preference].nil?

      session = NightSession.create!(session_attrs)

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
