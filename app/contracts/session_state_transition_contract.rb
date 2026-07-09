# frozen_string_literal: true

class SessionStateTransitionContract < ApplicationContract
  params do
    required(:session_id).filled(:string)
  end
end
