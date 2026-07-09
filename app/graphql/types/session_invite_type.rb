# frozen_string_literal: true

module Types
  class SessionInviteType < Types::BaseObject
    field :id, ID, null: false
    field :token, String, null: false, description: "Public token fragment for the magic link."
    field :status, String, null: false
    field :email, String, null: false
    field :role, Types::GroupRoleEnum, null: true
    field :expires_at, GraphQL::Types::ISO8601DateTime, null: false
    field :group, Types::GroupType, null: false
  end
end
