---
phase: 09-home-collection-redesign
plan: 08
subsystem: ui
tags: [vue, pinia, reka-ui, cards, skeletons, playwright, tdd]

requires:
  - phase: 09-home-collection-redesign
    plan: 07
    provides: responsive Collection workspace, filter panel, active chips, and reserved toolbar View slot

provides:
  - URL-backed accessible Grid/List presentation control with grid as the default
  - Rich vertical grid cards and horizontal list cards with safe BGG activation
  - Grouped and ungrouped layouts that preserve the selected card presentation
  - Twelve-item grid/list skeletons matching the selected view
  - Integrated frontend, backend, generated-contract, build, and browser verification

affects:
  - 10-picking-a-game-redesign
  - collection
  - shared-permalinks

tech-stack:
  added: []
  patterns:
    - "URL presentation state: serialize only non-default view=list; invalid values normalize to grid"
    - "One keyboard-operable card activation target with nested-interactive-event guards"
    - "Plain-text descriptions and fixed-host BGG URLs built from persisted objectid"
    - "View-matched loading geometry propagated through grouped and ungrouped results"

key-files:
  created:
    - app/frontend/components/collection/ViewModeToggle.vue
  modified:
    - app/frontend/components/collection/GameCard.vue
    - app/frontend/components/collection/GameGrid.vue
    - app/frontend/components/collection/ResultsSkeleton.vue
    - app/frontend/views/CollectionView.vue
    - spec/frontend/GameCard.spec.ts
    - tests/e2e/collection.spec.ts

key-decisions:
  - "Grid remains the default presentation; only view=list is serialized into shared URLs."
  - "Descriptions use Vue text interpolation only; no v-html path is permitted."
  - "External activation uses persisted objectid and noopener,noreferrer while nested controls remain independent."
  - "Server data stays in Apollo; Pinia owns only view and permalink UI state."

patterns-established:
  - "Collection presentation variants flow from URL-backed Pinia state through CollectionView to every grouped/ungrouped card and skeleton leaf."
  - "Rich cards expose one guarded keyboard/click activation surface and cap visible owner avatars at three plus an overflow count."

requirements-completed:
  - COLL-20
  - COLL-22
  - COLL-23

coverage:
  - id: D1
    description: "Collection URLs reproduce an accessible single-selected Grid/List presentation with grid as the default"
    requirement: COLL-22
    verification:
      - kind: unit
        ref: "spec/frontend/ViewModeToggle.spec.ts"
        status: pass
      - kind: unit
        ref: "spec/frontend/CollectionView.spec.ts#reproduces rich list view from the permalink"
        status: pass
      - kind: e2e
        ref: "tests/e2e/collection.spec.ts#shares a rich list collection permalink"
        status: pass
    human_judgment: false
  - id: D2
    description: "Grid and list cards show safe plain-text descriptions, rating, owners, and player/time/complexity metadata"
    requirement: COLL-20
    verification:
      - kind: unit
        ref: "spec/frontend/GameCard.spec.ts"
        status: pass
      - kind: e2e
        ref: "tests/e2e/collection.spec.ts#shares a rich list collection permalink"
        status: pass
      - kind: other
        ref: "! rg -n 'v-html' app/frontend/components/collection/GameCard.vue"
        status: pass
    human_judgment: false
  - id: D3
    description: "Grouped and ungrouped collection results preserve the selected grid/list geometry and stable item counts"
    requirement: COLL-20
    verification:
      - kind: unit
        ref: "spec/frontend/GameGrid.spec.ts"
        status: pass
      - kind: unit
        ref: "spec/frontend/CollectionView.spec.ts"
        status: pass
    human_judgment: false
  - id: D4
    description: "Initial loading renders twelve skeletons matching the selected grid or list view"
    requirement: COLL-23
    verification:
      - kind: unit
        ref: "spec/frontend/ResultsSkeleton.spec.ts"
        status: pass
      - kind: unit
        ref: "spec/frontend/CollectionView.spec.ts"
        status: pass
    human_judgment: false
  - id: D5
    description: "The complete Home and Collection redesign remains deployable across frontend, GraphQL, generated contracts, production build, and browser journeys"
    verification:
      - kind: integration
        ref: "npm test && npm run build"
        status: pass
      - kind: integration
        ref: "bundle exec rspec spec/graphql/dashboard_stats_query_spec.rb spec/graphql/discovery_query_spec.rb spec/graphql/last_played_at_query_spec.rb"
        status: pass
      - kind: e2e
        ref: "npm run e2e -- tests/e2e/health.spec.ts tests/e2e/home.spec.ts tests/e2e/collection.spec.ts"
        status: pass
    human_judgment: false

duration: 9h elapsed plus resumed verification
completed: 2026-07-17
status: complete
---

# Phase 09 Plan 08: Rich Grid/List Cards and Integrated Collection Gate Summary

**URL-backed grid/list presentation, rich safe BGG cards, grouped layout propagation, view-matched skeletons, and a fully passing Home/Collection deployment gate.**

## Performance

- **Duration:** 9h elapsed implementation window plus resumed verification
- **Started:** 2026-07-16T16:57:09+10:00
- **Completed:** 2026-07-17T22:06:05Z
- **Tasks:** 3 implementation tasks plus one browser-correction commit
- **Files modified:** 14

## Accomplishments

- Added an accessible `ViewModeToggle` whose Grid/List choice survives reload and sharing through the existing permalink contract.
- Rebuilt Collection cards for vertical grid and horizontal list layouts with plain-text descriptions, capped owner avatars, null-safe metadata, and isolated BGG activation.
- Propagated presentation through grouped and ungrouped results and rendered twelve matching skeletons during initial loading.
- Preserved collection filters, sorting, grouping, import/refresh, error, empty, and anonymous/group collection behavior around the redesign.
- Passed 279 frontend tests, the production build, 22 focused GraphQL examples, stable schema/codegen regeneration, and all 16 Home/Collection/health Playwright journeys.

## Task Commits

Each task was committed atomically with TDD RED/GREEN commits:

1. **Task 1 RED — rich-list permalink contracts:** `31366f2` - test(09-08): add failing tests for rich list view cards and permalink
2. **Task 2 GREEN — URL-backed view toggle:** `e780b9b` - feat(09-08): compose URL-backed accessible view toggle
3. **Task 3 GREEN — rich cards, grouped layouts, and skeletons:** `3d1e28d` - feat(09-08): ship rich cards, view-matched skeletons, and grouped layouts
4. **Integrated browser correction:** `7951d12` - fix(09-08): align collection E2E with redesigned controls

**Plan metadata:** committed with this summary.

## Files Created/Modified

- `app/frontend/components/collection/ViewModeToggle.vue` - Accessible Material Symbols Grid/List single-select control.
- `app/frontend/components/collection/GameCard.vue` - Rich grid/list card anatomy and guarded external BGG activation.
- `app/frontend/components/collection/GameGrid.vue` - Propagates selected presentation through grouped and ungrouped results.
- `app/frontend/components/collection/ResultsSkeleton.vue` - Twelve view-matched loading placeholders.
- `app/frontend/views/CollectionView.vue` - Connects permalink view state to toolbar, results, and loading branches.
- `spec/frontend/ViewModeToggle.spec.ts` - Selection, fallback, keyboard, focus, and hit-target coverage.
- `spec/frontend/GameCard.spec.ts` - Anatomy, plain text, owner cap, null fallback, URL, opener, keyboard, and nested-control coverage.
- `spec/frontend/GameGrid.spec.ts` - Grouped/ungrouped variant propagation and stable item-count coverage.
- `spec/frontend/ResultsSkeleton.spec.ts` - Grid/list twelve-item geometry coverage.
- `tests/e2e/collection.spec.ts` - Shared rich-list permalink and integrated browser journey.
- `app/frontend/components/collection/CollectionFilterPanel.vue` - Stable browser locator for the redesigned player-range control.
- `lib/tasks/e2e.rake` - Deterministic seeded history needed by Recently Played browser assertions.

## Decisions Made

- Grid is the default presentation; `view=list` is the only non-default URL value.
- Descriptions remain plain text and never enter an HTML rendering path.
- BGG navigation uses the generated persisted `objectid` on a fixed host with `noopener,noreferrer`.
- Nested interactive controls never activate the card-level external navigation target.
- Playwright commands preserve both mutable E2E fixture JSON files byte-for-byte with backup/restore traps.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Aligned stale browser selectors and deterministic history setup with the redesigned controls**
- **Found during:** Task 3 integrated browser gate
- **Issue:** Existing Playwright assertions targeted pre-redesign slider/card behavior, and the seeded Recently Played history needed deterministic records on every run.
- **Fix:** Added a stable range-control locator, idempotent E2E history seeding, and updated browser assertions to the shipped accessible controls and rich card anatomy.
- **Files modified:** `app/frontend/components/collection/CollectionFilterPanel.vue`, `app/frontend/components/collection/GameCard.vue`, `lib/tasks/e2e.rake`, `tests/e2e/collection.spec.ts`
- **Verification:** 13/13 Collection E2E tests and the final 16-test combined health/Home/Collection gate passed.
- **Committed in:** `7951d12`

---

**Total deviations:** 1 auto-fixed blocking integration issue
**Impact on plan:** The correction preserved scope and made the planned browser proof deterministic; no product capability was added beyond Plan 09-08.

## Issues Encountered

- The first final combined browser run rendered “Couldn't reach the server” in `health.spec.ts` while Home and Collection passed. A protected isolated health rerun passed, and the exact combined gate then passed all 16 journeys, classifying the earlier result as transient managed-server startup/connectivity evidence rather than a product regression.
- The first resume wrapper used zsh's reserved `status` variable and exited before Playwright started. The wrapper was corrected to `exit_code`; its `EXIT` trap still restored fixture bytes.

## User Setup Required

None - no external service configuration required.

## Threat Flags

- Untrusted descriptions are rendered through Vue text interpolation only.
- External URLs use a fixed BGG host/path plus persisted `objectid` and opener isolation.
- Nested controls are guarded from card activation, and invalid URL view values normalize to grid.

## Known Stubs

None. The view mode, cards, grouped layouts, and skeletons are wired to live collection and permalink state.

## Next Phase Readiness

- Phase 9's Home and Collection redesign implementation is complete and ready for phase-level review and verification.
- Phase 10 can reuse the rich card, metadata, avatar, badge, and responsive presentation patterns for attendee-aware game suggestions.
- No Plan 09-08 blocker remains.

## Self-Check: PASSED

- Created file exists: `.planning/phases/09-home-collection-redesign/09-08-SUMMARY.md` ✓
- Verified implementation commits: `31366f2`, `e780b9b`, `3d1e28d`, `7951d12` ✓
- Frontend suite: 28 files, 279 tests passed ✓
- Focused GraphQL suite: 22 examples, 0 failures ✓
- Production build passed; schema/codegen checksums remained stable across two regenerations ✓
- Protected Playwright gate: 16/16 health, Home, and Collection journeys passed; fixture checksums restored ✓

---
*Phase: 09-home-collection-redesign*
*Completed: 2026-07-17*
