# frozen_string_literal: true

class CreateAnonymousGroupContract < ApplicationContract
  params do
    required(:name).filled(:string, max_size?: 100)
    required(:bgg_usernames).array(:string, min_size?: 1, max_size?: 50) do
      filled? & format?(/\A[a-zA-Z0-9_-]+\z/)
    end
  end

  rule(:bgg_usernames) do
    key(:bgg_usernames).failure("must have between 1 and 2 usernames") if value.size < 1 || value.size > 2
  end
end
