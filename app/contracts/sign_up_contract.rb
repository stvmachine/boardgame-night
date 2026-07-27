# frozen_string_literal: true

class SignUpContract < ApplicationContract
  EMAIL_FORMAT = /\A[^\s@]+@[^\s@]+\.[^\s@]+\z/.freeze

  params do
    required(:email).filled(:string, max_size?: 254, format?: EMAIL_FORMAT)
    required(:password).filled(:string, min_size?: 8, max_size?: 128)
    optional(:username).maybe(:string, max_size?: 50)
  end

  rule(:email) do
    key.failure("is already taken") if User.exists?(email: value)
  end
end
