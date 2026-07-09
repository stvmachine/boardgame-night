# frozen_string_literal: true

class PickGameContract < SessionStateTransitionContract
  params do
    required(:session_id).filled(:string)
    required(:game_id).filled(:string)
  end
end
