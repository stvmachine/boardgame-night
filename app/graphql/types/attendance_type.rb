# frozen_string_literal: true

module Types
  class AttendanceType < Types::BaseObject
    field :id, ID, null: false
    field :user, Types::UserType, null: false
    field :response, String, null: false
    field :responded_at, GraphQL::Types::ISO8601DateTime, null: true
  end
end
