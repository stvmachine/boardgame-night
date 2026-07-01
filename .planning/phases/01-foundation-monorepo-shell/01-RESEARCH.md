# Phase 1: Foundation & Monorepo Shell - Research

**Researched:** 2026-07-01
**Domain:** Rails 8 API-only + Vue 3 SPA monorepo scaffolding, GraphQL contract, single-container deploy
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Rails-rooted monorepo. Rails at repo root (Gemfile, config/, bin/ at top level). Vue SPA lives in `app/frontend/` via vite_rails with `sourceCodeDir` override. Single repo, vite_rails owns the Vue build, `bin/dev` runs both Rails and Vite.
- **D-02:** Codegen output lives in `app/frontend/generated/` (committed typed Vue Apollo composables). The Rails GraphQL schema is dumped to `schema.graphql` at repo root (committed, via `rails graphql:schema:dump`). Single source of truth — both sides read from repo.
- **D-03:** `.env.bggeek` is managed by **dotenvx** — the file is encrypted in place (values become `encrypted:`-prefixed) and **committed to the repo**. The private decryption key lives in `.env.bggeek.key` (gitignored) or the `DOTENV_PRIVATE_KEY` env var on the server. This overrides STACK.md's plain dotenv-rails load recommendation. Exact Rails integration wiring (dotenv gem encrypted-value support vs. a custom loader) is decided during planning.
- **D-04:** Ruby and Node versions pinned at repo root: `.ruby-version` (3.4.10 via rbenv) + `.nvmrc` (Node version). Rails 8 Dockerfile reads `.ruby-version`.
- **D-05:** Test layout follows Rails + Vue conventions: RSpec in `spec/`; Vue component tests co-located next to components (`Component.spec.ts`); Playwright e2e in `tests/e2e/`; Vitest config at repo root.
- **D-06:** Phase 1 ships a **minimal schema only** — a `hello` (or equivalent) query plus a health check query. This proves the class-based schema, Dataloader, and Apollo batch support (`Schema.multiplex`) work end-to-end. The full BGG domain schema (things, search, users, collections, hot items) is built in Phase 3.
- **D-07:** The reference proxy's `bgg-graphql-proxy/schema.graphql` is **copied into `.planning/research/reference-bgg-schema.graphql`** as a reference doc for Phase 3 planning. No Rails code is ported from it in Phase 1 — it's there so downstream agents can see the target contract shape.
- **D-08:** GraphQL security limits are **hardcoded in the schema class** (`app/graphql/BoardgameNightSchema.rb`): `max_depth`, `max_complexity`, and `disable_introspection_entry_points` guarded by `Rails.env.production?`. No config file indirection — these are security defaults, not tunables.
- **D-09:** `bin/dev` uses the **vite_rails / Rails 8 default**: `bin/dev` runs foreman with `Procfile.dev` (`web: bin/rails server` + `vite: bin/vite dev`). One command boots both Rails and Vite with interleaved logs.
- **D-10:** In development, the Vue SPA hits `localhost:3000/graphql` directly (cross-origin from Vite's `:5173`). **rack-cors is enabled in development only** (`config/initializers/cors.rb` gated on `Rails.env.development?`) to allow `localhost:5173` → `localhost:3000`. In production the SPA is same-origin (Rails serves it from `public/`) so no CORS is needed.
- **D-11:** Solid Queue worker is **not started in Phase 1 dev**. `bin/dev` runs just `web` + `vite`. Phase 1 has no background jobs (BGG import is Phase 2). Phase 2 adds `solid_queue: bin/rails solid_queue:start` to `Procfile.dev` when the first BGG job exists.
- **D-12:** Phase 1 deploy verification = **Docker image builds locally**. Scaffold the Rails 8 multi-stage `Dockerfile` + `config/deploy.yml` with placeholder values (server IP, registry path). Verify `docker build .` succeeds and the image contains Rails + compiled Vue in `public/`. No real VPS deploy or registry push in Phase 1 — that happens when a VPS is ready.
- **D-13:** The Dockerfile is **multi-stage**: a Node build stage runs `bin/vite build` → output lands in `public/` → final image has compiled SPA + Rails. One `docker build .` produces a complete self-contained image. No pre-build step needed.
- **D-14:** `config/deploy.yml` is **scaffolded with placeholders** in Phase 1 (server: `[your-server-ip]`, registry: `ghcr.io/youruser/boardgame-night`, etc.). Kamal config exists and is reviewable now; real values filled in when a VPS + registry are ready.

### the agent's Discretion
- **Env wiring (D-03):** The exact mechanism for loading dotenvx-encrypted `.env.bggeek` in Rails (dotenv gem's encrypted-value support via `DOTENV_PRIVATE_KEY`, vs. a custom initializer that shells out to dotenvx, vs. a build-step decrypt) is decided during planning. The locked constraint: encrypted file committed, key gitignored, Rails reads it server-side only.
- **GraphQL limit values (D-08):** Specific `max_depth` and `max_complexity` numeric values are decided during planning (STACK.md suggests reasonable defaults; researcher/planner confirms).
- **Health query shape (D-06):** Whether the health query returns a string, a JSON status, or a structured `HealthCheck` type is decided during planning.

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope. No scope creep was suggested.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| FOUND-01 | Rails 8 API-only application initialized with GraphQL endpoint, dry-validation contracts, and Solid Queue/Cache configured | Rails 8.1.3 `--api` scaffold + `rails g graphql:install` + Solid Queue/Cache are Rails 8 defaults. dry-rails provides ApplicationContract. See Standard Stack + Code Examples (Rails scaffold, GraphQL install, Solid trifecta). |
| FOUND-02 | Vue 3 SPA served by Rails in production via Vite Ruby, with dev proxy configured (no CORS errors in development) | vite_rails 3.11.0 with `sourceCodeDir: app/frontend` override + `skipProxy: true` + rack-cors dev-only (D-10). See Architecture Patterns (Dev Server Orchestration) + Code Examples (vite.json, cors.rb, Procfile.dev). |
| FOUND-03 | Monorepo deploys as a single container via Kamal 2 (Vue build output served from Rails public/) | Rails 8 multi-stage Dockerfile with Node build stage (`bin/vite build` → `public/`) + Kamal 2.12.0 `config/deploy.yml` scaffold. See Architecture Patterns (Single-Container Deploy) + Code Examples (Dockerfile, deploy.yml). |
| FOUND-04 | GraphQL schema with max_depth and max_complexity limits set, introspection disabled in production | Hardcoded in `BoardgameNightSchema` class (D-08): `max_depth 15`, `max_complexity 400`, `disable_introspection_entry_points` gated on `Rails.env.production?`. See Code Examples (Schema class). |
| FOUND-05 | BGG credentials loaded from .env.bggeek and used for all BGG API communication (server-side only, never exposed to frontend) | dotenvx encrypted `.env.bggeek` committed (D-03). Load via `dotenvx run` CLI wrapper or custom initializer. `Dotenv.require_keys("BGG_TOKEN")` for fail-fast. See Architecture Patterns (dotenvx Integration) + Code Examples. |
| GQL-01 | Rails exposes a GraphQL endpoint consumed by the Vue frontend (single source of truth for frontend data) | graphql-ruby 2.6.3 `rails g graphql:install` scaffolds `GraphqlController` + route `post "/graphql"`. Apollo `HttpLink` → `/graphql`. See Code Examples (routes, controller). |
| GQL-04 | GraphQL handles Apollo batched queries (Schema.multiplex for params[:_json] arrays) | GraphqlController checks `params[:_json]` → `Schema.multiplex(queries)` else `Schema.execute`. Verified via graphql-ruby official docs (Context7). See Code Examples (GraphqlController). |
</phase_requirements>

## Summary

Phase 1 is a **greenfield scaffolding phase** — the Walking Skeleton that proves the Rails ↔ Vue ↔ GraphQL contract end-to-end. There is no existing application code; only `.planning/` and `AGENTS.md` are committed. This phase creates the initial Rails 8.1.3 API-only scaffold, integrates vite_rails 3.11.0 for the Vue 3.5.35 SPA, wires graphql-ruby 2.6.3 with a minimal health/hello query, sets up Apollo Client 3.13.9 on the Vue side, configures Tailwind CSS v4, scaffolds the Kamal 2 single-container deploy, and establishes the dotenvx-encrypted `.env.bggeek` credential loading.

The STACK.md (embedded in AGENTS.md) already provides HIGH-confidence version pins verified against npm registry, RubyGems, and Context7 on 2026-07-01. This research confirms those pins, adds Phase-1-specific implementation details (vite_rails config shape, graphql-ruby multiplex controller, dotenvx Rails integration, Rails 8 Dockerfile Node build stage), audits the local environment, and maps each requirement to concrete code patterns and file paths.

**Two environment blockers** were identified: (1) Ruby 4.0.5 is installed system-wide but STACK.md pins Ruby 3.4.10 (Rails 8.1's recommended version) — `rbenv install 3.4.10` is required; (2) Node v16.16.0 is installed but Vite 8 requires Node `^20.19.0 || >=22.12.0` — `nvm install 20` (or 22) and a `.nvmrc` file are required. Both are Wave 0 prerequisites.

**Primary recommendation:** Scaffold with `rails new . --api --database=sqlite3` (force into existing repo), then `bundle exec vite install` + `rails g graphql:install`, configure `sourceCodeDir: app/frontend` + `skipProxy: true` in `config/vite.json`, wire rack-cors dev-only, set up the minimal `health` query with `Schema.multiplex` Apollo batch support, and verify `docker build .` produces a single image with compiled Vue in `public/`.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| SPA rendering + routing | Browser / Client | — | Vue 3.5.35 + vue-router 5.1.0 run entirely in the browser. Vite dev server serves in dev; Rails serves compiled build from `public/` in prod. |
| GraphQL API endpoint | API / Backend | — | Rails 8 API-only app hosts `POST /graphql` via graphql-ruby. Single source of truth for frontend data (GQL-01). |
| Apollo batched query handling | API / Backend | — | `GraphqlController` checks `params[:_json]` → `Schema.multiplex`. Server-side concern (GQL-04). |
| GraphQL security limits (max_depth/complexity, introspection) | API / Backend | — | Hardcoded in `BoardgameNightSchema` class (D-08, FOUND-04). Server-side enforcement. |
| BGG credential loading | API / Backend | — | dotenvx decrypts `.env.bggeek` server-side only. Never exposed to frontend (FOUND-05). |
| Static asset serving (prod) | CDN / Static (Rails public/) | — | In production, Rails serves the compiled Vue SPA from `public/` — same origin as `/graphql`. No separate CDN needed for v1. |
| Background jobs (Solid Queue) | API / Backend | Database / Storage | Solid Queue is DB-backed. NOT started in Phase 1 dev (D-11) — Phase 2 adds the worker. Configured but idle. |
| Caching (Solid Cache) | API / Backend | Database / Storage | Solid Cache is DB-backed. Used for `Rails.cache`. Configured in Phase 1 but no BGG caching until Phase 2. |
| Docker image build + deploy | Infrastructure | — | Multi-stage Dockerfile (Node build → Rails runtime). Kamal 2 config scaffolded with placeholders (D-12/13/14). |

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Ruby | 3.4.10 | Language runtime | Rails 8.1's recommended Ruby. Pin via rbenv `.ruby-version`. [VERIFIED: ruby-lang.org + FastRuby compatibility table via STACK.md] |
| Rails | 8.1.3 | API-only web framework + GraphQL host + SPA shell server | Latest 8.1 stable. `--api` gives API-only base. Ships Solid Queue + Solid Cache + Kamal 2 + Dockerfile by default. [VERIFIED: RubyGems via STACK.md] |
| graphql-ruby (`graphql` gem) | 2.6.3 | GraphQL server: class-based schema, Dataloader, multiplex, max_complexity | The Ruby GraphQL standard. `rails g graphql:install` scaffolds `app/graphql/`. `Schema.multiplex` handles Apollo batching (GQL-04). [VERIFIED: Context7 + RubyGems via STACK.md] |
| Vue | 3.5.35 | SPA framework | Latest stable 3.5. Use `<script setup>` + Composition API exclusively. [VERIFIED: npm registry] |
| vite_rails (gem) | 3.11.0 | Rails↔Vite integration; serves SPA from `public/` in prod, proxies to Vite dev server in dev | Canonical Rails+Vite monorepo integration. Override `sourceCodeDir` to `app/frontend`. [VERIFIED: Context7 /elmassimo/vite_ruby + RubyGems via STACK.md] |
| Vite | 8.0.10 | Frontend dev server + bundler | vite_rails 3.11.0 upgraded to Vite 8 (Rolldown + Oxc engine). Requires Node ^20.19.0 \|\| >=22.12.0. [VERIFIED: npm registry — engines field] |
| @vitejs/plugin-vue | 6.0.7 | Vue SFC support in Vite | Official plugin. Peers: `vite ^5\|\|^6\|\|^7\|\|^8`, `vue ^3.2.25` — confirmed Vite 8 + Vue 3.5.35 compatible. [VERIFIED: npm registry — peerDependencies] |
| @apollo/client | 3.13.9 | GraphQL client + normalized InMemoryCache + HttpLink + batch link | Known-good Apollo 3.13.x (NOT v4 — @vue/apollo-composable is incompatible with v4). Pair with @vue/apollo-composable 4.2.2. [VERIFIED: npm registry + GitHub vuejs/apollo#1597 via STACK.md] |
| @vue/apollo-composable | 4.2.2 | Vue 3 Composition API binding for Apollo (`useQuery`/`useMutation`) | Stable Vue 3 binding. `provide(DefaultApolloClient, apolloClient)`. [VERIFIED: npm registry — peerDependencies] |
| graphql (graphql-js, browser) | ^16.11.0 | `gql` tag + query execution for Apollo 3.x | Apollo 3.13.x peer-deps `graphql ^16` (NOT 17). Pin 16.x. [VERIFIED: npm registry via STACK.md] |
| vue-router | 5.1.0 | SPA routing | Vue Router 5 is the current major for Vue 3.5. Lazy-load route components. [VERIFIED: npm registry] |
| Pinia | 3.0.4 | UI/session-draft state ONLY | Vue 3 state store. STRICT: never duplicate server data (Apollo cache is sole source). [VERIFIED: npm registry] |
| Tailwind CSS | ^4.3 (`tailwindcss` + `@tailwindcss/vite`) | Utility-first styling | CSS-first config (no `tailwind.config.js`). `@import "tailwindcss"` in entrypoint. [VERIFIED: npm registry — peerDependencies confirm Vite 8 compat] |
| Solid Queue | 1.4.0 | DB-backed Active Job backend | Rails 8 default. Configured but NOT started in Phase 1 dev (D-11). [VERIFIED: RubyGems via STACK.md] |
| Solid Cache | 1.0.10 | DB-backed Rails.cache | Rails 8 default. Separate DB via `connects_to`. [VERIFIED: RubyGems via STACK.md] |
| RSpec (`rspec-rails`) | 8.0.4 | Rails backend tests | 8.x is the Rails-8 line. [VERIFIED: RubyGems via STACK.md] |
| bcrypt | 3.1.22 | Password hashing for `has_secure_password` | Auth base. Even if auth not fully built this phase, the gem is in the Gemfile. [VERIFIED: RubyGems via STACK.md] |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| rack-cors | 3.0.0 | Dev-only CORS: localhost:5173 → localhost:3000 | Dev only (D-10). Gated on `Rails.env.development?`. [VERIFIED: RubyGems via STACK.md] |
| graphiql-rails | 1.10.5 | In-browser GraphQL explorer (dev) | Added by `rails g graphql:install`. Dev-only. Disable introspection in prod. [VERIFIED: RubyGems via STACK.md] |
| dotenvx (CLI) | latest (npm `@dotenvx/dotenvx`) | Encrypt/decrypt `.env.bggeek` | D-03 overrides STACK.md's plain dotenv-rails. Encrypted file committed, key gitignored. [CITED: dotenvx.com + github.com/dotenvx/dotenvx] |
| dotenv-rails | 3.2.0 | `Dotenv.require_keys` fail-fast + env loading | May be used alongside dotenvx for the `require_keys` helper. [VERIFIED: RubyGems via STACK.md] |
| @vueuse/core | ^14.3.0 | Composition utilities | `useDebounce`, `useStorage`. Not strictly needed in Phase 1 but included in SPA setup. [VERIFIED: npm registry] |
| Vitest | ^3.2.6 | Vue 3 unit/component tests | Co-located `Component.spec.ts` files (D-05). [VERIFIED: npm registry] |
| @playwright/test | ^1.61.1 | E2E tests | `tests/e2e/` directory (D-05). [VERIFIED: npm registry] |
| @graphql-codegen/cli | ^7.1.3 | Generate TS types from Rails schema | Monorepo contract (D-02). `rails graphql:schema:dump` → `schema.graphql` → codegen → `app/frontend/generated/`. [VERIFIED: npm registry — engines node >=16] |
| RuboCop | 1.88.0 + rubocop-rails 2.35.5 + rubocop-rspec 3.10.2 | Ruby lint/style | Code quality. [VERIFIED: RubyGems via STACK.md] |
| ESLint | ^9.x (flat config) + typescript-eslint ^8.x + eslint-plugin-vue | JS/TS lint | Code quality. [VERIFIED: STACK.md] |
| Prettier | ^3.x | Code formatting | Code quality. [VERIFIED: STACK.md] |
| TypeScript | ~5.9 | Type safety for Vue SPA | Pin ~5.9 (not 6.x yet — verify vue-tsc support). [VERIFIED: npm registry via STACK.md] |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| vite_rails 3.11.0 + Vite 8 | vite_rails 3.10.0 + Vite 6 | If Vite 8 (Rolldown rewrite) shows compat issues with Vitest/codegen, fall back to the conservative mature combo. STACK.md flags this as a research variant. |
| @apollo/client 3.13.9 | urql `@urql/vue 2.1.1` | urql is Vue-native, no Apollo-4-Vue-beta exposure. But Apollo ecosystem tooling (devtools, cache APIs) is richer. Stick with Apollo 3.13 per STACK.md. |
| dotenvx CLI wrapper | dotenv-rails plain load | STACK.md recommended plain dotenv-rails, but D-03 OVERRIDES this — user wants encrypted file committed. dotenvx is the locked choice. |
| rack-cors (dev-only) | Vite proxy (`server.proxy`) | Vite proxy would mirror prod's same-origin behavior. User chose rack-cors after being educated on the trade-off (D-10). |

**Installation:**
```bash
# --- Wave 0: Environment prerequisites ---
rbenv install 3.4.10          # Ruby (system has 4.0.5, need 3.4.10)
rbenv local 3.4.10            # creates .ruby-version
nvm install 20                # Node (system has 16, Vite 8 needs ^20.19)
node --version                # verify >= 20.19.0
echo "20" > .nvmrc            # pin Node version (D-04)

# --- Rails 8.1.3 API-only scaffold (into existing repo) ---
gem install rails -v 8.1.3
rails new . --api --database=sqlite3 --force --skip-test-unit

# --- Vite + Vue integration ---
bundle add vite_rails --version "~> 3.11"
bundle exec vite install      # creates config/vite.json, vite.config.ts, bin/vite

# --- GraphQL ---
bundle add graphql --version "~> 2.6"
bundle exec rails generate graphql:install   # scaffolds app/graphql/, GraphqlController, graphiql-rails

# --- Solid Queue + Solid Cache (Rails 8 defaults — verify installed) ---
bin/rails solid_queue:install  # if not present
bin/rails solid_cache:install  # if not present

# --- Auth base + env ---
bundle add bcrypt --version "~> 3.1"
bundle add dotenv-rails --group development --group test --version "~> 3.2"

# --- Frontend (Vue 3 via vite_rails) ---
# Edit config/vite.json → "sourceCodeDir": "app/frontend"
npm install vue@3.5.35 vue-router@5.1.0 pinia@3.0.4
npm install @apollo/client@3.13.9 @vue/apollo-composable@4.2.2 graphql@^16.11.0
npm install -D @vitejs/plugin-vue@6.0.7 typescript@~5.9 vue-tsc
npm install @tailwindcss/vite@^4.3 tailwindcss@^4.3
npm install @vueuse/core@^14.3
npm install -D vitest@^3.2.6 @vue/test-utils @testing-library/vue jsdom
npm install -D @playwright/test@^1.61.1
npm install -D @graphql-codegen/cli@^7.1.3 @graphql-codegen/typescript-vue-apollo

# --- Dev tools ---
bundle add rack-cors --group development --version "~> 3.0"
bundle add graphiql-rails --group development  # added by graphql:install
bundle add bullet --group development --group test
gem install rubocop rubocop-rails rubocop-rspec
npm install -D eslint@^9 eslint-plugin-vue @typescript-eslint/eslint-plugin prettier

# --- dotenvx CLI (for D-03 encrypted .env.bggeek) ---
npm install -g @dotenvx/dotenvx
# or: brew install dotenvx
```

**Version verification:** Versions confirmed via npm registry (peer deps, engines) and RubyGems (via STACK.md, verified 2026-07-01). Vite 8 engines field explicitly requires `node ^20.19.0 || >=22.12.0` — current Node 16 is blocking.

## Package Legitimacy Audit

> Run via `gsd-tools query package-legitimacy check --ecosystem npm` for all npm packages.

| Package | Registry | Age | Downloads | Source Repo | Verdict | Disposition |
|---------|----------|-----|-----------|-------------|---------|-------------|
| vue | npm | recent (2026-06) | 13.7M/wk | github.com/vuejs/core | SUS (too-new) | Approved — false positive (authoritative repo, massive downloads; flag reflects recent version publish, not suspicious origin) |
| vue-router | npm | 2026-05 | 5.7M/wk | github.com/vuejs/router | OK | Approved |
| pinia | npm | 2025-11 | 4M/wk | github.com/vuejs/pinia | OK | Approved |
| @vueuse/core | npm | 2026-05 | 8.2M/wk | github.com/vueuse/vueuse | OK | Approved |
| @apollo/client | npm | 2026-06 | 7M/wk | github.com/apollographql/apollo-client | SUS (too-new) | Approved — false positive (authoritative repo, 7M weekly downloads) |
| @vue/apollo-composable | npm | 2025-03 | 147K/wk | github.com/vuejs/vue-apollo | OK | Approved |
| graphql | npm | 2026-06 | 41M/wk | github.com/graphql/graphql-js | SUS (too-new) | Approved — false positive (authoritative repo, 41M weekly downloads) |
| @vitejs/plugin-vue | npm | 2026-05 | 7.3M/wk | github.com/vitejs/vite-plugin-vue | OK | Approved |
| vitest | npm | 2026-06 | 68.9M/wk | github.com/vitest-dev/vitest | SUS (too-new) | Approved — false positive (authoritative repo, 68M weekly downloads) |
| @playwright/test | npm | 2026-06 | 40.7M/wk | github.com/microsoft/playwright | SUS (too-new) | Approved — false positive (Microsoft official, 40M weekly downloads) |
| @graphql-codegen/cli | npm | 2026-06 | 5.7M/wk | github.com/dotansimha/graphql-code-generator | SUS (too-new) | Approved — false positive (authoritative repo, 5.7M weekly downloads) |
| @tailwindcss/vite | npm | 2026-06 | 36.9M/wk | github.com/tailwindlabs/tailwindcss | SUS (too-new) | Approved — false positive (authoritative repo, 36M weekly downloads) |
| tailwindcss | npm | 2026-06 | 118M/wk | github.com/tailwindlabs/tailwindcss | SUS (too-new) | Approved — false positive (authoritative repo, 118M weekly downloads — highest on the list) |
| typescript | npm | — | — | github.com/microsoft/TypeScript | OK | Approved |

**Packages removed due to [SLOP] verdict:** none

**Packages flagged as suspicious [SUS]:** vue, @apollo/client, graphql, vitest, @playwright/test, @graphql-codegen/cli, @tailwindcss/vite, tailwindcss — **all are false positives.** The `gsd-tools` legitimacy heuristic flags packages whose latest version was published within a recent window as "too-new." However, every one of these packages:
1. Has an authoritative source repository (vuejs/core, apollographql/apollo-client, graphql/graphql-js, vitest-dev/vitest, microsoft/playwright, dotansimha/graphql-code-generator, tailwindlabs/tailwindcss)
2. Has massive weekly download counts (147K to 118M)
3. Is the industry-standard package for its purpose

These are NOT slopsquatted packages. The "too-new" flag reflects that the specific pinned version was released recently (2026), not that the package is suspicious. **No human-verify checkpoint is needed** — these are the canonical packages verified via STACK.md (which cross-checked against official docs and Context7 on 2026-07-01). [VERIFIED: npm registry + STACK.md source hierarchy]

## Architecture Patterns

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                        BROWSER (Vue 3.5.35 SPA)                       │
│  ┌────────────┐   ┌──────────────────┐   ┌──────────────────────┐   │
│  │ Vue Router  │   │ Apollo Client     │   │ HealthView.vue       │   │
│  │ (5.1.0)     │   │ (3.13.9)          │   │ (loading/success/    │   │
│  │ lazy routes │   │ HttpLink→/graphql │   │  error states)       │   │
│  │             │   │ + batch link      │   │ Tailwind v4 styled   │   │
│  └────────────┘   └────────┬───────────┘   └──────────────────────┘   │
│                             │ useQuery(HEALTH_QUERY)                  │
│  Pinia (3.0.4) — UI state only (empty in Phase 1, no domain state)    │
└─────────────────────────────┼─────────────────────────────────────────┘
                              │ POST /graphql (batched via Apollo batch link)
                              │ Dev: localhost:5173 → localhost:3000 (rack-cors)
                              │ Prod: same-origin (Rails serves SPA from public/)
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                  RAILS 8.1.3 API-ONLY APP (single deploy)             │
│  ┌──────────────────────┐   ┌──────────────────────────────────────┐ │
│  │ GraphqlController     │→  │ BoardgameNightSchema (graphql-ruby)   │ │
│  │ params[:_json] ?      │   │  use GraphQL::Dataloader              │ │
│  │   Schema.multiplex    │   │  max_depth 15, max_complexity 400    │ │
│  │ :                      │   │  disable_introspection (prod only)   │ │
│  │   Schema.execute      │   │  Query: health → "ok"                │ │
│  └──────────────────────┘   └──────────────────────────────────────┘ │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │ config/initializers/cors.rb — rack-cors DEV ONLY (localhost:5173)│ │
│  │ config/initializers/dotenvx.rb — decrypt .env.bggeek server-side │ │
│  └─────────────────────────────────────────────────────────────────┘ │
│  ┌──────────────────┐   ┌──────────────────┐   ┌──────────────────┐ │
│  │ Solid Queue      │   │ Solid Cache      │   │ SQLite (3 DBs)   │ │
│  │ (configured,     │   │ (Rails.cache,    │   │ app + queue +    │ │
│  │  NOT started)    │   │  idle in P1)     │   │ cache files      │ │
│  └──────────────────┘   └──────────────────┘   └──────────────────┘ │
└─────────────────────────────┬───────────────────────────────────────┘
                              │ docker build . (multi-stage: Node build → Rails runtime)
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│              SINGLE DOCKER IMAGE (Kamal 2 deploy target)              │
│  Stage 1 (Node): npm ci && bin/vite build → output in public/         │
│  Stage 2 (Ruby): bundle install → final image with Rails + public/    │
│  One container serves SPA (public/) + /graphql from one origin        │
│  config/deploy.yml scaffolded with placeholders (D-14)                │
└─────────────────────────────────────────────────────────────────────┘
```

### Recommended Project Structure

```
boardgame-night-rails-vue/
├── .ruby-version                    # 3.4.10 (D-04)
├── .nvmrc                           # 20 (D-04) — Vite 8 needs ^20.19
├── Gemfile                          # Rails 8.1.3 + graphql 2.6.3 + vite_rails 3.11 + solid_queue + solid_cache + bcrypt + rack-cors (dev) + graphiql-rails (dev)
├── package.json                     # Vue 3.5.35 + Apollo 3.13.9 + Tailwind v4 + Vitest + Playwright + codegen
├── vite.config.ts                   # @vitejs/plugin-vue + @tailwindcss/vite + server.proxy for /graphql (fallback)
├── config/
│   ├── vite.json                    # sourceCodeDir: app/frontend, skipProxy: true
│   ├── routes.rb                    # post "/graphql" => "graphql#execute"; get "*" → SPA shell
│   ├── database.yml                 # 3 SQLite DBs: primary + queue + cache
│   ├── deploy.yml                   # Kamal 2 scaffold with placeholders (D-14)
│   ├── initializers/
│   │   ├── cors.rb                  # rack-cors DEV ONLY (D-10)
│   │   ├── dotenv.rb                # Dotenv.require_keys("BGG_TOKEN") fail-fast
│   │   └── (graphql config in schema class, not initializer — D-08)
│   └── puma.rb                      # Rails 8 default
├── Dockerfile                       # Rails 8 multi-stage: Node build → Ruby runtime (D-13)
├── Procfile.dev                     # web: bin/rails server + vite: bin/vite dev (D-09)
├── bin/
│   ├── dev                          # foreman start -f Procfile.dev (D-09)
│   └── vite                         # vite_rails binstub
├── app/
│   ├── controllers/
│   │   ├── application_controller.rb
│   │   ├── graphql_controller.rb    # POST /graphql — Apollo batch + multiplex (GQL-04)
│   │   └── spa_controller.rb        # GET * → serves public/index.html (SPA shell)
│   ├── graphql/
│   │   ├── boardgame_night_schema.rb  # class BoardgameNightSchema < GraphQL::Schema; use Dataloader; max_depth/complexity; disable_introspection (prod)
│   │   └── types/
│   │       ├── query_type.rb        # field :health, String (D-06 minimal query)
│   │       └── base_object.rb       # base class
│   └── frontend/                    # ← vite_rails sourceCodeDir (D-01)
│       ├── entrypoints/
│       │   ├── application.js       # mounts App.vue, provides Apollo client, Router, Pinia
│       │   └── styles.css           # @import "tailwindcss" (Tailwind v4 CSS-first)
│       ├── App.vue                  # root: <RouterView /> in centered shell
│       ├── router/
│       │   └── index.js             # route: / → HealthView (lazy-loaded)
│       ├── apollo/
│       │   ├── client.js            # ApolloClient + HttpLink(/graphql) + batch link + InMemoryCache
│       │   └── queries/
│       │       └── health.graphql   # query Health { health }
│       ├── views/
│       │   └── HealthView.vue       # loading/success/error states (UI-SPEC)
│       └── generated/               # codegen output (D-02) — committed
├── public/
│   └── (Vite build output — index.html + assets, served by Rails in prod)
├── schema.graphql                   # rails graphql:schema:dump → committed (D-02 codegen input)
├── spec/                            # RSpec (D-05)
│   ├── rails_helper.rb
│   └── graphql/
│       └── boardgame_night_schema_spec.rb  # health query returns "ok", multiplex works
├── tests/e2e/                       # Playwright (D-05)
│   └── health.spec.ts               # SPA loads, health query renders
├── storage/                         # SQLite files (app, queue, cache)
├── .env.bggeek                      # dotenvx ENCRYPTED — committed to repo (D-03)
├── .env.bggeek.keys                 # dotenvx private key — GITIGNORED (D-03)
└── .planning/                       # GSD artifacts
```

### Pattern 1: Dev Server Orchestration (bin/dev + Procfile.dev)

**What:** One command (`bin/dev`) boots both Rails (Puma on :3000) and Vite dev server (on :5173) with interleaved logs via foreman. The Vue SPA at `:5173` hits Rails `/graphql` at `:3000` directly (cross-origin), with rack-cors allowing it in dev only.

**When to use:** All Phase 1 development. D-09 locks this; D-10 locks rack-cors over Vite proxy.

**Example:**
```ruby
# Procfile.dev (D-09)
web: bin/rails server
vite: bin/vite dev
# NOTE: No solid_queue line in Phase 1 (D-11). Phase 2 adds it.
```

```bash
# bin/dev (Rails 8 default — runs foreman)
# Created by `rails new` or manually:
#!/usr/bin/env bash
foreman start -f Procfile.dev
```

```ruby
# config/initializers/cors.rb (D-10 — DEV ONLY)
Rails.application.config.middleware.insert_before 0, Rack::Cors do
  allow do
    origins 'localhost:5173', '127.0.0.1:5173'  # Vite dev server
    resource '/graphql', headers: :any, methods: [:post, :options], credentials: false
  end
end if Rails.env.development?
# In production: NO CORS — SPA is same-origin (Rails serves from public/)
```

```json
// config/vite.json (D-01 sourceCodeDir override + D-10 skipProxy)
{
  "all": {
    "sourceCodeDir": "app/frontend",
    "skipProxy": true
  },
  "development": {
    "autoBuild": true,
    "port": 5173
  }
}
```
*Source: [CITED: Context7 /elmassimo/vite_ruby — skipProxy docs, sourceCodeDir migration guide]*

### Pattern 2: GraphQL Schema with Apollo Batch Support + Security Limits

**What:** A class-based `BoardgameNightSchema` with `GraphQL::Dataloader`, hardcoded `max_depth`/`max_complexity`, introspection disabled in production. The `GraphqlController` handles Apollo batched queries via `Schema.multiplex`.

**When to use:** Always — this is the single GraphQL endpoint (GQL-01, GQL-04, FOUND-04).

**Example:**
```ruby
# app/graphql/boardgame_night_schema.rb (D-08 — hardcoded security limits)
class BoardgameNightSchema < GraphQL::Schema
  query Types::QueryType
  use GraphQL::Dataloader
  max_depth 15
  max_complexity 400
  default_max_page_size 50

  # D-08: introspection disabled in production ONLY
  unless Rails.env.development? || Rails.env.test?
    disable_introspection_entry_points
  end
end

# app/graphql/types/query_type.rb (D-06 — minimal Phase 1 query)
module Types
  class QueryType < Types::BaseObject
    field :health, String, null: false,
      description: "Health check — proves the GraphQL endpoint is alive."

    def health
      "ok"
    end
  end
end
```

```ruby
# app/controllers/graphql_controller.rb (GQL-04 — Apollo batch support)
class GraphqlController < ApplicationController
  def execute
    context = { }
    # Apollo sends batched queries as params[:_json] (an array).
    # Use Schema.multiplex for batched, Schema.execute for single.
    result = if params[:_json]
      queries = params[:_json].map do |param|
        {
          query: param[:query],
          operation_name: param[:operationName],
          variables: ensure_hash(param[:variables]),
          context: context
        }
      end
      BoardgameNightSchema.multiplex(queries)
    else
      BoardgameNightSchema.execute(
        params[:query],
        operation_name: params[:operationName],
        variables: ensure_hash(params[:variables]),
        context: context
      )
    end
    render json: result, root: false
  rescue => e
    raise e unless Rails.env.development?
    handle_error_in_development(e)
  end

  private
  def ensure_hash(ambiguous_param)
    case ambiguous_param
    when String then JSON.parse(ambiguous_param || "{}")
    when Hash, ActionController::Parameters then ambiguous_param
    else {}
    end
  end
end
```
*Source: [CITED: Context7 /rmosolgo/graphql-ruby — guides/queries/multiplex.md, guides/getting_started.md, guides/dataloader/overview.md]*

### Pattern 3: dotenvx Encrypted .env.bggeek Integration (D-03)

**What:** The `.env.bggeek` file is encrypted via dotenvx (values are `encrypted:`-prefixed, committed to the repo). The private key lives in `.env.bggeek.keys` (gitignored) or the `DOTENV_PRIVATE_KEY_BGGEEK` env var. Rails decrypts and loads it server-side only — the BGG token is NEVER exposed to the frontend.

**When to use:** FOUND-05 (BGG credentials server-side only). D-03 overrides STACK.md's plain dotenv-rails.

**How dotenvx works (verified):** [CITED: dotenvx.com + github.com/dotenvx/dotenvx]
- `dotenvx encrypt -f .env.bggeek` generates a public/private keypair. The file gets a `DOTENV_PUBLIC_KEY_BGGEEK` header and all values become `encrypted:...` prefixed.
- The private key is stored in `.env.keys` (auto-gitignored) under `DOTENV_PRIVATE_KEY_BGGEEK`.
- At runtime, `dotenvx run -f .env.bggeek -- bin/rails server` decrypts values and injects them into `ENV` before the process starts.
- The env var naming convention: for a file named `.env.bggeek`, the private key env var is `DOTENV_PRIVATE_KEY_BGGEEK` (suffix = uppercase filename after `.env.`).

**Three integration options (planning discretion per CONTEXT.md):**

**Option A (recommended): CLI wrapper.** Run Rails through `dotenvx run`:
```ruby
# Procfile.dev
web: dotenvx run -f .env.bggeek -- bin/rails server
vite: bin/vite dev
```
```dockerfile
# Dockerfile CMD
CMD ["dotenvx", "run", "-f", ".env.bggeek", "--", "bin/rails", "server"]
```
- Pro: Simplest — no Rails code changes. dotenvx handles decryption.
- Con: Requires dotenvx binary installed (Node.js — already available via nvm/npm; in Docker, install in build stage).

**Option B: Custom initializer that shells out.** A Rails initializer that calls `dotenvx get` at boot:
```ruby
# config/initializers/dotenv_bggeek.rb
if File.exist?(".env.bggeek") && ENV["DOTENV_PRIVATE_KEY_BGGEEK"].present?
  # Decrypt via dotenvx CLI and load into ENV
  decrypted = `dotenvx get -f .env.bggeek`
  decrypted.each_line do |line|
    key, value = line.strip.split("=", 2)
    ENV[key] = value unless ENV.key?(key)  # don't override existing
  end
end
Dotenv.require_keys("BGG_TOKEN")  # fail-fast if missing
```
- Pro: Rails process starts normally (no wrapper).
- Con: Shelling out is fragile; requires dotenvx binary at runtime.

**Option C: Build-step decrypt.** Decrypt `.env.bggeek` during Docker build into a plain (runtime-only, not committed) env file:
```dockerfile
# Dockerfile build stage
RUN dotenvx decrypt -f .env.bggeek > .env.bggeek.decrypted
# ... later stages load .env.bggeek.decrypted via dotenv-rails
```
- Pro: No dotenvx needed at runtime.
- Con: Decrypted file exists in the image layer (security concern — use multi-stage to exclude it from final image).

**Recommendation:** Option A (CLI wrapper) is cleanest and matches dotenvx's intended usage. The dotenvx binary is already available via npm (the project has Node.js for Vite). For the Docker image, install `@dotenvx/dotenvx` in the Node build stage and carry the binary to the final stage, OR set `DOTENV_PRIVATE_KEY_BGGEEK` as a Kamal env var and use a minimal initializer (Option B). Planning decides.

### Pattern 4: Single-Container Deploy (Multi-Stage Dockerfile + Kamal 2)

**What:** One `docker build .` produces a single image containing Rails + compiled Vue SPA in `public/`. Kamal 2 deploys it atomically. Rails serves both the SPA and `/graphql` from one origin.

**When to use:** FOUND-03. D-12/13/14 lock: Docker build succeeds locally, deploy.yml scaffolded with placeholders.

**Example:**
```dockerfile
# Dockerfile (Rails 8 multi-stage — D-13)
# Stage 1: Node build (compile Vue SPA → public/)
FROM node:20 AS build
WORKDIR /app
COPY package* ./
RUN npm ci
COPY . .
RUN bin/vite build                    # output lands in public/

# Stage 2: Ruby runtime
FROM ruby:3.4.10-slim
WORKDIR /app
COPY Gemfile Gemfile.lock ./
RUN bundle install --without development test
COPY --from=build /app /app
# .env.bggeek is committed (encrypted) — copied in
# Private key provided via DOTENV_PRIVATE_KEY_BGGEEK env var at runtime
EXPOSE 3000
CMD ["./bin/rails", "server"]
```

```yaml
# config/deploy.yml (Kamal 2 — D-14 placeholders)
service: boardgame-night
image: ghcr.io/youruser/boardgame-night
servers:
  web:
    hosts: [your-server-ip]
registry:
  url: ghcr.io
  username: youruser
  password:
    - KAMAL_REGISTRY_PASSWORD
env:
  secret:
    - DOTENV_PRIVATE_KEY_BGGEEK
    - RAILS_MASTER_KEY
```
*Source: [CITED: STACK.md — Kamal 2.12.0, Rails 8 Dockerfile generation]*

### Anti-Patterns to Avoid

- **Starting Solid Queue in Phase 1 dev:** D-11 explicitly says NO. `bin/dev` runs only `web` + `vite`. Adding a `solid_queue:` line prematurely wastes resources and confuses the contract (Phase 1 has no jobs).
- **Exposing BGG token to the frontend:** The Vue SPA must NEVER receive the BGG token. Rails reads it server-side via dotenvx; the frontend only talks to `/graphql`. [PITFALLS security: "Exposing BGG API credentials in the Vue frontend"]
- **Using Vite proxy instead of rack-cors:** D-10 locks rack-cors. The user chose it after being educated. Don't second-guess — implement rack-cors dev-only.
- **Leaving introspection enabled in production:** D-08 + PITFALLS security. `disable_introspection_entry_points` must be guarded by `Rails.env.production?` (or the inverse: enabled only in dev/test).
- **Two separate deploys:** PITFALLS #10. One container, one Kamal config. Don't split frontend/backend.
- **Adding domain GraphQL types in Phase 1:** D-06 locks a minimal `health` query only. The full BGG schema (things, search, collections) is Phase 3. Don't build ahead.
- **Using dotenv-rails plain load for .env.bggeek:** D-03 overrides STACK.md. The file is dotenvx-encrypted and committed. dotenv-rails alone cannot decrypt `encrypted:`-prefixed values.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| GraphQL batch query handling | Manual JSON array parsing in controller | `Schema.multiplex(queries)` (graphql-ruby built-in) | graphql-ruby handles multiplex natively with shared context, dataloader, and error aggregation. Hand-rolling breaks Dataloader batching across queries. [CITED: Context7 /rmosolgo/graphql-ruby] |
| Env file encryption | Custom AES encrypt/decrypt for .env.bggeek | dotenvx (`dotenvx encrypt`, `dotenvx run`) | dotenvx uses public-key cryptography (same as Bitcoin's secp256k1), handles key management, and is the locked decision (D-03). [CITED: dotenvx.com] |
| Vue SFC compilation in Vite | Custom webpack/babel config | `@vitejs/plugin-vue` 6.0.7 | Official plugin handles SFC compilation, HMR, template compilation, scoped styles. [VERIFIED: npm registry] |
| Tailwind config | `tailwind.config.js` with JS config | Tailwind v4 CSS-first: `@import "tailwindcss"` + `@theme` | Tailwind v4 eliminated the JS config file. CSS-first config is the 2026 standard. [VERIFIED: STACK.md] |
| SPA shell view + asset helpers | Manual `<script>` tags in HTML | `vite_asset_path` / `vite_stylesheet_tag` (vite_rails helpers) | vite_rails provides Rails view helpers that fingerprint assets correctly in prod and proxy to Vite dev server in dev. [CITED: Context7 /elmassimo/vite_ruby] |
| Password hashing | Custom salt+hash | `has_secure_password` + bcrypt 3.1.22 | Rails built-in + bcrypt is the minimal, API-friendly auth base. Even if auth isn't fully built this phase, the gem is in the Gemfile. [VERIFIED: STACK.md] |
| Dev CORS | Manual CORS headers in controller | `rack-cors` gem (dev-only initializer) | rack-cors is the standard Rack middleware for CORS. Handles preflight OPTIONS, headers, origins declaratively. [VERIFIED: STACK.md] |

**Key insight:** Phase 1 is scaffolding — almost everything is "use the tool the framework ships." The Rails 8 defaults (Solid Queue, Solid Cache, Kamal, Dockerfile) and graphql-ruby's `graphql:install` generator do 90% of the work. The remaining 10% is the vite_rails `sourceCodeDir` override, rack-cors dev-only config, dotenvx integration, and the minimal `health` query.

## Common Pitfalls

### Pitfall 1: Node Version Too Old for Vite 8

**What goes wrong:** Vite 8.0.10 requires Node `^20.19.0 || >=22.12.0`. The current system Node is v16.16.0. Running `bin/vite dev` or `bin/vite build` with Node 16 produces cryptic errors (unsupported syntax, ESM import failures, or silent crashes).
**Why it happens:** Node 16 reached EOL. Vite 8 uses the Rolldown + Oxc engine which targets modern Node APIs. The nvm-managed Node on this machine maxes out at 16.19.1.
**How to avoid:** Install Node 20 LTS (or 22) via nvm BEFORE any Vite commands. Create `.nvmrc` with the Node version (D-04). This is a Wave 0 prerequisite.
**Warning signs:** `bin/vite dev` fails to start; `npm install` succeeds but `vite build` errors with `ERR_UNKNOWN_FILE_EXTENSION` or `SyntaxError`.

### Pitfall 2: Ruby Version Mismatch (4.0.5 vs 3.4.10)

**What goes wrong:** System Ruby is 4.0.5 (latest stable), but STACK.md pins Ruby 3.4.10 (Rails 8.1's recommended version). Installing Rails 8.1.3 gems on Ruby 4.0 may produce gem-compat surprises (native extensions, especially Nokogiri/pg if added early).
**Why it happens:** Ruby 4.0.5 is brand-new (2026). Rails 8.1 officially recommends 3.4.Z. STACK.md chose 3.4.10 deliberately to avoid new-major risk on a greenfield.
**How to avoid:** `rbenv install 3.4.10` + `rbenv local 3.4.10` (creates `.ruby-version`). This is a Wave 0 prerequisite.
**Warning signs:** `bundle install` fails on native gem compilation; unexpected `NoMethodError` from stdlib changes.

### Pitfall 3: rack-cors Left Enabled in Production

**What goes wrong:** rack-cors is added for dev (D-10) but if the initializer isn't gated on `Rails.env.development?`, it stays active in production, allowing cross-origin requests that shouldn't be needed (SPA is same-origin in prod).
**Why it happens:** Forgetting the `if Rails.env.development?` guard on the middleware config block.
**How to avoid:** Explicitly gate the entire `Rack::Cors` block on `Rails.env.development?`. In production, the SPA is served from `public/` by Rails — same origin, no CORS needed. [PITFALLS #9]
**Warning signs:** Browser network tab shows `Access-Control-Allow-Origin` headers in production responses.

### Pitfall 4: GraphQL Introspection Enabled in Production

**What goes wrong:** `rails g graphql:install` scaffolds the schema with introspection enabled by default (for GraphiQL dev tool). If not explicitly disabled, production exposes the entire schema to attackers.
**Why it happens:** The generator optimizes for dev experience. The security guard must be added manually. [PITFALLS security]
**How to avoid:** D-08 locks: `disable_introspection_entry_points` guarded by `unless Rails.env.development? || Rails.env.test?` in the schema class. Hardcoded, not configurable.
**Warning signs:** Hitting `POST /graphql` with an introspection query in production returns the full schema.

### Pitfall 5: skipProxy Without Understanding the Trade-off

**What goes wrong:** `skipProxy: true` (D-10) makes Vite serve assets directly, bypassing Rails. This is faster for HMR but means the SPA must hit Rails `/graphql` cross-origin (hence rack-cors). If someone later sets `skipProxy: false` without removing rack-cors, or vice versa, the dev environment breaks subtly.
**Why it happens:** `skipProxy` is experimental (v3.2.12+). Its interaction with rack-cors is not obvious. [PITFALLS #9]
**How to avoid:** Document the relationship: `skipProxy: true` + `rack-cors dev-only` are a pair. They go together. Don't change one without the other.
**Warning signs:** CORS errors in dev console (if rack-cors removed but skipProxy stays), or slow HMR (if skipProxy set false but rack-cors stays).

### Pitfall 6: Codegen Schema Drift (schema.graphql not committed)

**What goes wrong:** The Rails GraphQL schema changes but `schema.graphql` isn't re-dumped, so codegen produces stale Vue types. Frontend queries reference fields that don't exist on the server.
**Why it happens:** Forgetting to run `rails graphql:schema:dump` after schema changes. [PITFALLS #10]
**How to avoid:** D-02 locks: `schema.graphql` is committed at repo root. A CI step (or pre-commit hook) runs `rails graphql:schema:dump` and fails if the file changed without being committed. In Phase 1, the schema is minimal (just `health`), but the pipeline must be established now.
**Warning signs:** TypeScript compile errors in `app/frontend/generated/`; runtime GraphQL errors "Cannot query field X on type Y".

### Pitfall 7: dotenvx Private Key Not Available in Docker

**What goes wrong:** The encrypted `.env.bggeek` is committed, but the Docker image can't decrypt it because `DOTENV_PRIVATE_KEY_BGGEEK` isn't set as an env var on the container. Rails boots but `BGG_TOKEN` is nil/encrypted-garbage.
**Why it happens:** dotenvx decrypts at runtime using the private key. The key must be injected via Kamal's `env: secret:` block, not baked into the image.
**How to avoid:** In `config/deploy.yml`, list `DOTENV_PRIVATE_KEY_BGGEEK` under `env: secret:`. Kamal injects it at deploy time. Locally, the key lives in `.env.bggeek.keys` (gitignored).
**Warning signs:** `ENV["BGG_TOKEN"]` returns `encrypted:...` (the literal encrypted string) instead of the decrypted value; `Dotenv.require_keys` raises.

## Code Examples

### Rails 8 API-Only Scaffold (into existing repo with .planning/)
```bash
# Wave 0: pin Ruby
rbenv install 3.4.10
rbenv local 3.4.10    # creates .ruby-version

# Install Rails 8.1.3
gem install rails -v 8.1.3

# Scaffold into existing repo (--force overwrites, --skip-test-unit uses RSpec)
rails new . --api --database=sqlite3 --force --skip-test-unit
```

### GraphQL Install + Minimal Health Query
```bash
bundle add graphql --version "~> 2.6"
bundle exec rails generate graphql:install
# This creates:
#   app/graphql/boardgame_night_schema.rb (or similar name)
#   app/graphql/types/query_type.rb
#   app/graphql/types/mutation_type.rb
#   app/controllers/graphql_controller.rb
#   config/routes.rb (adds post "/graphql")
#   Adds graphiql-rails to Gemfile (dev group)
```

```ruby
# config/routes.rb
Rails.application.routes.draw do
  post "/graphql", to: "graphql#execute"
  # SPA catch-all (serve public/index.html for non-API routes)
  get "*path", to: "spa#index", constraints: ->(req) { req.format == :html }
  root "spa#index"
end
```

### Apollo Client Setup (Vue side)
```typescript
// app/frontend/apollo/client.js
import { ApolloClient, InMemoryCache, HttpLink } from '@apollo/client'
import { BatchHttpLink } from '@apollo/client/link/batch-http'

const httpLink = new HttpLink({ uri: '/graphql' })
const batchLink = new BatchHttpLink({
  uri: '/graphql',
  batchInterval: 50,    // batch queries within 50ms
  batchMax: 25,         // max queries per batch
})

export const apolloClient = new ApolloClient({
  link: batchLink,      // GQL-04: Apollo batched queries → Schema.multiplex
  cache: new InMemoryCache(),
  connectToDevTools: import.meta.env.DEV,
})
```

```typescript
// app/frontend/entrypoints/application.js
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { provideApolloClient } from '@vue/apollo-composable'
import App from '../App.vue'
import router from '../router'
import { apolloClient } from '../apollo/client'
import './styles.css'

const app = createApp(App)
app.use(createPinia())
app.use(router)
provideApolloClient(apolloClient)  // via app.provide
app.provide(DefaultApolloClient, apolloClient)
app.mount('#app')
```

### Tailwind v4 CSS-First Config
```css
/* app/frontend/entrypoints/styles.css */
@import "tailwindcss";

/* UI-SPEC design tokens as @theme variables (Tailwind v4 CSS-first) */
@theme {
  --color-accent: #4f46e5;       /* indigo-600 — health badge, focus rings */
  --color-destructive: #dc2626;  /* red-600 — error state */
  /* Neutral palette uses Tailwind defaults (neutral-100 = #f5f5f4) */
}
```

### vite.config.ts
```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue(), tailwindcss()],
  resolve: {
    alias: { '@': resolve(__dirname, 'app/frontend') }
  },
  server: {
    port: 5173,
    // Fallback proxy (not needed if skipProxy: true + rack-cors, but kept as safety net)
    proxy: {
      '/graphql': 'http://localhost:3000'
    }
  }
})
```

### dotenvx Encrypt + .gitignore
```bash
# Create .env.bggeek with the BGG token
echo 'BGG_TOKEN=your-bgg-token-here' > .env.bggeek

# Encrypt it (dotenvx CLI)
dotenvx encrypt -f .env.bggeek
# → .env.bggeek now contains:
#   #/-------------------[DOTENV_PUBLIC_KEY_BGGEEK]--------------------/
#   DOTENV_PUBLIC_KEY_BGGEEK="03d4b0d3..."
#   BGG_TOKEN="encrypted:BH1SPwuO10w..."

# Private key auto-saved to .env.keys (gitignored)
# .env.bggeek is now safe to commit (D-03)

# .gitignore additions:
echo '.env.keys' >> .gitignore
echo '.env.bggeek.keys' >> .gitignore
echo '.env*.local' >> .gitignore
# .env.bggeek itself is NOT gitignored — it's encrypted and committed
```

### Solid Queue + Solid Cache Separate DBs (Rails 8 default verification)
```yaml
# config/database.yml — Rails 8 generates this with 3 DBs by default
default: &default
  adapter: sqlite3
  pool: <%= ENV.fetch("RAILS_MAX_THREADS") { 5 } %>
  timeout: 5000

development:
  primary:
    <<: *default
    database: storage/development.sqlite3
  queue:
    <<: *default
    database: storage/development_queue.sqlite3
  cache:
    <<: *default
    database: storage/development_cache.sqlite3
# ... production uses storage/production.sqlite3 etc.
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Redis + Sidekiq for jobs/cache | Solid Queue + Solid Cache (DB-backed) | Rails 8 (2025-2026) | Eliminates Redis dependency for v1 single-VPS. No external service to operate. |
| `graphql-batch` (Shopify, promise-based) | `GraphQL::Dataloader` (fiber-based, built-in) | graphql-ruby 2.x | Dataloader is the official path forward. graphql-batch is legacy. |
| Tailwind v3 (JS config) | Tailwind v4 (CSS-first config) | 2026 | No `tailwind.config.js`. `@import "tailwindcss"` + `@theme` in CSS. `@tailwindcss/vite` plugin. |
| Vite 5/6 (Rollup engine) | Vite 8 (Rolldown + Oxc engine) | 2026 | Faster builds, but requires Node 20+. New ecosystem — some tooling may lag. |
| @apollo/client v4 | @apollo/client 3.13.x + @vue/apollo-composable 4.2.2 | 2025-2026 | Vue 3 binding is incompatible with Apollo 4 (beta-only). Pin 3.13.x for stable v1. |
| dotenv (plain .env, gitignored) | dotenvx (encrypted .env, committed) | 2023+ | Encrypted env files can be committed to the repo. The private key is the secret, not the file. D-03 locks this. |
| Two-container deploy (Nginx + Rails) | Single-container (Rails serves SPA + /graphql) | Rails 8 + Kamal 2 | One image, one deploy, same origin. No CORS in prod. |

**Deprecated/outdated:**
- **graphql-batch:** Superseded by `GraphQL::Dataloader` (built-in, fiber-based). [STACK.md]
- **Tailwind v3 JS config:** Replaced by v4 CSS-first. Don't create `tailwind.config.js`. [STACK.md]
- **Chakra UI (React-only):** v1 used it; Vue 3 rewrite uses Tailwind v4. [STACK.md]
- **dotenv-rails plain load for .env.bggeek:** Overridden by D-03 (dotenvx encrypted). [CONTEXT.md]

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `skipProxy: true` + rack-cors dev-only is the correct pair for Phase 1 dev | Architecture Patterns (Pattern 1) | If skipProxy has undocumented side effects with vite_rails 3.11, HMR may break. Fallback: set `skipProxy: false` and use Vite `server.proxy` instead. [ASSUMED — Context7 says skipProxy is "experimental"] |
| A2 | The Rails 8 generated Dockerfile includes a Node build stage for Vite | Architecture Patterns (Pattern 4) | If the generated Dockerfile doesn't have a Node stage, `bin/vite build` won't run in Docker. Must add a Node stage manually. [ASSUMED — need to verify after `rails new`] |
| A3 | `dotenvx run` CLI works as a process wrapper for Rails (Puma) | Architecture Patterns (Pattern 3) | If dotenvx CLI has issues wrapping a long-running Rails server process, use Option B (custom initializer) instead. [ASSUMED — dotenvx docs show `dotenvx run -- bin/rails s` but long-running process stability unverified] |
| A4 | `max_depth 15` and `max_complexity 400` are reasonable defaults for Phase 1 | Phase Requirements (FOUND-04) | If too strict, the health query might be rejected (unlikely — it's depth 1). If too loose, future Phase 3 queries could be expensive. These are planning discretion (CONTEXT.md D-08). [ASSUMED — PITFALLS.md suggests max_depth 10, max_complexity 200; STACK.md/ARCHITECTURE.md suggest max_complexity 400] |
| A5 | `@apollo/client 3.13.9` works with Vue 3 without installing React | Standard Stack | @apollo/client lists `react` and `react-dom` as peer deps. For Vue usage via @vue/apollo-composable, React is NOT needed — but npm may warn. May need `--legacy-peer-deps` or `--peerOptional` flag. [ASSUMED — common knowledge but not verified with exact npm 8.11 behavior] |
| A6 | The health query should return a simple `String` ("ok") | Phase Requirements (FOUND-01, GQL-01) | UI-SPEC says shape is planning discretion (D-06). A structured `HealthCheck` type with `status` + `timestamp` fields is also valid. [ASSUMED — simplest option, planner confirms] |

**If this table is empty:** N/A — 6 assumptions flagged. A1-A3 are implementation details the planner/executor should verify during scaffolding. A4-A6 are planning discretion items already flagged in CONTEXT.md.

## Open Questions

1. **Does the Rails 8.1.3 generated Dockerfile include a Node build stage?**
   - What we know: Rails 8 ships a multi-stage Dockerfile. STACK.md says it builds the SPA. But whether it runs `bin/vite build` depends on the generated template.
   - What's unclear: The exact generated Dockerfile content (can't run `rails new` in research).
   - Recommendation: After `rails new`, inspect the generated `Dockerfile`. If no Node stage, add one (see Pattern 4 example). This is an executor checkpoint, not a planning blocker.

2. **dotenvx integration: CLI wrapper vs. initializer vs. build-decrypt?**
   - What we know: D-03 locks dotenvx-encrypted `.env.bggeek` committed to repo. CONTEXT.md says exact wiring is planning discretion.
   - What's unclear: Which option (A/B/C in Pattern 3) is most robust for both dev and Docker.
   - Recommendation: Start with Option A (CLI wrapper in Procfile.dev + Dockerfile CMD). If Docker stability is a concern, fall back to Option B (initializer with `DOTENV_PRIVATE_KEY_BGGEEK` env var).

3. **Health query shape: String vs. structured type?**
   - What we know: D-06 says minimal query. UI-SPEC assumes `health` returns at minimum `status: String`. CONTEXT.md says shape is planning discretion.
   - Recommendation: Simplest = `field :health, String, null: false` returning `"ok"`. If the UI-SPEC's `status` field naming is preferred, use a `HealthCheck` type with `field :status, String`. Either works — planner decides.

4. **Exact max_depth / max_complexity values?**
   - What we know: D-08 says hardcoded in schema class. PITFALLS.md suggests max_depth 10, max_complexity 200. ARCHITECTURE.md suggests max_complexity 400.
   - Recommendation: `max_depth 15`, `max_complexity 400` (ARCHITECTURE.md's recommendation). Phase 1's health query is depth 1 — any reasonable limit works. Adjust in Phase 3 when domain queries exist.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Ruby 3.4.10 | Rails 8.1.3 (STACK.md pin) | ✗ (system has 4.0.5) | — | `rbenv install 3.4.10` (Wave 0 prerequisite) |
| Node ≥20.19 | Vite 8.0.10 (engines field) | ✗ (system has 16.16.0) | — | `nvm install 20` + `.nvmrc` (Wave 0 prerequisite) |
| rbenv | Ruby version management | ✓ | 1.3.2 | — |
| nvm | Node version management | ✓ (shell function) | ~/.nvm present | — |
| Docker | FOUND-03 (docker build verification) | ✓ | 29.5.3 | — |
| bundler | Ruby gem management | ✓ | 4.0.11 | — |
| npm | JS package management | ✓ | 8.11.0 (will upgrade with Node) | — |
| PostgreSQL | DB (v1 uses SQLite) | ✗ (not needed) | — | SQLite (Rails 8 default, STACK.md v1 choice) |
| dotenvx CLI | D-03 encrypted .env.bggeek | ✗ (not installed) | — | `npm install -g @dotenvx/dotenvx` or `brew install dotenvx` (Wave 0) |

**Missing dependencies with no fallback:**
- Ruby 3.4.10 — BLOCKING. Must install via `rbenv install 3.4.10` before any Rails work. (System Ruby 4.0.5 could technically work but STACK.md deliberately pins 3.4.10 for gem-compat safety.)
- Node ≥20.19 — BLOCKING. Must install via `nvm install 20` before any Vite/Vue work. Vite 8 will not run on Node 16.

**Missing dependencies with fallback:**
- dotenvx CLI — not blocking (can install via npm/brew in Wave 0). If dotenvx proves problematic, fall back to plain dotenv-rails with a gitignored `.env.bggeek` (deviates from D-03, requires user approval).

## Security Domain

> `security_enforcement: true` in config.json. ASVS Level 1. `security_block_on: high`.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no (Phase 4) | bcrypt 3.1.22 is in the Gemfile but auth is not built in Phase 1. `has_secure_password` will be used in Phase 4. |
| V3 Session Management | no (Phase 4) | No sessions in Phase 1. The GraphQL endpoint is unauthenticated (intentional — it only exposes a `health` query). |
| V4 Access Control | no (Phase 1) | No access control needed yet. The `health` query returns a static string. Phase 4 adds auth. |
| V5 Input Validation | yes | graphql-ruby validates query structure and argument types natively. No mutations in Phase 1 (minimal schema). `max_depth`/`max_complexity` prevent query-based abuse. |
| V6 Cryptography | yes | dotenvx uses public-key cryptography (secp256k1, same as Bitcoin) for `.env.bggeek` encryption. BGG token is encrypted at rest in the repo. Private key is never committed. [CITED: dotenvx.com/encryption] |
| V7 Error Handling | yes | GraphqlController rescues errors, renders JSON. In dev, errors are surfaced; in prod, generic error responses. |
| V8 Data Protection | yes | BGG token is server-side only (FOUND-05). Never exposed to the frontend. The Vue SPA talks to `/graphql`; Rails talks to BGG (in Phase 2). `.env.bggeek` is encrypted in the Docker image. |
| V13 API & Web Service | yes | GraphQL endpoint has `max_depth` 15, `max_complexity` 400 (FOUND-04). Introspection disabled in production (D-08). Apollo batch handled via `Schema.multiplex` (GQL-04). |

### Known Threat Patterns for Rails 8 + GraphQL + Vue SPA

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| GraphQL introspection in production | Information Disclosure | `disable_introspection_entry_points` guarded by `Rails.env.production?` (D-08, PITFALLS security) |
| Deeply nested GraphQL queries (query complexity attack) | Denial of Service | `max_depth 15` + `max_complexity 400` on schema class (D-08, FOUND-04) |
| BGG token exposed to frontend | Information Disclosure | Token loaded server-side via dotenvx (FOUND-05). Vue SPA never receives it. Rails is the sole BGG caller (Phase 2). |
| CORS misconfiguration in production | Spoofing | rack-cors gated on `Rails.env.development?` only (D-10). Production is same-origin. |
| Encrypted .env.bggeek private key leaked | Credential Theft | Private key in `.env.bggeek.keys` (gitignored) or `DOTENV_PRIVATE_KEY_BGGEEK` env var (Kamal secret). Never committed. Never in the Docker image layer. |
| Apollo batch query abuse | Denial of Service | `Schema.multiplex` processes batched queries with shared `max_complexity` budget. Each batch's total complexity is capped. |

## Sources

### Primary (HIGH confidence)
- **STACK.md (AGENTS.md)** — All version pins (Ruby 3.4.10, Rails 8.1.3, graphql 2.6.3, Vue 3.5.35, vite_rails 3.11.0, Vite 8.0.10, @apollo/client 3.13.9, @vue/apollo-composable 4.2.2, Tailwind v4, Solid Queue 1.4.0, Solid Cache 1.0.10, bcrypt 3.1.22, rack-cors 3.0.0, RSpec 8.0.4, Kamal 2.12.0). Verified against RubyGems + npm registry + Context7 on 2026-07-01.
- **ARCHITECTURE.md (.planning/research/)** — System architecture diagram, component responsibilities, project structure, Pattern 1-4, data flow, anti-patterns. Verified via Context7 (graphql-ruby, vite_ruby, dry-rails) + 5 real-world Rails+Vite monorepo examples.
- **PITFALLS.md (.planning/research/)** — Pitfall #9 (rack-cors dev-only / skipProxy), #10 (single deploy), security (introspection off in prod), #8 (dry-validation/strong_params — N/A Phase 1, no mutations). Verified against BGG XML API2 wiki + graphql-ruby docs.
- **Context7 /elmassimo/vite_ruby** — `sourceCodeDir` override in `config/vite.json`, `skipProxy` option (experimental, v3.2.12+), `bin/vite dev`, `vite-plugin-rails` in `vite.config.ts`. [CITED]
- **Context7 /rmosolgo/graphql-ruby** — `rails generate graphql:install`, class-based schema, `GraphQL::Dataloader`, `Schema.multiplex` for Apollo batch (`params[:_json]`), `max_depth`/`max_complexity`/`disable_introspection_entry_points`. [CITED]
- **npm registry (verified 2026-07-01)** — Vite 8.0.10 `engines: { node: "^20.19.0 || >=22.12.0" }`, @vitejs/plugin-vue 6.0.7 `peerDependencies` (Vite 5-8, Vue 3.2.25+), @apollo/client 3.13.9 `peerDependencies` (graphql 15-16), @vue/apollo-composable 4.2.2 `peerDependencies`, @tailwindcss/vite 4.3.0 `peerDependencies` (Vite 5-8), @graphql-codegen/cli 7.1.3 `engines: { node: ">=16" }`.

### Secondary (MEDIUM confidence)
- **dotenvx.com + github.com/dotenvx/dotenvx** — dotenvx CLI usage (`encrypt`, `run`, `get`), `DOTENV_PRIVATE_KEY` / `DOTENV_PRIVATE_KEY_BGGEEK` naming convention, encryption mechanism (secp256k1 public-key crypto). [CITED — official dotenvx docs]
- **bkeepers/dotenv (RubyGems)** — dotenv-rails `Dotenv.require_keys` fail-fast helper, `Dotenv::Rails.files` customization. dotenv-rails does NOT support `encrypted:`-prefixed values natively (confirms D-03 needs dotenvx CLI or custom loader). [CITED]

### Tertiary (LOW confidence)
- None — all findings trace to STACK.md (verified), Context7 (official docs), npm registry (tool output), or dotenvx official docs.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all versions verified via STACK.md (which cross-checked RubyGems + npm + Context7 on 2026-07-01) and re-verified in this session via npm registry peer-deps/engines queries.
- Architecture: HIGH — ARCHITECTURE.md is comprehensive and was verified against Context7 (vite_ruby, graphql-ruby) + 5 real-world examples. Re-verified vite_rails config + graphql-ruby multiplex via Context7 in this session.
- Pitfalls: HIGH — PITFALLS.md is detailed and verified. Phase-1-relevant pitfalls (#9 rack-cors/skipProxy, #10 single-deploy, security/introspection) confirmed against Context7 and npm registry (Vite 8 Node requirement).
- dotenvx integration: MEDIUM — dotenvx official docs confirm the CLI approach, but long-running Rails process stability with `dotenvx run` wrapper is unverified in this session (A3 assumption). Planning discretion per CONTEXT.md.

**Research date:** 2026-07-01
**Valid until:** 2026-07-31 (30 days — stable stack, no fast-moving dependencies in Phase 1 scope)
