---
phase: 07-suggestion-engine-backend
reviewed: 2026-07-15T00:00:00Z
depth: standard
files_reviewed: 28
files_reviewed_list:
  - db/migrate/20260714000002_add_suggestion_preferences_to_night_sessions.rb
  - db/schema.rb
  - app/services/suggestions/engine.rb
  - app/models/night_session.rb
  - app/models/bgg_poll.rb
  - app/models/bgg_poll_result.rb
  - app/contracts/create_night_session_contract.rb
  - app/contracts/schedule_session_contract.rb
  - app/contracts/update_session_preferences_contract.rb
  - app/graphql/mutations/create_night_session.rb
  - app/graphql/mutations/schedule_session.rb
  - app/graphql/mutations/update_session_preferences.rb
  - app/graphql/types/mutation_type.rb
  - app/graphql/types/night_session_type.rb
  - app/graphql/types/suggestion_type.rb
  - app/graphql/types/suggestion_breakdown_type.rb
  - app/graphql/types/confidence_level_enum.rb
  - spec/services/suggestions/engine_spec.rb
  - spec/requests/night_session_suggestions_spec.rb
  - spec/models/night_session_spec.rb
  - spec/models/bgg_poll_spec.rb
  - spec/models/bgg_poll_result_spec.rb
  - spec/graphql/create_night_session_mutation_spec.rb
  - spec/graphql/schedule_session_mutation_spec.rb
  - spec/graphql/update_session_preferences_mutation_spec.rb
  - spec/graphql/boardgame_night_schema_spec.rb
  - schema.graphql
  - app/frontend/generated/types.ts
findings:
  critical: 2
  warning: 8
  info: 3
  total: 13
status: issues_found
---

# Phase 07: Suggestion Engine Backend — Code Review Report

**Reviewed:** 2026-07-15T00:00:00Z
**Depth:** standard
**Files Reviewed:** 28
**Status:** issues_found

## Summary

The suggestion engine backend is structurally sound: scoring is deterministic, Dataloader batches polls and owners into single queries, there are no synchronous BGG calls in the GraphQL path, and the generated schema/types are consistent. However, the review identified two critical issues: (1) the `nightSession` query exposes session metadata to unauthenticated users and non-members, and (2) the player-count fallback formula returns zero at the exact min/max boundaries of a published range, silently excluding games that do support the attendee count. Several additional warnings cover authorization gaps, GraphQL ID handling, and mutation atomicity.

## Critical Issues

### CR-01: Unauthenticated session data exposure via `QueryType.night_session`

**File:** `app/graphql/types/query_type.rb:68-69`
**Issue:** The `night_session` resolver returns any session by ID without checking authentication or group membership. Only the `NightSessionType.suggestions` field enforces authorization; all other fields (title, state, scheduledAt, location, capacity, host, group, attendances, attendee list) are visible to anyone who knows the session ID, including unauthenticated users. This leaks event details, attendee identities, and responses.
**Fix:** Require authentication and membership in the resolver, or implement schema-level authorization on the type:

```ruby
# app/graphql/types/night_session_type.rb
class NightSessionType < Types::BaseObject
  def self.authorized?(object, context)
    return false unless context[:current_user].present?
    object.host_id == context[:current_user].id ||
      object.group.member_ids.include?(context[:current_user].id)
  end
end
```

### CR-02: `low_confidence_fallback` excludes games at exact player-count boundaries

**File:** `app/services/suggestions/engine.rb:132-143`
**Issue:** The fallback formula uses a linear distance penalty that reaches zero at the exact published min or max. For a game with `min_players=2, max_players=4` and `attendee_count=2`, the midpoint is 3 and half-range is 1, so `distance/half_range = 1` and the score is `60 * (1 - 1) = 0`. The game is excluded even though 2 is explicitly inside its supported range. The same happens for a 1–6 player game with 1 attendee. The current spec codifies this edge-zero behavior (`engine_spec.rb:373-402`), but it is logically incorrect.
**Fix:** Change the penalty so the edges retain a non-zero fallback score, e.g.:

```ruby
score = 60.0 * (1 - [distance / (half_range + 1), 1.0].min)
```

Then update the affected spec to expect a non-zero boundary value.

## Warnings

### WR-01: Host-only authorization for `schedule_session` and `update_session_preferences`

**Files:** `app/graphql/mutations/schedule_session.rb:36`, `app/graphql/mutations/update_session_preferences.rb:24`
**Issue:** Only the session host can schedule or update preferences. Group owners/admins cannot take over if the host is unavailable, even though `create_night_session` allows owners and admins to create sessions. This creates an inconsistent authorization model.
**Fix:** Allow group owners/admins to manage any session in their group, or explicitly document the host-only restriction.

### WR-02: `schedule_session` performs two separate `update!` calls

**File:** `app/graphql/mutations/schedule_session.rb:44-54`
**Issue:** The state transition (lines 44–49) and the preference update (lines 51–54) are executed as two separate transactions. If the preference update fails after the state has been set to `"invited"`, the session is left in an inconsistent partially updated state.
**Fix:** Combine all attributes into a single `update!` or wrap both updates in `ActiveRecord::Base.transaction`.

### WR-03: Mutations use raw arguments instead of validated contract values

**Files:** `app/graphql/mutations/schedule_session.rb:52-53`, `app/graphql/mutations/update_session_preferences.rb:33-34`
**Issue:** The code checks `unless time_budget_minutes.nil?` using the raw resolver argument instead of `contract[:time_budget_minutes]`. This bypasses the contract’s coercion and is inconsistent with how other fields are handled, increasing the risk of drift if the contract is later changed to coerce or strip values.
**Fix:** Use the contract values:

```ruby
preference_updates[:time_budget_minutes] = contract[:time_budget_minutes] unless contract[:time_budget_minutes].nil?
preference_updates[:complexity_preference] = contract[:complexity_preference] unless contract[:complexity_preference].nil?
```

### WR-04: GraphQL ID arguments are not decoded as GlobalIDs

**Files:** `app/graphql/types/query_type.rb:68`, `app/graphql/mutations/create_night_session.rb:36`, `app/graphql/mutations/schedule_session.rb:33`, `app/graphql/mutations/update_session_preferences.rb:21`
**Issue:** `BoardgameNightSchema` encodes object IDs as GlobalIDs (`object.to_gid_param`), but these resolvers pass the raw ID string directly to `find_by(id: ...)`. If the frontend passes the UUID-style GraphQL ID returned by other queries, the lookup will silently return `nil` and the mutation/query will fail with a misleading “not found” error.
**Fix:** Decode incoming ID arguments with `BoardgameNightSchema.object_from_id(global_id)` or a helper, or use graphql-ruby’s built-in `loads:` option on mutation arguments.

### WR-05: “Any” complexity preference still penalizes every game

**File:** `app/services/suggestions/engine.rb:168-176`
**Issue:** When `complexity_preference` is `"Any"`, `complexity_fit_for` returns 50.0 for every game. Because the component carries a 0.20 weight, this imposes a 10-point penalty relative to a perfect match, contradicting the semantic meaning of “no preference.”
**Fix:** Return `100.0` for `"Any"`, or remove the complexity component from the weighted sum when the preference is `"Any"`.

### WR-06: Games with unknown playtime receive a 60% time fit

**File:** `app/services/suggestions/engine.rb:156-165`
**Issue:** When both `max_playtime` and `playing_time` are nil, `time_fit_for` returns 60.0 because `min` defaults to 0 and `max` defaults to `Float::INFINITY`. An unknown playtime is treated as a partial fit rather than as missing data, and the reason says “Playtime not listed.”
**Fix:** Consider returning a lower score (e.g., 30) or adding a confidence/reason flag when playtime is unknown.

### WR-07: `schedule_session` can fail if a member has no email

**File:** `app/graphql/mutations/schedule_session.rb:57-73`
**Issue:** `InviteToken.create!` requires `email` (DB `null: false`), but `User` allows nil email. If a group member has no email, scheduling fails mid-mutation after the session state has already been updated.
**Fix:** Skip members without email, or validate that all members have email before transitioning the session state.

### WR-08: Missing uniqueness validations on poll-related models

**Files:** `app/models/bgg_poll.rb:7`, `app/models/bgg_poll_result.rb:6-7`
**Issue:** The database has unique indexes on `(bgg_thing_id, name)` for `bgg_polls` and `(bgg_poll_id, player_count, value)` for `bgg_poll_results`, but the models lack matching `validates :uniqueness` validations, leaving a race-condition window for duplicate records.
**Fix:** Add model-level uniqueness validations:

```ruby
# app/models/bgg_poll.rb
validates :name, uniqueness: { scope: :bgg_thing_id }

# app/models/bgg_poll_result.rb
validates :value, uniqueness: { scope: [:bgg_poll_id, :player_count] }
```

## Info

### IN-01: Schema dump missing descriptions for new session mutations

**File:** `schema.graphql`
**Issue:** `createNightSession`, `scheduleSession`, and `updateSessionPreferences` do not have field descriptions in the dumped schema, even though `MutationType` defines them. This suggests the schema artifact is slightly stale.
**Fix:** Regenerate `schema.graphql` (and `app/frontend/generated/types.ts` if descriptions matter to codegen) with `rails graphql:schema:dump`.

### IN-02: `night_session_spec` omits "cancelled" from state inclusion test

**File:** `spec/models/night_session_spec.rb:15`
**Issue:** The matcher checks `%w[draft invited picking completed]` but the model also allows `"cancelled"`. This leaves a coverage gap.
**Fix:** Include `"cancelled"` in the expected array.

### IN-03: Outdated comment in `BoardgameNightSchema` orphan types

**File:** `app/graphql/boardgame_night_schema.rb:8-9`
**Issue:** The comment says “Types defined in this phase are not yet wired into Query/Mutation; expose them as orphan types,” but `NightSessionType`, `AttendanceType`, `PollType`, and `PollResultType` are now wired through the schema.
**Fix:** Update the comment to reflect the current state of the schema.

---

_Reviewed: 2026-07-15T00:00:00Z_
_Reviewer: the agent (gsd-code-reviewer)_
_Depth: standard_
