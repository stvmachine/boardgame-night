# frozen_string_literal: true

module Types
  class UserType < Types::BaseObject
    field :username, String, null: false
    field :avatar, String, null: true

    def avatar
      object.bgg_avatar_url
    end
  end
end
