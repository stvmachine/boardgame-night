# frozen_string_literal: true

class CreateGroupContract < ApplicationContract
  params do
    required(:name).filled(:string, max_size?: 100)
    optional(:description).maybe(:string, max_size?: 500)
  end
end
