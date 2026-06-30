# Project Research Summary

**Project:** boardgame-night-rails-vue
**Domain:** Boardgame collection sharing + night-organizing (Rails 8 API-only + Vue 3 SPA monorepo, GraphQL, BoardGameGeek XML API v2 integration)
**Researched:** 2026-07-01
**Confidence:** HIGH

## Executive Summary

This is a **rewrite-cum-expansion** of an existing Next.js + Apollo app (`bggeek-shared-list`) and its Node proxy (`bgg-graphql-proxy`), collapsed into a single **Rails 8 API-only + Vue 3 SPA monorepo** served via one Kamal 2 deploy. Experts build this category as a contract-first GraphQL service with a single egress point to upstream (BGG), strict input-validation contracts, and DB-persisted cached collections so the read path never blocks on the upstream rate limit. The recommended approach: a single `BggNightSchema` with `GraphQL::Dataloader`, dry-validation contracts at every mutation, Solid Queue (concurrency: 1, explicit `retry_on`) + Solid Cache (no Redis) for the BGG layer, Apollo Client 3.13 + `@vue/apollo-composable 4.2.2` (the known-good Vue 3 combo) with a normalized `InMemoryCache` as the sole source of server data, and `has_secure_password` + signed magic-link tokens for the friend-group auth that gates all night-organizing features.

The research surfaced five upstream/architectural traps that **must** be addressed in their owning phases, not as afterthoughts: (1) BGG's documented expansion-subtype bug requires a two-call workaround ported from the reference proxy (single `subtype=boardgame` silently miscategorizes expansions); (2) the 1 req/5s rate limit must be enforced **across all Solid Queue workers** via a Solid Cache compare-and-set key, with the BGG job capped at concurrency: 1; (3) BGG returns HTTP 202 "queued" for the collection endpoint — parse-empty-and-silent-fail unless you check status before Nokogiri and retry ≤5×; (4) Solid Queue has **no auto-retry** like Sidekiq — every BGG job must declare `retry_on`/`discard_on` or transient 503s die silently; (5) GraphQL::Dataloader (not legacy `graphql-batch`) is the N+1 path, and `max_complexity`/`max_depth` plus introspection-disabled-in-prod must be set from schema day one. The rewrite must also fix v1's hardcoded **2-user limit** (`useMultiUserCollections.ts` literally comments "for now, handle up to 2 usernames") — design for N users from the start, even though collection merging by `objectId` already generalizes trivially.

**Auth is the architectural gate.** Every night-organizing feature (friend groups, sessions, RSVP, suggestions) depends on user accounts plus per-account **BGG username binding** — the bridge between the auth world and the BGG-collection world. The game suggestion engine is the headline differentiator but is also the convergence point: it depends on **both** the persisted-collection surface (Phase 2/3) **and** the session/attendee surface (Phase 4). It therefore lands last, after both foundations are solid.

## Key Findings

### Recommended Stack

Full detail in [STACK.md](./STACK.md) — every version verified against RubyGems.org / npm registry / official docs on 2026-07-01.

**Core technologies:**
- **Rails 8.1.3 + Ruby 3.4.10** — `--api` scaffold, ships Solid Queue/Cache/Kamal 2 by default; the recommended Rails/Ruby pair for a greenfield in mid-2026.
- **graphql-ruby 2.6.3 + `GraphQL::Dataloader`** — class-based schema, fiber-based N+1 batching (NOT legacy `graphql-batch`), `Schema.multiplex` for Apollo batch link.
- **dry-rails + dry-validation 1.11** — `ApplicationContract` is the single input-validation boundary; never mix with strong_params (Pitfall #8).
- **Solid Queue 1.4 + Solid Cache 1.0** (no Redis) — DB-backed jobs/cache; concurrency: 1 on BGG key; **explicit `retry_on` mandatory** (no Sidekiq-style auto-retry).
- **Faraday 2.14 + Nokogiri 1.19** — sole BGG egress; Faraday `:retry` middleware is the first line of defense, `Bgg::RateLimiter` (Solid Cache key) is the second.
- **vite_rails 3.11 + Vue 3.5.35 + Apollo 3.13.9 + @vue/apollo-composable 4.2.2** — monorepo SPA; **fallback** to vite_rails 3.10 + Vite 6 if Vite 8 (Rolldown) tooling chafes in Phase 1.
- **Pinia 3.0 (UI/draft state only) + Apollo InMemoryCache (server data)** — never duplicate server data in Pinia (Anti-Pattern 4).
- **Tailwind v4 + @tailwindcss/vite + Fuse.js 7.4** — styling + client-side fuzzy search (Fuse moves to Postgres `pg_trgm` only past ~300 games).
- **bcrypt + `has_secure_password` + signed `ActiveSupport::MessageVerifier` tokens** — minimal API-friendly auth + magic-link invites; NOT Devise (fights API-only+Vue).
- **Kamal 2.12** — single-Docker-image atomic deploys (Rails serves compiled SPA from `public/` + `/graphql`).
- **Vitest 3.2 + Playwright 1.61** on frontend; **rspec-rails 8** + port reference proxy XML fixtures on backend.

**Critical version constraint:** `@apollo/client` 4.x is **incompatible** with `@vue/apollo-composable` (binding is beta-only today). Pin Apollo 3.13.9 + composable 4.2.2 + graphql ^16.11 for the launch — and revisit Apollo 4 only after composable v5 ships stable.

### Expected Features

Full prioritization matrix in [FEATURES.md](./FEATURES.md).

**Must have (table stakes / P1):**
- BGG username validation · N-user collection merge (fix v1's 2-user ceiling) · collection dedup + owner tracking by `objectId` · fuzzy search · player/time filters · sort (name/rating/year + complexity) · group-by (players/rating/best-players/none) · member color avatars · permalink URLs · responsive layout · hot games landing · game card w/ complexity badge · loading/empty/error states.
- **Auth + accounts + BGG username binding** — the gate for the new surface.
- **Friend groups (CRUD + invite + membership)** — persistent home for a group's merged collection.
- **Sessions: create → magic-link invite → binary RSVP → host picks from group collection** (thinnest organizing loop).
- **Group-scoped persistent merged collection view** — v1 collection UI, scoped to a group.

**Should have (differentiators / P2):**
- **Game suggestion engine (session-scoped, BGG-poll-based, deterministic weighted scoring)** — the headline feature.
- **Ranked voting on suggestion shortlist** (Borda/STV).
- **BGG-poll-based "best player count"** grouping/filter (replaces v1's range heuristic — the single biggest quality lever).
- 4-state RSVP (Going/Maybe/Interested/Not Going) · "who brings it" assignment · recurring sessions (clone first) · mechanic/category facets · play logging (local-only) — these add depth once the core loop ships.

**Defer (v3+/risk-flagged):**
- BGG play write-back (XML API2 cookie-auth is fragile/undocumented) · "want to play" cross-group boost · session history timeline + stats dashboard · live session tools · PWA install.
- **Anti-features (deliberately out of scope):** AI/LLM suggestions, public event discovery/marketplace, online play, shelf photo/barcode, price tracking, multi-table seating, native mobile apps, social feed/forums, tournament system.

**The algorithm that defines the differentiator:** the session-scoped suggestion engine scores candidate games (owned by ≥1 RSVP'd attendee, within player-count + time + complexity constraints) using Schmaus's adjusted-rating formula over BGG "suggested_player_count" poll data: `suitability = 100 * (best_pct*1.0 + rec_pct*0.6 + nrec_pct*0.0)`, combined with `time_fit`, `complexity_fit` (from `averageWeight`), `community_rating`, and optional `freshness` from play logs. Recommended weights: `players=40, time=20, complex=20, rating=10, fresh=10`. Outputs a ranked shortlist **with human-readable score breakdowns** ("Best at 5 players · 72% Best votes · 75min fits your 2h budget · Owned by Alex & Sam"). Beats ML/CF: transparent, instant, cold-start-safe (no training matrix a small friend group will ever produce), tuneable.

### Architecture Approach

Full detail in [ARCHITECTURE.md](./ARCHITECTURE.md). One Rails 8 API-only app, Vuex SPA co-located in `app/frontend/` via vite-ruby, single `POST /graphql` endpoint, single Kamal 2 deploy. Two BGG data tiers: **persisted** (`bgg_things`, `bgg_collection_items`, `bgg_users` — written by background import jobs, read by resolvers/suggestions as pure DB queries — this is what makes multi-user merge feasible at all) **vs fetched-live-cache-through** (hot/search/user-validation/single-thing-detail).

**Major components:**
1. **`app/graphql/`** — single `BggNightSchema` (`Dataloader`, `max_complexity 400`), class-based types/resolvers/mutations, `app/graphql/loaders/` for `GraphQL::Dataloader::Source` batch loaders (e.g. `BggThingLoader`).
2. **`app/contracts/`** — dry-validation `ApplicationContract` subclasses — **every mutation goes through a contract before touching a service**.
3. **`app/services/bgg/`** — `Bgg::Client` (the sole BGG egress) + `Bgg::RateLimiter` + `Bgg::XmlParser` + per-endpoint classes (`Thing`, `Search`, `User`, `Collection` w/ expansion workaround, `Hot`).
4. **`app/services/{collections,groups,sessions,suggestions}/`** — business logic; e.g. `Collections::Merge` (pure DB query over `bgg_collection_items`), `Sessions::Suggest`, `Suggestions::Engine` (pure: merged collection × attendees × player-count filter → ranked suggestions).
5. **`app/jobs/bgg/`** — `Bgg::ImportCollectionJob` (`limits_concurrency to: 1, key: "bgg_api"`, explicit `retry_on`/`discard_on`), `Bgg::RefreshHotItemsJob` (cron).
6. **Storage** — SQLite in prod v1 (3 files: app/queue/cache in `storage/`) → Postgres (one DB, three schemas) past ~1k users or when server-side fuzzy search is needed.
7. **Vue frontend** — Apollo `InMemoryCache` (normalized, **sole source of server data**), Pinia stores (**UI/draft state only**), `vue-router` permalink routes (`/u/:usernames`, `/g/:token`, `/s/:id`), graphql-codegen producing typed composables from the Rails `schema.graphql` (monorepo contract).
8. **Internal boundaries** — Resolvers never call BGG directly or hold business logic (they call services); services never call GraphQL; jobs never call GraphQL (they call services). The `Bgg::Client` is the only code that talks HTTP to BGG.

### Critical Pitfalls

Full detail in [PITFALLS.md](./PITFALLS.md) — 10 critical pitfalls + tech debt patterns + integration gotchas + rewrite-specific pitfalls.

1. **BGG expansion-subtype workaround (Pitfall #1)** — `subtype=boardgame` alone is a documented BGG API bug that mislabels expansions as base games. Port the exact two-call workaround (`excludesubtype=boardgameexpansion` + `subtype=boardgameexpansion`, then merge by `totalitems`+items) from `bggDataSource.ts`; test with the fixture that asserts 62 base + 13 expansions = 75 items.
2. **BGG 5-second rate limit, cross-worker (Pitfall #2)** — enforce via Solid Cache key `bgg:last_request_at` with compare-and-set; cap BGG jobs with `limits_concurrency to: 1, key: "bgg_api"`. Without this, BGG 429/503-storms and may IP-ban the server (no formal unban process).
3. **BGG HTTP 202 "queued" silent hang (Pitfall #3)** — the collection endpoint returns 202 when BGG is preparing data. **Check status before Nokogiri parse**; retry ≤5× with 2–5s delay; expose a `CollectionStatus` enum (`READY`/`QUEUED`/`ERROR`) to the frontend instead of returning an empty collection.
4. **Solid Queue no auto-retry (Pitfall #7)** — unlike Sidekiq's 25 retries, Solid Queue jobs die after one failure unless `retry_on` is declared. Every BGG job must declare `retry_on Bgg::RateLimitError, wait: :polynomially_longer` etc. + `discard_on Bgg::NotFoundError`; keep retry logic in Faraday too (defense in depth).
5. **GraphQL N+1, depth/complexity, introspection (Pitfalls #6 + security)** — use `GraphQL::Dataloader::Source` loaders (NOT legacy `graphql-batch`); set `max_complexity 400` + `max_depth` from day one; `disable_introspection_entry_points` in production (the old proxy had `introspection: true` — don't copy). Synchronous BGG fetches in resolvers are a strict anti-pattern — persist collections, read from DB.
6. **Rewrite-borrowed anti-patterns (R1, R2)** — do NOT port Node/serverless workarounds (Redis keepalive cron, Apollo `RESTDataSource` caching) — they solve problems Rails doesn't have. DO port: rate limiter, expansion workaround, XML normalizer, retry logic. **Fix** v1's hardcoded 2-user limit, sequential fetching without per-user error isolation, and arbitrary `bestPlayers` heuristic (use real BGG poll data).

## Implications for Roadmap

Suggested phase structure (5 phases — coarse granularity per PROJECT config). Built from ARCHITECTURE.md's 10-step build order, collapsed to preserve critical-path dependencies while allowing parallel waves.

### Phase 1: Foundation & Monorepo Shell
**Rationale:** Nothing compiles, runs, or deploys without it; this is the single gate everything else walks through.
**Delivers:** Rails 8.1 `--api` app scaffold; Vite-ruby + Vue 3.5 spa in `app/frontend/`; Apollo Client 3.13 + `@vue/apollo-composable` wired to `POST /graphql`; Vue Router + Pinia + Tailwind v4; empty `BggNightSchema` skeleton with `GraphQL::Dataloader` + `max_complexity 400`; `GraphqlController` supporting Apollo batch (`Schema.multiplex`); dry-rails container + `ApplicationContract` base; `.env.bggeek` loading via dotenv-rails; `rack-cors` dev-only CORS; dev proxy config (`skipProxy: true`, Vite `/graphql` → Rails); rspec-rails + Vitest + Playwright + codegen scaffolds; RuboCop + ESLint + Prettier; Kamal 2 `deploy.yml`; **verify Vite 8 vs fall back to Vite 6**.
**Addresses pitfalls:** #9 (dev proxy chaos), #10 (atomic deploy coupling — set up single-Kamal-deploy from day one), #8 (decide dry-validation-only strategy before any controllers exist).
**Research flag:** LOW — standard vite-ruby + Rails 8 setup. If Vite 8 (Rolldown) shows Vitest/codegen friction, fall back to `vite_rails 3.10 + Vite 6` per STACK.md "Stack Patterns by Variant."

### Phase 2: BGG Integration Layer + Persistence (research-flagged)
**Rationale:** BGG is the data source for every later feature; validation of the rate-limit + cache + 202 + expansion strategy early de-risks the largest unknowns (ARCHITECTURE.md build steps 2–3). Persistence is what makes multi-user merge feasible — without it, N-user merge is 50s of blocked GraphQL request.
**Delivers:** `Bgg::Client` + `Bgg::RateLimiter` (Solid Cache compare-and-set, 1 req/5s across workers) + `Bgg::XmlParser` (Nokogiri, nil-safe, porting reference proxy normalization) + per-endpoint classes (`Thing`, `Search`, `User`, `Collection` **with the two-call expansion workaround**, `Hot`); **202-as-202 retry middleware** returning a `CollectionStatus` enum; migrations for `bgg_things`, `bgg_collection_items`, `bgg_users` (3-DB split: app/queue/cache via `connects_to`); `Bgg::ImportCollectionJob` with `limits_concurrency to: 1, key: "bgg_api"` + explicit `retry_on`/`discard_on`; `Collections::Import` + `Collections::Merge` services (Merge is a **pure DB query**, no BGG calls); ported XML test fixtures (`stevmachine_*.xml`) and RSpec coverage asserting 62 base + 13 expansions = 75.
**Addresses pitfalls:** #1 (expansion workaround), #2 (rate limit), #3 (202 handling), #4 (XML nil-safety) — all first-class in this phase, not afterthoughts. #7 (Solid Queue retry_on) — established here, reused later.
**Research flag:** HIGH — BGG's quirky behaviors (202 semantics, subtype bug, mixed-content XML arrays) are unique to this upstream and require fixture-driven research-phase work. Cross-worker rate-limit locking on SQLite (not `FOR UPDATE SKIP LOCKED`) also needs validation.

### Phase 3: GraphQL API + Collection Surface (v1 parity)
**Rationale:** First user-visible feature; validates the entire stack end-to-end (Vue → Apollo → GraphQL → DB-cached BGG). Completes the "rewrite parity" half of v1 and is the foundation the night-organizing surface builds on top of (a group's merged collection view reuses the same components).
**Delivers:** Full `Types::QueryType` with `thing`, `things` (batched), `search`, `user`, `userCollection`, `hotItems`, `syncStatus`; `BggThingLoader` (`Dataloader::Source`) for N+1 prevention; Apollo batch link + `Schema.multiplex`; Vue `HomeView` (hot games + username input) + `CollectionView` (merged display); `useMultiUserCollections` generalized to **N users** (killing v1's 2-user ceiling); dedup + owner tracking by `objectId` with status; `GameCard` + `Results` + `ResultsSkeleton` + collapsible groups; member color avatars; fuzzy search (Fuse.js 7.4, keys/threshold/debounce preserving v1 config); player/time filters + sort + group-by (replacing `bestPlayers` heuristic with a placeholder until Phase 5 adds real BGG poll data); **complexity `averageWeight` filter + sort + card badge** (cheap, high value); permalink route `/u/:usernames`; responsive layout (mobile drawer + desktop sidebar); loading/empty/error states; graphql-codegen pipeline (schema dump → committed `schema.graphql` → typed Vue Apollo composables, CI fails on drift).
**Addresses pitfalls:** #6 (N+1 → Dataloader from day one), security (introspection disabled in prod), #10 (codegen contract prevents frontend/backend schema drift).
**Uses stack:** Apollo 3.13 + composable 4.2.2 + graphql ^16.11 + Pinia 3 (UI-only) + Fuse 7.4 + Tailwind v4 + `graphql-codegen`.
**Research flag:** LOW — mostly a v1 port to Vue 3 idioms + standard graphql-ruby patterns. Best-player-count grouping deliberately stubs the heuristic with TODO; real BGG poll data lands in Phase 5.

### Phase 4: Auth + Friend Groups + Session Lifecycle (research-flagged light)
**Rationale:** The FEATURES dependency graph makes auth the gate for **every** night-organizing feature, and BGG username binding is the bridge between auth and the collection world. Build groups + sessions together because they share the membership/invite model and because sessions belong to groups.
**Delivers:** `User` model + `has_secure_password` + bcrypt + `SessionToken`/JWT-ish signed session; **BGG username binding** (one validated `bgg_username` per user, validated via live `Bgg::Client.user` once, cached); `Group` + `group_members` (roles: owner/admin/member) with membership + invite-code/magic-link generation; `Session` + `session_attendees` (status state machine: draft → scheduled → rsvp_open → suggesting → picking → in_progress → completed); `CreateGroup`/`AddGroupMember`/`CreateSession`/`RsvpSession` mutations with contracts → services; `MagicLink` signed-token invites to a session (no-account RSVP → provisional profile → optional upgrade to account); `Types::GroupType` + `Types::SessionType`; Vue `GroupView` + `GroupForm` + `GroupMemberList` + `SessionView` + `SessionForm` + `AttendeePicker`; `importCollection` mutation wired to `Bgg::ImportCollectionJob` for an individual user *and* via group membership (group's merged collection = union of members' cached collections, deduped by `objectId`); Vue auth flows (login/Register + magic-link landing). **Out-of-scope for this phase:** suggestion engine, ranked voting, 4-state RSVP (binary Going/Not Going only), play logging.
**Addresses pitfalls:** R2 (fix N-user from start, fix no-account isolation); security (auth on GraphQL endpoint, BGG username binding validation); magic-link signed-token design.
**Research flag:** MEDIUM — Rails `has_secure_password` + signed token magic-links is standard, but the no-account-RSVP → provisional-profile → optional-upgrade flow needs design thinking (is it an identifiable `SessionAttendee` row keyed by invite token, or a provisional `User`?). Plan-phase should resolve the data model before execution.

### Phase 5: Game Suggestion Engine + Polish (research-flagged)
**Rationale:** The suggestion engine is the convergence point — it requires **both** the persisted-collection surface (Phase 2/3) **and** the session/attendee surface (Phase 4) to exist. Landing it last matches ARCHITECTURE.md build step 9 and FEATURES.md "P2 — add once P1 loop is validated." Polish (sync-status UX, hot-items cron, share-for-groups/sessions) is non-blocking tail.
**Delivers:** `Suggestions::Engine` (pure: merged collection × RSVP'd attendees × player-count filter + Schmaus poll-based scoring, weights `players=40/time=20/complex=20/rating=10/fresh=10` initially) + `Sessions::Suggest` service + `suggestions` Query resolver + `GameSuggestionType` (with `reasons` array for explainability); `BggThingLoader` upgraded to also prefetch poll data when suggestions are requested; **BGG-poll-based "best at N" grouping/filter** replacing v1's range heuristic and Phase 3's placeholder; Vue `SuggestionList` + `SuggestionCard` rendering score breakdowns ("Best at 5 players · 72% Best votes · 75min fits your 2h budget · Owned by Alex & Sam"); scheduled `Bgg::RefreshHotItemsJob` (Solid Queue cron, 24h); sync-status polling UX, "refresh collection" button with 15-min cooldown, permalink sharing for groups/sessions; Bullet on in dev/test to catch N+1 in the suggestion path; Mission Control — Jobs dashboard exposed admin-side for Solid Queue visibility.
**Addresses pitfalls:** R4 (suggestion algorithm mistakes — player count, complexity, ownership, expansion-without-base exclusion; cold-start fallback to hot items); perf (Suggestions::Engine uses DB indexes + `includes(:bgg_thing)` to avoid N+1 on 10-user × 200-game groups).
**Research flag:** HIGH — Schmaus formula implementation, +1-vote smoothing, low-confidence-flag fallback, expansion-without-base exclusion, and the explainability UX rendering all need a planning research-phase before execution. The poll data shape (BGG `suggested_player_count` returns Best/Recommended/NotRecommended vote counts per count) needs a real-XML-fixture spike to validate the parser.
**v1 ship gate:** all P1 features parity-checked, suggestions produce explainable shortlists for a test 5-friend group, deploy works end-to-end on Kamal. v1.x P2 items (ranked voting, 4-state RSVP, recurring sessions, "who brings it", facets, local play logging) are backlog from here.

### Phase Ordering Rationale

- **Dependency-driven, not preference-driven.** Phases 1 → 2 → 3 follow ARCHITECTURE.md's critical path verbatim (foundation → BGG client/persistence → GraphQL+UI). Phase 4 (auth/groups/sessions) waits for Phase 3 because session/group UI reuses collection components, and because FEATURES.md's dependency graph puts auth as the gate for the night-organizing surface that builds on the collection surface. Phase 5 (suggestions) waits for Phase 4 because suggestions need session attendees.
- **Phase 3 splits the v1 parity work from the new surface work** so the rewrite-parity milestone could theoretically ship here if scope pressure mounts — a useful de-risking seam.
- **Grouping by architectural component, not by feature-hype.** Phase 2 owns the entire Bgg::Client + rate limit + 202 + expansion + persistence story as one cohesive unit so all the BGG pitfalls are addressed together in their owning phase (per PITFALLS.md's pitfall-to-phase mapping). Phase 4 owns the entire auth + groups + sessions seam together. Phase 5 single-shoots the algorithmic risk.
- **Pitfall avoidance is woven into phase intent, not retrofitted.** #1/#2/#3/#4/#7 land in Phase 2, #6/security land in Phase 3, #8/#9/#10 land in Phase 1, R1/R2 are addressed by design discipline in every phase, R3 (scope creep) is enforced by this very 5-phase cap, R4 is addressed in Phase 5's research flag.

### Research Flags

**Needs research-phase during planning:**
- **Phase 2 (BGG Integration):** HIGH — BGG's 202/expansion/XML-array quirks are unique to this upstream and must be validated with ported XML fixtures; cross-worker rate-limit locking on SQLite (no `FOR UPDATE SKIP LOCKED`) needs a spike. Recommend `--research-phase 2`.
- **Phase 4 (Auth + Groups + Sessions):** MEDIUM — the magic-link → no-account-RSVP → provisional-profile → optional-upgrade-to-account lifecycle is a bespoke flow; data model needs design before execution. Recommend `--research-phase 4` for the attendee/invite data model only.
- **Phase 5 (Suggestion Engine):** HIGH — Schmaus formula, BGG poll parser, scoring weights, expandability reasons, cold-start fallback, and the engine's N+1 perf on large merged collections all warrant a planning-phase spike with real BGG poll XML. Recommend `--research-phase 5`.

**Standard patterns (skip research-phase):**
- **Phase 1 (Foundation):** vite-ruby + Rails 8 + Apollo wiring are well-documented; only decision is Vite 8 vs Vite 6 fallback, which is a STACK.md "Stack Patterns by Variant" toggle.
- **Phase 3 (GraphQL API + Collection UI):** mostly a v1 port to Vue 3 + graphql-ruby idioms; the Dataloader/complexity/introspection patterns are covered by Context7 graphql-ruby docs.

## Confidence Assessment

| Area  | Confidence | Notes |
|-------|------------|-------|
| Stack | HIGH | Every gem/package version verified against RubyGems.org / npm / official docs on 2026-07-01 via Context7. Only MEDIUM pins are Vite 8 (new Rolldown engine — fallback documented) and TypeScript ~5.9 (6.x exists but unverified against vue-tsc/eslint). |
| Features | HIGH (v1 baseline, source-verified) / MEDIUM (competitor landscape, corroborated across 6+ organizers) | v1 table stakes are code-verified from `bggeek-shared-list/src/`; differentiators corroborated across 6+ competitor apps; suggestion algorithm corroborated by Schmaus + 3+ open-source recommenders. |
| Architecture | HIGH | Shape verified against official graphql-ruby/vite-ruby/dry-rails/Rails 8 docs and cross-checked against 5 real-world Rails+Vite monorepos. |
| Pitfalls | HIGH | BGG API pitfalls verified against `bgg-graphql-proxy` source + BGG XML API2 wiki; Rails 8/graphql-ruby/dry-validation pitfalls verified via Context7 official docs across 4+ independent sources each. |

**Overall confidence:** HIGH — this is a rewrite of a known existing app with primary-source access, not greenfield speculation.

### Gaps to Address

- **Apollo 4 / `@vue/apollo-composable` 5 timeline:** pinned to Apollo 3.13.x for launch; revisit when composable v5 ships stable. Track issue vuejs/apollo #1597 / PR #1609. Not a v1 blocker.
- **Cross-worker rate-limit race on SQLite (Phase 2):** Solid Cache compare-and-set on SQLite needs a dedicated test — happy path works, but 2 Puma workers + a Solid Queue worker all hitting the `bgg:last_request_at` key simultaneously is the real test. Postgres (1k+ tier) gets `FOR UPDATE SKIP LOCKED`; SQLite gets polling + retry. Validate in Phase 2 research-phase.
- **BGG poll XML shape (Phase 5):** Schmaus formula assumes a specific `suggested_player_count` poll result shape (`PollResult{value, numVotes, level[Best|Recommended|NotRecommended]}`). The reference proxy schema has `polls` but real poll XML has not yet been pulled into fixtures. Spike required.
- **Vite 8 (Rolldown) ecosystem maturity (Phase 1):** Vitest 3.2.6 + `@graphql-codegen/cli 7` may show compat issues on Vite 8. Fallback to vite_rails 3.10 + Vite 6 is documented but ideally exercised in Phase 1 to avoid a mid-build swap.
- **Auth lifecycle precision (Phase 4):** resolved vs unresolved session attendee (provisional-profile-only vs upgradeable `User` account) needs a plan-phase decision — affects whether `group_members.bgg_username` is nullable, whether `session_attendees` can reference either a `user_id` or a magic-link token, etc.
- **Solid Queue concurrency controls on SQLite:** `limits_concurrency` uses polling on SQLite (not `SKIP LOCKED`). Phase 2 needs validation that a 1-BGG-job limit holds under periodic import pressures.

## Sources

### Primary (HIGH confidence)
- **Reference repos (read directly):** `bgg-graphql-proxy/src/datasources/bggDataSource.ts` (rate limit 5000ms, retry `[1000,2000,4000]`ms / MAX_RETRIES=3, expansion workaround, XML normalization) and `bgg-graphql-proxy/src/schema/schema.graphql` (Thing shape with `polls`, `averageWeight`, `userPlays`, `Status` enum, `hotItems`); `bggeek-shared-list/src/` (`useMultiUserCollections.ts` w/ 2-user hardcoded limit, `useFuzzySearch.ts`, `grouping.ts` `bestPlayers` heuristic, `search.ts` filter buckets, `permalink.ts`, `memberColors.ts`).
- **BGG XML API2 Official Wiki:** rate limit (5s), 202 queued responses, expansion `subtype` bug, collection parameters.
- **RubyGems + npm (verified 2026-07-01):** every pinned version (rails 8.1.3, graphql 2.6.3, dry-validation 1.11.1, dry-rails 0.7.0, faraday 2.14.3, nokogiri 1.19.4, solid_queue 1.4.0, solid_cache 1.0.10, rspec-rails 8.0.4, vite_rails 3.11.0, bcrypt 3.1.22, kamal 2.12.0; vue 3.5.35, vue-router 5.1.0, pinia 3.0.4, @vueuse/core 14.3.0, fuse.js 7.4.2, @apollo/client 3.13.9, @vue/apollo-composable 4.2.2, graphql 16.11, @vitejs/plugin-vue 6.0.7, vitest 3.2.6, @playwright/test 1.61.1, @graphql-codegen/cli 7.1.3, tailwindcss 4.3, @tailwindcss/vite 4.3).
- **Rails upgrading guide + FastRuby compatibility table:** Ruby ≥ 3.2, recommends 3.4.Z for Rails 8.1; chose Ruby 3.4.10.
- **Context7 (verified):** `/rmosolgo/graphql-ruby` (Dataloader + `Schema.multiplex` + `glyph:install` + class-based types), `/elmassimo/vite_ruby` (`app/frontend` `sourceCodeDir`, `entrypoints/`), `/dry-rb/dry-rails` (`ApplicationContract`, `safe_params`, container), `/vuejs/pinia` (setup stores), `/websites/guides_rubyonrails_v8_0` (Solid Queue default, multi-DB, Kamal 2), Tailwind v4 `@tailwindcss/vite`.
- **Basecamp/solid_queue + solid_cache README:** `limits_concurrency`, no auto-retry (relies on `retry_on`), separate-DB guidance, ActiveJob `retry_on` `wait: :polynomially_longer` semantics.
- **ActiveJob API docs:** `retry_on` `wait:` options, `attempts:`, `discard_on`.
- **GitHub issues/releases:** vuejs/apollo #1597 (composable incompatible w/ Apollo 4; v5 beta pending PR #1609), vitejs/vite-plugin-vue CHANGELOG (Vite 8 support in plugin-vue 6.0.3+), basecamp/kamal 2.12.0 (requires kamal-proxy 0.9.2), rubocop-rspec 3.x cops extraction.

### Secondary (MEDIUM confidence)
- **Competitor landscape (corroborated across 6+ organizers):** What2Play, DicyNight, Boardy, MeepleUp, GameNight, Game Night Picks, Games Night Planner — feature x competitor matrix in FEATURES.md.
- **Suggestion algorithms (corroborated):** Schmaus, unreasonableeffectiveness.com (adjusted-rating formula using BGG poll data); gamescout (content-based weighted scoring); Meeple-Matchmaker (hybrid CF+content); DiceDecider (player/time/complexity/play-count filters); BoardMatch (complexity weighting).
- **BGG play logging + BGA session model:** BoardGameGeek wiki "plays"; Board Game Stats FAQ; Board Game Arena FAQ.
- **Real-world Rails+Vite monorepos (Exa cross-check):** 5 examples — `app/frontend` (vite-ruby) pattern chosen as tightest fit for the single-deploy constraint; decoupled `apps/api + apps/web` rejected as violates PROJECT.md.

### Tertiary (LOW confidence, needs validation)
- **Vite 8 (Rolldown) compatibility with Vitest 3.2.6 + codegen 7** — new 2026 engine; STACK.md provides documented Vite 6 fallback but this needs exercise in Phase 1.
- **Solid Queue `limits_concurrency` behavior on SQLite (polling, not `SKIP LOCKED`)** — official docs confirm Postgres uses SKIP LOCKED; SQLite polling behavior under multi-worker contention needs Phase 2 spike.
- **BGG `suggested_player_count` poll XML real-world shape** — schema exists in reference proxy; raw fixture not yet captured. Phase 5 spike.

---
*Research completed: 2026-07-01*
*Synthesized from: STACK.md (308L), FEATURES.md (350L), ARCHITECTURE.md (637L), PITFALLS.md (564L), PROJECT.md.*
*Ready for roadmap: yes*