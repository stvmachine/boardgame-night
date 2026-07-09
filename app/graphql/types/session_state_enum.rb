# frozen_string_literal: true

module Types
  class SessionStateEnum < Types::BaseEnum
    graphql_name "SessionState"

    value "DRAFT", "Session is being edited", value: "draft"
    value "INVITED", "Invitations sent, RSVPs open", value: "invited"
    value "PICKING", "Host is picking a game", value: "picking"
    value "COMPLETED", "Game picked and session finalized", value: "completed"
    value "CANCELLED", "Session was cancelled and can be reopened", value: "cancelled"
  end
end
