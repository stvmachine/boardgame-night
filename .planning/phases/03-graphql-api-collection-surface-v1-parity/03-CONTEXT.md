# Phase 3: GraphQL API + Collection Surface (v1 Parity) — Context

**Gathered:** 2026-07-06
**Status:** Ready for planning

<domain>
## Phase Boundary

The GraphQL API surface (types, queries, mutations, subscriptions) and the Vue 3 frontend collection UI — the complete "merged collection" experience that v1 users interact with. This phase connects the Phase 2 BGG persistence layer to the frontend via GraphQL and builds the full collection browsing surface: N-user merge, search/filter/sort/group, hot games, permalinks, and responsive layout.

**Deliverables:**
- GraphQL schema: `ThingType`, `MergedThingType`, `MergedCollectionType`, `OwnerType`, `UserType`, `HotItemType`, `SearchResultType`, `UserSyncStatusType`, `SyncStatus` enum
- GraphQL queries: `mergedCollection(usernames)`, `hotItems`, `search(query)`, `user(username)`
- GraphQL mutations: `importCollection(username)`, `validateBggUsername(username)` — with dry-validation contracts
- GraphQL subscriptions: `collectionSynced(username)` — real-time sync status via Solid Cable
- `GraphQL::Dataloader` sources for batch-loading owners/users per thing
- Database migration: add statistics columns to `bgg_things` (average, bayes_average, users_rated, average_weight, num_comments)
- Vue routes: `/`, `/collection`, `/hot`
- Vue components: app shell (sidebar + topbar), game card grid, filter/search/sort bar, user sync status sidebar, mobile drawer
- Permalink system: `/collection?usernames=` with full filter state encoded via `history.replaceState`
- Pinia store: UI-only state (filters, sidebar, draft usernames) — never server data
- Fuse.js integration: client-side fuzzy search over merged collection
- Codegen: `rails graphql:schema:dump` → `schema.graphql` → typed Vue Apollo composables

**Not in scope:**
- Authentication / user accounts (Phase 4)
- Friend groups / group tokens (Phase 4)
- Boardgame night sessions / game suggestions (Phase 5)
- Server-side search (Postgres pg_trgm/FTS) — v2 when collections exceed ~300 games
- Thing detail pages (game cards link to BGG)
- BGG polls, comments, versions, expansions, categories, mechanics, designers — v2

</domain>

<decisions>
## Implementation Decisions

### GraphQL Schema Scope

- **D-01:** v1-essential `ThingType` only — fields: `id`, `name`, `yearPublished`, `minPlayers`, `maxPlayers`, `minPlaytime`, `maxPlaytime`, `minAge`, `image`, `thumbnail`, `description`, `average`, `bayesAverage`, `usersRated`, `averageWeight`, `isExpansion`, `owners`. Skip polls, comments, versions, expansions, categories, mechanics, designers, etc. — v2 additions. **[NEEDS ADR: ADR-003]**
- **D-02:** `mergedCollection(usernames: [String!]!): MergedCollection!` — server-side merge via `BggThing.merged_for_users` scope. One DB query, deduped things with owner arrays. This is the primary collection query.
- **D-03:** Individual columns on `bgg_things` for statistics: `average`, `bayes_average`, `users_rated`, `average_weight`, `num_comments`. Clean, queryable, indexable. Migration needed — `Normalizer` already produces these fields, `CollectionPersister` doesn't persist them yet.
- **D-04:** Skip thing detail queries (`thing(id)`, `things(ids)`). Game cards link to BGG (`https://boardgamegeek.com/boardgame/{id}`). Smaller schema, less surface area.
- **D-05:** Minimal `UserType`: `username` + `avatar` only. Full profile (real name, country, state, etc.) is v2.
- **D-06:** Two mutations with dry-validation contracts: `importCollection(username: String!): ImportResult` and `validateBggUsername(username: String!): ValidationResult`. Start the contract-first pattern in Phase 3 — every mutation gets a dry-validation contract before the service call. Phase 4 inherits this pattern. **[NEEDS ADR: ADR-004]**
- **D-07:** Dedicated `HotItemType` (id, name, thumbnail, rank, yearPublished) and `SearchResultType` (id, name, yearPublished) — only fields BGG actually returns for each endpoint. Accurate field availability, no nullable noise.
- **D-08:** `MergedCollection` wrapper type: `{ items: [MergedThing!]!, syncStatuses: [UserSyncStatus!]! }`. `MergedThing` = Thing fields + `owners: [Owner!]!`. `UserSyncStatus` = `{ username, status (READY|SYNCING|QUEUED|ERROR), lastSyncedAt, error }`. Frontend gets games + per-user sync state in one query — no waterfall fetches. **[NEEDS ADR: ADR-005]**

### Collection Import UX Flow

- **D-09:** Auto-import on submit: user enters usernames → inline `validateBggUsername` validation → `importCollection` mutation fires automatically for each valid user → frontend subscribes to sync status via `collectionSynced` subscription → shows skeleton loaders with per-user status → full collection renders when ready. Stale cached data shown immediately (stale-while-revalidate). **[NEEDS ADR: ADR-006]**
- **D-10:** Per-user status cards in sidebar: colored badges (yellow Syncing, green Ready, red Failed) with game count. Game grid shows partial results from ready users while others sync. Per-user retry button on error.
- **D-11:** GraphQL subscriptions for real-time sync status (no polling). Solid Cable (DB-backed, no Redis) + graphql-ruby Subscriptions. `SubscriptionType` with `collectionSynced(username: String!): SyncStatus!`. `ImportCollectionJob` broadcasts status changes at each lifecycle stage (queued → syncing → ready/error). Frontend uses `useSubscription`. **[NEEDS ADR: ADR-007]**
- **D-12:** Manual refresh: per-user "Refresh" button with 15-min cooldown (disabled with countdown timer if too recent). Stale-while-revalidate: old data shown while refreshing.
- **D-13:** ADRs in `docs/adr/` with MADR format (Context, Decision, Consequences, Alternatives). CONTEXT.md references them as canonical refs. Planner/executor creates them during execution. Meta-decision: most interesting decisions get ADRs.

### Permalink & URL State

- **D-14:** Real-time `history.replaceState` — URL updates silently on every filter/search/sort/grouping/owner-toggle change. The address bar always reflects current state — copyable at any moment. No explicit "Share" button needed; user just copies the URL.
- **D-15:** Owner filter encoded in URL — `&owners=alice,bob` for toggled-on owners. Recipient sees the exact same filtered view. Full fidelity replay of the sender's view.
- **D-16:** Omit default/empty values from URL — only non-default values appear. No player filter → no `players` param. Sort=alpha (default) → no `sort` param. Shorter, readable permalinks: `/collection?usernames=alice,bob&players=4&sort=rating`.
- **D-17:** No legacy `/u/:usernames` compat — only `/collection?usernames=` format. Clean break from v1 reference app. We're a fresh app with no existing users to migrate.

### Layout & Navigation

- **D-18:** Three routes: `/` (landing/hero with username input), `/collection` (main merged view with permalink state in query params), `/hot` (hot games). Search is a panel inside `/collection`, not a separate route. Simplest mental model.
- **D-19:** Sidebar + topbar layout. Left sidebar: user list with sync status badges, owner toggles, per-user refresh buttons. Main content area: game grid. Top bar: app name, nav links (Collection/Hot), username input. Sidebar collapses to slide-out drawer on mobile.
- **D-20:** `md` breakpoint (768px) — sidebar visible on `md+` (≥768px), collapses to slide-out drawer with hamburger toggle on mobile (<768px). Standard Tailwind breakpoint, most common pattern.
- **D-21:** Auto-fill grid with `minmax(180px, 1fr)` — cards size to fit available space, ~4-6 columns on desktop, 2 on mobile. Dense, efficient. Matches reference app pattern.

### the agent's Discretion
- Exact ADR numbering (ADR-003 through ADR-007 are suggested; adjust if prior ADRs exist)
- Component file structure within `app/frontend/components/` (feature folders vs flat)
- Pinia store file naming and composition (one store vs split stores for filters/sidebar)
- Fuse.js key configuration (preserve v1 keys: `name`, `name.text`, `originalname`, threshold 0.3, 300ms debounce)
- Exact filter UI component choices (sliders vs dropdowns for players/time/complexity)
- Skeleton loader design and animation
- Color palette for sync status badges and owner colors (port `memberColors` from reference UI)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Reference Proxy (GraphQL Patterns to Port)
- `/Users/estvmachine/Projects/personal/bgg-graphql-proxy/src/schema/schema.graphql` — Full GraphQL contract (456 lines). Adapt types/queries for our v1-essential scope.
- `.planning/research/reference-bgg-schema.graphql` — Copy of the reference schema in the planning dir.

### Reference UI (Vue/TS Patterns to Port)
- `/Users/estvmachine/Projects/personal/bggeek-shared-list/src/utils/sorting.ts` — Sort comparators (name, rating, year, playtime, complexity)
- `/Users/estvmachine/Projects/personal/bggeek-shared-list/src/utils/grouping.ts` — Group-by logic (owner, player count, category)
- `/Users/estvmachine/Projects/personal/bggeek-shared-list/src/utils/memberColors.ts` — Per-user color assignment for owner badges
- `/Users/estvmachine/Projects/personal/bggeek-shared-list/src/utils/permalink.ts` — URL state encode/decode pattern (adapt to our query-param format)
- `/Users/estvmachine/Projects/personal/bggeek-shared-list/src/utils/search.ts` — Fuse.js config and fuzzy search wrapper
- `/Users/estvmachine/Projects/personal/bggeek-shared-list/src/utils/fuzzySearch.ts` — Fuse.js key config (name, name.text, originalname, threshold 0.3)

### Project Requirements & Architecture
- `.planning/REQUIREMENTS.md` §COLL-01 through COLL-18 — Collection surface requirements
- `.planning/REQUIREMENTS.md` §GQL-02, GQL-05 — GraphQL requirements
- `.planning/ROADMAP.md` §Phase 3 — Phase goal and success criteria
- `.planning/STATE.md` — Current project state
- `.planning/phases/01-foundation-monorepo-shell/01-CONTEXT.md` — Phase 1 decisions (monorepo, codegen, Dataloader, schema shape)
- `.planning/phases/02-bgg-integration-layer-persistence/02-CONTEXT.md` — Phase 2 decisions (BGG services, models, merge scope)

### Research Docs
- `.planning/research/FEATURES.md` — Feature landscape, v1 table stakes, MVP definition
- `.planning/research/ARCHITECTURE.md` — System overview, project structure, patterns, pitfalls, build order
- `.planning/research/PITFALLS.md` — Critical pitfalls (expansion workaround, 202 handling, stale data, collection ownership, Solid Queue retry_on, rack-cors, skipProxy)
- `.planning/research/STACK.md` — Technology stack decisions (Apollo 3.13 + @vue/apollo-composable 4.2.2, Tailwind v4, Pinia 3, Fuse.js 7, Solid Cable)

</canonical_refs>

<code_context>
## Existing Code Insights

### Integration Points
- `app/graphql/types/query_type.rb` — Skeleton with only `health` field. All collection/hot/search queries must be added.
- `app/graphql/types/mutation_type.rb` — Placeholder with `testField` stub. Replace with `importCollection` and `validateBggUsername`.
- `app/graphql/loaders/` — Directory does NOT exist. Must be created for `GraphQL::Dataloader` sources (batch-load owners per thing, users per username).
- `app/frontend/router/index.ts` — Single route (`/` → HealthView). Add `/collection` and `/hot` routes with lazy-loaded components.
- `app/frontend/apollo/client.ts` — BatchHttpLink configured, InMemoryCache ready. Add `split` link for WebSocket subscriptions (Solid Cable).
- `app/models/bgg_thing.rb` — Missing statistics columns (average, bayes_average, users_rated, average_weight, num_comments). Migration needed.
- `app/models/bgg_collection.rb` — Join table with user_id, bgg_thing_id, ownership flags. Used for owner arrays.
- `app/jobs/bgg/import_collection_job.rb` — Robust namespaced ImportCollectionJob with retry_on/discard_on. Add subscription broadcasts at lifecycle stages.
- `app/jobs/import_collection_job.rb` — Duplicate top-level job. Consolidate into the namespaced one.
- `app/services/bgg/` — Full BGG service layer from Phase 2: Client, RateLimiter, Normalizer, CollectionFetcher, CollectionPersister. All reusable.
- `codegen.ts` — Wired and ready. Just needs `rails graphql:schema:dump` + new `.graphql` files in frontend.
- `config/vite.json` — `sourceCodeDir` is `app/frontend`. Vite dev server configured.

### Established Patterns (from Phase 1 & 2)
- GraphQL schema class-based with `max_depth 15` security constant
- `GraphQL::Dataloader` for N+1 prevention (must use, not graphql-batch)
- Solid Queue `limits_concurrency to: 1, key: "bgg_api"` for BGG jobs
- `Bgg::Normalizer` produces statistics fields; `Bgg::CollectionPersister` needs updating to persist them
- `BggThing.merged_for_users` scope exists for server-side merge
- Procfile.dev as dev orchestration point
- RSpec + factory pattern for testing

### Gaps to Fill
- No `app/graphql/loaders/` directory — create `ThingsLoader`, `OwnersLoader`, `UsersLoader` as `GraphQL::Dataloader::Source` subclasses
- No `SubscriptionType` — create and wire to Solid Cable
- No dry-validation contracts — create `app/contracts/` with `ImportCollectionContract`, `ValidateBggUsernameContract`
- No Pinia stores — create UI-only stores (filters, sidebar, draft usernames)
- No Fuse.js integration — install and configure with v1 key patterns
- No Tailwind setup — install `tailwindcss` + `@tailwindcss/vite`, configure `@import "tailwindcss"` in entrypoint
- No subscription WebSocket link in Apollo client — add `split` link for Solid Cable
- Statistics columns missing from `bgg_things` — migration required

</code_context>

<specifics>
## Specific Ideas

- Port `memberColors` from reference UI for per-user color assignment (owner badges, sidebar avatars)
- Port sort comparators from `bggeek-shared-list/src/utils/sorting.ts` (name, rating, year, playtime, complexity)
- Port group-by logic from `bggeek-shared-list/src/utils/grouping.ts` (owner, player count)
- Use `@vueuse/core` `useDebounce` for 300ms search debounce (replaces hand-rolled composable)
- Use `@vueuse/core` `useFuse` for reactive Fuse.js integration
- Use `@vueuse/core` `useStorage` for persisting filter state to localStorage (survives page refresh)
- Use `URLSearchParams` for permalink encode/decode (standard Web API, handles encoding correctly)
- Skeleton loaders should match card dimensions (180px min width) for stable layout during sync
- Sync status badges: yellow (Syncing), green (Ready), red (Failed) — use Tailwind color classes
- Owner colors: assign from a fixed palette per username (hash username → color index), consistent across sessions
- Subscription broadcast points in `ImportCollectionJob`: before perform (QUEUED), at start (SYNCING), on success (READY), on failure (ERROR)
- `collectionSynced` subscription should also broadcast `lastSyncedAt` and game count for sidebar status cards
- Codegen CI gate: `rails graphql:schema:dump` → commit `schema.graphql` → `npm run codegen` → fails if schema + queries drift

</specifics>

<deferred>
## Deferred Ideas

- **HTTP QUERY method** (draft-ietf-httpbis-safe-method-w-body): User suggested using the new QUERY method for search instead of GET with URL params. Rejected for v1 because: (1) no browser support — can't be used for shareable permalinks, (2) Apollo Client doesn't support it, (3) our query params are well within URI length limits, (4) GraphQL already handles complex query bodies via POST. Revisit if/when browsers and GraphQL clients adopt QUERY.
- **Server-side search** (Postgres pg_trgm/FTS): Fuse.js client-side search breaks >300 games. Fine for v1 friend groups (3-10 users, ~200 games each, deduped). Move to server-side in v2 when collections grow.
- **Thing detail pages**: Game cards link to BGG instead. A detail view could be added in v2 if we want in-app game pages.
- **Legacy `/u/:usernames` permalink compat**: Clean break from v1. No existing users to migrate.

</deferred>

---

*Phase: 3-GraphQL API + Collection Surface (v1 Parity)*
*Context gathered: 2026-07-06*
