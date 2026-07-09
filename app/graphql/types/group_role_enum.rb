# frozen_string_literal: true

module Types
  class GroupRoleEnum < Types::BaseEnum
    graphql_name "GroupRole"

    value "MEMBER", "Regular group member"
    value "ADMIN", "Group administrator"
    value "OWNER", "Group owner with full control"
  end
end
