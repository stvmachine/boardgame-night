# frozen_string_literal: true

class SignInContract < ApplicationContract
  EMAIL_FORMAT = /\A[^\s@]+@[^\s@]+\.[^\s@]+\z/.freeze

  params do
    required(:email).filled(:string, max_size?: 254, format?: EMAIL_FORMAT)
    required(:password).filled(:string, max_size?: 128)
  end
end
