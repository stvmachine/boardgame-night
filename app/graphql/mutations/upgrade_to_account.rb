# frozen_string_literal: true

module Mutations
  class UpgradeToAccount < BaseMutation
    argument :email, String, required: true
    argument :password, String, required: true
    argument :bgg_username, String, required: false

    field :token, String, null: false
    field :user, Types::UserType, null: false

    def resolve(email:, password:, bgg_username: nil)
      raise GraphQL::ExecutionError, "Authentication required" unless context[:current_user]
      raise GraphQL::ExecutionError, "Account already exists" unless context[:current_user].provisional?

      contract = UpgradeToAccountContract.new.call(
        email: email,
        password: password,
        bgg_username: bgg_username
      )
      raise GraphQL::ExecutionError, contract.errors.to_h.to_json if contract.failure?

      user = context[:current_user]
      user.update!(
        email: contract[:email],
        password: contract[:password],
        provisional: false,
        bgg_username: contract[:bgg_username]
      )

      session = Session.create!(
        user: user,
        expires_at: 30.days.from_now
      )

      { token: session.token, user: user }
    end
  end
end
