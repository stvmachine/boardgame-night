# frozen_string_literal: true

class UpgradeToAccountContract < ApplicationContract
  EMAIL_REGEX = /\A[^\s@]+@[^\s@]+\.[^\s@]+\z/.freeze

  params do
    required(:email).filled(:string, format?: EMAIL_REGEX)
    required(:password).filled(:string, min_size?: 8, max_size?: 128)
    optional(:bgg_username).maybe(:string, max_size?: 50)
  end
end
