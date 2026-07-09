# frozen_string_literal: true

class CreateNightSessionContract < ApplicationContract
  params do
    required(:title).filled(:string, max_size?: 200)
    required(:group_id).filled(:string)
    optional(:description).maybe(:string, max_size?: 1000)
    optional(:scheduled_at).maybe(:date_time)
    optional(:location).maybe(:string, max_size?: 200)
    optional(:capacity).maybe(:integer, gt?: 0)
  end
end
