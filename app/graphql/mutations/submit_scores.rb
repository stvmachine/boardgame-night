# frozen_string_literal: true

module Mutations
  class SubmitScores < BaseMutation
    argument :session_id, ID, required: true, description: "ID of the completed session"
    argument :scores, [ Types::ScoreInputType ], required: true, description: "Array of score entries"

    field :session, Types::NightSessionType, null: false, description: "The updated session with scores"

    def resolve(session_id:, scores:)
      raise GraphQL::ExecutionError, "Authentication required" unless context[:current_user]

      contract = SubmitScoresContract.new.call(session_id: session_id, scores: scores.map(&:to_h))
      raise GraphQL::ExecutionError, contract.errors.to_h.to_json if contract.failure?

      session = NightSession.find_by(id: contract[:session_id])
      raise GraphQL::ExecutionError, "Session not found" unless session

      unless session.host_id == context[:current_user].id
        raise GraphQL::ExecutionError, "You must be the session host to submit scores"
      end

      unless session.state == "completed"
        raise GraphQL::ExecutionError, "Scores can only be submitted for completed sessions"
      end

      ActiveRecord::Base.transaction do
        session.game_scores.destroy_all

        contract[:scores].each do |entry|
          session.game_scores.create!(
            user_id: entry[:user_id],
            score: entry[:score],
            rank: entry[:rank]
          )
        end
      end

      { session: session }
    end
  end
end
