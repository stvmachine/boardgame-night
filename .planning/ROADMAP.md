# Roadmap: boardgame-night-rails-vue

## Overview

A Rails 8 API-only + Vue 3 SPA monorepo that rewrites `bggeek-shared-list` and collapses `bgg-graphql-proxy` into one Kamal 2 deploy. v1 delivers shared-list collection parity (merge N BGG collections, browse/search/filter/sort/group/share in a responsive UI) plus a minimal night-organizing surface (accounts, friend groups, magic-link sessions, binary RSVP, host picks a game). The journey runs foundation → BGG data layer → collection surface → night-organizing surface — each phase a vertical slice that builds on the last. The headline game-suggestion engine is deferred to a future milestone (SUGG-01/02 are v2); v1 ships manual game picking.

## Phases

**Phase Numbering:**

- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Foundation & Monorepo Shell** - Rails 8 API + Vue 3 SPA skeleton, GraphQL contract, single Kamal 2 deploy
- [x] **Phase 2: BGG Integration Layer + Persistence** - BGG XML client, rate limiting, 202 retry, expansion workaround, persisted collections
- [ ] **Phase 3: GraphQL API + Collection Surface (v1 Parity)** - Full collection UI: N-user merge, search/filter/sort/group, hot games, permalinks, responsive layout
- [ ] **Phase 4: Auth + Friend Groups + Session Lifecycle** - Accounts, BGG username binding, friend groups, magic-link sessions, RSVP, manual game pick

## Phase Details

### Phase 1: Foundation & Monorepo Shell

**Goal**: The app runs locally and deploys as a single container with a working Rails GraphQL ↔ Vue contract.
**Mode:** mvp
**Depends on**: Nothing (first phase)
**Requirements**: FOUND-01, FOUND-02, FOUND-03, FOUND-04, FOUND-05, GQL-01, GQL-04
**Success Criteria** (what must be TRUE):

  1. Developer runs `bin/dev` and sees the Vue SPA render in the browser, talking to the Rails `/graphql` endpoint with no CORS errors in development (FOUND-02, GQL-01)
  2. A GraphQL query reaches the server through the Apollo-batched endpoint and returns a valid response (GQL-04, FOUND-01)
  3. The app deploys as a single container via Kamal 2 and serves both the compiled SPA and `/graphql` from one origin (FOUND-03)
  4. BGG credentials load from `.env.bggeek` and are available server-side but never exposed to the frontend (FOUND-05)
  5. The GraphQL schema has max_depth/max_complexity limits set and introspection is disabled in production (FOUND-04)

**Plans:** 3/3 plans complete
Plans:

- [x] 01-01-PLAN.md — Rails backend + dotenvx + GraphQL schema/multiplex + dev orchestration (PlanTasks 01..03; Wave 1)
- [x] 01-02-PLAN.md — Vue + Apollo frontend + codegen + Playwright e2e proving bin/dev round-trips health end-to-end
- [x] 01-03-PLAN.md — Single Docker image (multi-stage Node build → Ruby runtime) + Kamal 2 deploy.yml placeholders + docker build . verification (Wave 3)

**UI hint**: yes

### Phase 2: BGG Integration Layer + Persistence

**Goal**: The system can fetch, parse, persist, and merge BoardGameGeek collections with correct rate limiting and error handling — the data backbone that makes multi-user merge feasible on the read path.
**Mode:** mvp
**Depends on**: Phase 1
**Requirements**: BGG-01, BGG-02, BGG-03, BGG-04, BGG-05, BGG-06, BGG-07
**Success Criteria** (what must be TRUE):

   1. Fetching a BGG user's collection returns the correct base games + expansions via the two-call workaround (e.g. 62 base + 13 expansions = 75 items), with nil-safe XML normalization handling missing fields and single-vs-array items (BGG-01, BGG-04)
   2. BGG API calls are throttled to ≤1 request / 5 seconds across all workers, and HTTP 202 "queued" responses are retried automatically (≤5×) until data is ready instead of returning an empty collection (BGG-02, BGG-03)
   3. Collection imports run as Solid Queue background jobs that declare explicit `retry_on`/`discard_on` for transient failures (503, timeout) and never silently die (BGG-05)
   4. Persisted collections from N users can be merged into a single deduplicated view via a pure database query — no live BGG calls on the read path (BGG-04)
   5. Thing details can be batch-fetched by comma-separated IDs, and every BGG request carries a descriptive User-Agent header (BGG-07, BGG-06)

**Plans:** 3/3 complete
Plans:

- [x] 02-01-PLAN.md — Foundation: Gems + Bgg::Client + Bgg::RateLimiter + Bgg::Normalizer + XML fixtures (Wave 1)
- [x] 02-02-PLAN.md — Persistence: DB schema (bgg_things + bgg_collections) + AR models + merge query + Bgg::CollectionPersister (Wave 2)
- [x] 02-03-PLAN.md — Jobs: Bgg::CollectionFetcher (expansion workaround) + Bgg::ImportCollectionJob (Solid Queue concurrency) (Wave 3)

### Phase 3: GraphQL API + Collection Surface (v1 Parity)

**Goal**: Users can merge, browse, search, filter, sort, group, and share BoardGameGeek collections in a responsive UI — full parity with the original shared-list app, generalized to N users.
**Mode:** mvp
**Depends on**: Phase 2
**Requirements**: COLL-01, COLL-02, COLL-03, COLL-04, COLL-05, COLL-06, COLL-07, COLL-08, COLL-09, COLL-10, COLL-11, COLL-12, COLL-13, COLL-14, COLL-15, COLL-16, COLL-17, COLL-18, GQL-02, GQL-05
**Success Criteria** (what must be TRUE):

  1. User enters N BGG usernames (each validated before fetching), merges them into a single deduplicated collection with owner color-avatars, and browses it in a responsive layout (desktop sidebar + mobile drawer, 1→5 column grid) (COLL-01, COLL-02, COLL-09, COLL-16)
  2. User can fuzzy-search the merged collection, filter by players / play-time / complexity, sort by name / rating / year / complexity, and group by player-count / rating / best-player-count / none with collapsible groups (COLL-03, COLL-04, COLL-05, COLL-06, COLL-07, COLL-08)
  3. User sees hot/trending games on the landing page, well-formed game cards (thumbnail, name, rating, players, time, complexity, owner avatars, click → BGG page), and clear loading/empty/error states with per-user error isolation (COLL-11, COLL-12, COLL-13)
  4. User can share a permalink URL for a set of usernames, select-all/deselect-all owners, collapse/expand sidebar sections, and manually refresh cached collections (15-min cooldown, stale-while-revalidate) (COLL-10, COLL-14, COLL-15, COLL-18)
  5. The GraphQL schema exposes the full v1 query contract (things, search, users, collections, hot items) with Dataloader batching (no N+1 BGG calls), and codegen produces typed frontend composables committed to the repo (GQL-02, GQL-05, COLL-17)

**Plans**: 3 plans

Plans:

- [ ] 03-01-PLAN.md — Merged collection read path: statistics migration, Dataloader-backed GraphQL query, minimal game-card grid
- [ ] 03-02-PLAN.md — Import/sync API: Solid Cable subscriptions, dry-rails mutations, landing/hot items, search query, sidebar sync status, and ADRs
- [ ] 03-03-PLAN.md — Collection browsing surface: search/filter/sort/group, permalink state, responsive sidebar/drawer layout

**UI hint**: yes

### Phase 4: Auth + Friend Groups + Session Lifecycle

**Goal**: Users can create accounts, bind their BGG username, form friend groups, organize boardgame nights with magic-link invitations and binary RSVP, and manually pick a game from the group's shared collection.
**Mode:** mvp
**Depends on**: Phase 3
**Requirements**: AUTH-01, AUTH-02, AUTH-03, AUTH-04, GROUP-01, GROUP-02, GROUP-03, GROUP-04, GROUP-05, GROUP-06, SESS-01, SESS-02, SESS-03, SESS-04, SESS-05, SESS-06, GQL-03
**Success Criteria** (what must be TRUE):

  1. User can create an account with email/password, log in and stay logged in across sessions, log out from any page, and bind one BGG username to their account (validated against BGG before accepting) (AUTH-01, AUTH-02, AUTH-03, AUTH-04)
  2. User can create a friend group, generate an invite code + magic link, join a group via invite link, and have owner/admin manage members with three roles (owner / admin / member) (GROUP-01, GROUP-02, GROUP-03, GROUP-04, GROUP-05)
  3. A group has a persistent merged collection view — the union of all members' bound BGG collections, deduped by objectId (GROUP-06)
  4. Group owner/admin can create a boardgame night session, send magic-link invitations, and see RSVP attendee count/status; invitees can RSVP (Going / Not Going) via magic link without creating an account (SESS-01, SESS-02, SESS-03, SESS-04)
  5. Session owner can manually pick a game from the group's merged collection, the session transitions through its lifecycle states (draft → scheduled → rsvp_open → picking → completed), and every mutation is validated via dry-validation contracts (SESS-05, SESS-06, GQL-03)

**Plans**: TBD
**UI hint**: yes

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation & Monorepo Shell | 3/3 | Complete    | 2026-07-02 |
| 2. BGG Integration Layer + Persistence | 3/3 | Complete    | 2026-07-04 |
| 3. GraphQL API + Collection Surface (v1 Parity) | 0/TBD | Not started | - |
| 4. Auth + Friend Groups + Session Lifecycle | 0/TBD | Not started | - |

---

*Roadmap created: 2026-07-01*
*Granularity: coarse (4 phases) | Mode: mvp | Coverage: 51/51 v1 requirements mapped*
*Note: The game-suggestion engine (SUGG-01/02) and voting (VOTE-01/02) are v2-deferred per REQUIREMENTS.md and are not part of this v1 roadmap. v1 ships manual game picking (SESS-05); the suggestion engine is a future milestone.*
