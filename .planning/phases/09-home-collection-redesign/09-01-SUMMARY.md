---
phase: 09-home-collection-redesign
plan: 01
subsystem: Home dashboard
status: complete
tags: [home, dashboard, hero, stats, graphql, apollo, tdd]
dependency_graph:
  requires: []
  provides: [09-02, 09-03]
  affects: [app/graphql/types/query_type.rb, app/frontend/views/HomeView.vue, app/frontend/components/landing/HomeHero.vue, app/frontend/components/landing/StatsCard.vue]
tech_stack:
  added: [GraphQL DashboardStatsType, Apollo useDashboardStatsQuery, Vue Card/Button/Input/Badge/Skeleton, Pinia collectors store]
  patterns: [TDD RED/GREEN, Apollo-only server state, design-system component composition]
key_files:
  created:
    - app/frontend/components/landing/HomeHero.vue
    - app/frontend/components/landing/StatsCard.vue
    - app/frontend/components/landing/UsernameForm.vue
    - app/graphql/types/dashboard_stats_type.rb
    - spec/graphql/dashboard_stats_query_spec.rb
    - app/frontend/apollo/queries/dashboard_stats.graphql
  modified:
    - app/frontend/views/HomeView.vue
    - app/graphql/types/query_type.rb
    - schema.graphql
    - schema.json
    - app/frontend/generated/types.ts
    - app/frontend/generated/operations.ts
    - spec/frontend/HomeDashboard.spec.ts
    - tests/e2e/home.spec.ts
decisions:
  - "Wrapped UsernameForm navigation in async showCollection with await nextTick() to eliminate a router race after updating the Pinia collectors store."
  - "Added signed-in dashboard stats coverage to HomeDashboard.spec.ts to lock D-04/D-05/D-06 aggregation behavior."
  - "Used the generated single-argument useDashboardStatsQuery(options) signature to stay aligned with the codegen contract."
metrics:
  duration_seconds: 1207
  completed_date: 2026-07-16
  task_count: 3
  file_count: 14
---

# Phase 09 Plan 01: Home Hero and Stats Dashboard Summary

**One-liner:** Implemented a redesigned Home dashboard with a merge-first hero and dedicated `dashboardStats` GraphQL query, backed by Apollo-only state and TDD RED/GREEN commits.

## What Was Done

1. **Task 1 (RED):** Added `spec/frontend/HomeDashboard.spec.ts` and `tests/e2e/home.spec.ts` asserting the approved hero copy, `Merge collections` CTA, and signed-out stats prompt, then confirmed both failed before implementation.
2. **Task 2 (GREEN):** Added `DashboardStatsType` and `Query.dashboardStats` resolver; returns `null` when signed out and current-user-scoped counts for distinct collection games, groups, and non-cancelled sessions. Published `schema.graphql`/`schema.json`, generated Apollo client contract, and added RSpec coverage for authorization, deduplication, expansion inclusion, attendance semantics, and cross-user isolation.
3. **Task 3 (GREEN):** Built `HomeHero` as the sole hero owner, `StatsCard` as the Apollo-backed stats component, restyled `UsernameForm` with design-system controls while preserving validation/tags/search and canonical `/collection?usernames=...` navigation, and composed `HomeView` in hero → stats → discovery order with the approved 8/4 desktop layout.

## TDD Gate Compliance

- ✅ `test(09-01): add failing tests for Home hero and dashboard stats` (b38f448)
- ✅ `feat(09-01): implement dashboardStats GraphQL query` (6b8683e)
- ✅ `feat(09-01): implement redesigned Home hero and stats dashboard` (544b132)
- No refactor commit was required; the implementation did not need cleanup.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking Issue] Fixed router navigation race in UsernameForm**
- **Found during:** Task 3
- **Issue:** After setting the collectors store and immediately calling `router.push`, the navigation occasionally failed to reach the canonical `/collection` route during E2E runs.
- **Fix:** Changed `showCollection` to `async function showCollection()` and added `await nextTick()` between the Pinia store update and the router push.
- **Files modified:** `app/frontend/components/landing/UsernameForm.vue`
- **Commit:** 544b132

**2. [Rule 2 - Missing Critical Functionality] Added signed-in stats coverage**
- **Found during:** Task 3
- **Issue:** The RED target only verified the signed-out prompt; the signed-in `Games in your collection`/`Groups`/`Nights` labels from D-04/D-05/D-06 were not covered.
- **Fix:** Added a second `HomeDashboard.spec.ts` test that mocks a signed-in `dashboardStats` response and asserts the three labels and their values.
- **Files modified:** `spec/frontend/HomeDashboard.spec.ts`
- **Commit:** 544b132

**3. [Rule 1 - Bug] Fixed generated Apollo query call signature in StatsCard**
- **Found during:** Task 3 verification
- **Issue:** `vue-tsc` reported `Expected 0-1 arguments, but got 2` for `useDashboardStatsQuery(() => ({}), () => ({ fetchPolicy: ... }))` because the generated composable only accepts a single options argument.
- **Fix:** Collapsed to one options function: `useDashboardStatsQuery(() => ({ fetchPolicy: 'cache-and-network' }))`.
- **Files modified:** `app/frontend/components/landing/StatsCard.vue`
- **Commit:** 544b132

## Verification

- ✅ `bundle exec rspec spec/graphql/dashboard_stats_query_spec.rb` — 7 examples, 0 failures
- ✅ `npm test -- spec/frontend/HomeDashboard.spec.ts --run` — 2 tests passed
- ✅ `npm test -- spec/frontend/AppShell.spec.ts --run` — 2 tests passed
- ✅ `npm run e2e -- tests/e2e/health.spec.ts` — passed
- ✅ `npm run e2e -- tests/e2e/home.spec.ts` — passed
- ✅ Schema/codegen stability: `bin/rails graphql:schema:dump && npm run codegen` produced identical `schema.graphql`, `schema.json`, `types.ts`, and `operations.ts` checksums.

## Known Stubs

No intentional stubs were introduced. All data flows through the generated Apollo query or the existing collectors store.

## Threat Flags

No unplanned threat flags. The `dashboardStats` resolver honors the threat-register mitigation (T-09-01): it returns `null` when signed out and scopes every ActiveRecord relation to the current user; RSpec examples verify cross-user isolation and null signed-out behavior.

## Self-Check: PASSED

All three commits exist, the SUMMARY file is present, and no unexpected tracked-file deletions were introduced.
