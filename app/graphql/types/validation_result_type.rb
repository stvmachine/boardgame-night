# frozen_string_literal: true

module Types
  class ValidationResultType < Types::BaseObject
    field :valid, Boolean, null: false, description: "Whether the input passed the format contract."
    field :username, String, null: false, description: "The normalized username that was validated."
    field :exists, Boolean, null: false, description: "Whether the username exists on BoardGameGeek."
    field :avatar, String, null: true, description: "Avatar URL for the BGG user, if present."
  end
end
