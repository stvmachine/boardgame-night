---
phase: 05-design-system-foundation
plan: 03
subsystem: ui
tags: [vue3, vite, tailwind-v4, m3, shadcn-vue, material-symbols, avatar, skeleton, badge, card, icon]

requires:
  - phase: 05-design-system-foundation
    provides: Design tokens, Inter font, Iconify, cn() utility, shadcn-vue primitives (Plan 05-01)
  - phase: 05-design-system-foundation
    provides: AppShell, NavSidebar, NavDrawer shell rebuild (Plan 05-02)
  - phase: 05-design-system-foundation
    provides: Card, Badge, Button, Avatar, Skeleton, Collapsible, Icon primitives (Plan 05-04)

provides:
  - Migrated MemberAvatar, ResultsSkeleton, CollapsibleSection, CollapsibleGroup, EmptyState, HealthView, GameCard, and CollectorsSection to use design-system primitives and M3 tokens
  - 15-slot M3 tokenized deterministic avatar palette in useMemberColor
  - Replaced all remaining inline SVGs with the Icon component
  - Deleted old AppHeader, Sidebar, and MobileDrawer shell components

affects:
  - 05-design-system-foundation
  - 09-home-collection-redesign
  - 11-polish-e2e-hardening

tech-stack:
  added: []
  patterns:
    - "All avatars use Avatar + AvatarFallback primitives with M3 token classes"
    - "All skeleton placeholders use Skeleton primitive with bg-surface-variant"
    - "All chevron/inbox/spinner icons use Icon component with Material Symbols names"
    - "Game cards use Card, CardContent, and Badge primitives instead of hardcoded colors"
    - "Old shell components removed once replaced by NavSidebar/NavDrawer"

key-files:
  created:
    - app/frontend/components/common/__tests__/MemberAvatar.spec.ts
    - app/frontend/components/collection/__tests__/ResultsSkeleton.spec.ts
  modified:
    - app/frontend/composables/useMemberColor.ts
    - app/frontend/components/common/MemberAvatar.vue
    - app/frontend/components/collection/ResultsSkeleton.vue
    - app/frontend/components/common/CollapsibleSection.vue
    - app/frontend/components/collection/CollapsibleGroup.vue
    - app/frontend/components/collection/EmptyState.vue
    - app/frontend/views/HealthView.vue
    - app/frontend/components/collection/GameCard.vue
    - app/frontend/components/layout/CollectorsSection.vue
    - tests/e2e/collection.spec.ts
    - spec/frontend/AppShell.spec.ts
    - spec/frontend/CollapsibleSection.spec.ts
  deleted:
    - app/frontend/components/layout/AppHeader.vue
    - app/frontend/components/layout/Sidebar.vue
    - app/frontend/components/layout/MobileDrawer.vue
    - spec/frontend/Sidebar.spec.ts

key-decisions:
  - "Replaced the old 15-slot hardcoded Tailwind color palette in useMemberColor with M3 token classes (bg-primary text-on-primary, etc.) and made the composable return a single class string for simpler AvatarFallback usage."
  - "Migrated GameCard from a custom <article> to the Card + CardContent + Badge primitives, using semantic badge variants (invited for rating, draft for weight) and removing duplicated palette logic."
  - "Removed the obsolete Sidebar.spec.ts and updated AppShell.spec.ts to reflect the NavSidebar/NavDrawer shell introduced in Plan 05-02."

patterns-established:
  - "M3 token classes are the only source of color for avatars, skeletons, cards, badges, and layout surfaces."
  - "Inline SVGs are no longer allowed; use the Icon component backed by Material Symbols."
  - "Reusable component primitives live in app/frontend/components/ui/ and are imported via barrel indexes."

requirements-completed:
  - DS-01
  - DS-05
  - DS-06

coverage:
  - id: D1
    description: "MemberAvatar renders Avatar + AvatarFallback with a deterministic M3 tokenized color class."
    requirement: DS-06
    verification:
      - kind: unit
        ref: "app/frontend/components/common/__tests__/MemberAvatar.spec.ts"
        status: pass
      - kind: integration
        ref: "npm test"
        status: pass
    human_judgment: false
  - id: D2
    description: "ResultsSkeleton uses the Skeleton primitive with M3 surface-variant tokens and game-card layout."
    requirement: DS-05
    verification:
      - kind: unit
        ref: "app/frontend/components/collection/__tests__/ResultsSkeleton.spec.ts"
        status: pass
      - kind: integration
        ref: "npm test"
        status: pass
    human_judgment: false
  - id: D3
    description: "CollapsibleSection uses the Collapsible primitive with a Material Symbols chevron Icon."
    requirement: DS-01
    verification:
      - kind: integration
        ref: "spec/frontend/CollapsibleSection.spec.ts"
        status: pass
      - kind: integration
        ref: "npm test"
        status: pass
    human_judgment: false
  - id: D4
    description: "All inline SVGs in CollapsibleGroup, EmptyState, and HealthView are replaced with the Icon component."
    requirement: DS-01
    verification:
      - kind: integration
        ref: "npm test"
        status: pass
      - kind: e2e
        ref: "playwright tests/e2e/shell.spec.ts tests/e2e/collection.spec.ts --config=tests/e2e/playwright.config.ts"
        status: pass
    human_judgment: false
  - id: D5
    description: "GameCard renders with Card, CardContent, Badge primitives and M3 tokens; no hardcoded bg-indigo-50 or bg-neutral-100."
    requirement: DS-03
    verification:
      - kind: integration
        ref: "npm run build"
        status: pass
      - kind: e2e
        ref: "playwright tests/e2e/collection.spec.ts --config=tests/e2e/playwright.config.ts"
        status: pass
    human_judgment: false
  - id: D6
    description: "Old shell components (AppHeader, Sidebar, MobileDrawer) are deleted and no longer imported from @/components/layout/."
    verification:
      - kind: integration
        ref: "npm run build"
        status: pass
      - kind: e2e
        ref: "playwright tests/e2e/shell.spec.ts --config=tests/e2e/playwright.config.ts"
        status: pass
    human_judgment: false

duration: 15min
completed: 2026-07-13
status: complete
---

# Phase 05 Plan 03: Component Migration and Old Shell Cleanup Summary

**Migrated existing UI components to use the new shadcn-vue/M3 primitives (Avatar, Skeleton, Card, Badge, Collapsible, Icon), tokenized the avatar palette, and removed the old AppHeader/Sidebar/MobileDrawer shell components.**

## Performance

- **Duration:** 15 min
- **Started:** 2026-07-13T13:55:55Z
- **Completed:** 2026-07-13T14:11:12Z
- **Tasks:** 2
- **Files modified:** 18

## Accomplishments

- Replaced the hardcoded Tailwind color palette in `useMemberColor` with a 15-slot M3 token class palette and updated `MemberAvatar` to use the `Avatar` + `AvatarFallback` primitives.
- Migrated `ResultsSkeleton` to use the `Skeleton` primitive with `bg-surface-variant` tokens while preserving the game-card layout.
- Refactored `CollapsibleSection` to use the `Collapsible`/`CollapsibleTrigger`/`CollapsibleContent` primitives and a Material Symbols chevron `Icon`.
- Replaced inline SVGs in `CollapsibleGroup`, `EmptyState`, and `HealthView` with the `Icon` component, and tokenized remaining hardcoded colors.
- Converted `GameCard` from a custom `<article>` to `Card`/`CardContent`/`Badge` primitives, removed duplicate palette logic, and rendered owner avatars via `MemberAvatar`.
- Tokenized remaining hardcoded colors in `CollectorsSection` to M3 surface, outline, primary, and warning-container tokens.
- Deleted the obsolete shell components `AppHeader.vue`, `Sidebar.vue`, and `MobileDrawer.vue`, and updated or removed stale tests that imported them.
- Added unit tests for `MemberAvatar` and `ResultsSkeleton` migration outcomes.

## Task Commits

Each task was committed atomically:

1. **Task 1: Migrate MemberAvatar, ResultsSkeleton, CollapsibleSection to primitives; replace inline SVGs with Icon; tokenize GameCard** — `d8c4ad0` (feat)
2. **Task 2: Delete old shell components and verify no stale references** — `4898930` (feat)

## Files Created/Modified

### Migrated components
- `app/frontend/composables/useMemberColor.ts` — 15-slot M3 token palette; returns a single class string.
- `app/frontend/components/common/MemberAvatar.vue` — Uses `Avatar` + `AvatarFallback` from `@/components/ui/avatar`.
- `app/frontend/components/collection/ResultsSkeleton.vue` — Uses `Skeleton` from `@/components/ui/skeleton` with `bg-surface-variant`.
- `app/frontend/components/common/CollapsibleSection.vue` — Uses `Collapsible` primitives and `Icon` chevron.
- `app/frontend/components/collection/CollapsibleGroup.vue` — Replaced inline SVG chevron with `Icon name="chevron-right"`.
- `app/frontend/components/collection/EmptyState.vue` — Replaced inline SVG inbox with `Icon name="inbox"`; uses `Button` primitive.
- `app/frontend/views/HealthView.vue` — Replaced inline SVG spinner with `Icon name="progress-activity"`; tokenized colors.
- `app/frontend/components/collection/GameCard.vue` — Uses `Card`, `CardContent`, `Badge`, and `MemberAvatar` primitives; removed hardcoded colors.
- `app/frontend/components/layout/CollectorsSection.vue` — Tokenized remaining hardcoded colors to M3 tokens.

### Tests
- `app/frontend/components/common/__tests__/MemberAvatar.spec.ts` — Verifies initial and M3 token class on `AvatarFallback`.
- `app/frontend/components/collection/__tests__/ResultsSkeleton.spec.ts` — Verifies `Skeleton` components render with `animate-pulse` and `bg-surface-variant`.
- `spec/frontend/AppShell.spec.ts` — Updated to test the new NavSidebar/NavDrawer shell with Apollo and router mocks.
- `spec/frontend/CollapsibleSection.spec.ts` — Updated assertions for the new `Collapsible` primitive.
- `tests/e2e/collection.spec.ts` — Updated game-card selector from `article h3` to `[data-slot="card"] h3`.
- `spec/frontend/Sidebar.spec.ts` — Deleted (imported the removed `Sidebar.vue`).

### Deleted files
- `app/frontend/components/layout/AppHeader.vue`
- `app/frontend/components/layout/Sidebar.vue`
- `app/frontend/components/layout/MobileDrawer.vue`

## Decisions Made

- Followed the plan’s explicit M3 token palette for avatars rather than using semantic color names, so every color is design-system sourced.
- Chose to delete `Sidebar.spec.ts` instead of rewriting it, because `NavSidebar`/`NavSidebarContent` are covered by the updated `AppShell.spec.ts` and the new E2E shell tests.
- Kept `EmptyState`’s `Button` import as the default component from `button/Button.vue` rather than the barrel index; both export the same primitive and the build/tests pass.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Updated AppShell and CollapsibleSection tests after primitive migration**
- **Found during:** Task 1 (test run after migration)
- **Issue:** Existing `AppShell.spec.ts` referenced the old Sidebar slot and `BoardGame Night` copy from the deleted `MobileDrawer`; `CollapsibleSection.spec.ts` asserted the old hand-rolled `v-show` behavior (`display: none`). Both caused `npm test` failures.
- **Fix:** Rewrote `AppShell.spec.ts` to mount the new NavSidebar/NavDrawer shell with mocked Apollo and router. Updated `CollapsibleSection.spec.ts` to assert `aria-expanded` and `data-state` instead of inline style strings.
- **Files modified:** `spec/frontend/AppShell.spec.ts`, `spec/frontend/CollapsibleSection.spec.ts`
- **Verification:** `npm test` passes (92 tests)
- **Committed in:** `d8c4ad0` (Task 1)

**2. [Rule 3 - Blocking] Deleted stale Sidebar.spec.ts and updated collection E2E selector after GameCard migration**
- **Found during:** Task 2 (test run after deleting old shell)
- **Issue:** `Sidebar.spec.ts` imported the removed `Sidebar.vue`. The collection E2E test relied on `article h3` selector, which no longer matched because `GameCard` now uses `Card` (a `<div data-slot="card">`).
- **Fix:** Removed `Sidebar.spec.ts`. Changed the collection E2E selector to `[data-slot="card"] h3`.
- **Files modified:** `tests/e2e/collection.spec.ts`; deleted `spec/frontend/Sidebar.spec.ts`
- **Verification:** `npm test` passes; Playwright collection tests pass.
- **Committed in:** `4898930` (Task 2)

---

**Total deviations:** 2 auto-fixed (2 blocking)
**Impact on plan:** Both fixes were necessary because the migration changed component structure and removed old shell files. No scope creep.

## Issues Encountered

1. **`vue-tsc --noEmit` fails with pre-existing unrelated type errors.**
   - The migrated files themselves type-check cleanly; the failures are in `app/frontend/components/session/GamePicker.vue`, `RsvpDashboard.vue`, `composables/useAuth.ts`, `generated/operations.ts`, `views/GroupsView.vue`, `GroupView.vue`, `HealthView.spec.ts`, `InviteView.vue`, and `NightSessionView.vue` (missing `isExpansion` on `MergedThing`, missing `@vue/composition-api`, missing `AttendanceFragment`, etc.).
   - These errors existed before this plan and are outside the scope of the design-system migration. They should be addressed in a dedicated type-hygiene pass.

2. **`npx playwright test tests/e2e/...` from the repo root does not find the config file.**
   - The Playwright configuration lives at `tests/e2e/playwright.config.ts`. Running from the repo root without `--config` causes Playwright to use no `baseURL`, resulting in `Cannot navigate to invalid URL`.
   - The E2E tests themselves pass when invoked with `--config=tests/e2e/playwright.config.ts`:
     - `npx playwright test --config=tests/e2e/playwright.config.ts tests/e2e/shell.spec.ts` → 4 passed
     - `npx playwright test --config=tests/e2e/playwright.config.ts tests/e2e/collection.spec.ts` → 7 passed

3. **`rg --count "AppHeader|from.*Sidebar|MobileDrawer"` verification regex is overly broad.**
   - The pattern `from.*Sidebar` matches legitimate imports of `NavSidebar`/`NavSidebarContent` (e.g., `import NavSidebarContent from './NavSidebarContent.vue'`). No actual imports of the deleted `Sidebar.vue`, `AppHeader.vue`, or `MobileDrawer.vue` remain in `app/frontend/`.

## Known Stubs

None. All migrated components are wired to real data sources or existing props; no placeholder text, TODO, or hardcoded empty values were introduced.

## Threat Flags

No new security-relevant surface was introduced. The deleted old shell files (`AppHeader.vue`, `Sidebar.vue`, `MobileDrawer.vue`) contained no secrets or sensitive logic.

## User Setup Required

None.

## Next Phase Readiness

- The design system foundation is complete: tokens, primitives, migrated components, and the new shell are in place.
- The remaining `vue-tsc` errors should be resolved before broader GraphQL/session work proceeds, but they do not block the design-system phase itself.
- Ready for the next phase in the v1.1 milestone.

---

## Verification Results

| Command | Result | Notes |
|---|---|---|
| `npm run build` | ✅ Pass | Production Vite build succeeds. |
| `npm test` | ✅ Pass | 92 unit tests pass. |
| `npx playwright test --config=tests/e2e/playwright.config.ts tests/e2e/shell.spec.ts` | ✅ Pass | 4 E2E tests pass. |
| `npx playwright test --config=tests/e2e/playwright.config.ts tests/e2e/collection.spec.ts` | ✅ Pass | 7 E2E tests pass. |
| `npx vue-tsc --noEmit` | ❌ Fail | Fails due to pre-existing type errors in unrelated session, auth, and generated-code files. |
| Old colors check (`bg-blue-500`, etc.) in `useMemberColor.ts` | ✅ Pass | No hardcoded Tailwind colors remain. |
| `<svg>` check in `CollapsibleGroup`, `EmptyState`, `HealthView` | ✅ Pass | No inline `<svg>` elements remain. |
| Old badge colors in `GameCard.vue` | ✅ Pass | No `bg-indigo-50` or `bg-neutral-100` remain. |
| Deleted old shell files | ✅ Pass | `AppHeader.vue`, `Sidebar.vue`, `MobileDrawer.vue` removed. |

## Self-Check

- [x] Created `.planning/phases/05-design-system-foundation/05-03-SUMMARY.md`
- [x] Task commits recorded: `d8c4ad0`, `4898930`
- [x] All files created/modified listed in summary
- [x] Verification results documented
- [x] Known issues and deviations documented
- [x] Status set to `complete`

## Self-Check Result: PASSED
