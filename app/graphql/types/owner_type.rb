# frozen_string_literal: true

module Types
  class OwnerType < Types::BaseObject
    field :bgg_username, String, null: false
    field :avatar, String, null: true

    def bgg_username
      object.user.bgg_username || object.user.username
    end

    def avatar
      object.user.bgg_avatar_url
    end
  end
end
