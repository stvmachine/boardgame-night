# frozen_string_literal: true

module Mutations
  class ValidateBggUsername < BaseMutation
    argument :username, String, required: true, description: "BoardGameGeek username to validate."

    field :validation_result, Types::ValidationResultType, null: false

    def resolve(username:)
      contract = ValidateBggUsernameContract.new.call(username: username)
      return { validation_result: { valid: false, username: username, exists: false, avatar: nil } } if contract.failure?

      normalized = contract[:username]
      user_doc = Bgg::Client.new.user(normalized)
      user_node = user_doc.at_css("user")
      exists = user_node.present? && user_node["id"].to_s.present?
      avatar = user_node&.at_css("avatarlink")&.[]("value").presence

      {
        validation_result: {
          valid: true,
          username: normalized,
          exists: exists,
          avatar: avatar
        }
      }
    end
  end
end
