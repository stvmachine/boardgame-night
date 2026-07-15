---
phase: 08-group-detail-surface
plan: 02
subsystem: ui
tags: [vue, typescript, tailwind, vitest, playwright, graphql, apollo]

requires:
  - phase: 08-01
    provides: group route, layout, and approved/error route contracts

provides:
  - responsive role-aware group header with name, badge, description, and Create a night action
  - active session list with state-aware CTAs, date/time, and attendee count
  - group detail composition wiring header, sessions, and create-session mutation
  - route-level loading, error, and not-found states for GroupView
  - e2e fixture and browser contract for the header/sessions happy path
  - unit tests for header, sessions, and route states

affects:
  - 08-03
  - 08-04
  - 08-05

tech-stack:
  added: []
  patterns:
    - container view (GroupView) owns route-level skeleton/error/not-found states
    - presentational components (GroupHeader, GroupSessionsList) receive typed props and callbacks
    - Apollo mutation updates the active Group cache entry and navigates to /s/:id
    - e2e seed uses a fixed E2ENIGHTOWLS group with deterministic sessions for stable assertions
    - Vitest tests mount route components with a mocked vue-router and Apollo provider

key-files:
  created:
    - app/frontend/components/group/GroupHeader.vue
    - app/frontend/components/group/GroupSessionsList.vue
    - app/frontend/components/group/GroupDetail.vue
    - spec/frontend/GroupDetail.spec.ts
    - tests/e2e/group_detail.spec.ts
    - tests/e2e/fixtures/e2e_group.json
  modified:
    - app/frontend/views/GroupView.vue
    - lib/tasks/e2e.rake

key-decisions:
  - "Use a single GroupDetail container that delegates layout to GroupHeader and GroupSessionsList; keeps route view thin and state isolated."
  - "Session cards are compact list rows (not full cards) to match the UI-SPEC density; visual hierarchy is driven by text size, badge, and trailing CTA."
  - "Create a night uses the existing useCreateNightSessionMutation, updates the cached Group query, and pushes to /s/:id rather than refetching the group."
  - "E2E seed locks E2ENIGHTOWLS name and creates a deterministic set of sessions so browser assertions remain stable across runs."
  - "Use Date TBD and TBD placeholders for sessions without scheduledAt so the UI still renders a predictable row."

patterns-established:
  - "Group detail sub-components are pure props-in/events-out; Apollo/router concerns live in GroupDetail.vue."
  - "Empty state copy differs by role: managers see an actionable Create a night button, members see neutral copy."
  - "Status-aware CTA labels are derived from session status and isHost, not hardcoded in the template."
  - "Route state tests mount the actual vue-router and assert on navigation events."

requirements-completed:
  - GROUP-07
  - GROUP-08

coverage:
  - id: D1
    description: "Responsive group header shows approved name, member-count badge, description, and manager-only Create a night action."
    requirement: GROUP-07
    verification:
      - kind: unit
        ref: "spec/frontend/GroupDetail.spec.ts#renders group header with name, badge, description, and manager create button"
        status: pass
      - kind: e2e
        ref: "tests/e2e/group_detail.spec.ts#renders the group header"
        status: pass
    human_judgment: false
  - id: D2
    description: "Header layout adapts to desktop (right-aligned action) and mobile (full-width action below description)."
    requirement: GROUP-07
    verification:
      - kind: unit
        ref: "spec/frontend/GroupDetail.spec.ts#uses mobile layout"
        status: pass
    human_judgment: true
    rationale: "Visual responsive layout (stack vs. row) is best confirmed by a human eyeballing the rendered breakpoints; unit tests only assert class presence."
  - id: D3
    description: "Active sessions list shows date or Date TBD, status, title, time, confirmed attendee count, and exact state-aware CTA."
    requirement: GROUP-08
    verification:
      - kind: unit
        ref: "spec/frontend/GroupDetail.spec.ts#renders sessions with correct CTA per state"
        status: pass
      - kind: e2e
        ref: "tests/e2e/group_detail.spec.ts#shows the active sessions list with state-aware CTAs"
        status: pass
    human_judgment: false
  - id: D4
    description: "Managers see create-enabled empty state; ordinary members see neutral copy with no unauthorized action."
    requirement: GROUP-08
    verification:
      - kind: unit
        ref: "spec/frontend/GroupDetail.spec.ts#shows member empty state without create button"
        status: pass
    human_judgment: false
  - id: D5
    description: "Create a night mutation creates a real draft, updates the Group cache, and navigates to /s/:id."
    requirement: GROUP-08
    verification:
      - kind: unit
        ref: "spec/frontend/GroupDetail.spec.ts#creates a night and navigates to /s/:id"
        status: pass
    human_judgment: false
  - id: D6
    description: "GroupView renders skeleton, error, and not-found route states."
    requirement: GROUP-08
    verification:
      - kind: unit
        ref: "spec/frontend/GroupDetail.spec.ts#shows loading state"
        status: pass
      - kind: unit
        ref: "spec/frontend/GroupDetail.spec.ts#shows error state"
        status: pass
      - kind: unit
        ref: "spec/frontend/GroupDetail.spec.ts#shows not found state"
        status: pass
    human_judgment: false

duration: 17min
completed: 2026-07-15
status: complete
---

# Phase 8 Plan 2: Group Header and Sessions Surface Summary

**Responsive group header with member-count badge, role-aware Create a night action, and a compact active-sessions list with state-aware CTAs wired to real GraphQL mutations.**

## Performance

- **Duration:** 17 min
- **Started:** 2026-07-15T03:01:28Z
- **Completed:** 2026-07-15T03:18:44Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments

- Added a deterministic e2e group fixture (`E2ENIGHTOWLS`) and a browser contract covering the header and sessions happy path.
- Built `GroupHeader.vue` with approved name, member-count badge, description, and responsive Create a night placement.
- Built `GroupSessionsList.vue` with compact rows for date/status/title/time/attendees and state-aware CTAs.
- Composed both in `GroupDetail.vue` with the existing `useCreateNightSessionMutation`, Apollo cache update, and `/s/:id` navigation.
- Completed `GroupView.vue` skeleton, error, and not-found route states.
- Added unit tests for header, sessions, empty states, role variations, and route states.
- All 96 Vitest tests and the targeted e2e spec pass; production build succeeds.

## Task Commits

Each task was committed atomically:

1. **Task 1: Define e2e happy path and fixtures** - `682a03c` (test)
2. **Task 2: Add GroupDetail component specs for header, sessions, and route states** - `e51f6c2` (test)
3. **Task 2: Implement responsive group header and sessions list** - `c56ad31` (feat)

**Plan metadata:** (to be committed as `docs(08-02): complete group header and sessions surface plan`)

## Files Created/Modified

- `app/frontend/components/group/GroupHeader.vue` - Responsive role-aware group header
- `app/frontend/components/group/GroupSessionsList.vue` - Accessible active-session list and empty state
- `app/frontend/components/group/GroupDetail.vue` - Header/sessions composition and create-session handler
- `app/frontend/views/GroupView.vue` - Route-level skeleton, error, and not-found states
- `spec/frontend/GroupDetail.spec.ts` - Unit tests for header, sessions, and route states
- `tests/e2e/group_detail.spec.ts` - Authenticated browser contract for header and sessions
- `tests/e2e/fixtures/e2e_group.json` - Deterministic e2e group fixture
- `lib/tasks/e2e.rake` - Extended seed with fixed group and sessions

## Decisions Made

- Use a single `GroupDetail` container so `GroupView` stays thin and only owns route-level loading/error states.
- Keep session rows compact (title, time, badge, trailing CTA) rather than full cards to match the UI-SPEC density.
- Create a night writes through the existing mutation, patches the cached `Group` query, and routes to `/s/:id` instead of refetching the group.
- E2E seed pins the `E2ENIGHTOWLS` group and creates deterministic sessions so browser assertions are stable.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Group header and sessions surface is ready.
- Next plans (08-03 members, 08-04 invite, 08-05 collection spotlight) can now rely on the group route and session list as a foundation.
- No blockers.

---
*Phase: 08-group-detail-surface*
*Completed: 2026-07-15*

## Self-Check: PASSED

- All created files exist: GroupHeader.vue, GroupSessionsList.vue, GroupDetail.vue, GroupView.vue, GroupDetail.spec.ts, group_detail.spec.ts.
- All task commits exist: `682a03c`, `e51f6c2`, `c56ad31`.
