# frozen_string_literal: true

module Types
  class ScoreInputType < Types::BaseInputObject
    argument :user_id, ID, required: true, description: "ID of the user"
    argument :score, Integer, required: true, description: "Score value"
    argument :rank, Integer, required: false, description: "Rank (1st, 2nd, 3rd, etc.)"
  end
end
