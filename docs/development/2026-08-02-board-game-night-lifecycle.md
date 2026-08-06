---
title: "The Boardgame Night Session Lifecycle"
date: 2026-08-02
description: "How a night session moves from draft through invitations, RSVP, picking, and completion, with cancellation, provisional guests, and host-only authority."
tags: [rails, graphql, session, rsvp, suggestions]
---

## The problem

Organizing a boardgame night for a group of friends is a small state machine. The host drafts an event, sends invites, waits for people to RSVP, picks a game from the combined collection, and records the result. Along the way the host might cancel and reopen the event, and some invitees may not even have accounts yet. The backend must model those states explicitly, enforce who can do what, and only suggest games that fit the people who are actually going.

We chose a minimal manual state machine driven by GraphQL mutations rather than a state-machine gem or derived time-based states. The rules are straightforward: host-only writes, member-only reads, and a single `state` column that the UI can use to decide which buttons to show.

## The current state model

`NightSession` supports five states:

```ruby
validates :state, presence: true, inclusion: { in: %w[draft invited picking completed cancelled] }

def can_schedule?
  state == "draft"
end

def can_start_picking?
  state == "invited"
end

def can_complete?
  state == "picking"
end

def can_cancel?
  %w[draft invited picking].include?(state)
end

def can_reopen?
  state == "cancelled"
end
```

The lifecycle is `draft → invited → picking → completed`, with `cancelled` as an alternate path from any of the first three states. `previous_state` is preserved on cancellation so `reopen` can restore the session to where it was.

## Creating and scheduling: host + group authority

Only a group owner, admin, or host can create a session. `CreateNightSession` validates membership first, then writes a `draft` row:

```ruby
def resolve(title:, group_id:, description: nil, scheduled_at: nil, ...)
  raise GraphQL::ExecutionError, "Authentication required" unless context[:current_user]

  contract = CreateNightSessionContract.new.call(...)
  raise GraphQL::ExecutionError, contract.errors.to_h.to_json if contract.failure?

  group = Group.find_by(id: group_id)
  membership = group.group_memberships.find_by(user_id: context[:current_user].id)
  unless group.owner_id == context[:current_user].id || (membership && %w[owner admin].include?(membership.role))
    raise GraphQL::ExecutionError, "You must be an owner or admin of the group to create a session"
  end

  session = NightSession.create!(title: ..., state: "draft", ...)
  { session: session }
end
```

`ScheduleSession` moves the session from `draft` to `invited` and creates per-member `InviteToken` rows. The contract, host check, and `can_schedule?` guard make invalid transitions impossible at the GraphQL boundary.

## Inviting and RSVP without an account

Targeted invitations use the `InviteToken` table (see [ADR-010](https://github.com/stvmachine/boardgame-night-ror-vue/blob/main/docs/adr/010-group-invitation-tokens.md)). The raw token is a 256-bit CSPRNG value; only its SHA-256 digest is stored. A magic link contains the raw token, and the invite lookup is resolved by hashing the incoming token and matching the digest:

```ruby
def session_invite(token:)
  return nil if token.blank?

  digest = Digest::SHA256.hexdigest(token)
  invite = InviteToken.find_by(token_digest: digest)
  return nil unless invite&.night_session_id.present?
  return nil if invite.expired?

  invite
end
```

When an invitee RSVPs, the `Rsvp` mutation can create a provisional `User` if one does not exist for that email address (see [ADR-009](https://github.com/stvmachine/boardgame-night-ror-vue/blob/main/docs/adr/009-provisional-user-accounts-rsvp.md)):

```ruby
user = User.find_by(email: invite.email) || create_provisional_user(invite.email, contract[:nickname])

attendance = Attendance.find_or_initialize_by(night_session: invite.night_session, user: user)
attendance.assign_attributes(
  response: contract[:response],
  responded_at: Time.current
)
attendance.save!
```

Provisional users count as attendees, but they cannot join a group or contribute to the merged collection until they upgrade to a full account. The same `attendances` table stores both full and provisional guests, so counting "who is going" is a single query.

## From invited to picking: closing RSVPs

When the host is ready to choose a game, `StartPicking` transitions the session from `invited` to `picking`. Only the host can do this; the mutation does not require every invitee to have responded, because small friend groups often decide to start with whoever has replied:

```ruby
def resolve(session_id:)
  session = NightSession.find_by(id: contract[:session_id])
  unless session.host_id == context[:current_user].id
    raise GraphQL::ExecutionError, "You must be the session host to start picking"
  end

  unless session.can_start_picking?
    raise GraphQL::ExecutionError, "Session cannot start picking from #{session.state}"
  end

  session.update!(state: "picking")
  { session: session }
end
```

## Suggestions: only the games the going attendees can play

The `suggestions` field on `NightSessionType` is available only when the session is in `picking` and only to group members or the host. It starts by collecting the attendees who responded `going` and then asks the merged collection for the games owned by those users:

```ruby
def suggestions
  require_authentication!
  raise GraphQL::ExecutionError, "Unauthorized" unless group_member?(context[:current_user])
  return nil unless object.state == "picking"

  attendee_ids = object.attendances.where(response: "going").pluck(:user_id).uniq
  return [] if attendee_ids.empty?

  things = BggThing.merged_for_users(attendee_ids).to_a
  return [] if things.empty?

  thing_ids = things.map(&:id)

  polls = dataloader.with(Loaders::PollsLoader).load_all(thing_ids)
  owners = dataloader.with(Loaders::OwnersLoader).load_all(thing_ids)

  Suggestions::Engine.call(
    session: object,
    things: things,
    attendee_user_ids: attendee_ids,
    attendee_count: attendee_ids.size,
    polls_by_thing: thing_ids.zip(polls).to_h,
    owners_by_thing: thing_ids.zip(owners).to_h
  )
end
```

The suggestions come from the persisted collections of the attendees who are actually going, not from the whole group. The engine scores each candidate by player count, time budget, complexity preference, community rating, and ownership (see the collection and scoring posts). The result is a ranked list returned to the host.

## Host-only pick and cancellation

`PickGame` is the only mutation that can move a session from `picking` to `completed`, and it is restricted to the host. The chosen game must be in the merged collection of the session's group members:

```ruby
def resolve(session_id:, game_id:)
  session = NightSession.find_by(id: contract[:session_id])
  unless session.host_id == context[:current_user].id
    raise GraphQL::ExecutionError, "You must be the session host to pick a game"
  end

  unless session.state == "picking"
    raise GraphQL::ExecutionError, "Session cannot pick a game from #{session.state}"
  end

  in_collection = BggThing.merged_for_users(session.group.member_ids).exists?(id: game.id)
  unless in_collection
    raise GraphQL::ExecutionError, "Game is not in the group collection"
  end

  session.update!(picked_game_id: game.id, state: "completed")
  { session: session }
end
```

Cancellation preserves the previous state so the host can reopen exactly where they left off:

```ruby
unless session.can_cancel?
  raise GraphQL::ExecutionError, "Session cannot be cancelled from #{session.state}"
end

session.update!(previous_state: session.state, state: "cancelled")
```

Reopen does the reverse:

```ruby
unless session.can_reopen?
  raise GraphQL::ExecutionError, "Session cannot be reopened from #{session.state}"
end

session.update!(state: session.previous_state || "draft", previous_state: nil)
```

## Why this model works

The state machine is just a column and a few guard methods. There is no background job, no state-machine gem, and no derived status. Each transition is a GraphQL mutation with a dry-validation contract, a host check, and a model guard. That makes the rules easy to unit test and easy to map to UI buttons: if `can_start_picking?` is true, the host sees a "Start Picking" button; otherwise it is hidden or disabled.

The explicit separation of `invited` and `picking` matters because suggestions are only generated in `picking`. Until the host transitions, invitees can still change their RSVP. Once picking starts, the attendee set is locked so the suggestion engine has a stable target. This is documented in [ADR-012](https://github.com/stvmachine/boardgame-night-ror-vue/blob/main/docs/adr/012-session-lifecycle-state-machine.md), and the group-collection view that feeds the suggestions is described in [ADR-011](https://github.com/stvmachine/boardgame-night-ror-vue/blob/main/docs/adr/011-group-collection-view.md).

The main trade-off is that hosts must manually advance the session. For friend groups, that is a feature: it prevents the app from picking a game while people are still discussing whether they can make it. A future auto-advance or nudge job could be added without touching the core state machine.
