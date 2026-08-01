---
phase: 13-react-migration-parity
plan: 05
subsystem: ui
tags: [react, react-router, apollo-client, graphql, vitest, playwright, rsvp, invite]

requires:
  - phase: 13-01
    provides: React + Vite scaffold, generated Apollo hooks, App routing shell
  - phase: 13-04
    provides: Group Detail page with session list, PlaceholderPage pattern, component primitives

provides:
  - Authorized group past-session history route (`/g/:token/sessions`)
  - Auth-aware invite/RSVP page (`/invite/:token`) with binary Going/Not Going response
  - Focused Vitest suites for both pages
  - Updated App.tsx concrete routing for the two new pages

affects:
  - 13-06
  - session-lifecycle

actuals:
  tokens: 7816
  tasks: 2
  commits: 4

tech-stack:
  added: []
  patterns:
    - "Route-level generated-hook query with skip-when-missing-token"
    - "Component tests mock generated hooks and AuthContext to avoid ApolloProvider boilerplate"
    - "Binary RSVP controls disabled during mutation loading and replaced by confirmation on success"

key-files:
  created:
    - app/frontend/pages/GroupSessionsPage.tsx
    - app/frontend/pages/InvitePage.tsx
    - tests/vitest/group-sessions-page.spec.tsx
    - tests/vitest/invite-page.spec.tsx
  modified:
    - app/frontend/App.tsx

key-decisions:
  - "Kept past-session list in server order rather than re-sorting client-side, matching the existing Group Detail session-list behavior."
  - "Used title-case 'Going' / 'Not Going' labels in the UI while sending lowercase 'going' / 'not_going' response values to the Rails backend."
  - "Stored the successful RSVP response in local component state populated from the mutation return, avoiding manual cache manipulation."
  - "Showed a sign-in action with a return path query parameter for signed-out invite viewers rather than redirecting automatically."

patterns-established:
  - "Page-level components own loading/error/empty/success states and render accessible headings and progressbars."
  - "Route tokens are passed to generated Apollo hooks and the query is skipped when the token is missing."
  - "Mutations are tested with mocked hook tuples; pending state disables controls and errors render an alert without removing controls."

requirements-completed:
  - RMP-02
  - RMP-03
  - RMP-05

coverage:
  - id: D1
    description: "Authorized past-session history route displays completed/cancelled nights and picked games"
    requirement: RMP-02
    verification:
      - kind: unit
        ref: "tests/vitest/group-sessions-page.spec.tsx#GroupSessionsPage loading and error states / GroupSessionsPage past sessions list"
        status: pass
      - kind: e2e
        ref: "playwright: tests/e2e/full_user_flow.spec.ts -g 'past sessions'"
        status: pass
    human_judgment: false
  - id: D2
    description: "Invite page shows session context and a sign-in action carrying the invite return path for signed-out viewers"
    requirement: RMP-03
    verification:
      - kind: unit
        ref: "tests/vitest/invite-page.spec.tsx#InvitePage signed-out viewer"
        status: pass
    human_judgment: false
  - id: D3
    description: "Authenticated invitees can submit Going or Not Going RSVP and see a confirmation with the returned response"
    requirement: RMP-03
    verification:
      - kind: unit
        ref: "tests/vitest/invite-page.spec.tsx#InvitePage authenticated RSVP"
        status: pass
    human_judgment: false
  - id: D4
    description: "Expired, used, and invalid invite tokens show safe non-mutating states"
    requirement: RMP-05
    verification:
      - kind: unit
        ref: "tests/vitest/invite-page.spec.tsx#InvitePage loading and invalid states"
        status: pass
    human_judgment: false

duration: 69 min
completed: 2026-08-01
status: complete
---

# Phase 13 Plan 05: Past-Session and Invite/RSVP Route Migration Summary

**Authorized past-session history route and auth-aware invite RSVP page implemented as generated-hook-driven React pages with focused Vitest and Playwright evidence.**

## Performance

- **Duration:** 69 min
- **Started:** 2026-08-01T13:20:41Z
- **Completed:** 2026-08-01T14:30:04Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments

- Implemented `GroupSessionsPage` at `/g/:token/sessions` to render the group's completed and cancelled `pastSessions` in server order, including picked-game thumbnail/name and a responsive date/status/location card layout.
- Implemented `InvitePage` at `/invite/:token` to display invite session context, signed-out sign-in action, and authenticated binary Going/Not Going RSVP controls with pending, success, and error states.
- Wired both routes into `App.tsx` while preserving the `/g/:token` and unknown-route fallback.
- Added focused Vitest suites for both pages covering loading, error, not-found, empty, signed-out, authenticated, pending, success, and mutation-failure states.
- Verified the past-session route end-to-end with the targeted Playwright `full_user_flow.spec.ts` "past sessions" case.

## Task Commits

Each task was committed atomically using TDD:

1. **Task 1: Implement authorized past-session history**
   - RED: `6f6f871` — `test(13-05): add failing tests for authorized past-session history`
   - GREEN: `7330a6f` — `feat(13-05): implement authorized past-session history`
2. **Task 2: Implement auth-aware invite RSVP and normalized reconciliation**
   - RED: `12e4205` — `test(13-05): add failing tests for invite RSVP page`
   - GREEN: `34e1fba` — `feat(13-05): implement auth-aware invite RSVP page`

## Files Created/Modified

- `app/frontend/pages/GroupSessionsPage.tsx` — Past-session history page with loading, error, empty, and list states.
- `app/frontend/pages/InvitePage.tsx` — Invite RSVP page with session context, auth prompt, and binary RSVP controls.
- `app/frontend/App.tsx` — Concrete `/g/:token/sessions` and `/invite/:token` route wiring.
- `tests/vitest/group-sessions-page.spec.tsx` — Component tests for GroupSessionsPage.
- `tests/vitest/invite-page.spec.tsx` — Component tests for InvitePage.

## Decisions Made

- Followed the plan's TDD sequence: RED test commit, then minimal implementation commit for each task.
- Rendered the session state badge using the shared `StateBadge` primitive; tests assert the uppercase badge text that users see.
- For signed-out invite viewers, rendered a sign-in link that carries the invite path as a `return` query parameter rather than auto-redirecting, preserving the user's navigation intent.
- Kept the RSVP success confirmation in component state derived from the mutation response, avoiding speculative cache writes and ensuring the UI reflects only server-returned data.

## Deviations from Plan

None - plan executed as specified.

## Issues Encountered

- **Pre-existing unit test failure:** `tests/vitest/adapters.spec.ts > toGame > maps GqlMergedThing to Game` fails because the adapter now returns `description` and `lastPlayedAt` fields that the test expectation does not include. This is unrelated to the routes implemented in this plan. It was logged in the deferred items for the phase and not fixed here.
- **LSP jest-dom type warnings:** Existing Vitest test files show `toBeInTheDocument` type errors from missing `@testing-library/jest-dom` type declarations in the editor. The tests run and pass; this is an existing development-environment type issue, not a runtime failure.

## Known Stubs

No intentional stubs were introduced. The new pages read from real generated GraphQL hooks and route parameters.

## Threat Flags

No new threat surface beyond the plan's threat model was introduced. The implemented controls align with the STRIDE register:

| Threat ID | Status | Notes |
|-----------|--------|-------|
| T-13-05-01 | Mitigated | RSVP controls are gated by `AuthContext`; Rails remains authoritative for token/user/response validation. Signed-out path is tested negatively. |
| T-13-05-02 | Accepted | Invite preview exposes only session title, group, host, date, and location as intended. |
| T-13-05-03 | Mitigated | Past sessions are fetched through the authorized `group(token)` query. |
| T-13-05-04 | Mitigated | RSVP success state uses only the mutation-returned attendance id/response. |
| T-13-05-05 | Accepted | Server persistence is authoritative; the UI confirms the returned response and exposes failures. |

## Next Phase Readiness

- The `/g/:token/sessions` and `/invite/:token` routes are real React pages and are ready for the full invite-to-picking browser journey in Plan 13-06.
- No blockers from this plan.

---
*Phase: 13-react-migration-parity*
*Completed: 2026-08-01*

## Self-Check: PASSED

- Created files exist:
  - `app/frontend/pages/GroupSessionsPage.tsx`
  - `app/frontend/pages/InvitePage.tsx`
  - `tests/vitest/group-sessions-page.spec.tsx`
  - `tests/vitest/invite-page.spec.tsx`
- Summary file exists: `.planning/phases/13-react-migration-parity/13-05-SUMMARY.md`
- Task commits found in git log:
  - `6f6f871` test(13-05): add failing tests for authorized past-session history
  - `7330a6f` feat(13-05): implement authorized past-session history
  - `12e4205` test(13-05): add failing tests for invite RSVP page
  - `34e1fba` feat(13-05): implement auth-aware invite RSVP page