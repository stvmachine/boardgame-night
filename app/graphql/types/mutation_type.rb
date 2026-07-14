# frozen_string_literal: true

module Types
  class MutationType < Types::BaseObject
    field :import_collection, mutation: Mutations::ImportCollection, description: "Enqueue a BGG collection import for a username and return the user with initial sync status."
    field :validate_bgg_username, mutation: Mutations::ValidateBggUsername, description: "Validate a BGG username format and existence."
    field :sign_up, mutation: Mutations::SignUp, description: "Create a new user account and return a bearer token."
    field :sign_in, mutation: Mutations::SignIn, description: "Authenticate with email and password and return a bearer token."
    field :sign_out, mutation: Mutations::SignOut, description: "Destroy the current session and log out."
    field :bind_bgg_username, mutation: Mutations::BindBggUsername, description: "Bind a validated BGG username to the current user."
    field :create_group, mutation: Mutations::CreateGroup, description: "Create a new friend group and become the owner."
    field :invite_to_group, mutation: Mutations::InviteToGroup, description: "Invite someone to join a group by email."
    field :accept_group_invite, mutation: Mutations::AcceptGroupInvite, description: "Accept a group invitation using a magic-link token."
    field :remove_group_member, mutation: Mutations::RemoveGroupMember, description: "Remove a member from a group."
    field :update_group_member_role, mutation: Mutations::UpdateGroupMemberRole, description: "Change a member's role between admin and member."
    field :create_night_session, mutation: Mutations::CreateNightSession, description: "Create a new night session in draft state."
    field :schedule_session, mutation: Mutations::ScheduleSession, description: "Schedule a draft session and send invitations."
    field :update_session_preferences, mutation: Mutations::UpdateSessionPreferences, description: "Edit a session's time budget and complexity preference before picking starts."
    field :start_picking, mutation: Mutations::StartPicking, description: "Transition an invited session to the picking state."
    field :pick_game, mutation: Mutations::PickGame, description: "Pick a game from the group's collection and complete the session."
    field :cancel_session, mutation: Mutations::CancelSession, description: "Cancel an active session."
    field :reopen_session, mutation: Mutations::ReopenSession, description: "Reopen a cancelled session to its previous state."
    field :rsvp, mutation: Mutations::Rsvp, description: "RSVP to a session via a magic-link invite token."
    field :upgrade_to_account, mutation: Mutations::UpgradeToAccount, description: "Convert a provisional user to a full account."
  end
end
