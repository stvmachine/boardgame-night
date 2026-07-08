---
phase: 03-graphql-api-collection-surface-v1-parity
plan: 09
subsystem: ui
tags: [vue, tailwind, pinia, collapsible-section, sidebar, filters]

requires:
  - phase: 03-graphql-api-collection-surface-v1-parity
    provides: Shared filter/collectors Pinia stores and CollectionFilters component from prior plans

provides:
  - Reusable CollapsibleSection Vue component
  - Sidebar restructured into collapsible Filters and Collectors panels
  - CollectionFilters moved from main content into the Sidebar
  - Active-filter badge and Clear filters action in the sidebar
  - CollectionView main content reduced to sort/group bar + game grid

affects:
  - 03-graphql-api-collection-surface-v1-parity

tech-stack:
  added: []
  patterns:
    - Collapsible panel with title, badge slot, and v-show body
    - Pinia ui store owns section open/close state
    - Shared Pinia filterStore connects Sidebar filters to CollectionView grid

key-files:
  created:
    - app/frontend/components/common/CollapsibleSection.vue
  modified:
    - app/frontend/components/layout/Sidebar.vue
    - app/frontend/components/layout/CollectorsSection.vue
    - app/frontend/views/CollectionView.vue
    - app/frontend/stores/ui.ts
    - spec/frontend/CollapsibleSection.spec.ts
    - spec/frontend/Sidebar.spec.ts

key-decisions:
  - "Included the existing collector remove list inside the Collectors collapsible section so removal functionality is preserved and the entire collector area is toggled together."
  - "Bound CollapsibleSection open state directly to uiStore refs so toggle actions are straightforward and the UI remains fully controlled."

requirements-completed:
  - COLL-14

coverage:
  - id: D1
    description: Reusable CollapsibleSection component with title, chevron, badge slot, and toggle event
    requirement: COLL-14
    verification:
      - kind: unit
        ref: spec/frontend/CollapsibleSection.spec.ts
        status: pass
    human_judgment: false
  - id: D2
    description: Sidebar renders Filters and Collectors as collapsible sections
    requirement: COLL-14
    verification:
      - kind: unit
        ref: spec/frontend/Sidebar.spec.ts
        status: pass
    human_judgment: false
  - id: D3
    description: CollectionFilters lives in the Sidebar Filters section with active-filter badge and Clear filters
    requirement: COLL-14
    verification:
      - kind: unit
        ref: spec/frontend/Sidebar.spec.ts
        status: pass
    human_judgment: false
  - id: D4
    description: CollectionView main content contains only the sort/group bar and the game grid
    requirement: COLL-14
    verification:
      - kind: other
        ref: npx vue-tsc --noEmit (no new errors)
        status: pass
      - kind: other
        ref: npm run test (all 64 existing tests still pass)
        status: pass
    human_judgment: true
    rationale: Layout change is verified by absence of CollectionFilters in the view and passing type checks/tests, but visual confirmation of the main-content layout is still valuable.

duration: 8min
completed: 2026-07-08T00:23:43Z
status: complete
---

# Phase 03 Plan 09: Collapsible Sidebar Sections Summary

**Collapsible Filters and Collectors panels move filter controls out of the main collection grid and into the sidebar.**

## Performance

- **Duration:** 8 min
- **Started:** 2026-07-08T00:14:45Z
- **Completed:** 2026-07-08T00:23:43Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments

- Built a reusable `CollapsibleSection` component with a titled header, rotating chevron, optional badge slot, and `v-show` body.
- Restructured `Sidebar.vue` into two collapsible panels: Filters (containing `CollectionFilters`) and Collectors (containing `CollectorsSection`).
- Added an active-filter badge to the Filters header and a Clear filters action that appears only when filters are active.
- Removed filter inputs from `CollectionView.vue`, leaving only the sort/group bar and the game grid in the main content area.
- Extended the `ui` Pinia store with `filtersOpen`/`collectorsOpen` and toggle actions so section collapse state persists across re-renders.

## Task Commits

Each task was committed atomically:

1. **Task 1: Collapsible sidebar sections (TDD)** - `bfc359f` (test) + `8d23aaa` (feat)
2. **Task 2: Remove filter inputs from CollectionView** - `5fdeecc` (feat)

**Plan metadata:** to be committed after summary

## Files Created/Modified

- `app/frontend/components/common/CollapsibleSection.vue` - New reusable collapsible panel
- `app/frontend/components/layout/Sidebar.vue` - Restructured into collapsible Filters and Collectors sections
- `app/frontend/components/layout/CollectorsSection.vue` - Removed duplicate heading; kept select/deselect buttons at top of section body
- `app/frontend/stores/ui.ts` - Added `filtersOpen`/`collectorsOpen` refs and toggles
- `app/frontend/views/CollectionView.vue` - Removed `CollectionFilters`; kept sort/group bar and game grid
- `spec/frontend/CollapsibleSection.spec.ts` - New tests for toggle, defaultOpen, and badge slot
- `spec/frontend/Sidebar.spec.ts` - Updated tests for sections, `CollectionFilters` placement, badge, and clear action

## Decisions Made

- Included the existing collector remove list inside the Collectors collapsible section so the remove action remains available while the whole collector area toggles together.
- Bound `CollapsibleSection` open state directly to `uiStore` refs and updated them from the emitted `toggle` event, keeping the component fully controlled without extra model plumbing.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- Vue Test Utils `isVisible()` did not detect `v-show` state in jsdom for this project, so the `CollapsibleSection` tests assert the inline `display: none` style set by `v-show` instead. This is a test-implementation detail, not a behavior change.
- `npx vue-tsc --noEmit` reports two pre-existing errors unrelated to this plan (`app/frontend/generated/operations.ts` missing `@vue/composition-api` and `app/frontend/views/HealthView.spec.ts` importing `DeepMockProxy` from vitest). No new TypeScript errors were introduced.

## Next Phase Readiness

- Sidebar layout now matches the COLL-14 / UI-SPEC sidebar panel design.
- Collection view layout is ready for further responsive/mobile drawer refinements.

## Self-Check: PASSED

- [x] `app/frontend/components/common/CollapsibleSection.vue` created
- [x] `03-09-SUMMARY.md` created
- [x] Task commits `bfc359f`, `8d23aaa`, `5fdeecc` exist in git history
- [x] `npm run test` passes (64/64 tests)
- [x] `npx vue-tsc --noEmit` reports no new errors

---
*Phase: 03-graphql-api-collection-surface-v1-parity*
