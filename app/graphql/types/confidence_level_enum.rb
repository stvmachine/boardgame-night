# frozen_string_literal: true

module Types
  class ConfidenceLevelEnum < Types::BaseEnum
    graphql_name "ConfidenceLevel"

    value "HIGH", "50 or more votes at the target player count"
    value "MEDIUM", "20–49 votes at the target player count"
    value "LOW", "Fewer than 20 votes, or the range-midpoint fallback is in use"
  end
end
