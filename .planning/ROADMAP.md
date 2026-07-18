# Roadmap: boardgame-night-rails-vue

## Overview

Boardgame-night is a Rails 8 API-only + Vue 3 SPA monorepo that rewrites `bggeek-shared-list` and collapses `bgg-graphql-proxy` into a single Kamal 2 deploy. v1.0 shipped the foundation (Rails + Vue monorepo shell), BGG integration, collection parity, and auth/friend groups with session lifecycle. v1.1 reskins the entire app with the "Tabletop Social" Stitch design system, adds the new Group Detail surface, and ships the poll-based suggestion engine so sessions can recommend games that fit the exact attendee count.

## Milestones

- ✅ **v1.0 MVP** — Phases 1-4 (shipped 2026-07-09)
- 🚧 **v1.1 UI Redesign + Suggestion Engine** — Phases 5-11 (in progress)
- 📋 **v2.0 Enhanced Game Night** — Deferred (ranked voting, 4-state RSVP, play logging, etc.)

## Phases

**Phase Numbering:**

- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Foundation & Monorepo Shell** - Rails 8 API + Vue 3 SPA skeleton, GraphQL contract, single Kamal 2 deploy
- [x] **Phase 2: BGG Integration Layer + Persistence** - BGG XML client, rate limiting, 202 retry, expansion workaround, persisted collections
- [x] **Phase 3: GraphQL API + Collection Surface (v1 Parity)** - Full collection UI: N-user merge, search/filter/sort/group, hot games, permalinks, responsive layout
- [x] **Phase 4: Auth + Friend Groups + Session Lifecycle** - Accounts, BGG username binding, friend groups, magic-link sessions, RSVP, manual game pick
- [x] **Phase 5: Design System Foundation** - Tailwind v4/Material 3 tokens, Stitch primitives, app shell redesign (completed 2026-07-13)
- [x] **Phase 6: BGG Poll Data Layer** - Poll migrations, parser, enrichment job, one-time backfill (completed 2026-07-13)
- [x] **Phase 7: Suggestion Engine Backend** - Deterministic scoring service, explainable shortlist, GraphQL types (completed 2026-07-14)
- [x] **Phase 8: Group Detail Surface** - Group hub with sessions, members, spotlight, invite link (completed 2026-07-15)
- [x] **Phase 9: Home & Collection Redesign** - Dashboard hero, stats, trending, rich filters, game cards (completed 2026-07-17)
- [ ] **Phase 10: Picking a Game Redesign** - Session header, attendee-aware suggestions, pick cards
- [ ] **Phase 11: Polish & E2E Hardening** - E2E in CI, solid_cable dev config, legacy cleanup, dark mode/responsive QA

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

- [x] 01-01-PLAN.md — Local dev vertical slice: Rails 8 API + Vue 3 SPA + GraphQL health query + encrypted BGG credentials + Playwright e2e (Wave 1)
- [x] 01-02-PLAN.md — GraphQL contract vertical slice: Apollo BatchHttpLink + Rails Schema.multiplex + security regression checks (Wave 2)
- [x] 01-03-PLAN.md — Deploy vertical slice: multi-stage Dockerfile + Kamal 2 deploy.yml scaffold + docker build verification (Wave 3)

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

**Plans**: 11/11 plans complete

Plans:

- [x] 03-01-PLAN.md — Backend foundation: statistics migration, BggThing/BggCollectionItem models, normalizer/persister, GraphQL types/loaders, UserType, UserSyncStatusType, SyncStatusEnum
- [x] 03-02-PLAN.md — GraphQL query wiring: mergedCollection, user, minimal CollectionView + GameCard/GameGrid, schema codegen
- [x] 03-03-PLAN.md — Import/sync API: Solid Cable, collectionSynced subscription, ImportCollection mutation, Bgg::Client#hot
- [x] 03-04-PLAN.md — Landing + discovery: hotItems, search, validateBggUsername, HomeView, UsernameForm, HotList
- [x] 03-05-PLAN.md — Architecture Decision Records: ADR-003..007 and RESEARCH.md Open Questions resolved
- [x] 03-06-PLAN.md — Utilities + shell: Tailwind v4 CSS-first, AppShell/AppHeader/MobileDrawer, Sidebar, filter composables, Fuse.js wrapper
- [x] 03-07-PLAN.md — CollectionView polish: filters/sort/group-by, owner select/deselect, usePermalink, e2e tests
- [x] 03-08-PLAN.md — Collapsible game groups + grouping sort fix + e2e stability (COLL-08)
- [x] 03-09-PLAN.md — Move filters to sidebar + collapsible sidebar sections (COLL-14)
- [x] 03-10-PLAN.md — Manual refresh + 15-min cooldown + stale-while-revalidate (COLL-18)
- [x] 03-11-PLAN.md — Final schema/codegen diff check + e2e stability

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

**Plans:** 4/4 plans complete
Plans:

- [x] 04-01-PLAN.md — Auth foundation: Rails 8 Bearer token auth, signUp/signIn/signOut/bindBggUsername mutations + contracts, Apollo auth link, Vue auth forms, protected routes (Wave 1)
- [x] 04-02-PLAN.md — Friend groups: Group/GroupMembership/InviteToken models, createGroup/inviteToGroup/acceptGroupInvite mutations, dynamic group collection view, magic-link email invites, member management (Wave 2)
- [x] 04-03-PLAN.md — Sessions & RSVPs: NightSession/Attendance models, 4-state lifecycle, createNightSession/scheduleSession/rsvp/upgradeToAccount mutations, provisional users for no-account RSVP, RSVP dashboard (Wave 3)
- [x] 04-04-PLAN.md — Game picking & lifecycle: startPicking/pickGame/cancelSession/reopenSession mutations, GamePicker (filtered by attendee count), SessionSummary, e2e lifecycle test (Wave 4)

**UI hint**: yes

### Phase 5: Design System Foundation

**Goal**: The app renders with the "Tabletop Social" design system and a shared set of primitives so all redesigned surfaces can be built consistently.
**Mode:** mvp
**Depends on**: Phase 4 (v1.0 foundation)
**Requirements**: DS-01, DS-02, DS-03, DS-04, DS-05, DS-06
**Success Criteria** (what must be TRUE):

  1. User sees the app shell with the new Tabletop Social styling (Inter font, indigo primary, M3 tonal palette, Material Symbols Outlined icons) and a 280px fixed sidebar containing Home/Collection/Hot/Groups/Account navigation, Settings/Logout, and a "New Session" primary button; on mobile the sidebar becomes a drawer.
  2. User sees rounded-xl cards with soft shadows and M3 surface tonal layering (Level 0 background, Level 1 cards with 1px border).
  3. User sees status badges with semantic colors (Draft gray, Invited indigo, Picking amber, Completed green) and small-caps label-sm typography.
  4. User sees circular avatars with deterministic per-username colored backgrounds and white centered initials.
  5. User sees skeleton loading placeholders matching the game card layout while data is loading.

**Plans:** 4/4 plans complete
Plans:
**Wave 1**

- [x] 05-01-PLAN.md — Design tokens & infrastructure (M3 tonal palette, Inter font, Iconify icons, shadcn-vue init, cn() utility)

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 05-04-PLAN.md — Primitive library scaffolding (15 shadcn-vue/reka-ui primitives with M3 token overrides)

**Wave 3** *(blocked on Wave 2 completion)*

- [x] 05-02-PLAN.md — App shell redesign with new navigation (280px NavSidebar, Sheet-based NavDrawer, AppNav, New Session CTA)

**Wave 4** *(blocked on Wave 3 completion)*

- [x] 05-03-PLAN.md — Component migration & old shell cleanup (MemberAvatar→Avatar, ResultsSkeleton→Skeleton, inline SVG→Icon, delete old shell)

**UI hint**: yes

### Phase 6: BGG Poll Data Layer

**Goal**: BGG player-count poll data is parsed, persisted, and backfilled so the suggestion engine can use it.
**Mode:** mvp
**Depends on**: Phase 2 (BGG integration); can run in parallel with Phase 5 (design system), but must finish before Phase 7 (suggestion engine)
**Requirements**: SUGG-01, SUGG-05
**Success Criteria** (what must be TRUE):

  1. Rails parses BGG `suggested_numplayers` poll data (Best/Recommended/Not Recommended votes per player count) and persists normalized rows to `bgg_polls` / `bgg_poll_results`.
  2. New BGG imports automatically extract and persist poll data alongside thing details.
  3. Existing `BggThing` records are backfilled with poll data via a rate-limited background job that respects the BGG 1 req/5s limit.
  4. GraphQL exposes poll data per thing so the frontend can display per-player-count vote breakdowns.

**Plans:** 3/3 plans complete
Plans:
**Wave 1**

- [x] 06-01-PLAN.md — Parse + persist: poll tables migration, BggPoll/BggPollResult models, Normalizer.normalize_polls, Bgg::PollPersister (Wave 1)

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 06-02-PLAN.md — Fetch + jobs: Bgg::Client#thing per-thing caching + 20-ID batching + XXE hardening, EnrichThingPollsJob, BackfillPollDataJob, ImportCollectionJob hook, bgg:backfill_polls rake task (Wave 2)
- [x] 06-03-PLAN.md — GraphQL exposure: PollType, PollResultType, PollsLoader, ThingFields polls/bestPlayerCount, schema dump + codegen (Wave 2)

### Phase 7: Suggestion Engine Backend

**Goal:** As a session host, I want to see ranked game suggestions, so that I can choose a game that fits the attendees.
**Mode:** mvp
**Depends on**: Phase 6 (poll data layer)
**Requirements**: SUGG-02, SUGG-03, SUGG-04
**Success Criteria** (what must be TRUE):

  1. For a given session, the suggestion engine returns a ranked shortlist using weighted scoring (player-count fit 40%, time fit 20%, complexity fit 20%, rating 10%, ownership diversity 10%).
  2. Each suggestion includes explainable reason chips (player-count fit, time fit, complexity, ownership) and a confidence indicator when poll data is thin.
  3. The engine uses BGG community "best player count" poll data instead of the v1 min/max range heuristic for player-count fit.
  4. Suggestions are callable via GraphQL without synchronous BGG calls.

**Plans:** 4/4 plans complete
Plans:
**Wave 1**

- [x] 07-01-PLAN.md — Authenticated GraphQL happy path: persisted session context, deterministic scoring engine, and typed suggestions

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 07-02-PLAN.md — Host-controlled time/complexity preferences across create, schedule, and pre-picking update flows
- [x] 07-03-PLAN.md — Poll helpers plus confidence, fallback, authorization, candidate-isolation, and batching hardening

**Wave 3** *(blocked on Wave 2 completion)*

- [x] 07-04-PLAN.md — Runtime schema contract, schema/codegen publication, and integrated Phase 7 verification

### Phase 8: Group Detail Surface

**Goal**: As a group member, I want to view the group's sessions, members, shared collection spotlight, and invite controls in one hub, so that group members can coordinate upcoming nights and shared games from one place.
**Mode:** mvp
**Depends on**: Phase 4 (friend groups) and Phase 5 (design system)
**Requirements**: GROUP-07, GROUP-08, GROUP-09, GROUP-10, GROUP-11
**Success Criteria** (what must be TRUE):

  1. User can view a Group Detail page with a header showing name, member count badge, description, and a "Create a night" button.
  2. User sees upcoming sessions in a list with date blocks, status badges, session titles, time, and attendee counts.
  3. User sees a shared collection spotlight with a 4-game preview grid and owner attribution, plus a "Browse Library" link to the full collection.
  4. User sees a members panel with avatars, names, roles, and a per-member action menu.
  5. User can copy the group's invite link to the clipboard from the Group Detail page.

**Plans:** 6/6 plans complete
Plans:
**Wave 1**

- [x] 08-01-PLAN.md — Role-aware Group sessions API, bounded/full query split, and schema/codegen publication

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 08-02-PLAN.md — Responsive group header and upcoming-sessions user experience

**Wave 3** *(blocked on Wave 2 completion)*

- [x] 08-03-PLAN.md — Authorized deterministic collection spotlight API and compact cards

**Wave 4** *(blocked on Wave 3 completion)*

- [x] 08-04-PLAN.md — Group-scoped `/collection?group=<inviteCode>` routing and query mode
- [x] 08-05-PLAN.md — Authorized member actions with inline removal confirmation

**Wave 5** *(blocked on Wave 4 completion)*

- [x] 08-06-PLAN.md — Combined invite card and integrated responsive/security hardening

**UI hint**: yes

### Phase 9: Home & Collection Redesign

**Goal**: Users experience the redesigned Home dashboard and Collection views with the new design system and richer filtering.
**Mode:** mvp
**Depends on**: Phase 3 (collection surface) and Phase 5 (design system)
**Requirements**: HOME-01, HOME-02, HOME-03, COLL-19, COLL-20, COLL-21, COLL-22, COLL-23
**Success Criteria** (what must be TRUE):

  1. User sees a Home dashboard with a hero section for BGG username merge input, a "Merge collections" button, a personal stats card (collection size, group count, session count), and a "Trending on BGG" section.
  2. User sees a Collection view with a structured filter sidebar (search, owner toggles, player count range slider, play-time checkbox groups, complexity segmented buttons).
  3. User sees rich game cards with thumbnail, rating badge, name, owner avatars, description, and a 3-column stats footer (players, time, complexity).
  4. User can sort the collection by Name A-Z, Rating High-Low, Weight Light-Heavy, or Recently Played, and toggle between grid and list views.
  5. User sees skeleton loaders during collection data fetching.

**Plans:** 8/8 plans complete
Plans:
**Wave 1**

- [x] 09-01-PLAN.md — Home merge hero and dedicated authorization-scoped personal stats

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 09-02-PLAN.md — Persisted Trending enrichment and shared Home/Hot cards with preserved `/hot`

**Wave 3** *(blocked on Wave 2 completion)*

- [x] 09-03-PLAN.md — Immutable authorization-scoped Recently Played metadata and true BGG object identity

**Wave 4** *(blocked on Wave 3 completion)*

- [x] 09-04-PLAN.md — Exact four-sort frontend, legacy URL migration, and scoped Recently Played flow

**Wave 5** *(blocked on Wave 4 completion)*

- [x] 09-05-PLAN.md — Compact token, source-owned Slider, player-range behavior, and legacy-safe filter state

**Wave 6** *(blocked on Wave 5 completion)*

- [x] 09-06-PLAN.md — Source-owned ToggleGroup and accessible time, complexity, owner, and ordered panel controls

**Wave 7** *(blocked on Wave 6 completion)*

- [x] 09-07-PLAN.md — Responsive Collection-local filter panel, active chips, Sheet integration, and safe legacy-filter deletion

**Wave 8** *(blocked on Wave 7 completion)*

- [x] 09-08-PLAN.md — Rich grid/list cards, view-matched skeletons, production build, and integrated browser gate

**UI hint**: yes

### Phase 10: Picking a Game Redesign

**Goal**: Users can pick a game for a session using the redesigned UI with attendee-aware suggestions.
**Mode:** mvp
**Depends on**: Phase 7 (suggestion engine) and Phase 9 (collection redesign patterns)
**Requirements**: PICK-01, PICK-02, PICK-03
**Success Criteria** (what must be TRUE):

  1. User sees a session header with title, status badge, date/time, attendee avatars with count, and an "Edit Details" button on the Picking screen.
  2. User sees a "Game Suggestions (Filtered for N Players)" heading with suggestions filtered by confirmed attendees.
  3. User sees game suggestion cards with thumbnail, title, duration, description, player count, and a "Pick this game" button.
  4. User can pick a game from the suggestion list and the session updates to the selected game state.

**Plans:** 4/6 plans executed
Plans:

**Wave 1**

- [x] 10-01-PLAN.md — Host-only ordinary session-details mutation and lifecycle/authorization contract

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 10-02-PLAN.md — Schema publication, main NightSession suggestion operation, and generated Vue contracts

**Wave 3** *(blocked on Wave 2 completion)*

- [x] 10-03-PLAN.md — Responsive Picking session header and accessible Edit Details dialog
- [x] 10-04-PLAN.md — Additive explainable GameCard extension and server-ranked top-eight picker

**Wave 4** *(blocked on both Wave 3 plans)*

- [ ] 10-05-PLAN.md — Integrated state-driven route, deterministic fixtures, and protected lifecycle acceptance

**Wave 5** *(blocked on Wave 4 completion)*

- [ ] 10-06-PLAN.md — Human visual and interaction UI-SPEC compliance checkpoint

**UI hint**: yes

### Phase 11: Polish & E2E Hardening

**Goal**: v1.1 is hardened with E2E tests in CI, dev infrastructure fixes, and cleanup of legacy code.
**Mode:** mvp
**Depends on**: Phases 8, 9, 10 (all redesigned surfaces)
**Requirements**: DEBT-01, DEBT-02, DEBT-03, DEBT-04
**Success Criteria** (what must be TRUE):

  1. E2E test suite runs in CI on every PR (Playwright tests execute).
  2. Action Cable dev config uses the solid_cable adapter and Vite proxies `/cable` so real-time subscriptions work locally.
  3. Legacy duplicate BGG classes are removed (e.g., duplicate `ImportCollectionJob`, unsafe `Bgg::CollectionPersister#fetch_and_persist!`).
  4. REQUIREMENTS.md checkboxes are updated to reflect v1.0 implementation evidence (BGG-01, BGG-04, BGG-05, COLL-01, COLL-03, COLL-05).
  5. Dark mode and responsive layouts are verified across all redesigned surfaces.

**Plans**: TBD
**UI hint**: yes

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9 → 10 → 11

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation & Monorepo Shell | 3/3 | Complete | 2026-07-02 |
| 2. BGG Integration Layer + Persistence | 3/3 | Complete | 2026-07-04 |
| 3. GraphQL API + Collection Surface (v1 Parity) | 11/11 | Complete | 2026-07-08 |
| 4. Auth + Friend Groups + Session Lifecycle | 4/4 | Complete | 2026-07-09 |
| 5. Design System Foundation | 4/4 | Complete   | 2026-07-13 |
| 6. BGG Poll Data Layer | 3/3 | Complete    | 2026-07-13 |
| 7. Suggestion Engine Backend | 4/4 | Complete    | 2026-07-14 |
| 8. Group Detail Surface | 6/6 | Complete    | 2026-07-15 |
| 9. Home & Collection Redesign | 8/8 | Complete    | 2026-07-17 |
| 10. Picking a Game Redesign | 4/6 | In Progress|  |
| 11. Polish & E2E Hardening | 0/TBD | Not started | - |

---

*Roadmap created: 2026-07-01; updated for v1.1 on 2026-07-13*
*Granularity: coarse (4 v1.0 + 7 v1.1 phases) | Mode: mvp | Coverage: 31/31 v1.1 requirements mapped*
