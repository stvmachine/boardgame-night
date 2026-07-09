---
phase: 04-auth-friend-groups-session-lifecycle
plan: 03
subsystem: api
tags: [rails, graphql, vue, sessions, rsvp, invitations, provisional-users]

requires:
  - phase: 04-auth-friend-groups-session-lifecycle
    plan: 02
    provides: Friend groups, memberships, invite tokens, and magic-link email infrastructure

provides:
  - NightSession and Attendance models with four-state lifecycle
  - createNightSession, scheduleSession, rsvp, and upgradeToAccount GraphQL mutations
  - Session invite magic-link flow with RSVP and provisional user creation
  - Vue session editor, RSVP dashboard, and invite landing page
  - RSpec coverage for models, mutations, and mailers

affects:
  - 04-auth-friend-groups-session-lifecycle

tech-stack:
  added: []
  patterns:
    - GraphQL enum value mapping for lowercase model state strings
    - Atomic UPDATE WHERE status='pending' for invite token redemption
    - Provisional User rows with guest_* usernames and random passwords
    - Public session_invite query for landing-page token resolution

key-files:
  created:
    - app/models/night_session.rb
    - app/models/attendance.rb
    - app/graphql/mutations/create_night_session.rb
    - app/graphql/mutations/schedule_session.rb
    - app/graphql/mutations/rsvp.rb
    - app/graphql/mutations/upgrade_to_account.rb
    - app/graphql/types/night_session_type.rb
    - app/graphql/types/attendance_type.rb
    - app/graphql/types/session_state_enum.rb
    - app/frontend/views/NightSessionView.vue
    - app/frontend/views/InviteView.vue
    - app/frontend/components/session/SessionEditor.vue
    - app/frontend/components/session/RsvpDashboard.vue
    - app/frontend/stores/sessionDraft.ts
    - db/migrate/20260709000006_create_night_sessions.rb
    - db/migrate/20260709000007_create_attendances.rb
    - db/migrate/20260709000008_add_nickname_to_users.rb
  modified:
    - app/models/user.rb
    - app/graphql/types/mutation_type.rb
    - app/graphql/types/query_type.rb
    - app/graphql/types/session_invite_type.rb
    - app/graphql/boardgame_night_schema.rb
    - app/mailers/invite_mailer.rb
    - app/jobs/invite_mailer_job.rb
    - app/frontend/router/index.ts

key-decisions:
  - "Mapped SessionStateEnum values to lowercase database strings (draft/invited/picking/completed) via value: option."
  - "Added a public sessionInvite(token:) query so the shared /invite/:token landing page can distinguish group vs session invites."
  - "Made SessionInviteType.token nullable because the raw token is only available at creation time, not on query."
  - "Used Time.parse(...).to_datetime in schedule/create mutations so dry-validation :date_time accepts ISO8601 input."
  - "Allowed the group owner to create sessions even without an explicit membership row."

patterns-established:
  - "Public invite-token lookup query returns session details only for valid, non-expired session invites."
  - "Atomic UPDATE WHERE status='pending' prevents double-RSVP race conditions."
  - "Provisional users get a random password to satisfy has_secure_password while remaining unable to authenticate."

requirements-completed: [SESS-01, SESS-02, SESS-03, SESS-04, SESS-06]

coverage:
  - id: D1
    description: "Group owner/admin can create a night session with title, date/time, location, and capacity."
    requirement: SESS-01
    verification:
      - kind: unit
        ref: "spec/graphql/create_night_session_mutation_spec.rb#createNightSession mutation"
        status: pass
    human_judgment: false
  - id: D2
    description: "Session owner can schedule a draft session and send magic-link invitations to group members."
    requirement: SESS-02
    verification:
      - kind: unit
        ref: "spec/graphql/schedule_session_mutation_spec.rb#scheduleSession mutation"
        status: pass
      - kind: unit
        ref: "spec/mailers/invite_mailer_spec.rb#session_invite"
        status: pass
    human_judgment: false
  - id: D3
    description: "Invitee can RSVP via magic link without creating an account — Going or Not Going."
    requirement: SESS-03
    verification:
      - kind: unit
        ref: "spec/graphql/rsvp_mutation_spec.rb#rsvp mutation"
        status: pass
    human_judgment: false
  - id: D4
    description: "Session owner sees RSVP attendee count and status list in the dashboard."
    requirement: SESS-04
    verification:
      - kind: unit
        ref: "spec/graphql/rsvp_mutation_spec.rb#rsvp mutation attendee count"
        status: pass
      - kind: unit
        ref: "spec/models/attendance_spec.rb#Attendance"
        status: pass
    human_judgment: false
  - id: D5
    description: "Session transitions from draft to invited when scheduled."
    requirement: SESS-06
    verification:
      - kind: unit
        ref: "spec/graphql/schedule_session_mutation_spec.rb#state transition"
        status: pass
    human_judgment: false

duration: 34min
completed: 2026-07-09
status: complete
---

# Phase 04 Plan 03: Night Sessions & RSVPs Summary

**Night session lifecycle with draft→invited state transitions, magic-link session invitations, no-account RSVP, provisional user creation, and a Vue host dashboard.**

## Performance

- **Duration:** ~34 min
- **Started:** 2026-07-09T08:14:17Z
- **Completed:** 2026-07-09T18:50:00Z
- **Tasks:** 2
- **Files modified:** 40

## Accomplishments

- Added `NightSession` and `Attendance` models with `draft / invited / picking / completed` state machine.
- Implemented `createNightSession`, `scheduleSession`, `rsvp`, and `upgradeToAccount` GraphQL mutations with dry-validation contracts.
- Extended the magic-link email flow to send session invitations and enqueue `InviteMailerJob`.
- Built no-account RSVP flow: provisional `User` rows with `guest_*` usernames, random passwords, and atomic token redemption.
- Added `SessionInvite` public query so the shared `/invite/:token` landing page can distinguish group vs session invites.
- Created Vue `NightSessionView`, `InviteView`, `SessionEditor`, `RsvpDashboard`, and `sessionDraft` Pinia store.
- Wired `/s/:id` route and generated Apollo operations/types.

## Task Commits

Each task followed TDD RED → GREEN:

1. **Task 1: Create session + schedule + invite full-stack slice**
   - RED: `22c4593` — test(phase-04/plan-03): Task 1 failing tests for session + schedule + invite slice
   - GREEN: `97e99a1` — feat(phase-04/plan-03): Task 1 create session + schedule + invite slice
2. **Task 2: RSVP + dashboard + provisional users full-stack slice**
   - RED: `f106238` — test(phase-04/plan-03): Task 2 failing tests for RSVP + provisional user upgrade slice
   - GREEN: `27b2175` — feat(phase-04/plan-03): Task 2 RSVP + dashboard + provisional user upgrade slice
3. **Follow-up host check wiring:** `0a42397` — feat(phase-04/plan-03): wire current user into NightSessionView host check

**Plan metadata:** pending (docs commit after this file)

## Files Created/Modified

- `app/models/night_session.rb` — Night session model with state guards and associations
- `app/models/attendance.rb` — Attendance join model with response validation
- `app/models/user.rb` — Added nickname support and display_name fallback
- `db/migrate/20260709000006_create_night_sessions.rb` — Night sessions table
- `db/migrate/20260709000007_create_attendances.rb` — Attendances table
- `db/migrate/20260709000008_add_nickname_to_users.rb` — Nickname column
- `app/graphql/mutations/create_night_session.rb` — Create session mutation
- `app/graphql/mutations/schedule_session.rb` — Schedule + send invites mutation
- `app/graphql/mutations/rsvp.rb` — Public RSVP mutation
- `app/graphql/mutations/upgrade_to_account.rb` — Convert provisional user to full account
- `app/graphql/types/night_session_type.rb` — Session GraphQL type
- `app/graphql/types/attendance_type.rb` — Attendance GraphQL type
- `app/graphql/types/session_state_enum.rb` — Four-state enum with value mapping
- `app/graphql/types/session_invite_type.rb` — Extended with `session` field; made `token` nullable
- `app/graphql/types/query_type.rb` — Added `nightSession` and `sessionInvite` queries
- `app/graphql/types/mutation_type.rb` — Wired new mutations
- `app/mailers/invite_mailer.rb` — Added `session_invite` email
- `app/jobs/invite_mailer_job.rb` — Branches between group and session invites
- `app/frontend/views/NightSessionView.vue` — Session page with editor and dashboard
- `app/frontend/views/InviteView.vue` — Shared invite landing page for group + session invites
- `app/frontend/components/session/SessionEditor.vue` — Draft session scheduling form
- `app/frontend/components/session/RsvpDashboard.vue` — Host/member response dashboard
- `app/frontend/stores/sessionDraft.ts` — UI-only session draft state
- `app/frontend/router/index.ts` — Added `/s/:id`
- `schema.graphql`, `schema.json` — Regenerated
- `app/frontend/generated/types.ts`, `app/frontend/generated/operations.ts` — Regenerated

## Decisions Made

- **SessionStateEnum mapped to lowercase DB strings:** The model stores `state` as lowercase (`draft`, `invited`, etc.), but GraphQL enums expose uppercase values. Used `value: "draft"` etc. to bridge the two.
- **Public `sessionInvite(token:)` query added:** The plan said to determine invite type by query or token check; no such query existed. Added a lightweight public query so the shared `/invite/:token` route can render the correct UI.
- **`SessionInviteType.token` made nullable:** The raw token is intentionally never persisted. It is only available when the invite is first created, so returning it on a query would require storing the raw token or exposing the digest. Making the field nullable preserves security.
- **Datetime parsing in mutations:** GraphQL `ISO8601DateTime` inputs reach resolvers as strings. Converted them to `DateTime` before passing to dry-validation `:date_time` predicates.
- **Group owner allowed to create sessions without explicit membership:** `Group.create!` in tests and some flows does not create a membership row for the owner, so the mutation also checks `group.owner_id == current_user.id`.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Added public sessionInvite query for shared invite landing page**
- **Found during:** Task 2 (InviteView implementation)
- **Issue:** The plan required InviteView to determine whether `/invite/:token` is a group or session invite, but no backend query existed to distinguish them.
- **Fix:** Added `sessionInvite(token:)` query to `QueryType` and a `session` field to `SessionInviteType`. The query returns session details only for valid, non-expired session invites; otherwise the view falls back to the group-join UI.
- **Files modified:** `app/graphql/types/query_type.rb`, `app/graphql/types/session_invite_type.rb`, `app/frontend/views/InviteView.vue`, `app/frontend/apollo/queries/session_invite.graphql`
- **Verification:** All RSpec and Vitest tests pass; schema regenerated.
- **Committed in:** `27b2175` (Task 2 commit)

**2. [Rule 1 - Bug] Fixed GraphQL enum / DB state mismatch**
- **Found during:** Task 1 GREEN run
- **Issue:** `SessionStateEnum` values were uppercase (`DRAFT`), but `NightSession.state` stored lowercase (`draft`), causing `UnresolvedValueError` when scheduling.
- **Fix:** Mapped each enum value to its lowercase DB string using `value:` keyword argument.
- **Files modified:** `app/graphql/types/session_state_enum.rb`
- **Verification:** `scheduleSession` mutation spec passes.
- **Committed in:** `97e99a1` (Task 1 commit)

**3. [Rule 1 - Bug] Fixed datetime validation failures**
- **Found during:** Task 1 GREEN run
- **Issue:** `CreateNightSessionContract` and `ScheduleSessionContract` used `maybe(:date_time)`, which rejected the ISO8601 string values passed by GraphQL.
- **Fix:** Added `parse_datetime` helper in mutations to convert string/Time inputs to `DateTime` before validation.
- **Files modified:** `app/graphql/mutations/create_night_session.rb`, `app/graphql/mutations/schedule_session.rb`
- **Verification:** Mutation specs with `scheduledAt` variable pass.
- **Committed in:** `97e99a1` (Task 1 commit)

**4. [Rule 1 - Bug] Allowed group owner to create sessions when no membership row exists**
- **Found during:** Task 1 GREEN run
- **Issue:** `createNightSession` only checked `group_memberships`, but a group owner created without a membership row was rejected.
- **Fix:** Added `group.owner_id == current_user.id` as an authorized path.
- **Files modified:** `app/graphql/mutations/create_night_session.rb`
- **Verification:** `createNightSession` mutation spec passes.
- **Committed in:** `97e99a1` (Task 1 commit)

**5. [Rule 2 - Missing Critical] Wired current user into host check for dashboard visibility**
- **Found during:** Task 2 review
- **Issue:** `RsvpDashboard` visibility was stubbed to `route.params.id`, which is not the actual current user.
- **Fix:** Added `currentUser` query and used it to compute `isHost` in `NightSessionView`.
- **Files modified:** `app/frontend/views/NightSessionView.vue`, `app/frontend/apollo/queries/current_user.graphql`
- **Verification:** Vitest tests pass; component compiles.
- **Committed in:** `0a42397` (follow-up commit)

---

**Total deviations:** 5 auto-fixed (2 Rule 1 bugs, 3 Rule 2 missing critical)
**Impact on plan:** All fixes were necessary for correctness, security, or the shared landing page to function. No scope creep beyond the minimal query needed for token type resolution.

## Issues Encountered

- `gsd-tools query state.advance-plan` and `state.record-metric` failed because the existing `STATE.md` format does not match the parser expectations. Planning files will be updated manually.
- Pre-existing Vue LSP module-resolution warnings for `*.vue` imports are not actual runtime errors; Vitest and Vite resolve the SFCs correctly.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Night session lifecycle (draft → invited) is complete and tested.
- Provisional user pattern and RSVP flow are in place.
- Ready for Plan 04-04 (game picking and session completion) to build on `PICKING` and `COMPLETED` states.
- No blockers.

## Self-Check: PASSED

- Verified `04-03-SUMMARY.md` exists on disk.
- Verified all task commits exist in git history: `22c4593`, `97e99a1`, `f106238`, `27b2175`, `0a42397`.
- Verified final test suite: 39/39 RSpec examples pass, 80/80 Vitest tests pass.
- Verified `schema.graphql` and `schema.json` regenerated.

---
*Phase: 04-auth-friend-groups-session-lifecycle*
*Completed: 2026-07-09*
