# frozen_string_literal: true

class UpdateSessionDetailsContract < ApplicationContract
  params do
    required(:session_id).filled(:string)
    optional(:title).filled(:string, max_size?: 200)
    optional(:description).maybe(:string, max_size?: 2000)
    optional(:scheduled_at).maybe(:date_time)
    optional(:location).maybe(:string, max_size?: 200)
    optional(:capacity).maybe(:integer, gt?: 0)
  end

  rule do
    unless key?(:title) || key?(:description) || key?(:scheduled_at) || key?(:location) || key?(:capacity)
      base.failure("at least one ordinary detail must be provided")
    end
  end
end
