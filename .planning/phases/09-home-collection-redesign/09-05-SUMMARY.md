---
phase: 09-home-collection-redesign
plan: 05
subsystem: ui
tags: [vue3, reka-ui, pinia, tailwind, shadcn-vue, slider, filters, permalink, tdd]

# Dependency graph
requires:
  - phase: 09-04
    provides: Existing collection filter state, sorting/grouping helpers, and permalink behavior that this plan extended.

provides:
  - Compact `--spacing-compact` Tailwind token (12px) for filter controls.
  - Source-owned, two-thumb, keyboard-accessible reka-ui Slider primitive.
  - Migrated filter store using `PlayerRange`, `Set<number>` time buckets, and `ViewMode`.
  - Range/multi-time/complexity filtering in `useCollectionFilters`.
  - Backward-compatible permalink hydration/serialization for players, time, complexity, view, sort, and group tokens.
  - `PlayerRangeSlider` component adapting the Slider to a 1–10+ player range with reset.

affects:
  - 09-06 (filter panel UI composition)
  - 09-07 (view-mode toggle and clear-filters behavior)
  - 09-08 (game grid/list presentation)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Source-owned shadcn-vue primitive: generated then inspected/reverted, with @lucide/vue replaced by project Icon and M3 tokens preserved."
    - "Pinia setup store holds PlayerRange and Set<number> for multi-select state."
    - "Legacy state shims (playerCount/timeBucket) keep existing components working during migration."
    - "URL parser normalizes and clamps untrusted numeric values before entering Pinia."

key-files:
  created:
    - app/frontend/components/ui/slider/Slider.vue
    - app/frontend/components/ui/slider/index.ts
    - app/frontend/components/collection/PlayerRangeSlider.vue
    - spec/frontend/PlayerRangeSlider.spec.ts
  modified:
    - app/frontend/entrypoints/styles.css
    - app/frontend/components/ui/__tests__/primitives.spec.ts
    - app/frontend/stores/filters.ts
    - app/frontend/utils/filters.ts
    - app/frontend/composables/useCollectionFilters.ts
    - app/frontend/composables/usePermalink.ts
    - spec/frontend/filters.spec.ts
    - spec/frontend/useCollectionFilters.spec.ts
    - spec/frontend/usePermalink.spec.ts
    - spec/frontend/CollectionFilters.spec.ts

key-decisions:
  - "Kept the source-owned Slider after local shadcn-vue generation because it provided the exact reka-ui two-thumb primitive and package checksum gate succeeded."
  - "Projected legacy playerCount/timeBucket as writable computed shims in the filter store to avoid rewriting unrelated CollectionFilters and CollectionView specs mid-phase."
  - "Mapped the full 1–10 slider range back to null so an untouched slider means no restriction, matching the URL omission contract."

patterns-established:
  - "shadcn-vue generator gate: capture before/after shasum of package.json, package-lock.json, and components.json; reject any drift."
  - "Pinia store state for filters is the single source of truth; components adapt via v-model without internal duplicate state."
  - "usePermalink is the only URL writer; it preserves reserved group tokens and migrates legacy values."

requirements-completed: [COLL-19]

# Coverage metadata
coverage:
  - id: D1
    description: "Compact spacing token and source-owned M3 Slider primitive with two-thumb support"
    requirement: COLL-19
    verification:
      - kind: unit
        ref: "app/frontend/components/ui/__tests__/primitives.spec.ts#Slider is a source-owned reka-ui wrapper with two-thumb support"
        status: pass
      - kind: unit
        ref: "app/frontend/components/ui/__tests__/primitives.spec.ts#Slider passes aria-labels to each thumb"
        status: pass
    human_judgment: false
  - id: D2
    description: "Player range, multi-time bucket, and view-mode filter state with backward-compatible URL contracts"
    requirement: COLL-19
    verification:
      - kind: unit
        ref: "spec/frontend/filters.spec.ts#player range filter"
        status: pass
      - kind: unit
        ref: "spec/frontend/useCollectionFilters.spec.ts"
        status: pass
      - kind: unit
        ref: "spec/frontend/usePermalink.spec.ts"
        status: pass
    human_judgment: false
  - id: D3
    description: "Keyboard/touch accessible PlayerRangeSlider component for 1–10+ player selection"
    requirement: COLL-19
    verification:
      - kind: unit
        ref: "spec/frontend/PlayerRangeSlider.spec.ts"
        status: pass
    human_judgment: false

# Metrics
duration: 16m 24s
completed: 2026-07-16
status: complete
---

# Phase 9 Plan 5: Compact Token, Source Slider, and Player-Range Filter Foundation Summary

**Compact 12px spacing token, source-owned reka-ui two-thumb Slider, migrated player-range/multi-time/view filter state, and backward-compatible permalink foundation.**

## Performance

- **Duration:** 16m 24s
- **Started:** 2026-07-16T05:22:27Z
- **Completed:** 2026-07-16T05:38:51Z
- **Tasks:** 3
- **Files modified:** 13

## Accomplishments
- Declared `--spacing-compact: 0.75rem` in `app/frontend/entrypoints/styles.css` before any compact utility use.
- Generated and reviewed the shadcn-vue Slider locally; reverted all CLI side effects (Google Fonts import, duplicate `--font-heading`, extra `@layer base`, and an accidental `@lucide/vue` install) so `package.json`, `package-lock.json`, and `components.json` remained byte-identical.
- Added a source-owned M3-styled `Slider` wrapper using reka-ui with two-thumb support and a `thumbLabels` aria-label prop.
- Migrated `stores/filters.ts` to `PlayerRange`, `Set<number>` time buckets, and `ViewMode`, while retaining legacy `playerCount`/`timeBucket` computed shims for existing components.
- Updated `utils/filters.ts` with a `playerRangeFilter` helper and adjusted `useCollectionFilters` for range, multi-time OR, and Any/Light/Medium/Heavy complexity filtering.
- Rewrote `usePermalink` to hydrate/serialize `players=N`, `players=N-M`, `time=N,M`, `view=list`, migrated sort/group values, and preserve reserved `group` tokens.
- Built `PlayerRangeSlider.vue` as a typed adapter over the source Slider, with null/full-range semantics, 10+ cap label, and reset control.
- Covered all changes with focused Vitest suites: primitives, filters, useCollectionFilters, usePermalink, and PlayerRangeSlider.

## Task Commits

Each task was committed atomically:

1. **Task 1: Declare compact spacing and scaffold the source-owned Slider** - `6934522` (feat)
2. **Task 2 RED: Add failing tests for player-range filter and permalink migration** - `dfecf9c` (test)
3. **Task 2 GREEN: Implement PlayerRange, multi-time bucket, and view-mode filter state** - `70c4462` (feat)
4. **Task 3 RED: Add failing tests for PlayerRangeSlider and thumb labels** - `6c46c6d` (test)
5. **Task 3 GREEN: Add PlayerRangeSlider adapter over source-owned Slider** - `26d62ed` (feat)

## Files Created/Modified

- `app/frontend/entrypoints/styles.css` — added `--spacing-compact: 0.75rem` token.
- `app/frontend/components/ui/slider/Slider.vue` — source-owned two-thumb reka-ui Slider with M3 tokens and `thumbLabels` support.
- `app/frontend/components/ui/slider/index.ts` — barrel export.
- `app/frontend/components/ui/__tests__/primitives.spec.ts` — Slider M3, two-thumb, source-ownership, and thumb-label tests.
- `app/frontend/stores/filters.ts` — `PlayerRange`, `Set<number>` time buckets, `ViewMode`, and legacy `playerCount`/`timeBucket` shims.
- `app/frontend/utils/filters.ts` — `playerRangeFilter` helper alongside existing `playerCountFilter`.
- `app/frontend/composables/useCollectionFilters.ts` — range, multi-time OR, and complexity filtering.
- `app/frontend/composables/usePermalink.ts` — legacy/new URL round-trip with group-token preservation.
- `app/frontend/components/collection/PlayerRangeSlider.vue` — 1–10+ player range adapter with reset.
- `spec/frontend/filters.spec.ts` — `playerRangeFilter` coverage.
- `spec/frontend/useCollectionFilters.spec.ts` — combined filter semantics.
- `spec/frontend/usePermalink.spec.ts` — URL migration and round-trip tests.
- `spec/frontend/PlayerRangeSlider.spec.ts` — null/interacted labels, named thumbs, touch target, reset tests.
- `spec/frontend/CollectionFilters.spec.ts` — adjusted complexity bucket count to match new 3-bucket mapping.

## Decisions Made
- Followed the plan’s generator-gate exactly: verified `package.json`, `package-lock.json`, and `components.json` checksums before and after `./node_modules/.bin/shadcn-vue add slider --yes`.
- Used legacy `playerCount`/`timeBucket` computed shims in the store rather than rewriting `CollectionFilters` and `CollectionView` in this plan, keeping the migration surface small and avoiding scope creep.
- Mapped slider values `[1, 10]` to `null` so the URL omits an unrestricted range and old `players=N` links still parse to a real restriction.
- Kept `complexity` values as `1/2/3` (Light/Medium/Heavy) in the URL, migrating legacy `4` to `3`.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Preserved existing CollectionView and CollectionFilters specs after filter state migration**
- **Found during:** Task 2 GREEN (implementation of migrated filter state)
- **Issue:** Existing `CollectionView.spec.ts` and `CollectionFilters.spec.ts` referenced `playerCount`/`timeBucket` from the store and expected four complexity options; the new store removed those fields and reduced complexity to three buckets.
- **Fix:** Added backward-compatible `playerCount` and `timeBucket` computed shims to `stores/filters.ts` and updated `CollectionFilters.spec.ts` to expect 4 complexity options (Any + 3 buckets).
- **Files modified:** `app/frontend/stores/filters.ts`, `spec/frontend/CollectionFilters.spec.ts`
- **Verification:** Full `npm test` suite passed (24 files, 213 tests).
- **Committed in:** `70c4462` (Task 2 GREEN commit)

**2. [Rule 3 - Blocking] Added ResizeObserver mock for PlayerRangeSlider component tests**
- **Found during:** Task 3 GREEN (running PlayerRangeSlider tests)
- **Issue:** reka-ui `SliderRoot` uses `useSize` which requires `ResizeObserver`, unavailable in jsdom, causing all 8 PlayerRangeSlider tests to fail on mount.
- **Fix:** Added a `ResizeObserver` mock in `spec/frontend/PlayerRangeSlider.spec.ts` `beforeAll` block.
- **Files modified:** `spec/frontend/PlayerRangeSlider.spec.ts`
- **Verification:** `spec/frontend/PlayerRangeSlider.spec.ts` passed; full suite passed.
- **Committed in:** `26d62ed` (Task 3 GREEN commit)

---

**Total deviations:** 2 auto-fixed (1 bug, 1 blocking environment issue)
**Impact on plan:** Both fixes were necessary to keep the existing suite green and the new component testable. No scope creep.

## Issues Encountered
- The shadcn-vue Slider generator introduced a Google Fonts import, a duplicate `--font-heading` declaration, and an unwanted `@lucide/vue` dependency. All were reverted before the Task 1 commit, satisfying the checksum gate.
- `usePermalink` RED tests needed a small boundary adjustment (`minPlaytime: 31` for the 30–60 bucket) and `decodeURIComponent` on the mock router query string to match real Vue Router behavior. These were corrected before the GREEN commit.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Filter state and URL contracts are stable; Plan 09-06 can compose `CollectionFilterPanel` without another state rewrite.
- Plan 09-07 can rely on the `ViewMode` store state and `view=list` permalink contract.
- Plan 09-08 can use the source-owned `Slider` and `PlayerRangeSlider` without duplicating range logic.

## Self-Check: PASSED

- [x] `09-05-SUMMARY.md` created at `.planning/phases/09-home-collection-redesign/09-05-SUMMARY.md`
- [x] Task commits found in git history: `6934522`, `dfecf9c`, `70c4462`, `6c46c6d`, `26d62ed`
- [x] Final metadata commit `b1742f2` includes SUMMARY.md, STATE.md, ROADMAP.md, and REQUIREMENTS.md
- [x] Full `npm test` suite passed: 24 files, 213 tests

---
*Phase: 09-home-collection-redesign*
*Plan: 05*
*Completed: 2026-07-16*
