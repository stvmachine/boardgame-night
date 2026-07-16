---
phase: 09-home-collection-redesign
plan: 04
subsystem: ui
tags:
  - vue
  - reka-ui
  - select
  - sorting
  - recently-played
  - permalink
  - e2e

requires:
  - phase: 09-03
    provides: Immutable scoped lastPlayedAt and objectid on MergedThing

provides:
  - Four deterministic frontend sort comparators
  - reka-ui Select-based Sort and Group-by controls
  - Legacy sort URL migration with group-token preservation
  - Scoped Recently Played wiring in CollectionView
  - Browser proof for signed-in, group, and anonymous history flows

affects:
  - collection view
  - sort controls
  - permalink hydration

tech-stack:
  added: []
  patterns:
    - reka-ui Select for source-owned dropdowns
    - null-last deterministic comparators with name/id ties
    - LEGACY_SORT_MAP for URL migration

key-files:
  created:
    - spec/frontend/sorting.spec.ts
  modified:
    - app/frontend/utils/sorting.ts
    - app/frontend/composables/usePermalink.ts
    - app/frontend/components/collection/SortControl.vue
    - app/frontend/components/collection/GroupByToggle.vue
    - app/frontend/views/CollectionView.vue
    - spec/frontend/SortControl.spec.ts
    - spec/frontend/usePermalink.spec.ts
    - spec/frontend/CollectionView.spec.ts
    - lib/tasks/e2e.rake
    - tests/e2e/collection.spec.ts

key-decisions:
  - "Keep the sort contract narrow: exactly four product-facing options, deterministic name/id tie-breaks, and null-last missing values."
  - "Use reka-ui Select primitives for Sort and Group-by so the controls are keyboard/portal accessible and match the design system."
  - "Preserve description and lastPlayedAt when normalizing group collection items rather than nulling description."

requirements-completed:
  - COLL-21

coverage:
  - id: D1
    description: Four deterministic sort comparators with null-last values and ties
    requirement: COLL-21
    verification:
      - kind: unit
        ref: spec/frontend/sorting.spec.ts#name_asc/rating_desc/weight_asc/recently_played cases
        status: pass
    human_judgment: false
  - id: D2
    description: reka-ui Select-based SortControl with exactly four approved options
    requirement: COLL-21
    verification:
      - kind: unit
        ref: spec/frontend/SortControl.spec.ts#renders exactly the four approved sort options
        status: pass
    human_judgment: false
  - id: D3
    description: Legacy sort URL migration to approved options while preserving group tokens
    requirement: COLL-21
    verification:
      - kind: unit
        ref: spec/frontend/usePermalink.spec.ts#maps legacy sort values...
        status: pass
      - kind: e2e
        ref: tests/e2e/collection.spec.ts#legacy sort URL migrates to a valid sort
        status: pass
    human_judgment: false
  - id: D4
    description: Scoped lastPlayedAt wired into merged and group collection sorting
    requirement: COLL-21
    verification:
      - kind: unit
        ref: spec/frontend/CollectionView.spec.ts#sorts merged/group collection by scoped lastPlayedAt
        status: pass
      - kind: e2e
        ref: tests/e2e/collection.spec.ts#sorts Recently Played from authorized session history / group mode / anonymous
        status: pass
    human_judgment: false

# Metrics
duration: 20min
completed: 2026-07-16
status: complete
---

# Phase 09 Plan 04: Four-Sort Frontend, Legacy Permalink, and Scoped Recently Played Summary

**Implemented the exact four-sort contract, migrated legacy sort query values, replaced native controls with accessible Select primitives, and wired immutable scoped lastPlayedAt through CollectionView end to end.**

## Performance

- **Duration:** 20 min
- **Started:** 2026-07-16T04:50:00Z
- **Completed:** 2026-07-16T05:09:41Z
- **Tasks:** 3 / 3
- **Files modified:** 10 source/test files

## Accomplishments

- Reduced the sort contract to exactly four product-facing choices: Name A–Z, Rating High–Low, Weight Light–Heavy, and Recently Played.
- Implemented deterministic null-last comparators with name/id tie-breaks for rating, weight, and scoped last-played dates.
- Added a strict `LEGACY_SORT_MAP` so old name/rating/year/weight/complexity sort values migrate to one of the four options while preserving real `group=<inviteCode>` tokens and `groupBy` state.
- Replaced the native `SortControl` and `GroupByToggle` with keyboard/portal-safe reka-ui `Select` primitives and updated unit coverage to target the Select contract.
- Updated `CollectionView` to preserve `description` and `lastPlayedAt` when normalizing group collection items and to feed those dates into `sortGames` in both merged and group modes.
- Seeded a completed NightSession with a picked game and deterministic date in `lib/tasks/e2e.rake` so browser tests have a stable history signal.
- Added Playwright proof for signed-in normal, group, and anonymous Recently Played flows plus exact-option and legacy-sort URL cases.

## Task Commits

Each task was committed atomically:

1. **Task 1: Add reliable RED sort, Select, and Recently Played contracts** - `5bf3e47` (test)
2. **Task 2: Implement four sorts, legacy migration, and Select controls** - `576e35c` (feat)
3. **Task 3: Wire scoped dates into Collection and pass browser history flows** - `ef0587f` (feat)

## Files Created/Modified

- `app/frontend/utils/sorting.ts` - Four deterministic sort comparators and `SORT_OPTIONS`.
- `app/frontend/composables/usePermalink.ts` - `LEGACY_SORT_MAP` and on-hydration URL rewrite for stale sort values.
- `app/frontend/components/collection/SortControl.vue` - reka-ui Select with "Sort by: {label}" trigger.
- `app/frontend/components/collection/GroupByToggle.vue` - reka-ui Select for grouping options.
- `app/frontend/views/CollectionView.vue` - Preserves `lastPlayedAt`/`description` in group normalization and wires dates to `sortGames`.
- `spec/frontend/sorting.spec.ts` - Comparator cases for all four sorts, invalid dates, null-last values, and ties.
- `spec/frontend/SortControl.spec.ts` - Portal-safe Select tests for exact options, labels, model updates, and keyboard selection.
- `spec/frontend/usePermalink.spec.ts` - Legacy sort mapping, unknown fallback, group-token preservation, and serialization.
- `spec/frontend/CollectionView.spec.ts` - Merged and group scoped `lastPlayedAt` sort cases.
- `lib/tasks/e2e.rake` - Completed session with picked game and deterministic date for stable browser history.
- `tests/e2e/collection.spec.ts` - Signed-in, group, anonymous, exact-options, and legacy-sort browser journeys.

## Decisions Made

- **Four options only:** Narrowed the sort surface to the four product choices and migrated legacy values rather than keeping a larger menu.
- **reka-ui Select:** Replaced native selects with source-owned Select primitives to satisfy the M3 design system and accessibility requirements.
- **Preserve group normalization fields:** Kept `description` and `lastPlayedAt` on normalized group items so the redesigned cards can use both without another data pass.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Legacy sort URL persisted stale values after hydration**
- **Found during:** Task 3 E2E verification (`legacy sort URL migrates to a valid sort`)
- **Issue:** `LEGACY_SORT_MAP` correctly mapped `year_desc` to `name_asc` in Pinia state, but because the mapped value matched the default sort, the URL serialization watch did not fire and the invalid `sort=year_desc` remained in the address bar.
- **Fix:** Added an explicit on-hydration URL rewrite in `usePermalink`: when the incoming `sort` param differs from its mapped value, the param is either deleted (if mapped to default) or replaced with the mapped value, then `replaceUrl` is called immediately.
- **Files modified:** `app/frontend/composables/usePermalink.ts`
- **Verification:** `spec/frontend/usePermalink.spec.ts` still passes; `tests/e2e/collection.spec.ts#legacy sort URL migrates to a valid sort` passes.
- **Committed in:** `ef0587f` (Task 3 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 - bug)
**Impact on plan:** The extra URL rewrite is necessary for the legacy migration to actually clean the URL. No scope creep.

## Issues Encountered

- jsdom does not trigger reka-ui `Select` content on click, so portal tests open the menu with `Enter` and select items via keyboard events. This reflects real accessibility behavior and is covered by the unit tests.
- The `spec/frontend/CollectionView.spec.ts` initial preservation test asserted the description would appear in `wrapper.text()`, but the current `GameCard` does not render description. The test was refocused to prove `lastPlayedAt` drives ordering through the normalized merged/group data path.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- COLL-21 is complete from the frontend perspective.
- The four sort choices, Select controls, and scoped Recently Played data are ready for the redesigned Collection cards and filter workspace in later Phase 09 plans.
- No blockers.

---
*Phase: 09-home-collection-redesign*
*Completed: 2026-07-16*

## Self-Check: PASSED

- `app/frontend/utils/sorting.ts` exists
- `app/frontend/components/collection/SortControl.vue` exists
- `app/frontend/components/collection/GroupByToggle.vue` exists
- `spec/frontend/sorting.spec.ts` exists
- Commit `5bf3e47` (Task 1) exists
- Commit `576e35c` (Task 2) exists
- Commit `ef0587f` (Task 3) exists
- All 182 Vitest tests pass
- All 12 `tests/e2e/collection.spec.ts` tests pass
- `tests/e2e/health.spec.ts` passes
- E2E fixtures restored to their pre-run bytes after each browser run
- Unrelated Phase 01 plans, package files, and `09-REVIEWS.md` were not committed
