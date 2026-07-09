# frozen_string_literal: true

module Mutations
  class SignIn < BaseMutation
    argument :email, String, required: true
    argument :password, String, required: true

    field :token, String, null: false
    field :user, Types::UserType, null: false

    def resolve(email:, password:)
      contract = SignInContract.new.call(email: email, password: password)
      raise GraphQL::ExecutionError, contract.errors.to_h.to_json if contract.failure?

      user = User.find_by(email: contract[:email])
      if user.nil? || !user.authenticate(contract[:password])
        raise GraphQL::ExecutionError, "Invalid credentials"
      end

      session = user.sessions.create!(expires_at: 30.days.from_now)

      { token: session.token, user: user }
    end
  end
end