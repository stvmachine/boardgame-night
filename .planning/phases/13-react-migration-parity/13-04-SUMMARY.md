---
phase: 13-react-migration-parity
plan: 04
subsystem: frontend-group-detail
tags: [react, apollo, graphql, react-router, vitest, playwright, accessibility]

requires:
  - phase: 13-react-migration-parity
    plan: 01
    provides: Generated React Apollo group query and mutation hooks
  - phase: 13-react-migration-parity
    plan: 02
    provides: Live React navigation, product-data, and anonymous group boundaries
provides:
  - Role-aware Group Detail header and server-ordered upcoming-session journey
  - Authorized shared-collection spotlight with safe BoardGameGeek links
  - Owner/admin membership controls with accessible inline removal confirmation
  - Canonical group-link copy and role-bounded email invitations
affects: [13-05, 13-06, group-detail, group-sessions, invitations]

actuals:
  tokens: 13120
  tasks: 3
  commits: 6

tech-stack:
  added: []
  patterns:
    - Generated Apollo hooks remain the sole Group Detail data and mutation boundary
    - Role-aware controls mirror server authorization without replacing it
    - Mutation cache reconciliation uses server-returned entity identities
    - Mobile source order matches the approved coordination hierarchy

key-files:
  created: []
  modified:
    - app/frontend/pages/GroupPage.tsx
    - tests/vitest/group-page.spec.tsx

key-decisions:
  - "Keep Group Detail on the generated GetGroup and group mutation hooks, using raw query fields where adapters lose attendee or role data."
  - "Preserve backend session order and role-filtered visibility instead of duplicating sorting or authorization in React."
  - "Allow admins to remove non-owner peers, including other admins, while reserving all role changes for owners and re-authorizing every mutation on Rails."
  - "Keep Play History after the five required coordination sections so the shipped extension remains reachable without displacing the approved hub order."

patterns-established:
  - "Group cache updates identify the scoped Group and reconcile only server-returned session or membership identities."
  - "Manager controls are absent for ordinary members, but client visibility never substitutes for mutation authorization."
  - "External spotlight activation uses persisted BGG object IDs, React escaping, and noopener noreferrer."

requirements-completed:
  - RMP-01
  - RMP-02
  - RMP-03
  - RMP-05

coverage:
  - id: D1
    description: Group Detail renders its approved header and server-ordered session rows with role-correct creation, cache reconciliation, and navigation.
    requirement: RMP-02
    verification:
      - kind: integration
        ref: "tests/vitest/group-page.spec.tsx#GroupPage header and upcoming sessions (3/3 passed)"
        status: pass
      - kind: e2e
        ref: "tests/e2e/group_detail.spec.ts#owner and member session journeys"
        status: pass
    human_judgment: false
  - id: D2
    description: Authorized users see a bounded collection spotlight, safe BGG links, joined membership roles, and role-correct update/removal controls.
    requirement: RMP-01
    verification:
      - kind: integration
        ref: "tests/vitest/group-page.spec.tsx#GroupPage collection spotlight and members (6/6 passed)"
        status: pass
      - kind: e2e
        ref: "tests/e2e/group_detail.spec.ts#owner sees Members card and manager-only Invite people card"
        status: pass
    human_judgment: false
  - id: D3
    description: Owners and admins can copy the canonical group URL and send role-bounded email invitations with accessible success and error behavior.
    requirement: RMP-03
    verification:
      - kind: integration
        ref: "tests/vitest/group-page.spec.tsx#GroupPage invitations and integrated order (5/5 passed)"
        status: pass
      - kind: e2e
        ref: "tests/e2e/group_detail.spec.ts#owner can copy invite link and see Copied feedback"
        status: pass
    human_judgment: false
  - id: D4
    description: The five coordination sections remain visible and source-ordered at 375px, with Play History preserved afterward and no horizontal page overflow.
    requirement: RMP-05
    verification:
      - kind: automated_ui
        ref: "tests/vitest/group-page.spec.tsx#keeps the five coordination sections in mobile source order before Play History"
        status: pass
      - kind: e2e
        ref: "npm run e2e -- tests/e2e/group_detail.spec.ts (5/5 passed)"
        status: pass
    human_judgment: false

duration: 22 min
completed: 2026-08-01
status: complete
---

# Phase 13 Plan 04: Group Detail Parity Summary

**React Group Detail now coordinates server-ordered sessions, the shared collection, role-aware membership management, and invitations through generated Apollo operations in the approved responsive hub.**

## Performance

- **Duration:** 22 min
- **Started:** 2026-08-01T12:21:08Z
- **Completed:** 2026-08-01T12:43:23Z
- **Tasks:** 3
- **Files modified:** 2

## Accomplishments

- Replaced the legacy Group summary with the approved role-aware header, ordered session rows, real session creation, Apollo reconciliation, and route navigation.
- Added the bounded shared-collection spotlight and joined member/membership controls with safe external links, role boundaries, inline confirmation, focus management, and mutation error retention.
- Added canonical invite-link copy, polite success feedback, owner/admin invitation forms, owner-only Admin selection, mobile source-order protection, and preserved Play History.

## Task Commits

Each task was committed atomically:

1. **Task 1 RED: Group header and upcoming sessions** - `2dff515` (test)
2. **Task 1 GREEN: Role-aware group sessions** - `9d03e66` (feat)
3. **Task 2 RED: Spotlight and membership contracts** - `41c0dd0` (test)
4. **Task 2 GREEN: Spotlight and member controls** - `e8d42bb` (feat)
5. **Task 3 RED: Invitation and mobile contracts** - `782cfe0` (test)
6. **Task 3 GREEN: Invitation controls and integrated proof** - `0a07ce1` (feat)

## Files Created/Modified

- `app/frontend/pages/GroupPage.tsx` - Complete generated-hook Group Detail coordination hub.
- `tests/vitest/group-page.spec.tsx` - Fourteen focused role, order, cache, clipboard, invitation, error, and mobile-order checks.

## Decisions Made

- Used generated Group query/mutation hooks exclusively and retained ActiveGroupContext synchronization for mobile and collection destinations.
- Preserved server order and authorization-filtered data instead of re-ranking sessions or fetching an unscoped parallel collection.
- Used labelled, source-owned action controls and inline confirmation because no React dropdown primitive exists in the current active component library.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Removed duplicate draft placeholder copy**
- **Found during:** Task 3 browser verification
- **Issue:** A seeded undated draft rendered both the required date-block `TBD` and `Time TBD · TBD`, producing duplicate exact text and failing the established browser contract.
- **Fix:** Kept the required date-block `TBD` and changed the secondary line to a single meaningful schedule placeholder when both time and location are undecided.
- **Files modified:** `app/frontend/pages/GroupPage.tsx`
- **Verification:** Group Detail component suite 14/14 and Playwright 5/5 passed.
- **Committed in:** `0a07ce1`

**2. [Rule 1 - Bug] Corrected focused-test isolation and clipboard observation**
- **Found during:** Tasks 2 and 3 GREEN verification
- **Issue:** Two multi-render tests retained earlier DOM trees, and `userEvent.setup()` installs its own clipboard stub after the shared test setup.
- **Fix:** Explicitly cleaned up between role renders and spied on the installed clipboard method used by the interaction.
- **Files modified:** `tests/vitest/group-page.spec.tsx`
- **Verification:** Focused component suite passed 14/14.
- **Committed in:** `e8d42bb`, `0a07ce1`

---

**Total deviations:** 2 auto-fixed bugs. **Impact on plan:** Both fixes preserve the approved behavior and strengthen deterministic evidence without expanding scope or weakening assertions.

## Issues Encountered

- The configured `gsd-executor` model alias (`kimi-for-coding/k2.7-code`) was unavailable. The dispatch failed before startup and produced no repository writes; execution continued through the workflow's sequential inline fallback.
- Vite continues to report the existing advisory warning for a JavaScript chunk larger than 500 kB; the production build exits successfully.

## User Setup Required

None - no external service configuration required.

## Verification

- `npm test -- tests/vitest/group-page.spec.tsx` — 14/14 passed
- `npm run typecheck` — passed
- `npm run build` — passed
- `npm run e2e -- tests/e2e/group_detail.spec.ts` — 5/5 passed

## Self-Check: PASSED

- Both scoped implementation/test files exist and all six TDD commits are present.
- Header, sessions, spotlight, membership, invitation, cache, responsive, and Play History acceptance criteria are covered by passing component or browser evidence.
- No generated, backend, package, collection, or E2E files were modified.
- Excluded `.planning/research/.cache/*.json` files remain untracked and unstaged.

## Next Phase Readiness

- Plan 13-05 can consume the complete Group Detail hub for past-session and invitation/RSVP route parity.
- No Plan 13-04 blocker remains.

---
*Phase: 13-react-migration-parity*
*Completed: 2026-08-01*
