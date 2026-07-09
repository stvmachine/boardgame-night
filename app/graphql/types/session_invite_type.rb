# frozen_string_literal: true

module Types
  class SessionInviteType < Types::BaseObject
    field :id, ID, null: false
    field :token, String, null: true, description: "Raw token fragment for the magic link; only available when the invite is first created."
    field :status, String, null: false
    field :email, String, null: false
    field :role, Types::GroupRoleEnum, null: true
    field :expires_at, GraphQL::Types::ISO8601DateTime, null: false
    field :group, Types::GroupType, null: false
    field :session, Types::NightSessionType, null: true

    def role
      object.role&.upcase
    end

    def session
      object.night_session
    end
  end
end
