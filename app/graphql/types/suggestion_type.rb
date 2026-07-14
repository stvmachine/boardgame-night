# frozen_string_literal: true

module Types
  class SuggestionType < Types::BaseObject
    field :thing, Types::MergedThingType, null: false
    field :score, Float, null: false
    field :breakdown, Types::SuggestionBreakdownType, null: false
    field :confidence, Types::ConfidenceLevelEnum, null: false
    field :reasons, [String], null: false
  end
end
