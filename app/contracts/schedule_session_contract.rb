# frozen_string_literal: true

class ScheduleSessionContract < ApplicationContract
  params do
    required(:session_id).filled(:string)
    optional(:scheduled_at).maybe(:date_time)
    optional(:location).maybe(:string, max_size?: 200)
    optional(:capacity).maybe(:integer, gt?: 0)
    optional(:time_budget_minutes).filled(:integer, gt?: 0)
    optional(:complexity_preference).filled(:string, included_in?: NightSession::VALID_COMPLEXITY_PREFERENCES)
  end
end
