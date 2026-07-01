# Phase 1: Foundation & Monorepo Shell - Context

**Gathered:** 2026-07-01
**Status:** Ready for planning

<domain>
## Phase Boundary

The app runs locally and deploys as a single container with a working Rails GraphQL ↔ Vue contract. Specifically: a developer runs `bin/dev` and sees the Vue SPA render in the browser talking to the Rails `/graphql` endpoint; a GraphQL query reaches the server through the Apollo-batched endpoint and returns a valid response; the app's Docker image builds as a single container (Rails serves compiled SPA from `public/` + `/graphql`); BGG credentials load from `.env.bggeek` server-side only; the GraphQL schema has security limits set and introspection disabled in production.

This phase delivers the **plumbing and contract** — not domain features. The full BGG domain schema (things, search, users, collections, hot items) is Phase 3. BGG data fetching is Phase 2. Auth/groups/sessions are Phase 4.

</domain>

<decisions>
## Implementation Decisions

### Monorepo Layout
- **D-01:** Rails-rooted monorepo. Rails at repo root (Gemfile, config/, bin/ at top level). Vue SPA lives in `app/frontend/` via vite_rails with `sourceCodeDir` override. Single repo, vite_rails owns the Vue build, `bin/dev` runs both Rails and Vite.
- **D-02:** Codegen output lives in `app/frontend/generated/` (committed typed Vue Apollo composables). The Rails GraphQL schema is dumped to `schema.graphql` at repo root (committed, via `rails graphql:schema:dump`). Single source of truth — both sides read from repo.
- **D-03:** `.env.bggeek` is managed by **dotenvx** — the file is encrypted in place (values become `encrypted:`-prefixed) and **committed to the repo**. The private decryption key lives in `.env.bggeek.key` (gitignored) or the `DOTENV_PRIVATE_KEY` env var on the server. This overrides STACK.md's plain dotenv-rails load recommendation. Exact Rails integration wiring (dotenv gem encrypted-value support vs. a custom loader) is decided during planning.
- **D-04:** Ruby and Node versions pinned at repo root: `.ruby-version` (3.4.10 via rbenv) + `.nvmrc` (Node version). Rails 8 Dockerfile reads `.ruby-version`.
- **D-05:** Test layout follows Rails + Vue conventions: RSpec in `spec/`; Vue component tests co-located next to components (`Component.spec.ts`); Playwright e2e in `tests/e2e/`; Vitest config at repo root.

### GraphQL Schema Starting Point
- **D-06:** Phase 1 ships a **minimal schema only** — a `hello` (or equivalent) query plus a health check query. This proves the class-based schema, Dataloader, and Apollo batch support (`Schema.multiplex`) work end-to-end. The full BGG domain schema (things, search, users, collections, hot items) is built in Phase 3.
- **D-07:** The reference proxy's `bgg-graphql-proxy/schema.graphql` is **copied into `.planning/research/reference-bgg-schema.graphql`** as a reference doc for Phase 3 planning. No Rails code is ported from it in Phase 1 — it's there so downstream agents can see the target contract shape.
- **D-08:** GraphQL security limits are **hardcoded in the schema class** (`app/graphql/BoardgameNightSchema.rb`): `max_depth`, `max_complexity`, and `disable_introspection_entry_points` guarded by `Rails.env.production?`. No config file indirection — these are security defaults, not tunables.

### Dev Server Orchestration
- **D-09:** `bin/dev` uses the **vite_rails / Rails 8 default**: `bin/dev` runs foreman with `Procfile.dev` (`web: bin/rails server` + `vite: bin/vite dev`). One command boots both Rails and Vite with interleaved logs.
- **D-10:** In development, the Vue SPA hits `localhost:3000/graphql` directly (cross-origin from Vite's `:5173`). **rack-cors is enabled in development only** (`config/initializers/cors.rb` gated on `Rails.env.development?`) to allow `localhost:5173` → `localhost:3000`. In production the SPA is same-origin (Rails serves it from `public/`) so no CORS is needed. Note: this means dev diverges slightly from prod's same-origin behavior — the Vite proxy alternative (which would mirror prod) was explained and the user chose rack-cors.
- **D-11:** Solid Queue worker is **not started in Phase 1 dev**. `bin/dev` runs just `web` + `vite`. Phase 1 has no background jobs (BGG import is Phase 2). Phase 2 adds `solid_queue: bin/rails solid_queue:start` to `Procfile.dev` when the first BGG job exists.

### Kamal 2 Deploy Verification
- **D-12:** Phase 1 deploy verification = **Docker image builds locally**. Scaffold the Rails 8 multi-stage `Dockerfile` + `config/deploy.yml` with placeholder values (server IP, registry path). Verify `docker build .` succeeds and the image contains Rails + compiled Vue in `public/`. No real VPS deploy or registry push in Phase 1 — that happens when a VPS is ready.
- **D-13:** The Dockerfile is **multi-stage**: a Node build stage runs `bin/vite build` → output lands in `public/` → final image has compiled SPA + Rails. One `docker build .` produces a complete self-contained image. No pre-build step needed.
- **D-14:** `config/deploy.yml` is **scaffolded with placeholders** in Phase 1 (server: `[your-server-ip]`, registry: `ghcr.io/youruser/boardgame-night`, etc.). Kamal config exists and is reviewable now; real values filled in when a VPS + registry are ready.

### the agent's Discretion
- **Env wiring (D-03):** The exact mechanism for loading dotenvx-encrypted `.env.bggeek` in Rails (dotenv gem's encrypted-value support via `DOTENV_PRIVATE_KEY`, vs. a custom initializer that shells out to dotenvx, vs. a build-step decrypt) is decided during planning. The locked constraint: encrypted file committed, key gitignored, Rails reads it server-side only.
- **GraphQL limit values (D-08):** Specific `max_depth` and `max_complexity` numeric values are decided during planning (STACK.md suggests reasonable defaults; researcher/planner confirms).
- **Health query shape (D-06):** Whether the health query returns a string, a JSON status, or a structured `HealthCheck` type is decided during planning.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Planning
- `.planning/PROJECT.md` — Project definition, core value, constraints, key decisions
- `.planning/REQUIREMENTS.md` — Phase 1 requirements: FOUND-01, FOUND-02, FOUND-03, FOUND-04, FOUND-05, GQL-01, GQL-04
- `.planning/ROADMAP.md` §"Phase 1: Foundation & Monorepo Shell" — Goal, mode, dependencies, success criteria

### Research (Stack & Architecture)
- `.planning/research/STACK.md` — Pinned versions for all technologies (Rails 8.1.3, Vue 3.5.35, vite_rails 3.11.0, graphql 2.6.3, Apollo 3.13.9, etc.). **Note: dotenv-rails plain load is overridden by D-03 (dotenvx encrypted).**
- `.planning/research/ARCHITECTURE.md` — Monorepo structure, vite_ruby app/frontend, Dataloader, Solid Queue/Cache, dry-rails ApplicationContract
- `.planning/research/PITFALLS.md` — #9 (rack-cors dev-only / skipProxy), security (introspection off in prod), #10 (single deploy)

### Reference Apps (external, for context only — NOT ported in Phase 1)
- `/Users/estvmachine/Projects/personal/bgg-graphql-proxy/schema.graphql` — Reference BGG GraphQL schema (to be copied to `.planning/research/reference-bgg-schema.graphql` per D-07)
- `/Users/estvmachine/Projects/personal/bggeek-shared-list/schema.json` — Reference frontend schema (the app being rewritten)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **None.** This is a greenfield repo — only `.planning/` and `AGENTS.md` are committed. No Rails or Vue code exists yet. Phase 1 creates the initial scaffold.

### Established Patterns
- **None yet.** Phase 1 establishes the patterns that later phases follow: Rails `--api` scaffold, vite_rails integration, GraphQL class-based schema, Apollo client setup, codegen pipeline.

### Integration Points
- **Reference apps exist locally** and inform the rewrite:
  - `bgg-graphql-proxy/` (Node/TS Apollo Server) — the BGG XML→GraphQL normalization patterns Rails will replace (Phase 2/3)
  - `bggeek-shared-list/` (Next.js + Chakra UI) — the UI feature set Vue will replace (Phase 3/4)
- Phase 1 does not integrate with these — it builds the empty shell they'll be ported into.

</code_context>

<specifics>
## Specific Ideas

- User wants `.env.bggeek` **committed to the repo** via dotenvx encryption (not just gitignored) — this is a deliberate choice so the BGG token travels with the repo without being plaintext. The private key is the secret, not the file itself.
- User chose rack-cors over Vite proxy for dev `/graphql` routing after being educated on the trade-off — preference for the SPA hitting Rails directly in dev.
- User requested education/explanation on several concepts (Solid Queue, Procfile.dev, Vite proxy vs rack-cors) — indicate a preference for being briefed on unfamiliar infrastructure concepts before deciding.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope. No scope creep was suggested.

</deferred>

---

*Phase: 1-Foundation & Monorepo Shell*
*Context gathered: 2026-07-01*