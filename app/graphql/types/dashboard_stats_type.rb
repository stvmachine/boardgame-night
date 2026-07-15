# frozen_string_literal: true

module Types
  class DashboardStatsType < Types::BaseObject
    field :collection_count, Integer, null: false, description: "Distinct games in the signed-in user's bound BGG collection."
    field :group_count, Integer, null: false, description: "Distinct groups the user owns or belongs to."
    field :session_count, Integer, null: false, description: "Distinct non-cancelled sessions the user hosts or is going to."
  end
end
