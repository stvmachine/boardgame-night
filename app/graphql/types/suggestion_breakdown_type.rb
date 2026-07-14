# frozen_string_literal: true

module Types
  class SuggestionBreakdownType < Types::BaseObject
    field :player_count_fit, Float, null: false
    field :time_fit, Float, null: false
    field :complexity_fit, Float, null: false
    field :community_rating, Float, null: false
    field :ownership_bonus, Float, null: false
  end
end
