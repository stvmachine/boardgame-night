# frozen_string_literal: true

module Types
  class NightSessionType < Types::BaseObject
    field :id, ID, null: false
    field :title, String, null: false
    field :description, String, null: true
    field :state, Types::SessionStateEnum, null: false
    field :host, Types::UserType, null: false
    field :group, Types::GroupType, null: false
    field :scheduled_at, GraphQL::Types::ISO8601DateTime, null: true
    field :location, String, null: true
    field :capacity, Int, null: true
    field :attendances, [Types::AttendanceType], null: false
    field :picked_game, Types::MergedThingType, null: true
    field :attendee_count, Int, null: false
    field :previous_state, Types::SessionStateEnum, null: true

    def attendances
      object.attendances.includes(:user).to_a
    end

    def attendee_count
      object.attendances.where(response: "going").count
    end
  end
end
