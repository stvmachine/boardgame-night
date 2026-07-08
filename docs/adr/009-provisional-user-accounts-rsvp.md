# ADR-009: Provisional User Accounts for No-Account RSVP

## Status

accepted

## Context

A key v1 requirement is that invitees can RSVP to a boardgame night session via a magic link **without creating an account**. After RSVPing, they may optionally upgrade to a full account (email, password, BGG username). The existing `User` model already has `has_secure_password` and owns `bgg_collections`.

We need a data model that:
- Lets a non-registered person respond to an invitation.
- Counts them in the attendee headcount.
- Allows them to later upgrade to a real account without losing their RSVP history.
- Does not complicate GraphQL types or Apollo's normalized cache.
- Prevents provisional accounts from being treated as group members (group members must contribute BGG collections).

## Decision

We will implement **provisional user accounts** by adding a `provisional` boolean column to the existing `users` table.

Specifically:
- When an organizer invites someone by email, the system finds or creates a `User` record with `provisional: true` and a generated `guest_*` username (e.g., `guest_a1b2c3d4`).
- The invitee's RSVP is stored in a new `attendances` table (`session_id`, `user_id`, `status`) just like a real user.
- The magic link token encodes `{user_id, session_id, expires_at}` and is verified with `ActiveSupport::MessageVerifier`.
- When the provisional user upgrades, a single `UPDATE` sets `provisional: false`, `username`, `password`, and optionally `bgg_username`.
- Group memberships validate that the user is not provisional; only full accounts can pool collections into a group.
- `UserType` exposes `isProvisional: Boolean!` and `displayName: String!` so the UI can badge guests without needing a separate type.

## Consequences

- Account upgrade is a single row update — no data migration, no orphaned records, no polymorphic retargeting.
- GraphQL and Apollo stay simple: `Session.attendees` returns `[User!]!`; guests are just users with `isProvisional: true`.
- We must auto-generate unique guest usernames and hide them from the UI.
- We must guard group membership with a model validation (`user_must_not_be_provisional`).
- `User.full` scope (or equivalent) should be used wherever only real accounts are intended.

## Alternatives Considered

- **Separate `Guest` table + `rsvp_responses`** — rejected: cleaner schema separation, but upgrading to an account requires retargeting every RSVP row across tables.
- **Polymorphic `Attendee` (`User` or `Guest`)** — rejected: no FK constraint on the polymorphic reference, complex GraphQL union types, and complex upgrade logic.
- **Nullable `password_digest` on `User`** — rejected: relies on disabling `has_secure_password` validations; too easy to accidentally create a real user without a password.

## References

- `app/models/user.rb`
- `docs/adr/008-authentication-session-strategy.md`
- `docs/adr/010-group-invitation-tokens.md`
- Research notes: `.planning/phases/04-auth-friend-groups-session-lifecycle/04-CONTEXT.md`
