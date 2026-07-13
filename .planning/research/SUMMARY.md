# Project Research Summary

**Project:** boardgame-night-rails-vue
**Domain:** Rails 8 API-only + Vue 3 SPA monorepo, GraphQL API, BGG XML API v2 integration, friend groups + boardgame-night sessions
**Milestone:** v1.1 — UI Redesign ("Tabletop Social" / Stitch) + Poll-based Suggestion Engine
**Researched:** 2026-07-13
**Confidence:** HIGH

## Executive Summary

Boardgame-night is a friend-group social app for merging BoardGameGeek collections and organizing game nights. The v1.1 milestone is a full UI reskin to the "Tabletop Social" Stitch design system (Material 3 + Inter + Material Symbols) plus a new poll-based suggestion engine that uses BGG community "Best / Recommended / Not Recommended" votes to rank games for the exact attendee count.

The recommended approach is to keep the existing Rails 8.1 API-only + Vue 3.5 monorepo stack, add Material 3 tokens via Tailwind v4's CSS-first `@theme`, and build the suggestion engine as a deterministic, explainable Ruby service backed by persisted BGG poll data. This avoids AI/ML opacity, respects BGG's 1 req/5s rate limit, and keeps the frontend thin.

Key risks are: (1) Material Symbols performance and Tailwind v4 migration breaking existing utilities; (2) BGG poll data being missing, malformed, or fetched on demand; (3) the suggestion engine over-fitting to player count or ownership; (4) GraphQL schema changes breaking the existing frontend; (5) Group Detail N+1 queries and Apollo cache invalidation regressions. Mitigations include font subsetting/preloading, normalized poll storage, rule-based scoring with fallback heuristics, strict schema evolution discipline, eager loading, and surgical Apollo cache updates.

## Key Findings

### Recommended Stack

The stack is a concrete, version-pinned instantiation of the v1.0 architecture chosen to mitigate the known pitfalls. It is a Rails 8.1 single-deploy monorepo with a Vue 3 SPA co-located via vite-ruby, GraphQL via graphql-ruby (Dataloader), dry-validation contracts, Solid Queue/Cache (no Redis), Faraday + Nokogiri as the sole BGG egress, and Kamal 2 for atomic deploys. See [STACK.md](STACK.md) for full version details and installation commands.

**Core technologies:**
- **Ruby 3.4.10 + Rails 8.1.3 API-only** — Rails 8.1 is the recommended greenfield choice in mid-2026; ships Solid Queue, Solid Cache, Kamal 2, and a production Dockerfile. Pin via rbenv.
- **Vue 3.5.35 + Vite 8 + vite_rails 3.11.0** — SPA monorepo served from `public/` by Rails; override `sourceCodeDir` to `app/frontend`.
- **@apollo/client 3.13.9 + @vue/apollo-composable 4.2.2** — stable, known-good combo. Do **not** use Apollo 4 until the Vue binding v5 is stable; urql is the alternative if you want to avoid a legacy major.
- **GraphQL Ruby 2.6.3 with Dataloader** — official, fiber-based N+1 solution; prefer over legacy `graphql-batch`.
- **dry-rails + dry-validation** — contracts as the single input-validation boundary; never mix with Strong Parameters.
- **Faraday 2.14.3 + Nokogiri 1.19.4** — BGG XML API with retry middleware and nil-safe XML parsing.
- **Solid Queue 1.4.0 + Solid Cache 1.0.10** — no Redis for v1; use `limits_concurrency to: 1, key: "bgg_api"` and explicit `retry_on`.
- **SQLite for v1, Postgres upgrade path** — zero-ops for friend-group scale; move to Postgres only at 1k+ users or for server-side search.
- **Tailwind CSS v4.3 + Material Symbols** — design system foundation; use CSS-first `@theme` and subset the icon font.
- **@vueform/slider 2.1.10** — range slider for Collection filters; Vue 3 native and TS-friendly.

### Expected Features

The v1.1 milestone treats all v1.0 functionality as table stakes and adds a design-system migration plus a poll-based suggestion engine. The two new surfaces are interdependent only at the UI layer: the redesign can proceed in parallel with backend suggestion work once the token/primitive contract is defined. See [FEATURES.md](FEATURES.md) for the full feature dependency graph and prioritization matrix.

**Must have (table stakes from v1.0):**
- N-user BGG collection merge — core value prop, already in `BggThing.merged_for_users`
- Search/filter/sort/group — Fuse.js client-side search, responsive filters
- Hot/trending games — landing hook
- Permalinks — URL state sync + shareability
- Auth + friend groups + magic-link sessions — foundation for suggestions
- Binary RSVP — required for attendee count
- Manual game picking — fallback for suggestions
- Responsive layout — phones + desktop

**Should have (differentiators in v1.1):**
- Material 3 "Tabletop Social" design system — cohesive, modern UI
- App shell redesign — sidebar nav with clear primary action
- Home dashboard redesign — hero + stats + trending games
- Collection view redesign — structured filter sidebar, range slider, rich cards
- Group Detail surface — sessions list, members panel, shared collection spotlight
- Picking a Game redesign — session header + attendee-aware suggestions
- Poll-based suggestion engine — BGG community polls score games for the exact attendee count
- Explainable shortlist UI — reason chips + confidence indicators
- BGG-poll best-player-count grouping — replaces heuristic grouping

**Defer (v1.2+):**
- 4-state RSVP — expands state machine before suggestion engine is validated
- Ranked voting — depends on stable suggestion shortlist
- "Who brings it" assignment — post-pick logistics
- Play logging — adds models and post-session UI
- Availability polling — scheduling complexity
- Server-side search — Fuse.js is fine until shared collections exceed ~300 games

### Architecture Approach

The v1.1 architecture adds two parallel workstreams to the existing v1.0 monorepo: a design-system migration and a poll-based suggestion engine. The design system is isolated in `app/frontend/components/stitch/` primitives and Tailwind v4 `@theme` tokens so feature reskins can proceed mechanically. The suggestion engine is a pure Ruby service (`Suggestions::Engine`) that reads persisted `BggPoll`/`BggPollResult` data and returns a ranked shortlist with per-factor reasons. GraphQL resolvers stay thin; they authorize and call services. See [ARCHITECTURE.md](ARCHITECTURE.md) for the full build order and component map.

**Major components:**
1. **Tailwind v4 token layer + Stitch primitives** — single source of truth for M3 colors, typography, icons, elevation, shape.
2. **BggPoll / BggPollResult models** — normalized storage of BGG poll data attached to `BggThing`.
3. **Bgg::XmlParser poll extraction + Bgg::EnrichThingJob** — parse and backfill poll data without hitting the rate limit during requests.
4. **Suggestions::Engine + scoring classes** — deterministic, explainable scoring over merged collection × session context.
5. **GraphQL schema extensions** — `SuggestionType`, `BggPollType`, Group type fields (`sessions`, `inviteCode`, `collectionSpotlight`), `HomeDashboard`.
6. **Group Detail / Home / Collection / NightSession views** — redesigned surfaces using Stitch primitives and Apollo data.

### Critical Pitfalls

The top risks span design-system migration, BGG data integration, recommendation quality, and frontend data consistency. See [PITFALLS.md](PITFALLS.md) for the full checklist and recovery strategies.

1. **Material Symbols / Tailwind v4 integration** — subset icons, pin axes, preload the font, use `@theme` tokens, replace `@layer utilities` with `@utility`, and avoid hardcoded hex colors.
2. **BGG poll data pitfalls** — missing polls, malformed `numplayers` strings (e.g., `"3-4"`, `"4+"`), and fetching on demand. Normalize and persist polls during import; fall back to min/max heuristic when data is thin.
3. **Suggestion engine algorithm** — over-fitting to exact player count, cold-start empty shortlists, and opaque scores. Use weighted rule-based scoring with player fit, time fit, complexity, rating, and ownership; return structured reasons.
4. **Group Detail N+1** — eager load the full group/sessions/attendances/members graph, use `GraphQL::Dataloader`, and limit the collection spotlight to a curated subset.
5. **Apollo cache / Pinia conflicts** — keep server data in Apollo, UI-only state in Pinia; use mutation `update` callbacks with `cache.modify` rather than relying on `refetchQueries`.

## Implications for Roadmap

Based on the research, the v1.1 milestone should be delivered in seven phases. The critical path is: Design System → BGG Poll Data → Suggestion Engine → Picking a Game. UI reskin work can run in parallel with backend data work once primitives and tokens are established.

### Phase 1: Design System Foundation
**Rationale:** Every redesigned surface depends on tokens and primitives; this is the first dependency of the critical path.
**Delivers:** M3 `@theme` tokens, Inter + Material Symbols loading strategy, Stitch primitives (`StSurface`, `StText`, `StButton`, `StBadge`, `StSkeleton`, `StIcon`, `StAvatar`), Tailwind v4 migration cleanup.
**Addresses:** Material 3 design system, app shell redesign.
**Avoids:** Material Symbols font bloat, Tailwind v4 config conflicts, color token drift, dark-mode inconsistency.

### Phase 2: BGG Poll Data Layer
**Rationale:** The suggestion engine cannot function without persisted, normalized poll data.
**Delivers:** `bgg_polls` / `bgg_poll_results` migrations, `Bgg::XmlParser` poll extraction, `Bgg::EnrichThingJob` with concurrency controls, one-time backfill for existing `BggThing` rows.
**Addresses:** BGG-poll "best player count" grouping.
**Avoids:** BGG poll data pitfalls, rate-limit storms, synchronous BGG fetches in resolvers.

### Phase 3: Suggestion Engine Backend
**Rationale:** The headline differentiator; build the backend before any UI that depends on it.
**Delivers:** `Suggestions::Engine`, scoring classes (`PlayerCountScorer`, `TimeFitScorer`, `ComplexityScorer`, `Explain`), `SuggestionType` + `SuggestionReasonType`, `suggestions` resolver.
**Addresses:** Poll-based suggestion engine, explainable shortlist.
**Avoids:** Algorithm over-fitting, opaque scores, resolver compute, cold-start empty shortlists.

### Phase 4: Group Detail Surface
**Rationale:** Surfaces existing group data in the new design; depends on primitives and schema extensions.
**Delivers:** `Group` type extensions (`sessions`, `inviteCode`, `collectionSpotlight`), `GroupView` panels (header, sessions list, members, invite, spotlight), eager-loaded queries.
**Addresses:** Group Detail surface.
**Avoids:** N+1 queries, over-fetching the full merged collection, pagination regressions.

### Phase 5: Home & Collection Redesign
**Rationale:** Pure UI work over existing data; can be built in parallel with the suggestion engine once primitives exist.
**Delivers:** `HomeDashboard` query, `HomeView` dashboard layout, `CollectionFilters` with range slider, rich `GameCard`s, sort + grid/list toggle.
**Addresses:** Home dashboard redesign, Collection view redesign.
**Avoids:** Dark mode drift, responsive regressions, `@apply`/`@reference` issues.

### Phase 6: Picking a Game Redesign
**Rationale:** Converges the suggestion engine and the redesign in the most visible user flow.
**Delivers:** Redesigned `NightSessionView`, `SuggestionList`, `SuggestionCard`, attendee picker, game pick mutation, explainable reason chips.
**Addresses:** Picking a Game redesign, explainable shortlist UI.
**Avoids:** Apollo cache stale data, opaque scores, UX inconsistency.

### Phase 7: Polish & E2E Hardening
**Rationale:** Quality gates before ship; preserves v1.0 functionality and validates the redesign.
**Delivers:** Dark mode / responsive QA, Apollo cache audit, E2E tests in CI, schema/codegen diff check, `schema.graphql` committed.
**Addresses:** Existing v1.0 flows preserved.
**Avoids:** GraphQL breaking changes, E2E regressions, Pinia store duplication of server data.

### Phase Ordering Rationale

- **Dependencies:** The suggestion engine (Phase 3) requires poll data (Phase 2). The Picking a Game redesign (Phase 6) requires both the suggestion engine and the design primitives (Phase 1). Group Detail, Home, and Collection can be built in parallel once Phase 1 is done.
- **Risk reduction:** Front-loading the design system and BGG poll data work surfaces the two highest-risk integration areas early (Tailwind v4/Material Symbols and BGG XML parsing). The suggestion engine is unit-tested before the UI is wired.
- **Architecture alignment:** Thin resolvers, pure services, normalized models, and Apollo-normalized cache are consistent patterns across all phases. This grouping avoids re-introducing anti-patterns like synchronous BGG calls or Pinia-as-source-of-server-data.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 1:** Vite 8 (Rolldown) compatibility with Vitest and graphql-codegen — have a fallback path (vite_rails 3.10.0 + Vite 6) ready.
- **Phase 2:** Live BGG XML poll samples could not be fetched due to BGG authentication requirements; validate the parser against real XML during implementation.
- **Phase 5:** Tailwind v4 `@theme` migration may require incremental testing; verify `@apply` / `@reference` behavior with Vue SFC styles.

Phases with standard patterns (skip research-phase):
- **Phase 3:** Deterministic scoring is well-defined in FEATURES.md and ARCHITECTURE.md.
- **Phase 4:** GraphQL + Dataloader eager-loading is a standard Rails pattern.
- **Phase 7:** E2E/CI hardening and schema validation are standard practice.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All versions verified against RubyGems, npm, and official docs on 2026-07-01. Apollo 3.13.x + Vue composable 4.2.2 is a known-good combo. |
| Features | HIGH | Existing codebase, BGG docs, competitor analysis, and prior v1.0 research provide a clear v1.1 scope. |
| Architecture | MEDIUM | Derived from v1.0 project context and standard patterns; BGG poll XML structure was inferred from docs, not fetched live. |
| Pitfalls | HIGH | Official Tailwind, Apollo, Material, and GraphQL docs plus project source code corroborate the risks. |

**Overall confidence:** HIGH

### Gaps to Address

- **Live BGG poll XML validation:** ARCHITECTURE.md notes no live sample was fetched due to BGG authentication; verify the parser against real responses in Phase 2.
- **Vite 8 ecosystem maturity:** Vitest and graphql-codegen compatibility should be verified immediately in Phase 1; fall back to the conservative stack if friction appears.
- **Apollo 4 migration path:** Decide whether to stay on Apollo 3 for the long term or migrate to urql; document the decision in an ADR if needed.
- **Dark mode strategy:** Confirm whether the product requires a manual toggle, `prefers-color-scheme`, or both before finalizing the token file.

## Sources

### Primary (HIGH confidence)
- RubyGems.org / npm registry — verified gem/package versions (2026-07-01).
- Rails 8.1 guides — Solid Queue, Solid Cache, API-only mode, Kamal 2.
- graphql-ruby official guides — Dataloader, class-based schema, `graphql:install`.
- vite-ruby docs — `app/frontend`, `sourceCodeDir` override, Vite 8 integration.
- Tailwind CSS v4 docs — `@theme`, CSS-first configuration, `@utility`, `@reference`, dark mode.
- Google Material Symbols / Material 3 docs — variable axes, subsetting, color roles.
- Apollo Client 3 docs — mutation cache updates, fetch policies, normalized cache.
- GraphQL.org schema design — deprecation, nullability, versionless evolution.
- BGG XML API2 official wiki — `/thing` endpoint, poll structure, rate limits.

### Secondary (MEDIUM confidence)
- Competitor products (What2Play, Boardy, MeepleUp, GameNight) — group hub layout and suggestion UX patterns.
- Reference apps `bgg-graphql-proxy` and `bggeek-shared-list` — prior implementation patterns and v1 UI behavior.

### Tertiary (LOW confidence)
- Live BGG XML sample shape for `<poll name="suggested_numplayers">` — inferred from docs and reference schemas; needs validation against real responses.

---
*Research completed: 2026-07-13*
*Ready for roadmap: yes*
