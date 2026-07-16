---
phase: 09-home-collection-redesign
plan: 06
subsystem: ui
tags: [vue3, reka-ui, pinia, shadcn-vue, toggle, toggle-group, checkbox, filters, tdd]

requires:
  - phase: 09-05
    provides: Source-owned Slider, compact spacing token, migrated filter store, and URL/permalink contracts.

provides:
  - Source-owned Toggle and ToggleGroup primitives styled with M3 tokens.
  - TimeBucketCheckboxes multi-select OR control with full-label targets.
  - ComplexityToggleGroup single-select segmented control (Any/Light/Medium/Heavy).
  - OwnerAvatarToggles multi-select OR control with avatar buttons and select-all/clear.
  - CollectionFilterPanel ordered Search → Owners → Players → Playing time → Complexity form.
  - Vitest interaction coverage for controls and panel order.

affects:
  - 09-07 (view-mode toggle and clear-filters behavior)
  - 09-08 (game grid/list presentation)
  - 10-picking-game-redesign (ComplexityToggleGroup reuse)

tech-stack:
  added: []
  patterns:
    - "Source-owned shadcn-vue generator gate: checksum before/after, then revert package/styles side effects."
    - "Filter controls bind directly to Pinia store refs via v-model; no internal duplicate state."
    - "reka-ui ToggleGroup type=single for segmented single-select with arrow/Enter/Space keyboard support."
    - "reka-ui Checkbox model-value contract for controlled boolean state."

key-files:
  created:
    - app/frontend/components/ui/toggle/Toggle.vue
    - app/frontend/components/ui/toggle/index.ts
    - app/frontend/components/ui/toggle-group/ToggleGroup.vue
    - app/frontend/components/ui/toggle-group/ToggleGroupItem.vue
    - app/frontend/components/ui/toggle-group/index.ts
    - app/frontend/components/collection/TimeBucketCheckboxes.vue
    - app/frontend/components/collection/ComplexityToggleGroup.vue
    - app/frontend/components/collection/OwnerAvatarToggles.vue
    - app/frontend/components/collection/CollectionFilterPanel.vue
    - spec/frontend/CollectionWorkspace.spec.ts
  modified: []

key-decisions:
  - "Wrapped the local shadcn-vue generator in a before/after checksum gate and restored package.json, package-lock.json, and styles.css after generation because the CLI re-adds @lucide/vue and CSS overrides."
  - "Bound CollectionFilterPanel controls directly to the Pinia filter store to avoid duplicating state."
  - "Used reka-ui Checkbox's update:modelValue event rather than update:checked in TimeBucketCheckboxes to match the actual component contract."
  - "Rendered owner Select all/Clear actions inside OwnerAvatarToggles so the component owns the full owner selection surface."

patterns-established:
  - "Source-owned shadcn-vue primitives must be inspected for package/styles drift and @lucide/vue icon imports before commit."
  - "M3 token override for generated toggle variants: bg-primary/aria-pressed, focus-visible:ring-primary, and 44px touch targets."

requirements-completed: [COLL-19]

# Coverage metadata
coverage:
  - id: D1
    description: "Source-owned Toggle and ToggleGroup primitives with M3 tokens and preserved reka-ui keyboard behavior"
    requirement: COLL-19
    verification:
      - kind: other
        ref: "shadcn-vue generator checksum gate: package.json, package-lock.json, components.json byte-identical before and after invocation"
        status: pass
      - kind: unit
        ref: "spec/frontend/CollectionWorkspace.spec.ts#ComplexityToggleGroup"
        status: pass
    human_judgment: false
  - id: D2
    description: "TimeBucketCheckboxes with six-bucket OR semantics and full-label click targets"
    requirement: COLL-19
    verification:
      - kind: unit
        ref: "spec/frontend/CollectionWorkspace.spec.ts#TimeBucketCheckboxes"
        status: pass
    human_judgment: false
  - id: D3
    description: "ComplexityToggleGroup single-select Any/Light/Medium/Heavy with keyboard-accessible ToggleGroup"
    requirement: COLL-19
    verification:
      - kind: unit
        ref: "spec/frontend/CollectionWorkspace.spec.ts#ComplexityToggleGroup"
        status: pass
    human_judgment: false
  - id: D4
    description: "OwnerAvatarToggles multi-select OR controls with avatar buttons, aria-pressed, and select-all/clear"
    requirement: COLL-19
    verification:
      - kind: unit
        ref: "spec/frontend/CollectionWorkspace.spec.ts#OwnerAvatarToggles"
        status: pass
    human_judgment: false
  - id: D5
    description: "CollectionFilterPanel with semantic fieldsets in exact Search → Owners → Players → Playing time → Complexity order and compact spacing"
    requirement: COLL-19
    verification:
      - kind: unit
        ref: "spec/frontend/CollectionWorkspace.spec.ts#CollectionFilterPanel"
        status: pass
    human_judgment: false

# Metrics
duration: 15 min
completed: 2026-07-16
status: complete
---

# Phase 9 Plan 6: Source-Owned Toggle/ToggleGroup and Filter Controls Summary

**Source-owned Toggle/ToggleGroup primitives, OR time-bucket checkboxes, single-select complexity segmented control, owner avatar toggles, and the ordered CollectionFilterPanel with interaction coverage.**

## Performance

- **Duration:** 15 min
- **Started:** 2026-07-16T05:48:08Z
- **Completed:** 2026-07-16T06:03:25Z
- **Tasks:** 2
- **Files modified:** 10

## Accomplishments

- Scaffolded source-owned `Toggle` and `ToggleGroup` primitives via the local shadcn-vue binary while preserving package-manifest stability.
- Overrode generated toggle variants with M3 tokens, 44px touch targets, and the project's focus-ring convention.
- Built `TimeBucketCheckboxes` for six-bucket multi-select OR filtering with full-label targets.
- Built `ComplexityToggleGroup` as a single-select segmented control (Any/Light/Medium/Heavy) using the source `ToggleGroup`.
- Built `OwnerAvatarToggles` with avatar buttons, `aria-pressed`, and Select all/Clear actions.
- Built `CollectionFilterPanel` composing the Pinia filter store in exact Search → Owners → Players → Playing time → Complexity order with semantic fieldsets and compact spacing.
- Added `CollectionWorkspace.spec.ts` covering time OR, complexity selection, owner OR/select-all/clear, and panel order/labels/store binding.

## Task Commits

Each task was committed atomically:

1. **Task 1: Scaffold source-owned Toggle/ToggleGroup** - `59ba5f1` (feat)
2. **Task 2 RED: Add failing tests for filter controls and panel** - `b5a4a14` (test)
3. **Task 2 GREEN: Implement filter controls and ordered panel** - `91b4905` (feat)

## Files Created/Modified

- `app/frontend/components/ui/toggle/Toggle.vue` — reka-ui toggle wrapper.
- `app/frontend/components/ui/toggle/index.ts` — `Toggle` export and M3 `toggleVariants`.
- `app/frontend/components/ui/toggle-group/ToggleGroup.vue` — `ToggleGroupRoot` wrapper.
- `app/frontend/components/ui/toggle-group/ToggleGroupItem.vue` — `ToggleGroupItem` wrapper.
- `app/frontend/components/ui/toggle-group/index.ts` — barrel exports.
- `app/frontend/components/collection/TimeBucketCheckboxes.vue` — six-bucket OR checkbox group.
- `app/frontend/components/collection/ComplexityToggleGroup.vue` — Any/Light/Medium/Heavy segmented control.
- `app/frontend/components/collection/OwnerAvatarToggles.vue` — avatar owner toggles with select-all/clear.
- `app/frontend/components/collection/CollectionFilterPanel.vue` — ordered filter form over Pinia store.
- `spec/frontend/CollectionWorkspace.spec.ts` — control and panel interaction tests.

## Decisions Made

- Followed the plan's generator-gate exactly: verified `package.json`, `package-lock.json`, and `components.json` before and after `./node_modules/.bin/shadcn-vue add toggle toggle-group --yes`, then reverted the CLI's `@lucide/vue` reinstall and `styles.css` overrides so the final checksums matched.
- Used the Pinia filter store as the single source of truth inside `CollectionFilterPanel`; controls adapt via `v-model` without internal duplicate state.
- Aligned `TimeBucketCheckboxes` with the reka-ui Checkbox `update:modelValue` contract rather than `update:checked`.
- Kept owner Select all/Clear actions inside `OwnerAvatarToggles` so the component owns the full owner-selection surface.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Reverted shadcn-vue generator side effects to preserve package manifest stability**
- **Found during:** Task 1 (scaffolding source-owned Toggle/ToggleGroup)
- **Issue:** The local `shadcn-vue add toggle toggle-group --yes` command reinstalled `@lucide/vue` in `package.json`/`package-lock.json` and added a Google Fonts import, duplicate `--font-heading`, and an extra `@layer base` block to `styles.css`.
- **Fix:** After generation, restored `package.json`, `package-lock.json`, and `app/frontend/entrypoints/styles.css` to their original state so the before/after checksum gate of `package.json`, `package-lock.json`, and `components.json` passed exactly.
- **Files modified:** `package.json`, `package-lock.json`, `app/frontend/entrypoints/styles.css` (restored to original; no net change in final commit)
- **Verification:** Before/after `shasum` of the three checksum files matched; `! rg '@lucide/vue' app/frontend/components/ui/toggle app/frontend/components/ui/toggle-group` passed.
- **Committed in:** `59ba5f1` (Task 1 commit)

**2. [Rule 1 - Bug] Corrected TimeBucketCheckboxes event binding to reka-ui Checkbox contract**
- **Found during:** Task 2 GREEN (running the RED tests)
- **Issue:** Initial `TimeBucketCheckboxes` used `@update:checked` on the reka-ui `Checkbox` wrapper, but the component emits `update:modelValue`; clicks did not update the model.
- **Fix:** Changed the binding to `:model-value` and `@update:model-value` with a boolean-aware `updateBucket` helper.
- **Files modified:** `app/frontend/components/collection/TimeBucketCheckboxes.vue`
- **Verification:** `spec/frontend/CollectionWorkspace.spec.ts` time-bucket tests passed; full `npm test` suite passed (230 tests).
- **Committed in:** `91b4905` (Task 2 GREEN commit)

---

**Total deviations:** 2 auto-fixed (1 missing critical, 1 bug)
**Impact on plan:** Both fixes preserved the source-scaffold security gate and made the new controls work. No scope creep.

## Issues Encountered

- None beyond the two deviations documented above. The test suite emits pre-existing Vue warnings about `inject()` and missing router injections in unrelated specs; these are test-environment warnings and do not affect functionality or test results.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Source-owned `ToggleGroup` and `Checkbox` are ready for Plan 09-07's view-mode toggle and clear-filters behavior.
- `CollectionFilterPanel` is ready to be mounted inside the desktop sticky aside and the mobile Sheet in Plan 09-07.
- `ComplexityToggleGroup` is reusable for Plan 10's picking-game filters.
- All URL/store contracts from Plan 09-05 remain intact; no state rewrite is needed.

## Self-Check: PASSED

- [x] `09-06-SUMMARY.md` created at `.planning/phases/09-home-collection-redesign/09-06-SUMMARY.md`
- [x] Task commits found in git history: `59ba5f1`, `b5a4a14`, `91b4905`
- [x] All 10 plan-owned files exist on disk
- [x] `npm test` passed: 25 files, 230 tests
- [x] `package.json`/`package-lock.json`/`components.json` unchanged from original state
- [x] No `@lucide/vue` imports in `app/frontend/components/ui/toggle` or `app/frontend/components/ui/toggle-group`
- [x] No unrelated Phase 01 plans or 09-REVIEWS.md staged

---
*Phase: 09-home-collection-redesign*
*Plan: 06*
*Completed: 2026-07-16*
