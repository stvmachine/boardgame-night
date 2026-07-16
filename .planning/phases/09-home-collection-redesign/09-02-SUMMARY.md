---
phase: 09-home-collection-redesign
plan: 02
subsystem: ui
tags:
  - vue
  - graphql-ruby
  - dataloader
  - solid-cache
  - playwright
  - vitest
  - rspec

requires:
  - phase: 09-01
    provides: Redesigned Home hero and signed-out stats dashboard

provides:
  - Persisted batched Hot enrichment via GraphQL Dataloader
  - Shared TrendingGameCard / TrendingGames Vue components
  - Six-card Home preview and standalone /hot full grid
  - Updated schema.graphql/schema.json and generated Apollo types

affects:
  - 09-03
  - collection filtering
  - discovery queries

tech-stack:
  added: []
  patterns:
    - HotItemThingLoader as input-order-preserving GraphQL::Dataloader::Source
    - Reusable TrendingGames component with preview/full mode props
    - E2E fixture cache seeding for deterministic external-API-free browser tests

key-files:
  created:
    - app/graphql/loaders/hot_item_thing_loader.rb
    - app/frontend/components/landing/TrendingGameCard.vue
    - app/frontend/components/landing/TrendingGames.vue
  modified:
    - app/graphql/types/hot_item_type.rb
    - app/graphql/types/query_type.rb
    - app/frontend/apollo/queries/hot_items.graphql
    - app/frontend/views/HomeView.vue
    - app/frontend/views/HotView.vue
    - spec/frontend/HomeDashboard.spec.ts
    - tests/e2e/home.spec.ts
    - schema.graphql
    - schema.json
    - app/frontend/generated/types.ts
    - app/frontend/generated/operations.ts

key-decisions:
  - "Seed the BGG hot list Rails cache during e2e:seed so the Home/Hot Playwright journey is deterministic and free of live BGG network dependency."
  - "Configure development/test Solid Cache to use the `cache` database so the seed task and the running e2e server share cache state."
  - "Use a shared TrendingGames component on both Home (limit 6) and /hot (full list) to keep the card system consistent without changing routes."

patterns-established:
  - "GraphQL Dataloader for persisted enrichment: one batch query keyed by external objectid, nullable fields when no local row exists."
  - "Vue presentation component with deterministic fallbacks (em dashes) and isolated external-link activation."
  - "E2E fixture cache seeding for external API boundaries."

requirements-completed:
  - HOME-03

coverage:
  - id: D1
    description: Persisted batched Hot enrichment backend with no per-card BGG requests
    requirement: HOME-03
    verification:
      - kind: integration
        ref: spec/graphql/discovery_query_spec.rb#hotItems query enrichment
        status: pass
      - kind: integration
        ref: spec/graphql/discovery_query_spec.rb#does not issue synchronous per-card BGG detail requests
        status: pass
    human_judgment: false
  - id: D2
    description: Shared responsive Trending cards on Home and Hot routes
    requirement: HOME-03
    verification:
      - kind: unit
        ref: spec/frontend/HomeDashboard.spec.ts#renders six enriched Trending on BGG cards with View all
        status: pass
      - kind: e2e
        ref: tests/e2e/home.spec.ts#keeps a six-card Home preview and standalone Hot route
        status: pass
    human_judgment: false

duration: 113min
completed: 2026-07-16
status: complete
---

# Phase 09 Plan 02: Trending Hot Enrichment and Home/Hot Cards Summary

**Persisted batched BGG Hot enrichment in GraphQL plus a shared responsive Trending card system on Home and standalone `/hot`.**

## Performance

- **Duration:** 113 min (1h 53m)
- **Started:** 2026-07-16T12:15:38+10:00
- **Completed:** 2026-07-16T14:06:58+10:00
- **Tasks:** 3 / 3
- **Files modified:** 10 source/test files plus generated schema/codegen artifacts

## Accomplishments

- Extended `HotItemType` with nullable enrichment fields (`average`, `averageWeight`, `minPlayers`, `maxPlayers`, `minPlaytime`, `maxPlaytime`) resolved through a single `HotItemThingLoader` batch query.
- Added RSpec coverage proving persisted-hit, missing-row, bounded SQL, and zero synchronous per-card BGG detail requests.
- Dumped and stabilized `schema.graphql`/`schema.json` and regenerated Apollo `types.ts`/`operations.ts`.
- Built `TrendingGameCard` and `TrendingGames` Vue components with rank overlay, thumbnail fallback, rating/weight/players/time meta, em-dash fallbacks, and keyboard-accessible `noopener,noreferrer` external links.
- Wired `TrendingGames` on `HomeView` (six-card preview + "View all") and `HotView` (full grid) while preserving the existing `/hot` route and sidebar nav.
- Made the E2E Home/Hot journey deterministic by seeding the BGG hot list cache during `e2e:seed` and routing dev/test Solid Cache to the `cache` database.

## Task Commits

Each task was committed atomically:

1. **Task 1: Add smoke-gated RED contracts for Trending and preserved Hot** - `5fa4ed3` (test)
2. **Task 2: Add persisted batched Hot enrichment and publish the client contract** - `1206f0d` (feat)
3. **Task 3: Render shared responsive Trending cards on Home and Hot** - `656cf3b` (feat)

## Files Created/Modified

- `app/graphql/loaders/hot_item_thing_loader.rb` - New Dataloader source that batches `BggThing` lookups by objectid while preserving input order.
- `app/graphql/types/hot_item_type.rb` - Extended with nullable enrichment fields and loader-backed resolvers.
- `app/graphql/types/query_type.rb` - Existing hot identity resolver; unchanged except consumed by enriched type.
- `app/frontend/apollo/queries/hot_items.graphql` - Added enrichment selections.
- `app/frontend/components/landing/TrendingGameCard.vue` - New ranked, keyboard-accessible external-link card.
- `app/frontend/components/landing/TrendingGames.vue` - New reusable preview/full grid component with "View all" link.
- `app/frontend/views/HomeView.vue` - Uses `TrendingGames :limit="6"`.
- `app/frontend/views/HotView.vue` - Uses `TrendingGames :show-view-all="false"` for the full list.
- `spec/frontend/HomeDashboard.spec.ts` - RED target for six cards and Vitest green verification.
- `tests/e2e/home.spec.ts` - E2E journey for Home preview and `/hot` route.
- `schema.graphql`, `schema.json`, `app/frontend/generated/types.ts`, `app/frontend/generated/operations.ts` - Regenerated schema/codegen contract.
- `lib/tasks/e2e.rake` - Seeds BGG hot list cache for deterministic E2E.
- `config/cache.yml` - Routes dev/test Solid Cache to the `cache` database.
- `config/environments/development.rb` - Allows `RAILS_CACHE_STORE` env override.
- `bin/dev-e2e`, `bin/e2e-seed` - Set `RAILS_CACHE_STORE=solid_cache_store` for E2E runs.

## Decisions Made

- **Seeded BGG hot cache for E2E:** Rather than rely on live BoardGameGeek availability/rate-limiting during browser tests, the `e2e:seed` task writes a known six-item hot list to the Rails cache. This keeps the E2E fast and deterministic while still exercising the full GraphQL resolver path.
- **Solid Cache database for E2E:** Development default is `:memory_store`, which does not persist across the `e2e:seed` process and the web server. We route dev/test Solid Cache to the `cache` database for E2E via `RAILS_CACHE_STORE` so the seeded cache is shared.
- **One shared card component:** `TrendingGames` is reused on both `/` and `/hot` with `limit` and `showViewAll` props, avoiding duplication and keeping the `/hot` route unchanged in behavior.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] E2E failed because live BGG hot API was unavailable in the test environment**
- **Found during:** Task 3 (E2E verification of Home/Hot Trending cards)
- **Issue:** The `keeps a six-card Home preview and standalone Hot route` Playwright test received an empty `hotItems` response; no cards rendered because the BGG hot endpoint was not reached or was rate-limited.
- **Fix:** Seeded the BGG hot list cache in `lib/tasks/e2e.rake`, configured dev/test Solid Cache to use the `cache` database via `config/cache.yml`, and exported `RAILS_CACHE_STORE=solid_cache_store` in `bin/dev-e2e` and `bin/e2e-seed` so the seed and the running server share the cache. Also made the `/hot` route heading assertion more specific (`Trending Games`) to avoid matching two headings.
- **Files modified:** `lib/tasks/e2e.rake`, `config/cache.yml`, `config/environments/development.rb`, `bin/dev-e2e`, `bin/e2e-seed`, `tests/e2e/home.spec.ts`
- **Verification:** `rtk playwright test tests/e2e/home.spec.ts --config=tests/e2e/playwright.config.ts` exits 0.
- **Committed in:** `656cf3b` (Task 3 commit)

---

**Total deviations:** 1 auto-fixed (Rule 3 - blocking)
**Impact on plan:** Necessary infrastructure fix to make the E2E acceptance deterministic. No scope creep; it preserves the plan's intent to verify Home/Hot end-to-end.

## Issues Encountered

- Initial Solid Cache attempt raised `ArgumentError: No unique index found for key_hash` because development was configured to use `:memory_store`. Once dev/test were routed to the `cache` database, writes persisted and the E2E hot list populated correctly.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- HOME-03 is complete.
- The discovery GraphQL contract (`HotItem` enrichment) and shared card components are ready for collection filtering and game-detail work in subsequent phases.
- No blockers.

---
*Phase: 09-home-collection-redesign*
*Completed: 2026-07-16*

## Self-Check: PASSED

- `app/frontend/components/landing/TrendingGameCard.vue` exists
- `app/frontend/components/landing/TrendingGames.vue` exists
- `.planning/phases/09-home-collection-redesign/09-02-SUMMARY.md` exists
- Commit `5fa4ed3` (Task 1) exists
- Commit `1206f0d` (Task 2) exists
- Commit `656cf3b` (Task 3) exists
