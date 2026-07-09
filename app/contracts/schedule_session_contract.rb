# frozen_string_literal: true

class ScheduleSessionContract < ApplicationContract
  params do
    required(:session_id).filled(:string)
    optional(:scheduled_at).maybe(:date_time)
    optional(:location).maybe(:string, max_size?: 200)
    optional(:capacity).maybe(:integer, gt?: 0)
  end
end
