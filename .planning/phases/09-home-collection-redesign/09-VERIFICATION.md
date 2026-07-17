---
phase: 09-home-collection-redesign
status: passed
score: 8/8
requirements_checked: [HOME-01, HOME-02, HOME-03, COLL-19, COLL-20, COLL-21, COLL-22, COLL-23]
verified: 2026-07-17
---

# Phase 09 Verification — Home & Collection Redesign

## Verdict

Phase 09 achieves its goal: users receive the redesigned Home dashboard and Collection workspace with the Tabletop Social design system, richer filtering, exact sort and view contracts, safe rich cards, and matching loading states.

Three configured verifier runs completed without producing an artifact. This fallback verification reconciles all eight plans and summaries, actual source and test files, the integrated execution evidence, capability gates, and an independent Oracle review. The Oracle review verified all eight requirements and found no implementation gap or human-only verification need.

## Requirement Evidence

| Requirement | Result | Evidence |
|---|---|---|
| HOME-01 | PASS | `HomeHero.vue` composes the approved merge headline, supporting copy, username input, and Merge collections CTA inside the Home 8/4 responsive layout. `HomeDashboard.spec.ts` and `home.spec.ts` prove rendering and merge navigation. |
| HOME-02 | PASS | `StatsCard.vue` consumes the dedicated authorization-scoped `dashboardStats` query and renders Games, Groups, and Nights with a signed-out prompt. Seven GraphQL examples cover distinct counts, cancelled/not-going exclusions, and cross-user isolation. |
| HOME-03 | PASS | `TrendingGames.vue` renders a six-card Home preview and `/hot` continuation. `HotItemThingLoader` batches persisted enrichment without per-card BGG detail calls; component, GraphQL, and browser tests cover metadata and null fallbacks. |
| COLL-19 | PASS | `CollectionFilterPanel.vue` and the source-owned Slider/ToggleGroup controls provide search, owner OR-selection, player range, time buckets, and complexity. `CollectionView.vue` supplies the sticky desktop panel, labelled mobile Sheet, active chips, and safe Clear all behavior. |
| COLL-20 | PASS | `GameCard.vue` ships vertical grid and horizontal list variants with image fallback, rating, title, plain-text description, capped owners, and players/time/complexity footer. Tests prove no `v-html`, null fallbacks, fixed BGG `objectid` URL, opener isolation, keyboard activation, and nested-control guards. |
| COLL-21 | PASS | `sorting.ts` and `SortControl.vue` expose exactly Name A–Z, Rating High–Low, Weight Light–Heavy, and Recently Played. `LastPlayedAtLoader` and `ScopedMergedThing` preserve authorization and multiplex isolation for merged/group scopes; sorting, GraphQL, component, and E2E tests pass. |
| COLL-22 | PASS | `ViewModeToggle.vue`, the Pinia filter store, and `usePermalink.ts` provide one accessible Grid/List selection, grid default, `view=list` sharing, and invalid-value normalization. Unit and Playwright permalink tests pass. |
| COLL-23 | PASS | `ResultsSkeleton.vue` renders twelve grid/list-matched placeholders, and `CollectionView.vue` forwards the active view while preserving loading/error/empty/import/refresh branches. Component and browser coverage passes. |

## Must-Have and Decision Coverage

- Home composition follows hero → stats → trending with the approved responsive grid.
- Personal stats remain a dedicated authenticated GraphQL surface rather than being inferred from merged collection state.
- Trending enrichment uses persisted batched data and does not add per-card BGG requests.
- Filter state and presentation state remain URL-backed UI state in Pinia; Apollo remains the server-data source of truth.
- Collection cards use plain-text descriptions and persisted BGG identity with `noopener,noreferrer` isolation.
- `lastPlayedAt` remains immutable and authorization scoped across user, group, anonymous, and multiplexed operations.
- Real invite-token `group` values survive filter/sort/view writes and remain distinct from legacy grouping parameters.
- Grid/list presentation propagates through grouped and ungrouped results and their loading skeletons.

## Security and Accessibility

- Vue text interpolation and explicit tag stripping prevent BGG descriptions from entering an HTML rendering path.
- External card activation uses a fixed BGG host/path, persisted `objectid`, opener isolation, Enter/Space support, and nested-control guards.
- Dashboard statistics and recently-played history have direct cross-user, outsider, anonymous, same-operation, and multiplex isolation tests.
- Slider, ToggleGroup, Select, Sheet, and view controls have accessible labels, keyboard behavior, focus handling, and required touch targets.

## Automated Evidence

- Full frontend suite: **28 files, 279 tests, all passing**.
- Focused Phase 09 backend suite: **22 examples, 0 failures**.
- Production Vite build: passing.
- Schema dump and GraphQL code generation: stable across consecutive checksum comparisons.
- Protected browser gate: **16/16 Playwright tests passing** across health, Home, and Collection journeys; fixture JSON checksums restored.
- GSD schema-drift gate: passing.
- GSD codebase-drift gate: skipped because no structure document exists; no action required.
- GSD UI safety gate: passing with the approved Phase 09 UI contract present.

## Human Verification

None. Automated component, GraphQL, contract, build, security, accessibility, and browser evidence covers every Phase 09 requirement and must-have.

## Remaining Advisories

- `REQUIREMENTS.md` still records COLL-20, COLL-22, and COLL-23 as pending; this is tracking drift, not an implementation gap, and is corrected by phase completion.
- One earlier managed-server health run failed transiently before the protected isolated and exact combined reruns passed.
- Existing Vue Router/injection and Vite/Rolldown annotation warnings remain non-failing and are not Phase 09 regressions.

No requirement gap, human-only acceptance item, or high-severity threat remains open. Phase 09 may be marked complete.
