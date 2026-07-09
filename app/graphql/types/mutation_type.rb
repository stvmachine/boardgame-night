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
  end
end
