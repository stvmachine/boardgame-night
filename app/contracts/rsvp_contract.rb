# frozen_string_literal: true

class RsvpContract < ApplicationContract
  params do
    required(:token).filled(:string)
    required(:response).filled(:string, included_in?: %w[going not_going])
    optional(:nickname).maybe(:string, max_size?: 50)
  end
end
