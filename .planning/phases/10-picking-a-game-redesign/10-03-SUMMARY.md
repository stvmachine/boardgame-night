---
phase: 10-picking-a-game-redesign
plan: 03
subsystem: frontend
status: complete
tags: [vue, typescript, component-tests, ui-spec, accessibility]

requires:
  - phase: 10-picking-a-game-redesign
    plan: 02
    provides: Committed schema, extended NightSession operation, and generated Vue Apollo contracts

provides:
  - Responsive attendee-aware PickingSessionHeader component
  - Focused ordinary-details SessionDetailsEditor Dialog component
  - Focused component tests covering host/non-host, responsive classes, accessibility, validation, save/cancel/failure, and locked preferences

affects:
  - 10-picking-a-game-redesign

tech-stack:
  added: []
  patterns:
    - Source-owned M3 primitives (Badge, Button, AvatarGroup, Dialog, Input)
    - Material Symbols via project Icon wrapper
    - Responsive DOM order preserved with CSS flex-wrap + order utilities
    - Programmatic focus management on Dialog open and error summary

key-files:
  created:
    - app/frontend/components/session/PickingSessionHeader.vue
    - spec/frontend/PickingSessionHeader.spec.ts
    - app/frontend/components/session/SessionDetailsEditor.vue
    - spec/frontend/SessionDetailsEditor.spec.ts

key-decisions:
  - Kept the header's source/DOM order as title/status, metadata, attendees, then Edit Details on every breakpoint by using flex-wrap + responsive order utilities
  - Used AvatarGroup/MemberAvatar with one aria-label on the group and aria-hidden on individual avatars to avoid duplicate screen-reader announcements
  - Rendered two responsive AvatarGroupCount elements so the overflow value is correct at both mobile and desktop caps
  - Implemented SessionDetailsEditor as a local-draft Dialog that reinitializes from server values on every open and discards on cancel
  - Excluded timeBudgetMinutes and complexityPreference from the editor UI and save payload, surfacing only the approved helper copy
  - Focused title input on Dialog open and the error summary on failure using flush: 'post' watchers

requirements-completed:
  - PICK-01

# Metrics
duration: 14min
completed: 2026-07-18
---

# Phase 10 Plan 03: Responsive Picking Header and Edit Details Dialog Summary

**Implemented the responsive Picking session header and focused ordinary-details editor specified by D-01 through D-06, with 30 passing focused component tests and no new dependencies or palette.**

## Performance

- **Duration:** 14 min
- **Started:** 2026-07-18T06:42:09Z
- **Completed:** 2026-07-18T06:56:09Z
- **Tasks:** 2
- **Files created:** 4

## Accomplishments

- Built `PickingSessionHeader` with the approved container, single `h1`, Picking badge, scheduled date/time or Date TBD, location or Location TBD, going-only attendee avatars, and host-only Edit Details action.
- Preserved the exact source/DOM order on every breakpoint: title/status, metadata, attendees, then Edit Details.
- Implemented responsive avatar caps (4 below `md`, 5 at `md+`) with matching `+N` overflow counts and a single accessible group label containing confirmed count and names.
- Exposed `focusEditButton()` so Plan 10-05 can restore focus to the Edit Details trigger after the Dialog closes.
- Built `SessionDetailsEditor` as a controlled source-owned Dialog using the exact field order, copy, and helper line from the UI-SPEC.
- Added inline validation mirroring server limits (required title, 200/2000/200 length bounds, positive capacity) before emitting the ordinary-fields save payload.
- Disabled Save/Cancel and showed `Saving…` with `aria-busy` while `loading` is true.
- Kept the Dialog open and values intact on failure, focused the `role="alert"` error summary, and discarded local edits on Cancel/Escape.
- Added 16 `SessionDetailsEditor` tests covering open/close, field initialization, title focus, validation, save payload, pending state, failure, cancel, and absence of preference controls.
- Added 14 `PickingSessionHeader` tests covering host/non-host, going-only attendees, fallback copy, responsive classes, DOM order, accessible group label, and focus restoration method.

## Task Commits

Each task was committed atomically:

1. **Task 1: Build the responsive attendee-aware Picking header** - `b9e3e33` (feat)
2. **Task 2: Build the focused session-details Dialog** - `a4e645d` (feat)

## Files Created/Modified

- `app/frontend/components/session/PickingSessionHeader.vue` - New responsive session header
- `spec/frontend/PickingSessionHeader.spec.ts` - Header component tests
- `app/frontend/components/session/SessionDetailsEditor.vue` - New details-only Dialog editor
- `spec/frontend/SessionDetailsEditor.spec.ts` - Dialog component tests

## Decisions Made

- Used Tailwind responsive `order` utilities and `flex-wrap` to place Edit Details visually on the desktop header row while keeping it last in DOM/source order, satisfying the accessibility contract without media-query grid-area hacks.
- Chose to render two `AvatarGroupCount` elements with responsive visibility classes so the overflow number is correct at mobile and desktop without JavaScript breakpoint detection.
- Wrapped each `MemberAvatar` in an `aria-hidden` span inside the group so screen readers hear the single group label instead of repeated per-avatar labels.
- Kept the editor's form state local to the component and re-initialized from `session` every time `open` becomes true, ensuring Cancel always discards to server values and the shared `sessionDraft` Pinia store is not used for details editing.
- Focused the error summary with `flush: 'post'` watchers so refs are bound after the Dialog portal renders.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- `vue-tsc --noEmit` reports pre-existing TypeScript errors in unrelated files (e.g., `ComplexityToggleGroup.vue`, `TimeBucketCheckboxes.vue`, `GroupMembersPanel.vue`, `RsvpDashboard.vue`, `SessionSummary.vue`, `useAuth.ts`, `CollectionView.vue`, `GroupsView.vue`, `GroupView.vue`, `HealthView.spec.ts`, `InviteView.vue`, and `NightSessionView.vue`). The two new components and their spec files introduce no new TypeScript errors. The focused component suites pass independently.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- The Picking header and Edit Details dialog are ready to be composed into `NightSessionView` for the PICKING state.
- Next: implement the additive explainable `GameCard` extension and server-ranked top-eight picker in Plan 10-04.

## Self-Check: PASSED

- All created files exist on disk.
- All task commits (`b9e3e33`, `a4e645d`) exist in `git log --oneline -3`.
- Focused component suites pass: `30 tests passed` across both spec files.
- No new TypeScript errors were introduced by the plan's files; `vue-tsc` failures are limited to pre-existing unrelated files.
- No unrelated dirty files were staged or modified.

---
*Phase: 10-picking-a-game-redesign*
*Completed: 2026-07-18*
