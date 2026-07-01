# Walking Skeleton — boardgame-night-rails-vue

**Phase:** 1
**Generated:** 2026-07-01
**Mode:** MVP + Walking Skeleton (greenfield)

## Capability Proven End-to-End

A developer runs `bin/dev`, the browser loads the Vue 3 SPA on `localhost:5173`, it round-trips a batched Apollo GraphQL `health` query to the Rails `/graphql` endpoint on `localhost:3000`, and renders the returned `health: "ok"` value — with BGG credentials loaded server-side-only from a dotenvx-encrypted `.env.bggeek` that is committed to the repo, and the same app building into a single self-contained Docker image (compiled SPA in `public/` + Rails runtime) that Kamal 2 can later deploy.

## Architectural Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Framework (backend) | Ruby on Rails 8.1.3 API-only (`--api --database=sqlite3`) | D-01, STACK.md — single source of truth, hosts GraphQL + compiled SPA |
| Framework (frontend) | Vue 3.5.35 (`<script setup>` + Composition API only) via vite_rails 3.11.0 | D-01 — Vue SPA at `app/frontend/` via `sourceCodeDir` override |
| API style | GraphQL (graphql-ruby 2.6.3, class-based schema, `GraphQL::Dataloader`) | GQL-01 — single endpoint at `POST /graphql`, Apollo batch via `Schema.multiplex` |
| Data layer | SQLite (Rails 8 default, 3 DBs: app + queue + cache in `storage/`) | Foundational tier — zero-ops, sufficient for v1 single-VPS |
| Background jobs | Solid Queue 1.4.0 (DB-backed), configured but NOT started in P1 dev | D-11 — `Procfile.dev` has only `web` + `vite` (no `solid_queue:` line) |
| Caching | Solid Cache 1.0.10 (DB-backed) via `Rails.cache`, idle in P1 | Rails 8 default, separate DB via `connects_to` |
| Auth | bcrypt 3.1.22 + `has_secure_password` ready (gem in Gemfile, NOT built in P1) | Phase 4 builds auth; Phase 1 just includes the gem |
| Styling | Tailwind CSS v4 (`@tailwindcss/vite`, CSS-first `@import "tailwindcss"` + `@theme`) | UI-SPEC, STACK.md — no `tailwind.config.js` |
| GraphQL client | @apollo/client 3.13.9 + @vue/apollo-composable 4.2.2 + graphql ^16.11 (NOT Apollo 4 — incompatible with composable v5 beta) | STACK.md — `BatchHttpLink` → `/graphql`, `InMemoryCache` normalized |
| Routing | vue-router 5.1.0, lazy-loaded route components | SPA routes; `/` → HealthView in P1 |
| State | Pinia 3.0.4 (UI/session-draft only — NEVER server data; Apollo cache is sole source of server data) | STACK.md Anti-Pattern 4 |
| Codegen contract | `rails graphql:schema:dump` → `schema.graphql` (committed) → @graphql-codegen/cli → `app/frontend/generated/` (committed) | D-02 — single source of truth, both sides read from repo |
| Credentials | dotenvx-encrypted `.env.bggeek` **committed**; private key in `.env.bggeek.keys` (gitignored) or `DOTENV_PRIVATE_KEY_BGGEEK` env var | D-03 overrides STACK.md plain dotenv-rails; Option A (CLI wrapper in `Procfile.dev` + Dockerfile `CMD`) |
| Dev orchestration | foreman via `Procfile.dev` (`web: bin/rails server` + `vite: bin/vite dev`); rack-cors dev-only (`Rails.env.development?` gate) + `skipProxy: true` go together | D-09, D-10 |
| Deployment | Single Docker image (multi-stage: Node 20 build → Ruby 3.4.10 runtime) via Kamal 2.12.0; image contains compiled SPA in `public/` + Rails | D-12, D-13, D-14 — image builds locally in P1; real Registry/VPS deploy when VPS ready |
| Ruby / Node pins | `.ruby-version` = 3.4.10 (rbenv), `.nvmrc` = `20` (Vite 8 needs `^20.19`) | D-04; Rails 8.1 recommends 3.4.Z |
| Test layout | RSpec in `spec/`; Vue co-located `*.spec.ts`; Playwright in `tests/e2e/`; Vitest config at repo root | D-05 |

## Stack Touched in Phase 1

- [x] Project scaffold — Rails 8.1.3 `--api` + vite_rails + graphql-ruby + Vue 3.5.35 + Tailwind v4
- [x] Routing — `/` → HealthView (lazy-loaded via vue-router)
- [x] Database — SQLite configured (3 DBs); P1 has no real domain read/write (proves plumbing only, per boundary)
- [x] UI — HealthView renders real GraphQL data round-tripped through Apollo batch link
- [x] Deployment — `docker build .` produces single image containing Rails + compiled Vue; Kamal 2 `config/deploy.yml` scaffolded with placeholders
- [x] Dev full-stack run — `bin/dev` boots Rails (:3000) + Vite (:5173) interleaved via foreman

## Out of Scope (Deferred to Later Slices)

- BGG XML API client, rate limiting, 202 retry, expansion two-call workaround (Phase 2)
- Domain GraphQL schema: `things`, `search`, `users`, `collections`, `hot items` (Phase 3)
- Collection merge UI, search/filter/sort/group, permalinks, responsive sidebar/drawer (Phase 3)
- Auth, friend groups, magic-link sessions, RSVP, manual game pick (Phase 4)
- Solid Queue worker in dev (Phase 2 adds `solid_queue:` to `Procfile.dev`)
- Real VPS deploy / registry push (when a VPS + registry are ready; P1 only verifies `docker build .`)
- Dry-validation contracts (no mutations in P1 — no contract needed yet; gem infrastructure ready)
- Dark mode, brand font, real component library (Phase 3+)
- domain-specific TS types beyond the trivial `health` query

## Subsequent Slice Plan

Each later phase adds one vertical slice on top of this skeleton without renegotiating the architectural decisions above:

- **Phase 2**: BGG integration layer — domain models, Solid Queue import jobs, rate limiter. Adds `solid_queue:` to `Procfile.dev`.
- **Phase 3**: GraphQL domain schema + collection surface — full v1 parity UI built on the Apollo client + Tailwind shell scaffolded here.
- **Phase 4**: Auth + friend groups + session lifecycle — `has_secure_password` + bcrypt activate, magic-link signed tokens, dry-validation contracts on mutations.

## Verified End-to-End Test Proven in Phase 1

1. `bundle exec rails runner "puts ENV['BGG_TOKEN']"` succeeds (env loaded server-side-only via dotenvx decrypt)
2. `POST /graphql` with `{"query":"{health}"}` returns `{"data":{"health":"ok"}}`
3. `POST /graphql` with Apollo batch `[{"query":...},{"query":...}]` returns array of multiplexed results
4. `docker build .` produces one image containing both `bin/rails` AND `public/index.html`
5. In `RAILS_ENV=production` introspection queries return an error (`disable_introspection_entry_points`)
6. Visiting `http://localhost:5173` in the browser shows no CORS errors and renders the health value