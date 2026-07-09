# frozen_string_literal: true

module Mutations
  class SignUp < BaseMutation
    argument :email, String, required: true
    argument :password, String, required: true
    argument :username, String, required: true

    field :token, String, null: false
    field :user, Types::UserType, null: false

    def resolve(email:, password:, username:)
      contract = SignUpContract.new.call(email: email, password: password, username: username)
      raise GraphQL::ExecutionError, contract.errors.to_h.to_json if contract.failure?

      user = User.create!(
        email: contract[:email],
        username: contract[:username],
        password: contract[:password],
        provisional: false
      )
      session = user.sessions.create!(expires_at: 30.days.from_now)

      { token: session.token, user: user }
    end
  end
end