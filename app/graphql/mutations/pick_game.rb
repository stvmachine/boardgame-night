# frozen_string_literal: true

module Mutations
  class PickGame < BaseMutation
    argument :session_id, ID, required: true, description: "ID of the session to pick a game for"
    argument :game_id, ID, required: true, description: "ID of the game to pick from the group's merged collection"

    field :session, Types::NightSessionType, null: false, description: "The updated session"

    def resolve(session_id:, game_id:)
      raise GraphQL::ExecutionError, "Authentication required" unless context[:current_user]

      contract = PickGameContract.new.call(session_id: session_id, game_id: game_id)
      raise GraphQL::ExecutionError, contract.errors.to_h.to_json if contract.failure?

      session = NightSession.find_by(id: contract[:session_id])
      raise GraphQL::ExecutionError, "Session not found" unless session

      unless session.host_id == context[:current_user].id
        raise GraphQL::ExecutionError, "You must be the session host to pick a game"
      end

      unless session.state == "picking"
        raise GraphQL::ExecutionError, "Session cannot pick a game from #{session.state}"
      end

      game = BggThing.find_by(id: contract[:game_id])
      raise GraphQL::ExecutionError, "Game not found" unless game

      in_collection = BggThing.merged_for_users(session.group.member_ids).exists?(id: game.id)
      unless in_collection
        raise GraphQL::ExecutionError, "Game is not in the group collection"
      end

      session.update!(picked_game_id: game.id, state: "completed")

      { session: session }
    end
  end
end
