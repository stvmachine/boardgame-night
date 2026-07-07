---
phase: 03-graphql-api-collection-surface-v1-parity
verified: 2026-07-08T12:10:00Z
status: gaps_found
score: 14/17 truths verified
behavior_unverified: 0
overrides_applied: 0
gaps:
  - truth: "User can group the merged collection by player-count / rating / best-player-count / none with collapsible groups"
    status: failed
    reason: "GameGrid renders group sections with headers, but there is no collapse/expand affordance for individual groups or expand/collapse-all control."
    artifacts:
      - path: app/frontend/components/collection/GameGrid.vue
        issue: "Group sections are static; no collapse/expand controls or state tracking"
    missing:
      - "Add collapse/expand buttons to group headers in GameGrid"
      - "Track collapsed group state (e.g., in the filter store or a GameGrid-local ref)"
      - "Add expand-all / collapse-all controls"
  - truth: "User can collapse/expand filter, search, and collector sections in the sidebar"
    status: failed
    reason: "Filter and search controls are rendered in the main CollectionView content area, not the sidebar, and the collector section in the sidebar has no collapse/expand UI."
    artifacts:
      - path: app/frontend/components/layout/Sidebar.vue
        issue: "No collapse/expand controls for the Collectors section or the collector list"
      - path: app/frontend/views/CollectionView.vue
        issue: "CollectionFilters (search/players/time/complexity/rating) is rendered in the main content area, not in the sidebar"
    missing:
      - "Move filter/search controls into the sidebar OR add a collapsible filter panel in the main content area"
      - "Add collapse/expand affordance to the sidebar collector section"
  - truth: "User can manually refresh cached collections with a 15-minute cooldown and stale-while-revalidate behavior"
    status: failed
    reason: "There is no manual refresh button in the UI, no per-user cooldown enforcement, and no stale-while-revalidate caching for the BGG collection fetch. The importCollection mutation can be invoked without any throttling, and the collection resolver reads directly from the database."
    artifacts:
      - path: app/frontend/components/layout/Sidebar.vue
        issue: "No refresh button or last-synced timestamp UI"
      - path: app/frontend/components/layout/CollectorsSection.vue
        issue: "No refresh trigger for individual collectors"
      - path: app/graphql/mutations/import_collection.rb
        issue: "No cooldown check before enqueueing Bgg::ImportCollectionJob"
      - path: app/services/bgg/client.rb
        issue: "Collection fetch is not cached; no stale-while-revalidate logic"
    missing:
      - "Add a per-user refresh button with last-synced timestamp in the sidebar"
      - "Enforce a 15-minute cooldown per username before enqueueing a new import"
      - "Cache BGG collection responses with stale-while-revalidate, or surface staleness in the UI"
behavior_unverified_items: []
---

# Phase 3: GraphQL API + Collection Surface (v1 Parity) Verification Report

**Phase Goal:** Users can merge, browse, search, filter, sort, group, and share BoardGameGeek collections in a responsive UI — full parity with the original shared-list app, generalized to N users.

**Verified:** 2026-07-08T12:10:00Z

**Status:** `gaps_found`

**Re-verification:** No — initial verification

## MVP Mode: User Flow Coverage

| # | User Flow Step | Expected | Evidence in Codebase | Status |
|---|----------------|----------|----------------------|--------|
| 1 | Enter BGG usernames on the landing page | Inline validation of format and BGG existence | `UsernameForm.vue` calls `useValidateBggUsernameMutation`; mutation checks `Bgg::Client#user` | ✓ |
| 2 | Submit usernames to merge collections | Navigate to `/collection?usernames=...` and fetch merged data | `UsernameForm.vue` → `collectorsStore.set()` → `router.push()`; `CollectionView.vue` → `useMergedCollectionQuery` | ✓ |
| 3 | Browse merged collection | Game cards render with thumbnail, name, rating, players, time, complexity, owner avatars | `GameCard.vue` renders all required fields; `GameGrid.vue` renders cards | ✓ |
| 4 | Search by game name | Fuse.js debounced search over `name` and `originalname` | `useCollectionFilters.ts` uses `fuseSearch.ts` with 300ms debounce | ✓ |
| 5 | Filter by players, play time, complexity, rating | UI controls and filter logic exist for all four dimensions | `CollectionFilters.vue` + `useCollectionFilters.ts` + `utils/filters.ts` | ✓ |
| 6 | Sort by name, rating, year, complexity | Sort select and sort logic exist | `SortControl.vue` + `utils/sorting.ts` | ✓ |
| 7 | Group by players, rating, best-player-count, none | Group select and group logic exist | `GroupByToggle.vue` + `utils/grouping.ts` | ✓ |
| 8 | Collapse/expand grouped sections | Each group section can be collapsed/expanded | `GameGrid.vue` renders static group headers only | ✗ |
| 9 | View hot/trending games on landing page | Hot list renders from BGG API | `HotList.vue` → `useHotItemsQuery` → `Bgg::Client#hot` | ✓ |
| 10 | Share a permalink URL | URL reflects usernames, filters, sort, group, and selected owners | `usePermalink.ts` + `collectors.ts` URL sync | ✓ |
| 11 | Select-all / deselect-all owners | Buttons toggle all owner filters | `CollectorsSection.vue` emits `select-all` / `deselect-all` | ✓ |
| 12 | Collapse/expand sidebar sections | Filter/search/collector sections in sidebar are collapsible | Sidebar lacks collapse/expand UI | ✗ |
| 13 | Manually refresh collection with cooldown | Refresh button enqueues import with 15-minute cooldown | No refresh button or cooldown logic | ✗ |
| 14 | View loading/empty/error states | Skeleton, empty, and error states render | `ResultsSkeleton.vue`, `EmptyState.vue`, per-user validation status | ✓ |

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | User enters N BGG usernames and each is validated inline before fetching/merging | ✓ VERIFIED | `UsernameForm.vue` validates format and BGG existence via `validateBggUsername`; `Bgg::Client#user` checks BGG API |
| 2 | Collections merge into a single deduplicated view with owner color-avatars | ✓ VERIFIED | `BggThing.merged_for_bgg_usernames` scope; `Loaders::OwnersLoader` batch-loads owners; `GameCard.vue` renders deterministic colored avatars |
| 3 | Layout is responsive: desktop fixed sidebar + mobile drawer | ✓ VERIFIED | `AppShell.vue` uses `md:` breakpoint with fixed sidebar; `MobileDrawer.vue` handles `<md` viewports |
| 4 | User can fuzzy-search the merged collection | ✓ VERIFIED | `fuseSearch.ts` uses Fuse.js with keys `name`/`originalname`, threshold 0.3, 300ms debounce |
| 5 | User can filter by players, play-time, and complexity | ✓ VERIFIED | `filters.ts` + `useCollectionFilters.ts` + `CollectionFilters.vue` implement all four filter dimensions |
| 6 | User can sort by name, rating, year, and complexity | ✓ VERIFIED | `sorting.ts` + `SortControl.vue` implement all four sort options |
| 7 | User can group by player-count, rating, best-player-count, or none | ✓ VERIFIED | `grouping.ts` + `GroupByToggle.vue` implement all four group options |
| 8 | Grouped sections are collapsible/expandable | ✗ FAILED | `GameGrid.vue` renders static group headers with no collapse/expand controls |
| 9 | User sees hot/trending games on the landing page | ✓ VERIFIED | `HotList.vue` → `useHotItemsQuery` → `hotItems` resolver with 1-hour Rails cache |
| 10 | Game cards display thumbnail, name, rating, players, time, complexity, owner avatars, and click to BGG | ✓ VERIFIED | `GameCard.vue` renders all listed fields; click opens `https://boardgamegeek.com/boardgame/{id}` |
| 11 | Loading, empty, and error states are rendered | ✓ VERIFIED | `ResultsSkeleton.vue`, `EmptyState.vue`, and per-user validation status in `UsernameForm.vue` |
| 12 | User can share a permalink URL for a set of usernames and filter state | ✓ VERIFIED | `usePermalink.ts` serializes owners/filters/sort/group via `history.replaceState`; `collectors.ts` syncs `?usernames=` via `router.replace` |
| 13 | User can select-all / deselect-all owners | ✓ VERIFIED | `CollectorsSection.vue` emits `select-all` and `deselect-all`; `filters.ts` implements the actions |
| 14 | Sidebar filter, search, and collector sections are collapsible/expandable | ✗ FAILED | Filter/search live in `CollectionView` main content; `Sidebar.vue` collector section has no collapse/expand UI |
| 15 | User can manually refresh cached collections with a 15-minute cooldown and stale-while-revalidate | ✗ FAILED | No refresh button in UI; `importCollection` mutation has no cooldown; `Bgg::Client#collection` is not cached |
| 16 | GraphQL schema exposes the v1 query contract (things, search, users, collections, hot items) | ✓ VERIFIED | `schema.graphql` contains `mergedCollection`, `user`, `hotItems`, `search`, and all required types |
| 17 | Dataloader batches expansion/base-game lookups and codegen produces committed typed composables | ✓ VERIFIED | `Loaders::OwnersLoader` inherits from `GraphQL::Dataloader::Source`; `app/frontend/generated/operations.ts` exports `useMergedCollectionQuery`, `useHotItemsQuery`, etc. |

**Score:** 14/17 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `app/graphql/types/query_type.rb` | Exposes `mergedCollection`, `user`, `hotItems`, `search` | ✓ VERIFIED | All fields present and resolvers wired |
| `app/graphql/types/merged_thing_type.rb` | Exposes thing fields + batched owners | ✓ VERIFIED | Uses `ThingFields` + `Loaders::OwnersLoader` |
| `app/graphql/loaders/owners_loader.rb` | Batch-loads owners in input order | ✓ VERIFIED | Uses `includes(:user)` and `group_by` |
| `app/models/bgg_thing.rb` | `merged_for_bgg_usernames` scope | ✓ VERIFIED | Joins `bgg_collections` and `users` with `distinct` |
| `app/frontend/views/CollectionView.vue` | Wires query, filters, sort, group, permalink | ✓ VERIFIED | Uses filter store, `usePermalink`, `sortGames`, `groupGames` |
| `app/frontend/components/collection/GameCard.vue` | Renders required card fields | ✓ VERIFIED | Thumbnail, name, meta, rating, complexity, owner avatars |
| `app/frontend/components/collection/GameGrid.vue` | Renders grouped or ungrouped cards | ⚠️ PARTIAL | Functional but lacks group collapse/expand |
| `app/frontend/components/collection/CollectionFilters.vue` | Filter inputs | ✓ VERIFIED | Search, players, time, complexity, rating |
| `app/frontend/components/layout/Sidebar.vue` | Collector management in sidebar | ⚠️ PARTIAL | Collector list present, no collapse/expand, no refresh button |
| `app/frontend/components/layout/CollectorsSection.vue` | Owner toggles + select-all/deselect-all | ✓ VERIFIED | Implemented with accessible checkboxes |
| `app/frontend/composables/usePermalink.ts` | Serialize/hydrate filter state to URL | ✓ VERIFIED | Uses `URLSearchParams` + `history.replaceState` |
| `app/frontend/views/HomeView.vue` | Landing page with username form and hot list | ✓ VERIFIED | `UsernameForm` + `HotList` rendered |
| `app/frontend/components/landing/HotList.vue` | Hot games grid | ✓ VERIFIED | Uses `useHotItemsQuery` with cache-first |
| `schema.graphql` | Committed schema dump | ✓ VERIFIED | Regenerated and in sync with code |
| `app/frontend/generated/operations.ts` | Typed Apollo composables | ✓ VERIFIED | Exports all required queries/mutations/subscriptions |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `CollectionView.vue` | `mergedCollection` GraphQL query | `useMergedCollectionQuery` | ✓ WIRED | Reactive variables read from `collectorsStore.usernames` |
| `mergedCollection` resolver | `BggThing.merged_for_bgg_usernames` | `QueryType#merged_collection` | ✓ WIRED | Calls scope and builds `MergedCollection` struct |
| `MergedThingType#owners` | `BggCollection` records | `Loaders::OwnersLoader` | ✓ WIRED | `dataloader.with(Loaders::OwnersLoader).load(object.id)` |
| `GameCard.vue` | BGG boardgame page | `@click="openBgg"` | ✓ WIRED | Opens `https://boardgamegeek.com/boardgame/{id}` |
| `UsernameForm.vue` | `validateBggUsername` mutation | `useValidateBggUsernameMutation` | ✓ WIRED | Mutation calls `Bgg::Client#user` for existence check |
| `HotList.vue` | `hotItems` query | `useHotItemsQuery` | ✓ WIRED | Cache-first policy |
| `importCollection` mutation | `Bgg::ImportCollectionJob` | `perform_later` | ✓ WIRED | Enqueues with Solid Queue concurrency limit |
| Apollo split link | Action Cable subscriptions | `app/frontend/apollo/client.ts` | ✓ WIRED | `split` routes subscriptions to `ActionCableLink` |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|-------------------|--------|
| `CollectionView.vue` | `result.value?.mergedCollection.items` | `useMergedCollectionQuery` → Rails DB | DB query on `BggThing` with owner join | ✓ FLOWING |
| `GameCard.vue` | `owners` prop | `GameGrid` → `MergedThing.owners` | Loaded via `OwnersLoader` from `bgg_collections` | ✓ FLOWING |
| `HotList.vue` | `result.value?.hotItems` | `useHotItemsQuery` → `Bgg::Client#hot` | BGG XML API with 1-hour Rails cache | ✓ FLOWING |
| `UsernameForm.vue` | `validationStatus[username]` | `useValidateBggUsernameMutation` | BGG XML API `user` endpoint | ✓ FLOWING |
| `CollectorsSection.vue` | `selected` | `filters.ts` Pinia store | Derived from user toggles | ✓ FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Backend test suite passes | `eval "$(rbenv init -)" && bundle exec rspec` | 117 examples, 0 failures | ✓ PASS |
| Frontend unit tests pass | `npm run test` | 49 tests passed | ✓ PASS |
| Schema dump regenerates without changes | `eval "$(rbenv init -)" && bin/rails graphql:schema:dump` | No `git diff` changes | ✓ PASS |
| E2E collection & permalink suite | `eval "$(rbenv init -)" && npm run e2e` | 7/8 passed; first test flaky (cold-start timing) | ⚠️ FLAKY |
| Type check | `npx vue-tsc --noEmit` | 2 pre-existing errors unrelated to phase | ✓ PASS (no new errors) |

### Requirements Coverage

| Requirement | Description | Source Plan | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| COLL-01 | Validate BGG username exists before fetching | 03-04 | ✓ SATISFIED | `validateBggUsername` mutation calls `Bgg::Client#user`; `UsernameForm` shows inline status |
| COLL-02 | Merge N collections into deduplicated view | 03-01, 03-02 | ✓ SATISFIED | `BggThing.merged_for_bgg_usernames` + `mergedCollection` query |
| COLL-03 | Fuzzy-search merged collection by name | 03-04, 03-06 | ✓ SATISFIED | `fuseSearch.ts` + `useCollectionFilters` |
| COLL-04 | Filter by number of players | 03-03, 03-06 | ✓ SATISFIED | `playerCountFilter` + `CollectionFilters.vue` |
| COLL-05 | Filter by playing time (bucketed) | 03-04, 03-06 | ✓ SATISFIED | `TIME_BUCKETS` + `playtimeFilter` |
| COLL-06 | Filter by complexity/weight | 03-07, 03-06 | ✓ SATISFIED | `COMPLEXITY_BUCKETS` + `complexityFilter` |
| COLL-07 | Sort by name/rating/year/complexity | 03-07 | ✓ SATISFIED | `sorting.ts` + `SortControl.vue` |
| COLL-08 | Group by player count/rating/best-player-count/none with collapsible groups | 03-07 | ✗ BLOCKED | Grouping works; groups are not collapsible |
| COLL-09 | Member color avatars as owner badges | 03-01, 03-06 | ✓ SATISFIED | `GameCard.vue` deterministic color function; `MemberAvatar.vue` |
| COLL-10 | Share permalink URL for usernames | 03-07 | ✓ SATISFIED | `usePermalink.ts` + `collectors.ts` URL sync |
| COLL-11 | Hot/trending games on landing page | 03-03, 03-04 | ✓ SATISFIED | `hotItems` query + `HotList.vue` |
| COLL-12 | Game card with required fields | 03-02, 03-04, 03-07 | ✓ SATISFIED | `GameCard.vue` |
| COLL-13 | Loading, empty, and error states | 03-02, 03-07 | ✓ SATISFIED | `ResultsSkeleton.vue`, `EmptyState.vue`, validation status chips |
| COLL-14 | Collapse/expand filter, search, and collector sections in sidebar | 03-07 | ✗ BLOCKED | Filter/search in main content; sidebar sections not collapsible |
| COLL-15 | Select-all / deselect-all members | 03-06, 03-07 | ✓ SATISFIED | `CollectorsSection.vue` + `filters.ts` |
| COLL-16 | Responsive layout | 03-06 | ✓ SATISFIED | `AppShell.vue` + `MobileDrawer.vue` + responsive grid |
| COLL-17 | GraphQL collection queries use Dataloader | 03-01, 03-07 | ✓ SATISFIED | `Loaders::OwnersLoader` |
| COLL-18 | Cached collections with stale-while-revalidate; manual refresh with 15-min cooldown | 03-03 | ✗ BLOCKED | No refresh UI; no cooldown; no collection fetch cache |
| GQL-02 | GraphQL schema exposes queries for things, search, users, collections, hot items | 03-01, 03-02, 03-04 | ✓ SATISFIED | `schema.graphql` contains all fields |
| GQL-05 | Codegen typed composables committed and in sync | 03-02, 03-04, 03-07 | ✓ SATISFIED | `app/frontend/generated/operations.ts` exports all composables; `bin/rails graphql:schema:dump` produces no diff |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `app/frontend/utils/grouping.ts` | 91-95 | `ratingSort` compares `name` against itself instead of `a.name` vs `b.name` | ⚠️ Warning | Rating groups may not sort deterministically; minor UX bug |
| `app/frontend/composables/usePermalink.ts` | 27, 33, 36, etc. | Directly assigns plain values to Pinia setup-store refs | ℹ️ Info | Tests pass, but direct assignment can lose reactivity if not careful; currently works in practice |
| `tests/e2e/collection.spec.ts` | 7-13 | First test is flaky under full-suite cold start | ⚠️ Warning | Passes in isolation; full suite fails because server/seed not ready within 10s timeout |

### Gaps Summary

The core collection browsing experience is implemented and tested: users can validate BGG usernames, merge collections, search, filter, sort, group, view hot games, and share permalinks. Backend and frontend unit tests pass, and the schema/codegen contract is in sync.

Three roadmap success-criteria items are not implemented in the actual codebase:

1. **Collapsible groups** (`COLL-08`) — `GameGrid` renders group headers but provides no collapse/expand affordance.
2. **Collapsible sidebar sections** (`COLL-14`) — Filter/search controls live in the main content area, and the sidebar collector section has no collapse/expand UI.
3. **Manual refresh with 15-minute cooldown / stale-while-revalidate** (`COLL-18`) — No refresh button exists, no cooldown is enforced, and the BGG collection fetch is not cached.

Additionally, the first Playwright e2e test is flaky when the full suite runs (cold-start timing), although it passes in isolation.

---

_Verified: 2026-07-08T12:10:00Z_
_Verifier: the agent (gsd-verifier)_
