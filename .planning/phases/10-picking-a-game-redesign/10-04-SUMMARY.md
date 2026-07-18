---
phase: 10-picking-a-game-redesign
plan: 04
subsystem: frontend
status: complete
tags: [vue, typescript, component-tests, ui-spec, accessibility]

requires:
  - phase: 10-picking-a-game-redesign
    plan: 03
    provides: Responsive PickingSessionHeader and SessionDetailsEditor components

provides:
  - Additive explainable suggestion-card extension for GameCard
  - Server-ranked top-eight GamePicker shortlist with host-only pick behavior
  - Focused component tests for GameCard and GamePicker covering regression, ordering, roles, and mutation lifecycle

affects:
  - 10-picking-a-game-redesign

tech-stack:
  added: []
  patterns:
    - Source-owned M3 primitives (Card, Badge, Button, Skeleton, EmptyState)
    - Optional additive Vue props to preserve Phase 9 collection behavior
    - Apollo mutation result drives completion; no Pinia copy or optimistic state

key-files:
  created:
    - spec/frontend/GamePicker.spec.ts
  modified:
    - app/frontend/components/collection/GameCard.vue
    - spec/frontend/GameCard.spec.ts
    - app/frontend/components/session/GamePicker.vue

key-decisions:
  - GameCard suggestion context (score/confidence/reasons) is additive; when absent, no suggestion-only DOM or state is rendered
  - GamePicker reads only session.suggestions, preserves server order, and caps display at eight with no client search/filter/ranking
  - Host-only pick action uses a global pending guard; all actions disable during flight and errors stay scoped to the selected card

requirements-completed:
  - PICK-02
  - PICK-03

# Metrics
duration: 15min
completed: 2026-07-18
---

# Phase 10 Plan 04: Additive Suggestion Card and Ranked Shortlist Summary

**Extended the Phase 9 GameCard with an additive explainable suggestion layer and rewrote GamePicker to consume the server-ranked top-eight shortlist exactly as specified by D-08 through D-15.**

## Performance

- **Duration:** 15 min
- **Started:** 2026-07-18T20:10:00Z
- **Completed:** 2026-07-18T20:20:00Z
- **Tasks:** 2 (TDD RED + GREEN for each)
- **Files created/modified:** 4

## Accomplishments

- Extended `GameCard.vue` with optional `score`, `confidence`, and `reasons` props so the card renders identically to its Phase 9 collection card when those props are absent.
- Added a rounded integer score pill with tabular numerals, an explicit confidence badge (`High confidence` / `Medium confidence` / `Low confidence`), and first-three backend reason chips.
- Added a `Show more reasons` disclosure with `aria-expanded` and `aria-controls` for the remaining reason chips, preserving BGG/action isolation on click and keyboard.
- Rewrote `GamePicker.vue` around `session.suggestions` only, removing the group-collection query, search, filters, and Browse All fallback.
- Rendered the exact heading `Game Suggestions (Filtered for N Players)` and read-only chips `Up to N min` and `X complexity` from server preferences.
- Implemented host-only `Pick this game` action, non-host guidance `The host will choose the game.`, pending `Picking…` state, all-action disable during flight, scoped inline error, and `picked(gameName)` emit on a successful mutation result.
- Added approved loading skeletons (8 card-shaped), query error state with `Try again`, and the two empty states (`No confirmed players yet` / `No games fit this night`).
- Used the approved responsive grid: `grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6`.
- Added 26 GameCard tests (including 10 new suggestion-context cases) and 14 GamePicker tests, all passing.

## Task Commits

Each TDD task was committed atomically as RED then GREEN:

1. **Task 1 RED: GameCard suggestion tests** - `c0c4dea` (test)
2. **Task 1 GREEN: GameCard extension** - `5ee9bf7` (feat)
3. **Task 2 RED: GamePicker tests** - `e7751eb` (test)
4. **Task 2 GREEN: GamePicker rewrite** - `d554154` (feat)

## Files Created/Modified

- `app/frontend/components/collection/GameCard.vue` — Additive score, confidence, reason chips, disclosure, and action/keyboard isolation
- `spec/frontend/GameCard.spec.ts` — Extended collection regression + suggestion-context coverage
- `app/frontend/components/session/GamePicker.vue` — Server-ranked top-eight picker, host-only pick action, loading/error/empty states
- `spec/frontend/GamePicker.spec.ts` — New focused test suite for the picker

## Decisions Made

- Kept `GameCard` changes strictly additive so Phase 9 collection rendering and existing tests are untouched when suggestion props are absent.
- Used a plain `<button>` for the `Show more reasons` disclosure to avoid adding a new primitive dependency and to keep focus/click handling lightweight.
- Scoped the pending/error UI to the selected suggestion while disabling all pick buttons globally during flight, preventing competing submissions without blocking retry after a failure.
- Chose `error?: any` for the `GamePicker` error prop because `unknown` triggered a `withDefaults` type error with this Vue TypeScript setup; the runtime contract remains the same (any Apollo/query error object).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Missing rating/weight badges in grid variant after inserting suggestion block**
- **Found during:** Task 1 GREEN (running the full GameCard suite)
- **Issue:** The new suggestion block was inserted after the description but accidentally replaced the existing rating/weight badges in the grid variant; the existing test `renders rating and weight badges` failed.
- **Fix:** Re-inserted the rating/weight badge row immediately after the suggestion block, before the owner avatars, in the grid variant only.
- **Files modified:** `app/frontend/components/collection/GameCard.vue`
- **Verification:** `npm test -- spec/frontend/GameCard.spec.ts` passed (26/26).
- **Committed in:** `5ee9bf7` (Task 1 GREEN)

### Other Adjustments

- Changed the `GamePicker` `error` prop from `unknown` to `any` to satisfy the Vue `withDefaults` + `defineProps` type checker. This is a type-only change with no runtime effect on the Apollo error object passed by the parent.

## Issues Encountered

- The full-project `./node_modules/.bin/vue-tsc --noEmit` still reports pre-existing TypeScript errors in unrelated files (e.g., `ComplexityToggleGroup.vue`, `TimeBucketCheckboxes.vue`, `GroupMembersPanel.vue`, `RsvpDashboard.vue`, `SessionSummary.vue`, `useAuth.ts`, `CollectionView.vue`, `GroupsView.vue`, `GroupView.vue`, `InviteView.vue`, `NightSessionView.vue`, `HealthView.spec.ts`). The files created/modified by this plan (`GameCard.vue`, `GamePicker.vue`, `GameCard.spec.ts`, `GamePicker.spec.ts`) produce no new type errors after the `error?: any` adjustment. The focused component suites pass independently.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- The additive `GameCard` and ranked `GamePicker` are ready to be wired into `NightSessionView` for the `PICKING` state in Plan 10-05.
- Next: integrate the header, picker, edit-details dialog, and route-level state-driven composition with deterministic E2E fixtures.

## Self-Check: PASSED

- All created/modified files exist on disk.
- All task commits (`c0c4dea`, `5ee9bf7`, `e7751eb`, `d554154`) exist in `git log --oneline -5`.
- Focused component suites pass: `40 tests passed` across `GameCard.spec.ts` and `GamePicker.spec.ts`.
- `vue-tsc --noEmit` reports no new errors in the plan's files; remaining failures are pre-existing unrelated files.
- No unrelated dirty files were staged or modified.

---
*Phase: 10-picking-a-game-redesign*
*Completed: 2026-07-18*
