# frozen_string_literal: true

class UpdateSessionPreferencesContract < ApplicationContract
  params do
    required(:session_id).filled(:string)
    optional(:time_budget_minutes).filled(:integer, gt?: 0)
    optional(:complexity_preference).filled(:string, included_in?: NightSession::VALID_COMPLEXITY_PREFERENCES)
  end

  rule do
    unless key?(:time_budget_minutes) || key?(:complexity_preference)
      base.failure("at least one preference must be provided")
    end
  end
end
