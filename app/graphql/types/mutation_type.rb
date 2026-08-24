# frozen_string_literal: true

module Types
  class MutationType < Types::BaseObject
    field :import_collection, mutation: Mutations::ImportCollection, description: "Enqueue a BGG collection import for a username and return the user with initial sync status."
    field :validate_bgg_username, mutation: Mutations::ValidateBggUsername, description: "Validate a BGG username format and existence."
    # sign_up / sign_in / sign_out moved to REST (authentication-zero, --api):
    # POST /sign_up, POST /sign_in, DELETE /sessions/:id.
    field :bind_bgg_username, mutation: Mutations::BindBggUsername, description: "Bind a validated BGG username to the current user."
    field :create_group, mutation: Mutations::CreateGroup, description: "Create a new friend group and become the owner."
    field :invite_to_group, mutation: Mutations::InviteToGroup, description: "Invite someone to join a group by email."
    field :accept_group_invite, mutation: Mutations::AcceptGroupInvite, description: "Accept a group invitation using a magic-link token."
    field :remove_group_member, mutation: Mutations::RemoveGroupMember, description: "Remove a member from a group."
    field :update_group_member_role, mutation: Mutations::UpdateGroupMemberRole, description: "Change a member's role between admin and member."
    field :create_night_session, mutation: Mutations::CreateNightSession, description: "Create a new night session in draft state."
    field :schedule_session, mutation: Mutations::ScheduleSession, description: "Schedule a draft session and send invitations."
    field :update_session_preferences, mutation: Mutations::UpdateSessionPreferences, description: "Edit a session's time budget and complexity preference before picking starts."
    field :update_session_details, mutation: Mutations::UpdateSessionDetails, description: "Edit a session's ordinary details while in draft, invited, or picking state."
    field :start_picking, mutation: Mutations::StartPicking, description: "Transition an invited session to the picking state."
    field :pick_game, mutation: Mutations::PickGame, description: "Pick a game from the group's collection and complete the session."
    field :cancel_session, mutation: Mutations::CancelSession, description: "Cancel an active session."
    field :reopen_session, mutation: Mutations::ReopenSession, description: "Reopen a cancelled session to its previous state."
    field :rsvp, mutation: Mutations::Rsvp, description: "RSVP to a session via a magic-link invite token."
    field :upgrade_to_account, mutation: Mutations::UpgradeToAccount, description: "Convert a provisional user to a full account."
    field :submit_scores, mutation: Mutations::SubmitScores, description: "Submit scores for a completed session."
    field :import_plays, mutation: Mutations::ImportPlays, description: "Import play history from BGG for a username."
    field :create_anonymous_group, mutation: Mutations::CreateAnonymousGroup, description: "Create a group with up to 2 BGG usernames without requiring an account."
  end
end
