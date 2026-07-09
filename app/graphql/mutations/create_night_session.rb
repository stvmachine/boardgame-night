# frozen_string_literal: true

module Mutations
  class CreateNightSession < BaseMutation
    argument :title, String, required: true
    argument :description, String, required: false
    argument :group_id, ID, required: true
    argument :scheduled_at, GraphQL::Types::ISO8601DateTime, required: false
    argument :location, String, required: false
    argument :capacity, Integer, required: false

    field :session, Types::NightSessionType, null: false

    def resolve(title:, group_id:, description: nil, scheduled_at: nil, location: nil, capacity: nil)
      raise GraphQL::ExecutionError, "Authentication required" unless context[:current_user]

      scheduled_at = parse_datetime(scheduled_at)

      contract = CreateNightSessionContract.new.call(
        title: title,
        group_id: group_id,
        description: description,
        scheduled_at: scheduled_at,
        location: location,
        capacity: capacity
      )
      raise GraphQL::ExecutionError, contract.errors.to_h.to_json if contract.failure?

      group = Group.find_by(id: group_id)
      raise GraphQL::ExecutionError, "Group not found" unless group

      membership = group.group_memberships.find_by(user_id: context[:current_user].id)
      unless group.owner_id == context[:current_user].id || (membership && %w[owner admin].include?(membership.role))
        raise GraphQL::ExecutionError, "You must be an owner or admin of the group to create a session"
      end

      session = NightSession.create!(
        title: contract[:title],
        description: contract[:description],
        group: group,
        host: context[:current_user],
        scheduled_at: contract[:scheduled_at],
        location: contract[:location],
        capacity: contract[:capacity],
        state: "draft"
      )

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
