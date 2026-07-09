# frozen_string_literal: true

module Types
  class GroupMembershipType < Types::BaseObject
    field :id, ID, null: false
    field :user, Types::UserType, null: false
    field :group, Types::GroupType, null: false
    field :role, Types::GroupRoleEnum, null: false
  end
end
