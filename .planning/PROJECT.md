# boardgame-night-rails-vue

## What This Is

A board game collection sharing app that lets you enter multiple BoardGameGeek (BGG) usernames, fetches each user's game collection, and shows the merged/deduplicated view so you can discover which games are shared across your group — ideal for picking games for board game night. Built as a monorepo with Ruby on Rails (API-only) serving a GraphQL API consumed by a Vue.js frontend.

## Core Value

Show which board games are shared across multiple BGG users' collections so a group can quickly pick games everyone can play tonight.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Fetch and merge multiple BGG users' collections into a single deduplicated view
- [ ] Validate that entered BGG usernames exist before fetching
- [ ] Search, filter (players, play time), sort, and group the merged collection
- [ ] Rails API exposes a GraphQL endpoint consumed by the Vue frontend
- [ ] Rails communicates with BoardGameGeek's API using credentials from `.env.bggeek`
- [ ] Hot/trending BGG games showcase on the landing page
- [ ] Shareable permalink URLs for a set of usernames
- [ ] Responsive layout (mobile drawer + desktop sidebar)

### Out of Scope

- Real-time chat — not core to collection sharing
- OAuth login against BGG — BGG token read from env file is sufficient for v1
- Mobile native app — web-first, responsive is enough
- Game session tracking / scheduling / RSVP — deferred to a future milestone (the "boardgame-night" name is aspirational; v1 is the shared-list rewrite)

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
| Monorepo: Rails + Vue in one repo | Simplifies deployment and keeps API + frontend in sync | — Pending |
| Rails in API-only mode (`--api`) | Vue owns the UI; Rails is purely the data/GraphQL layer | — Pending |
| GraphQL (not REST) between Vue and Rails | Matches the existing proxy's contract; frontend already GraphQL-shaped | — Pending |
| Rails owns BGG communication (not Vue) | Keeps BGG credentials server-side; centralizes rate limiting & caching | — Pending |
| rbenv for Ruby version management | User requirement; modern Ruby toolchain | — Pending |
| `.env.bggeek` for BGG credentials | Keeps secrets out of git; user-specified location | — Pending |
| v1 = shared-list feature parity (no session tracking yet) | "boardgame-night" is the project name; v1 ships the rewrite, night-features are a future milestone | — Pending |

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
*Last updated: 2026-06-30 after initialization*
