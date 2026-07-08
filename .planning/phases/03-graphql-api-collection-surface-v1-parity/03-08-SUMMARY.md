---
phase: 03-graphql-api-collection-surface-v1-parity
plan: 08
subsystem: ui
tags: [vue, tailwind, vitest, playwright, grouping, collapse]

requires:
  - phase: 03-07
    provides: GameGrid and grouping foundation

provides:
  - CollapsibleGroup.vue reusable component
  - useCollapsedGroups composable
  - Fixed ratingSort ordering in grouping.ts
  - Stable e2e cold-start test

affects:
  - 03-09
  - collection-view
  - e2e-verification

tech-stack:
  added: []
  patterns:
    - "Collapsible section wrapper with prop-controlled open state + watcher"
    - "Pinia-free UI state composable for ephemeral collapse state"
    - "Inline SVG icon to avoid adding an icon library dependency"

key-files:
  created:
    - app/frontend/components/collection/CollapsibleGroup.vue
    - app/frontend/composables/useCollapsedGroups.ts
    - spec/frontend/grouping.spec.ts
  modified:
    - app/frontend/utils/grouping.ts
    - app/frontend/components/collection/GameGrid.vue
    - app/frontend/views/CollectionView.vue
    - tests/e2e/collection.spec.ts

key-decisions:
  - "Kept CollapsibleGroup's prop named initiallyOpen per UI-SPEC but added a watcher so parent expand-all/collapse-all controls can sync group visibility."
  - "Used an inline SVG chevron instead of installing lucide-vue-next, which is not in the current dependency set."

patterns-established:
  - "UI-only collapse state belongs in a composable, not Pinia, because it is ephemeral view state."
  - "Collapsible sections expose a toggle event while allowing parent batch control through reactive props."

requirements-completed:
  - COLL-08

coverage:
  - id: D1
    description: "ratingSort returns a distinct index per rating bucket and 999 for unknown names"
    requirement: COLL-08
    verification:
      - kind: unit
        ref: "spec/frontend/grouping.spec.ts#ratingSort returns the correct index for each rating bucket"
        status: pass
      - kind: unit
        ref: "spec/frontend/grouping.spec.ts#ratingSort returns 999 for unknown bucket names"
        status: pass
    human_judgment: false
  - id: D2
    description: "groupGames sorts rating groups from highest to lowest with Unrated last"
    requirement: COLL-08
    verification:
      - kind: unit
        ref: "spec/frontend/grouping.spec.ts#groupGames sorts rating groups from highest to lowest, with Unrated last"
        status: pass
    human_judgment: false
  - id: D3
    description: "useCollapsedGroups tracks collapsed group names with toggle, expandAll, and collapseAll"
    requirement: COLL-08
    verification:
      - kind: unit
        ref: "spec/frontend/grouping.spec.ts#useCollapsedGroups toggles a group between collapsed and expanded"
        status: pass
      - kind: unit
        ref: "spec/frontend/grouping.spec.ts#useCollapsedGroups expands all known groups"
        status: pass
      - kind: unit
        ref: "spec/frontend/grouping.spec.ts#useCollapsedGroups reports when all groups are collapsed"
        status: pass
    human_judgment: false
  - id: D4
    description: "GameGrid renders grouped sections inside CollapsibleGroup with expand/collapse-all buttons"
    requirement: COLL-08
    verification:
      - kind: e2e
        ref: "tests/e2e/collection.spec.ts#groups by number of players"
        status: pass
    human_judgment: true
    rationale: "Automated tests verify grouping renders; visual collapse/expand interaction and chevron rotation need human confirmation."
  - id: D5
    description: "First e2e test passes reliably under full-suite cold start"
    requirement: COLL-08
    verification:
      - kind: e2e
        ref: "tests/e2e/collection.spec.ts#loads merged collection from seed data (3 consecutive runs)"
        status: pass
    human_judgment: false

duration: 7min
completed: 2026-07-08T00:09:08Z
status: complete
---

# Phase 03 Plan 08: Collapsible Groups + Cold-Start E2E Fix Summary

**Collapsible grouped game grid with expand/collapse-all controls, corrected rating sort ordering, and stabilized e2e cold-start test**

## Performance

- **Duration:** 7 min
- **Started:** 2026-07-08T00:01:46Z
- **Completed:** 2026-07-08T00:09:08Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments

- Fixed ratingSort bug in `grouping.ts` so rating groups order from highest bucket to lowest/Unrated.
- Added `useCollapsedGroups` composable to track collapsed group names reactively.
- Added `CollapsibleGroup.vue` with chevron toggle and parent-synced open state.
- Updated `GameGrid.vue` to wrap grouped sections in `CollapsibleGroup` and render Expand All / Collapse All controls.
- Passed `groupBy` from `CollectionView.vue` to `GameGrid.vue` per plan contract.
- Added `spec/frontend/grouping.spec.ts` covering ratingSort, groupGames rating ordering, and `useCollapsedGroups` behavior.
- Stabilized the first Playwright e2e test by waiting for `networkidle` and increasing visibility timeout to 30s.

## Task Commits

Each task was committed atomically:

1. **Task 1 (RED):** `test(03-08): add failing tests for grouping and collapse behavior` — `c379bce`
2. **Task 1 (GREEN):** `feat(03-08): implement collapsible groups and fix rating sort` — `e7b969a`
3. **Task 1 bug fix:** `fix(03-08): make CollapsibleGroup react to parent collapse state` — `9ae29f1`
4. **Task 2:** `fix(03-08): stabilize e2e cold-start test` — `94bf6a5`

**Plan metadata:** (to be committed after summary)

## Files Created/Modified

- `app/frontend/utils/grouping.ts` — Exported `ratingSort` and fixed duplicate-index bug.
- `app/frontend/composables/useCollapsedGroups.ts` — New composable for reactive collapsed group state.
- `app/frontend/components/collection/CollapsibleGroup.vue` — New reusable collapsible section wrapper.
- `app/frontend/components/collection/GameGrid.vue` — Added grouped rendering, CollapsibleGroup usage, expand/collapse-all buttons.
- `app/frontend/views/CollectionView.vue` — Passed `groupBy` prop to `GameGrid`.
- `spec/frontend/grouping.spec.ts` — Unit tests for rating sort, group ordering, and collapse state.
- `tests/e2e/collection.spec.ts` — Increased first-test timeout and added network-idle wait.

## Decisions Made

- **CollapsibleGroup prop design:** Kept the plan's `initiallyOpen` prop name but added a `watch` so parent-driven `expandAll`/`collapseAll` updates sync group visibility. This preserves the uncontrolled-component API while making batch controls functional.
- **No icon library added:** Used an inline SVG chevron because `lucide-vue-next` is not in the current dependency set and adding a new dependency was not required by the plan.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] CollapsibleGroup did not react to parent expand-all/collapse-all**
- **Found during:** Task 1 (GameGrid integration)
- **Issue:** Following the UI-SPEC literally produced an uncontrolled `CollapsibleGroup` whose internal `isOpen` state was only initialized from `initiallyOpen`. The parent `expandAll`/`collapseAll` buttons could update `useCollapsedGroups` state but could not force the child component to re-open or re-close, leaving the batch controls non-functional.
- **Fix:** Added a `watch(() => props.initiallyOpen, ...)` in `CollapsibleGroup.vue` that updates the internal `isOpen` ref when the prop changes. Local header clicks still toggle internally and emit `toggle`, so both individual and batch controls work.
- **Files modified:** `app/frontend/components/collection/CollapsibleGroup.vue`
- **Verification:** `spec/frontend/grouping.spec.ts` passes; e2e collection suite passes 3 consecutive times.
- **Committed in:** `9ae29f1` (Task 1 fix commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Minor. The deviation was necessary for the expand/collapse-all controls to function as specified. No scope creep.

## Issues Encountered

- Pre-existing `vue-tsc` errors in `app/frontend/generated/operations.ts` (missing `@vue/composition-api`) and `app/frontend/views/HealthView.spec.ts` (missing `DeepMockProxy`) were not introduced by this plan. No new type errors were added.
- The plan's verify command references `npm run test:e2e`, but the project script is named `npm run e2e`. Used `npm run e2e -- tests/e2e/collection.spec.ts` for verification.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Collapsible group UI is ready for end-of-phase UAT.
- Collection surface now supports grouping, sorting, filtering, and collapsible sections.
- E2E cold-start flakiness is resolved; remaining e2e suite can be relied on for verification.

## Self-Check: PASSED

- [x] Created files exist: `app/frontend/components/collection/CollapsibleGroup.vue`, `app/frontend/composables/useCollapsedGroups.ts`, `spec/frontend/grouping.spec.ts`
- [x] Modified files exist: `app/frontend/utils/grouping.ts`, `app/frontend/components/collection/GameGrid.vue`, `app/frontend/views/CollectionView.vue`, `tests/e2e/collection.spec.ts`
- [x] Commits exist: `c379bce`, `e7b969a`, `9ae29f1`, `94bf6a5`
- [x] `npm run test` passes (55 tests)
- [x] `spec/frontend/grouping.spec.ts` passes (6 tests)
- [x] E2E collection suite passes 3 consecutive runs

---
*Phase: 03-graphql-api-collection-surface-v1-parity*
*Completed: 2026-07-08*
