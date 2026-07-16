---
phase: 09-home-collection-redesign
plan: 07
subsystem: ui
tags: [vue, pinia, reka-ui, sheet, active-filters, tdd]

requires:
  - phase: 09-home-collection-redesign
    plan: 06
    provides: source-owned filter controls and panel (CollectionFilterPanel) used inside the new workspace

provides:
  - Responsive Collection workspace with local sticky desktop filter panel and mobile Sheet
  - ActiveFilterChips component for visible, independently removable filter restrictions
  - Safe deletion of the legacy CollectionFilters component and spec after coverage migration
  - Verified preservation of sort, grouping, view, collectors, and group invite token on Clear all

affects:
  - 09-home-collection-redesign
  - 08-group-detail-surface

tech-stack:
  added: []
  patterns:
    - "Collection-local filter panel: 264px sticky aside at xl, labelled Sheet trigger below xl"
    - "Pinia-backed shared filter state drives both desktop and Sheet presentations without duplicate controls"
    - "Active-filter chips as removable state buttons with a single Clear all action"
    - "TDD with RED/GREEN commits for workspace and legacy deletion"

key-files:
  created:
    - app/frontend/components/collection/ActiveFilterChips.vue
  modified:
    - app/frontend/views/CollectionView.vue
    - app/frontend/stores/filters.ts
    - spec/frontend/CollectionWorkspace.spec.ts
    - spec/frontend/CollectionView.spec.ts
  removed:
    - app/frontend/components/collection/CollectionFilters.vue
    - spec/frontend/CollectionFilters.spec.ts

key-decisions:
  - "Implemented ActiveFilterChips as a standalone toolbar component rather than embedding chips inside CollectionFilterPanel, keeping the panel focused on editing state and the toolbar on visibility/reset."
  - "Used reka-ui DialogPortal for Sheet content so title/description render outside the VTU wrapper in tests; tests query document to verify Sheet copy."
  - "Reset selectedOwners to all collectors in clearFilters so Clear all removes the owner restriction while preserving the collector list and group token."
  - "Deleted the legacy CollectionFilters component and spec only after replacement suites passed, with a named filesystem assertion as the deletion gate."

patterns-established:
  - "Active-filter chips read from the same Pinia store used by the panel and render independently in the toolbar."
  - "Desktop and mobile filter presentations share one CollectionFilterPanel instance bound to the same reactive state."
  - "Clear all resets only restriction filters, leaving presentation (view), sort, grouping, collectors, and URL parameters such as the group invite token intact."

requirements-completed:
  - COLL-19

coverage:
  - id: D1
    description: "Responsive Collection workspace with xl sticky 264px aside and labelled mobile Sheet"
    requirement: COLL-19
    verification:
      - kind: unit
        ref: "spec/frontend/CollectionView.spec.ts#renders a desktop filter panel aside with exact geometry classes"
        status: pass
      - kind: unit
        ref: "spec/frontend/CollectionView.spec.ts#renders a labelled Filters button and Sheet title/description"
        status: pass
      - kind: unit
        ref: "spec/frontend/CollectionWorkspace.spec.ts#mobile Sheet opens, closes, and traps focus"
        status: pass
    human_judgment: false
  - id: D2
    description: "ActiveFilterChips renders and removes each filter restriction independently"
    requirement: COLL-19
    verification:
      - kind: unit
        ref: "spec/frontend/CollectionWorkspace.spec.ts#renders a search chip and removes it"
        status: pass
      - kind: unit
        ref: "spec/frontend/CollectionWorkspace.spec.ts#renders a player range chip and removes it"
        status: pass
      - kind: unit
        ref: "spec/frontend/CollectionWorkspace.spec.ts#renders a time bucket chip per selected bucket and removes it"
        status: pass
      - kind: unit
        ref: "spec/frontend/CollectionWorkspace.spec.ts#renders a complexity chip and removes it"
        status: pass
      - kind: unit
        ref: "spec/frontend/CollectionWorkspace.spec.ts#renders owner chips only when a subset is selected and removes them"
        status: pass
    human_judgment: false
  - id: D3
    description: "Clear all removes only filter restrictions while preserving sort, grouping, view, collectors, and group token"
    requirement: COLL-19
    verification:
      - kind: unit
        ref: "spec/frontend/CollectionWorkspace.spec.ts#clears all filter restrictions while preserving sort, grouping, and view"
        status: pass
      - kind: unit
        ref: "spec/frontend/CollectionView.spec.ts#shows the clear action on the empty state when filters are active"
        status: pass
    human_judgment: false
  - id: D4
    description: "No duplicate filter controls exist; only one CollectionFilterPanel instance is active"
    requirement: COLL-19
    verification:
      - kind: unit
        ref: "spec/frontend/CollectionView.spec.ts#mounts only one CollectionFilterPanel when the Sheet is closed"
        status: pass
      - kind: unit
        ref: "spec/frontend/CollectionView.spec.ts#does not duplicate active filter controls when the Sheet is closed"
        status: pass
      - kind: unit
        ref: "spec/frontend/CollectionView.spec.ts#does not mount the Sheet panel content while the Sheet is closed"
        status: pass
    human_judgment: false
  - id: D5
    description: "Legacy CollectionFilters component and spec are removed after coverage migration"
    requirement: COLL-19
    verification:
      - kind: unit
        ref: "spec/frontend/CollectionView.spec.ts#has deleted the legacy CollectionFilters component and spec"
        status: pass
      - kind: other
        ref: "test ! -e app/frontend/components/collection/CollectionFilters.vue && test ! -e spec/frontend/CollectionFilters.spec.ts"
        status: pass
    human_judgment: false
  - id: D6
    description: "Merged/group collection modes, import polling, and URL/state preservation remain functional around the new workspace"
    requirement: COLL-19
    verification:
      - kind: unit
        ref: "spec/frontend/CollectionView.spec.ts#enables merged query and disables group query in usernames mode"
        status: pass
      - kind: unit
        ref: "spec/frontend/CollectionView.spec.ts#enables group query and disables merged query in group mode"
        status: pass
      - kind: unit
        ref: "spec/frontend/CollectionView.spec.ts#hydrates collectors from non-empty member bggUsernames in group mode"
        status: pass
      - kind: unit
        ref: "spec/frontend/CollectionView.spec.ts#queues imports from group collection sync statuses"
        status: pass
      - kind: unit
        ref: "spec/frontend/usePermalink.spec.ts"
        status: pass
    human_judgment: false

duration: 13m
completed: 2026-07-16
status: complete
---

# Phase 09 Plan 07: Collection Workspace, Active Filter Chips, and Legacy Filter Deletion Summary

**Responsive Collection workspace with a 264px sticky desktop filter panel, labelled mobile Sheet, independent active-filter chips, and safe removal of the legacy CollectionFilters component/spec after coverage migration.**

## Performance

- **Duration:** 13 min
- **Started:** 2026-07-16T16:27:11+10:00
- **Completed:** 2026-07-16T16:40:00+10:00
- **Tasks:** 2
- **Files modified:** 7 (1 created, 2 removed, 4 modified)

## Accomplishments
- Built `ActiveFilterChips.vue` to display and remove search, player range, time buckets, complexity, and owner restrictions with a single Clear all action.
- Recomposed `CollectionView.vue` with an xl-only 264px sticky filter aside and a labelled mobile Sheet that both share the same `CollectionFilterPanel` instance, eliminating duplicate controls.
- Updated `clearFilters` in `filters.ts` so Clear all resets only restriction filters while preserving view, sort, grouping, collectors, and the `group` invite token.
- Migrated all retained behavior from the legacy `CollectionFilters` suite into `CollectionWorkspace.spec.ts` and `CollectionView.spec.ts` before deleting the obsolete files.
- Verified the full replacement suite (86 tests) passes before and after the legacy deletion, and confirmed no residual references to the deleted component/spec remain.

## Task Commits

Each task was committed atomically with TDD RED/GREEN commits:

1. **Task 1 RED:** `367b448` - test(09-07): add failing tests for collection workspace, chips, and Sheet integration
2. **Task 1 GREEN:** `784380a` - feat(09-07): implement collection workspace, active chips, and Sheet integration
3. **Task 2 RED:** `ff26f44` - test(09-07): assert legacy CollectionFilters files are deleted
4. **Task 2 GREEN:** `17e7257` - feat(09-07): delete legacy CollectionFilters component and spec

**Plan metadata:** (to be committed with final docs update)

## Files Created/Modified
- `app/frontend/components/collection/ActiveFilterChips.vue` - New toolbar component with removable active-filter chips and Clear all.
- `app/frontend/views/CollectionView.vue` - Recomposed collection workspace with sticky desktop panel and Sheet-driven mobile panel.
- `app/frontend/stores/filters.ts` - `clearFilters` now preserves view/sort/grouping/collectors while clearing restrictions.
- `spec/frontend/CollectionWorkspace.spec.ts` - ActiveFilterChips, panel, and migrated-control coverage.
- `spec/frontend/CollectionView.spec.ts` - Workspace integration, duplicate-control prevention, state preservation, and legacy deletion assertion.
- `app/frontend/components/collection/CollectionFilters.vue` - Deleted obsolete legacy component.
- `spec/frontend/CollectionFilters.spec.ts` - Deleted obsolete legacy spec.

## Decisions Made
- **ActiveFilterChips as a standalone toolbar component** rather than embedding chips inside the panel, keeping editing and visibility concerns separate.
- **reka-ui DialogPortal for the Sheet** so Sheet content renders through a portal; tests verify title/description via `document` queries.
- **`clearFilters` resets `selectedOwners` to all collectors** so Clear all removes the active owner restriction without dropping the collector list or the group token.
- **Deletion after coverage migration** with a filesystem assertion in the test suite to enforce the safe ordering.

## Deviations from Plan

None - plan executed exactly as written. The reference scan was refined from the plan's broad `rg -n 'CollectionFilters'` to exclude the intentionally retained `useCollectionFilters` composable, but no additional work or scope change was required.

## Issues Encountered

None.

## Threat Flags

No new security-relevant surface was introduced. The Sheet and focus behavior were implemented with reka-ui's built-in focus management and verified by responsive component tests. The high-severity group-token mitigation (T-09-16) was preserved through existing and new preservation tests.

## Known Stubs

None. All created components are wired to live Pinia state and the composable filter pipeline; no placeholder or mock data paths remain.

## Next Phase Readiness

- The Collection workspace is ready for Plan 09-08 (ViewModeToggle insertion in the reserved toolbar slot) and any downstream phases that consume the collection filter/sort/group state.
- COLL-19 is satisfied. No blockers remain.

## Self-Check: PASSED

- Created file exists: `.planning/phases/09-home-collection-redesign/09-07-SUMMARY.md` ✓
- Verified commits: `367b448`, `784380a`, `ff26f44`, `17e7257` ✓
- Legacy files absent: `app/frontend/components/collection/CollectionFilters.vue`, `spec/frontend/CollectionFilters.spec.ts` ✓
- Replacement suites pass: 86/86 tests across CollectionWorkspace, CollectionView, useCollectionFilters, and usePermalink ✓

---
*Phase: 09-home-collection-redesign*
*Completed: 2026-07-16*
