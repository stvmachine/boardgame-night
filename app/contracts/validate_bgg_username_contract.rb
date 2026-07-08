# frozen_string_literal: true

class ValidateBggUsernameContract < ApplicationContract
  BGG_USERNAME_FORMAT = /\A[a-zA-Z0-9_\-]+\z/.freeze

  params do
    required(:username).filled(:string, max_size?: 50, format?: BGG_USERNAME_FORMAT)
  end
end
