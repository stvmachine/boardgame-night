# boardgame-night-rails-vue

## What This Is

A board game collection and night-organizing app for groups of friends. Users create friend groups, link their BoardGameGeek (BGG) usernames, and the app merges everyone's collections into a shared deduplicated view. From there, any member can spin up a boardgame night session — invite group members, get game suggestions drawn from the shared pool (filtered by who's coming and player count), and pick what to play. Built as a monorepo with Ruby on Rails 8 (API-only) serving a GraphQL API consumed by a Vue.js 3 frontend.

## Core Value

Let a group of friends merge their BGG collections and pick games everyone can play for boardgame night.

## Requirements

### Validated

- ✓ Rails API exposes a GraphQL endpoint consumed by the Vue frontend — Phase 1

### Active

- [ ] Migrate UI to "Tabletop Social" design system (Inter, indigo, Material 3 tonal palette, Material Symbols icons, 280px sidebar, rounded-xl cards, status badges, skeleton loaders)
- [ ] Redesign app shell with new sidebar navigation (Home/Collection/Hot/Groups/Account + Settings/Logout + "New Session" primary button)
- [ ] Redesign Home as a dashboard (hero with BGG merge input + personal stats card + trending games)
- [ ] Redesign Collection view (structured filter sidebar with range slider, checkbox groups, segmented buttons + rich game cards + sort + grid/list toggle + skeleton loaders)
- [ ] Build Group Detail surface (group header + upcoming sessions list + shared collection spotlight + members panel with roles + invite link with copy)
- [ ] Redesign Picking a Game screen (session header with status badge + attendee-aware filtered game suggestions + "Pick this game" cards)
- [ ] Build full poll-based suggestion engine (SUGG-01/02: session-scoped weighted scoring with BGG best-player-count poll data, explainable shortlist)
- [ ] Address v1.0 tech debt (E2E suite in CI, Action Cable dev config, cleanup legacy BGG classes, update REQUIREMENTS checkboxes)

### Out of Scope

- Real-time chat — not core to collection sharing
- OAuth login against BGG — BGG token read from env file is sufficient for v1
- Mobile native app — web-first, responsive is enough

## Context

This is a rewrite of an existing app, `bggeek-shared-list` (codename "Shared Shelf"), currently built with Next.js 15 + Chakra UI v3 + Apollo Client. That app talks to a separate GraphQL proxy, `bgg-graphql-proxy` (Node/TypeScript, Apollo Server + Express), which translates BGG's XML API v2 into GraphQL.

For this rewrite:
- The Rails backend takes over the role of `bgg-graphql-proxy` — it talks to BGG's XML API v2 directly, normalizes XML responses, and exposes its own GraphQL schema to the Vue frontend.
- The Vue frontend takes over the role of `bggeek-shared-list`'s React UI — collection input, merging, filtering, sorting, grouping, and display.
- The existing `bgg-graphql-proxy` GraphQL schema (things, search, users, collections, plays, geeklists, hot items) is the reference for what the Rails GraphQL API should expose.
- The existing `bggeek-shared-list` feature set (multi-user collection merge, fuzzy search, filters, sort, group, hot games, permalinks) is the reference for v1 scope.

**BGG API notes:**
- BGG's XML API v2 (`https://boardgamegeek.com/xmlapi2`) is read-only for the endpoints used (thing, search, collection, plays, hot items) and does not strictly require authentication for public data.
- The `.env.bggeek` token is intended for authenticated BGG access where useful (e.g., private collections, rate-limit headroom, or future write operations like logging plays). Rails should load this token and use it when calling BGG.
- BGG enforces a strict rate limit (~1 request / 5 seconds); the Rails BGG client must respect this with throttling, retries, and caching.

**Prior work to reference:**
- `/Users/estvmachine/Projects/personal/bgg-graphql-proxy` — BGG XML→GraphQL normalization patterns, rate limiting, retry logic, expansion-merge workaround.
- `/Users/estvmachine/Projects/personal/bggeek-shared-list` — UI feature set, filtering/sorting/grouping logic, permalink format.

## Constraints

- **Tech stack**: Ruby on Rails (API-only mode) + Vue.js 3, in a single git repository (monorepo) — Rails serves the Vue build and exposes GraphQL; no separate proxy service.
- **Ruby version management**: rbenv (pin a modern Ruby, e.g. 3.2+).
- **API style**: GraphQL between Vue and Rails (Rails is the single GraphQL source of truth for the frontend).
- **BGG credentials**: API token loaded from `.env.bggeek` (not committed to git).
- **BGG rate limits**: Must throttle to ~1 req/5s with retries and caching — BGG will 429/503 otherwise.
- **Modern Rails**: Use current Rails conventions (Rails 7.1+ / 8.x), Hotwire is not needed (API-only + Vue), use `--api` scaffold.
- **Frontend build**: Vue 3 with Vite, integrated into the Rails asset pipeline or served as a built SPA from `public/`.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Monorepo: Rails + Vue in one repo | Simplifies deployment and keeps API + frontend in sync | ✅ Phase 1 — Single Kamal 2 container serves SPA + /graphql from same origin |
| Rails in API-only mode (`--api`) | Vue owns the UI; Rails is purely the data/GraphQL layer | ✅ Phase 1 — Rails 8.1.3 scaffolded with `--api`, SPA served via catch-all route |
| GraphQL (not REST) between Vue and Rails | Matches existing proxy contract; frontend already GraphQL-shaped | ✅ Phase 1 — BoardgameNightSchema with health query, Apollo multiplex support, max_depth/max_complexity |
| Rails owns BGG communication (not Vue) | Keeps BGG credentials server-side; centralizes rate limiting & caching | ✅ Phase 1 — dotenvx-encrypted .env.bggeek loaded server-side, never exposed to frontend |
| rbenv for Ruby version management | User requirement; modern Ruby toolchain | ✅ Phase 1 — .ruby-version at 3.4.9, rbenv shims prioritized in PATH |
| `.env.bggeek` for BGG credentials | Keeps secrets out of git; user-specified location | ✅ Phase 1 — dotenvx-encrypted, .env.bggeek.keys gitignored, decrypted via DOTENV_PRIVATE_KEY_BGGEEK at runtime |
| v1 = shared-list parity + boardgame night sessions | v1 rewrites bggeek-shared-list AND adds the night-session features that the project name implies | ✅ Complete — v1.0 shipped 2026-07-09 |
| v1.1 = UI redesign + suggestion engine | Reskin with Stitch "Tabletop Social" design, build Group Detail surface, ship poll-based suggestion engine | — In progress |
| Vue 3.5 SPA with Apollo 3.13 + @vue/apollo-composable 4.2.2 | Apollo 4 + composable v5 still in beta (incompatible) | ✅ Phase 1 — Apollo BatchHttpLink, vue-router, Pinia, Tailwind v4, HealthView E2E verified via Playwright |

## Current Milestone: v1.1 UI Redesign + Suggestion Engine

**Goal:** Reskin the entire app with the "Tabletop Social" Stitch design system, build the new Group Detail surface, and ship the full poll-based suggestion engine.

**Target features:**
- Design system migration (Inter, indigo, Material 3 tonal palette, Material Symbols icons, 280px sidebar, rounded-xl cards, status badges, skeleton loaders)
- App shell redesign (sidebar nav: Home/Collection/Hot/Groups/Account + Settings/Logout + "New Session" button)
- Home redesign (dashboard: hero + personal stats + trending games)
- Collection redesign (structured filter sidebar + rich game cards + sort + grid/list toggle + skeleton loaders)
- Group Detail (new surface: sessions list + shared collection spotlight + members panel + invite link)
- Picking a Game redesign (session header + attendee-aware filtered suggestions + "Pick this game" cards)
- Suggestion engine (SUGG-01/02: poll-based weighted scoring, explainable shortlist)
- Tech debt cleanup (E2E in CI, Action Cable dev config, legacy BGG class cleanup, REQUIREMENTS checkboxes)

**Design reference:** Stitch project "BoardGame Night UI Redesign" (projects/2288729336915094585) — "Tabletop Social" design system

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-07-13 after Milestone v1.0 complete; starting v1.1 (UI Redesign + Suggestion Engine)*
