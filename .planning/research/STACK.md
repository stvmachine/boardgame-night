# Stack Research

**Domain:** Rails 8 API-only + Vue 3 SPA monorepo, GraphQL API, BoardGameGeek XML API v2 integration, dry-validation, Solid Queue/Cache, friend groups + boardgame-night sessions
**Researched:** 2026-07-01
**Confidence:** HIGH (every gem/package version below was verified against RubyGems.org, npm registry, or official docs/Context7 on 2026-07-01 — not training data)

## Recommended Stack

This stack is the concrete, version-pinned instantiation of the architecture in `ARCHITECTURE.md` and is chosen to mitigate every pitfall in `PITFALLS.md`. It is a **Rails 8.1 single-deploy monorepo** with a Vue 3 SPA co-located via vite-ruby, GraphQL via graphql-ruby (Dataloader), dry-validation contracts, Solid Queue/Cache (no Redis), Faraday+Nokogiri as the sole BGG egress, and Kamal 2 for atomic deploys.

### Core Framework (Ruby / Rails)

| Technology | Version | Purpose | Why Recommended | Confidence |
|------------|---------|---------|-----------------|------------|
| **Ruby** | **3.4.10** (2026-06-30) | Language runtime | Latest 3.4 patch. Rails 8.1's *recommended* Ruby is `3.4.Z` (FastRuby compatibility table + Rails upgrading guide). Pin via rbenv (`.ruby-version`). Ruby 4.0.5 is "current stable" but is brand-new (early 2026) and **Rails 8.1 officially recommends 3.4** — adopting 4.0 risks gem-compat surprises on a greenfield. Stay on 3.4.10; revisit 4.x when Rails 9 blesses it. | HIGH |
| **Rails** | **8.1.3** (2026-03-24) | API-only web framework + GraphQL host + SPA shell server | Latest 8.1 stable. Bug-fix support until Oct 2026, security until Oct 2027. 8.0.5 exists but the 8.0 series drops to security-only in May 2026 — for a greenfield in July 2026, start on 8.1. Ships Solid Queue + Solid Cache + Kamal 2 + Solid Cable + a production Dockerfile by default; `--api` gives the API-only base PROJECT.md requires. Required Ruby ≥ 3.2.0. | HIGH |
| **Puma** | **8.0.2** (2026-05-26) | Rails webserver | Rails 8 default. Required Ruby ≥ 3.0. Single-process + worker threads is plenty for v1 single-VPS; scale by adding workers in `config/puma.rb`. | HIGH |
| **graphql-ruby** (`graphql` gem) | **2.6.3** (2026-05-26) | GraphQL server: class-based schema, `GraphQL::Dataloader`, `max_complexity`, multiplex | The Ruby GraphQL standard. `use GraphQL::Dataloader` is built-in (fiber-based, the official path forward — **prefer over `graphql-batch`**, which is promise-based and now legacy). `rails generate graphql:install` scaffolds `app/graphql/` + adds `graphiql-rails` for dev. Required Ruby ≥ 2.7.0; works on Rails 8.1. (Note: 2.6.4 was released 2026-06-22 then **yanked** — use 2.6.3.) | HIGH |
| **graphql-batch** | — (do NOT use) | — | Superseded by `GraphQL::Dataloader` (in `ARCHITECTURE.md` Pattern 1). `graphql-batch` is still a dev-dep of graphql-ruby but Dataloader is the recommended N+1 solution for new apps. Only consider `graphql-batch` if you must batch outside GraphQL execution (you don't). | HIGH |

### Database & Persistence

| Technology | Version | Purpose | Why Recommended | Confidence |
|------------|---------|---------|-----------------|------------|
| **SQLite** (production, v1) | Rails 8 default (`sqlite3` gem, latest `~> 2.x`) | Primary DB for app + Solid Queue + Solid Cache (3 files in `storage/`) | Rails 8's default and the correct choice for a single-user friend-group app on one VPS. Three separate DBs (app, queue, cache) via Rails multi-DB — avoids the autovacuum-storm pitfall (PITFALLS.md "Solid Queue polling on shared Postgres database"). Zero ops. Good enough for the 0–1k users tier. | HIGH |
| **PostgreSQL** (production, scaling tier) | `pg` gem `~> 1.5` | Upgrade path when load grows | Switch when: concurrent users > ~1k, you want `pg_trgm`/full-text search for game collections (FEATURES.md notes Fuse.js client-side search breaks >300 games → move search server-side), or you run separate Solid Queue workers under load. One Postgres, three schemas (app/queue/cache) is the clean upgrade. **Not needed for v1 launch.** | MEDIUM |

**DB decision rationale:** Start SQLite (Rails 8 default, zero-ops, 3-file split). The BGG rate limit (1 req/5s) is the real bottleneck long before the DB — persisting collections turns multi-user merges into pure DB queries, so even SQLite handles a 10-friend × 200-game group instantly. Move to Postgres only at the 1k+ tier or when server-side fuzzy search is needed. This directly follows ARCHITECTURE.md's scaling table.

### BGG Integration (the sole egress to boardgamegeek.com)

| Technology | Version | Purpose | Why Recommended | Confidence |
|------------|---------|---------|-----------------|------------|
| **Faraday** | **2.14.3** (2026-06-16) | HTTP client for BGG XML API v2 | The idiomatic Ruby HTTP client with a middleware stack — exactly what the BGG integration needs: `f.request :retry` (exp backoff on 502/503/429), `f.response :raise_error`, timeouts, custom `User-Agent`. Composes cleanly with the `Bgg::RateLimiter` and `Bgg::Client` in ARCHITECTURE.md Pattern 3. Required Ruby ≥ 3.0. | HIGH |
| **Nokogiri** | **1.19.4** (2026-06-18) | XML parsing for BGG responses | The only sane way to parse BGG's inconsistent XML (PITFALLS.md #4 — arrays-vs-single-objects, mixed `name` content, missing fields). Use CSS selectors / XPath, **never regex**. 1.19.0 added native gem support for Ruby 4.0; required Ruby ≥ 3.2. Ships precompiled native gems (fast install, no system libxml2 build). | HIGH |
| **dotenv-rails** | **3.2.0** (2025-12-03) | Load BGG token from `.env.bggeek` | PROJECT.md mandates `.env.bggeek` for BGG credentials. dotenv-rails is the standard; load the specific file via `Dotenv.load('.env.bggeek')` in an initializer (keeps it out of the default `.env` so it's clearly BGG-scoped and gitignored). Rails 8 has no built-in `.env` loader, so this gem is required. | HIGH |

**Why Faraday over HTTParty:** Faraday's middleware pipeline maps 1:1 onto the BGG client's needs (retry, raise_error, rate-limit injection, caching hook). HTTParty is simpler but has no first-class retry middleware — you'd hand-roll the retry/backoff that Faraday gives declaratively. The reference Node proxy's `makeRequest` retry logic (`[1000,2000,4000]` ms, `MAX_RETRIES=3`) translates directly into a Faraday `:retry` middleware config. Faraday also makes the **202-queued retry** (PITFALLS.md #3) a custom middleware instead of tangled control flow.

### Frontend Build & Framework

| Technology | Version | Purpose | Why Recommended | Confidence |
|------------|---------|---------|-----------------|------------|
| **Vue** | **3.5.35** (2026-05-27) | SPA framework | Latest stable 3.5. 3.5 reworked reactivity (version counting + doubly-linked deps → faster computed, lower memory), stabilized `useId`, reactive prop destructure, `useTemplateRef`. Use `<script setup>` + Composition API exclusively (matches ARCHITECTURE.md). 3.6 is in beta — stay on 3.5.35. | HIGH |
| **vite_rails** (gem) | **3.11.0** (2026-05-05) | Rails↔Vite integration; serves SPA from `public/` in prod, proxies to Vite dev server in dev | The canonical Rails+Vite monorepo integration (ARCHITECTURE.md). `gem 'vite_rails'` + `bundle exec vite install`. Default `sourceCodeDir` is `app/javascript` — **override to `app/frontend`** in `config/vite.json` per ARCHITECTURE.md. Provides `vite_asset_path`/`vite_stylesheet_tag` helpers for the SPA shell view. | HIGH |
| **Vite** | **8.x** (latest `8.0.10`) | Frontend dev server + bundler | vite_rails 3.11.0 upgraded to **Vite 8 (Rolldown + Oxc engine)** — the current Vite generation. Instant dev server, HMR, optimized prod build to `public/`. ⚠️ **Research flag:** Vite 8 is the Rolldown-based rewrite (new in 2026); if any tooling (Vitest, codegen) shows compat issues, fall back to **vite_rails 3.10.0 + Vite 6** (conservative, fully mature). | MEDIUM |
| **@vitejs/plugin-vue** | **6.0.7** (2026-05-15) | Vue SFC support in Vite | Official plugin. Peers: `vite ^5||^6||^7||^8`, `vue ^3.2.25` — confirmed Vite 8 + Vue 3.5.35 compatible. Drop Options API via `features.optionsAPI: false` for smaller prod bundles (we use Composition API only). | HIGH |
| **vue-router** | **5.1.0** (latest) | SPA routing + permalink hydration | Vue Router 5 is the current major for Vue 3.5. Powers the permalink routes (`/u/:usernames`, `/g/:token`, `/s/:id`) from ARCHITECTURE.md + FEATURES.md. Lazy-load route components. | HIGH |
| **TypeScript** | **~5.9** (latest stable 5.x) | Type safety for the Vue SPA | Pin `~5.9` — full toolchain support (vue-tsc/Volar, typescript-eslint, graphql-codegen). TS 6.0.3 is the absolute latest but is very new; adopt 6.x only after verifying vue-tsc + typescript-eslint support. v1 used TS 5.7. | MEDIUM |
| **@vitejs/plugin-vue** + `vue-tsc` | `vue-tsc` latest | Type-checking for SFCs | Run `vue-tsc --noEmit` in CI for SFC type safety. | MEDIUM |

### Vue Data Layer (GraphQL client)

This is the **single most consequential frontend decision** and has a genuine 2026 compatibility constraint — read carefully.

| Technology | Version | Purpose | Why Recommended | Confidence |
|------------|---------|---------|-----------------|------------|
| **@apollo/client** | **^3.13.9** (last 3.x, 2025-07) | GraphQL client + normalized `InMemoryCache` + `HttpLink` + batch link | **Recommended (ship-now) path.** `@vue/apollo-composable@4.2.2` (the Vue 3 binding) is **incompatible with @apollo/client v4** (confirmed: vuejs/apollo issue #1597; a v4 rewrite is committed but only released as `@next` beta, PR #1609 not yet stable). So for a reliable v1 launch on Vue 3, use the **known-good Apollo 3.13.x + @vue/apollo-composable 4.2.2** combo. You keep everything ARCHITECTURE.md wanted: normalized cache (entities sync across views), `HttpLink`→`/graphql`, batch link → `Schema.multiplex`, `cache-and-network`/`cache-first` policies. Pair with `graphql ^16.11.0`. | HIGH |
| **@vue/apollo-composable** | **4.2.2** (2025-03-11) | Vue 3 Composition API binding for Apollo (`useQuery`/`useMutation`/`useSubscription`) | The stable Vue 3 binding. `provide(DefaultApolloClient, apolloClient)` in `application.js`. Works with `@apollo/client 3.13.x` + Vue 3.5 (don't install `@vue/composition-api` — it's optional and causes peer conflicts, issue #1535). | HIGH |
| **graphql** (graphql-js, browser) | **^16.11.0** | `gql` tag + query execution for Apollo 3.x | Apollo 3.13.x peer-deps `graphql ^16` (NOT 17). graphql-js 17.0.1 exists but is only validated for @apollo/client 4.x. Pin 16.x to match the Apollo 3.13 path. (Server-side graphql-ruby is independent of this.) | HIGH |
| **@graphql-codegen/cli** | **^7.1.3** (latest) | Generate TS types + Vue Apollo composables from the Rails schema | Monorepo contract guarantee (PITFALLS.md #10): `rails graphql:schema:dump` → `schema.graphql` committed → codegen produces typed `useXxxQuery` composables. Use `@graphql-codegen/typescript-vue-apollo` (codegen 7-compatible). Fails CI if schema + queries drift. | MEDIUM |

**🚩 Research flag — Apollo 4 migration (defer to a later phase):** Apollo Client **4.2.3** is current (framework-agnostic, supports graphql 17), but the Vue 3 binding (`@vue/apollo-composable` v5) is **still beta** as of mid-2026. Do **NOT** adopt Apollo 4 + Vue on day one. Plan a migration phase once `@vue/apollo-composable@5.0.0` ships stable. Until then, Apollo 3.13.x is the pragmatic, normalized-cache, ships-now choice.

**Alternative (recommended if you want to avoid the Apollo-3.x-legacy-major concern):** **urql `@urql/vue ^2.1.1`** — purpose-built for Vue, stable, supports graphql 16, lighter than Apollo, normalized cache via `@urql/exchange-graphcache`, batch + dedup exchanges. No Apollo-4-beta exposure, no previous-major dependency. ARCHITECTURE.md leaned Apollo (team familiarity from the React v1); if that familiarity weight is low, urql is the lower-risk Vue-native pick. **Choose Apollo 3.13.x if** you want the same mental model as v1 + the richest cache tooling; **choose urql if** you prioritize a Vue-native, currently-maintained major.

### Vue State, Search & Styling

| Technology | Version | Purpose | Why Recommended | Confidence |
|------------|---------|---------|-----------------|------------|
| **Pinia** | **3.0.4** (latest) | UI/session-draft state ONLY (filters, sidebar, draft session) | The Vue 3 state store. **Strict rule (ARCHITECTURE.md Anti-Pattern 4):** Pinia holds UI-only state — **never** a duplicate of server data. Apollo's normalized cache is the sole source of server data. Use setup stores: `defineStore('filters', () => { const query = ref(''); … })`. | HIGH |
| **Fuse.js** | **^7.4.2** (latest 7.x) | Client-side fuzzy search over the merged collection | v1 used Fuse.js 7.1.0 (keys: `name`, `name.text`, `originalname`, threshold 0.3, 300ms debounce) — preserve config for parity (FEATURES.md). ⚠️ PITFALLS.md: Fuse.js client-side breaks >300 games; when collections grow, move to Postgres `pg_trgm`/FTS via GraphQL. For v1 friend groups it's fine. | HIGH |
| **@vueuse/core** | **^14.3.0** (latest) | Composition utilities (`useDebounce`, `useFuse`, `useStorage`, `useEventListener`) | Vue 3 standard utility lib. `useFuse` wraps Fuse.js reactively; `useDebounce` for the 300ms search debounce; `useStorage` for persisting filter state. Replaces hand-rolled composables from v1. | MEDIUM |
| **Tailwind CSS** | **^4.3** (`tailwindcss` + `@tailwindcss/vite` ^4.3) | Utility-first styling for the Vue 3 SPA | v1 used Chakra UI (React-only) — the Vue 3 rewrite needs a new styling approach. Tailwind v4 is the 2026 standard: CSS-first config (no `tailwind.config.js` required), `@tailwindcss/vite` plugin (zero-runtime, build-time), `@import "tailwindcss"` in `entrypoints/styles.css`. Pairs cleanly with Vite 8. Responsive utilities map directly to v1's mobile-drawer/desktop-sidebar layout. | HIGH |

**Why Tailwind v4 over UnoCSS:** Tailwind v4 is the default, best-documented, zero-config-with-Vite choice with the largest ecosystem and the exact responsive utilities v1's layout needs. UnoCSS is faster and more flexible but has a smaller ecosystem and more config churn — the perf difference is irrelevant for a SPA of this size. Pick Tailwind v4 for predictability; revisit UnoCSS only if build speed becomes an issue (it won't).

### Background Jobs & Caching (no Redis — Rails 8 Solid trifecta)

| Technology | Version | Purpose | Why Recommended | Confidence |
|------------|---------|---------|-----------------|------------|
| **Solid Queue** | **1.4.0** (2026-03-20) | DB-backed Active Job backend for BGG import/refresh jobs | Rails 8 default (preconfigured in new apps; `bundle add solid_queue` + `bin/rails solid_queue:install` if adding manually). **No Redis.** Supports delayed jobs, recurring (cron) jobs, numeric priorities, and — critically for BGG — **concurrency controls**: `limits_concurrency to: 1, key: "bgg_api"` enforces max-1 BGG job at a time (ARCHITECTURE.md Pattern 3, PITFALLS.md #2). Uses `FOR UPDATE SKIP LOCKED` on Postgres, polling on SQLite. Required Ruby ≥ 3.1. | HIGH |
| **Solid Cache** | **1.0.10** (2025-11-08) | DB-backed `Rails.cache` for BGG response cache + rate-limit mutex | Rails 8 default. Backs the `Bgg::RateLimiter`'s `bgg:last_request_at` timestamp key (1 req/5s **across all workers**) and the per-endpoint BGG response cache (thing=1h, collection=30m, hot=24h, search=30m, user=1h per ARCHITECTURE.md). No Redis. Configure separate DB via `connects_to` to keep cache churn off the app DB. | HIGH |

**⚠️ Critical pitfall mitigation (PITFALLS.md #7):** Solid Queue has **NO automatic retries** (unlike Sidekiq's 25 retries). Every BGG job **must** declare `retry_on` explicitly:
```ruby
class Bgg::ImportCollectionJob < ApplicationJob
  limits_concurrency to: 1, key: "bgg_api", duration: 5.minutes
  retry_on Bgg::RateLimitError,   wait: :polynomially_longer, attempts: 5   # ~3s,18s,83s,258s…
  retry_on Faraday::TimeoutError, wait: 10.seconds, attempts: 3
  retry_on Faraday::ConnectionFailed, wait: 5.seconds, attempts: 3
  discard_on Bgg::NotFoundError                                          # don't retry 404s
end
```
Keep retry logic in the Faraday client too (defense in depth — the 502/503/429 exp-backoff is the first line; `retry_on` is the second). Monitor via **Mission Control — Jobs** (Solid Queue's dashboard).

### Testing

| Technology | Version | Purpose | Why Recommended | Confidence |
|------------|---------|---------|-----------------|------------|
| **RSpec** (`rspec-rails`) | **8.0.4** (2026-03-11) | Rails backend tests (models, services, contracts, jobs, graphql) | The Rails testing standard. **8.x is the line for Rails 8.x/7.2** (rspec-rails README versioning strategy). Required Ruby ≥ 3.0. Test the BGG client with **XML fixtures ported from the reference proxy** (`stevmachine_collection.xml` etc. — PITFALLS.md #4). | HIGH |
| **Vitest** | **^3.2.6** (2026-06-01) | Vue 3 unit/component tests | v1 used Vitest; preserve. Vitest 3.2.6 is the mature stable line (Vitest 4.1.9 and a 5.0 beta exist — 3.2.6 is the safe pin). Uses the same Vite pipeline as the app. ⚠️ Verify Vite 8 compat at phase 1; if issues, hold Vite at 7 or move to Vitest 4.x. Pair with `@vue/test-utils` + `@testing-library/vue` + `jsdom`. | MEDIUM |
| **Playwright** (`@playwright/test`) | **^1.61.1** (latest) | E2E tests (collection merge flow, permalink routes, session lifecycle) | v1 used Playwright (11 `.spec.ts` files — PITFALLS.md R2: review them for what was fragile). Cross-browser, reliable for the SPA-over-GraphQL flow. Pin `^1.61.1` (v1 used 1.55.1). | HIGH |

### Deployment & Infrastructure

| Technology | Version | Purpose | Why Recommended | Confidence |
|------------|---------|---------|-----------------|------------|
| **Kamal** | **2.12.0** (2026-06-18) | Atomic, zero-downtime Docker deploys to a VPS | Rails 8 default deploy tool. Builds one Docker image (Rails + compiled Vue in `public/`), pushes to registry, Kamal Proxy health-checks + swaps traffic. **Single container = atomic frontend+backend deploy** (PITFALLS.md #10). Requires `kamal-proxy ≥ 0.9.2` (run `kamal proxy reboot`). `config/deploy.yml` is generated by `rails new` in Rails 8. | HIGH |
| **Docker** | (Rails 8 generated `Dockerfile`) | Container image | Rails 8 ships a multi-stage production Dockerfile. `bin/vite build` runs in the build stage → Vue output lands in `public/` → one image serves SPA + `/graphql`. Image ~250–350MB. | HIGH |

### Development Tools

| Tool | Version | Purpose | Notes |
|------|---------|---------|-------|
| **rack-cors** | **3.0.0** (2025-05-16) | Allow `localhost:5173` (Vite dev) → `localhost:3000` (Rails) GraphQL in dev | **Dev-only** (PITFALLS.md #9). In production the SPA is same-origin (served from `public/` by Rails) → no CORS. Configure in `config/initializers/cors.rb` gated on `Rails.env.development?`. |
| **bullet** | **8.1.3** (2026-06-02) | Detect N+1 queries in dev/test | Catches missing `includes(:bgg_thing)` in `Collections::Merge` (PITFALLS.md perf traps). Enable in `development` + `test` envs. |
| **graphiql-rails** | **1.10.5** (2025-05-16) | In-browser GraphQL explorer (dev) | Added by `rails g graphql:install`. Dev-only. Last release ~14 months old but still the standard Rails GraphQL explorer; if it bit-rots, switch to the standalone GraphiQL or Apollo Sandbox mounted at `/graphiql`. **Disable introspection in production** (PITFALLS.md security: `GraphQL::Schema.disable_introspection_entry_points` when `Rails.env.production?`). |
| **dotenv-rails** | **3.2.0** (2025-12-03) | Load `.env.bggeek` | See BGG Integration section. |
| **vite_rails dev server** | (vite_rails 3.11.0) | HMR for Vue | `bin/vite dev` → Vite dev server. Set `skipProxy: true` in `config/vite.json` for faster HMR (PITFALLS.md #9); route `/graphql` to Rails via Vite's `server.proxy` in `vite.config.ts`. |

### Code Quality

| Tool | Version | Purpose | Notes |
|------|---------|---------|-------|
| **RuboCop** | **1.88.0** (2026-06-16) | Ruby lint/style | Pair with **rubocop-rails 2.35.5** (2026-06-21, requires rubocop ≥ 1.75) + **rubocop-rspec 3.10.2** (2026-06-06). ⚠️ rubocop-rspec 3.x **extracted** the Rails/Capybara/FactoryBot cops into separate gems (`rubocop-rspec_rails`, `rubocop-capybara`, `rubocop-factory_bot`) — add the ones you use to `.rubocop.yml` `require:`. |
| **ESLint** | **^9.x** (flat config) | JS/TS lint | v1 used 9.35.0. Use flat config (`eslint.config.js`). Pair with **typescript-eslint ^8.x** (v1 used 8.44) + `eslint-plugin-vue` (Vue-specific rules) + `prettier` (via `eslint-config-prettier`). |
| **Prettier** | **^3.x** | Code formatting | v1 used 3.6.2. Pair with `eslint-config-prettier` to disable conflicting ESLint rules. |

### Authentication

| Technology | Version | Purpose | Why Recommended | Confidence |
|------------|---------|---------|-----------------|------------|
| **bcrypt** | **3.1.22** (2026-03-18) | Password hashing for `has_secure_password` | **Recommended: Rails built-in `has_secure_password` + bcrypt** for email/password auth. This is the minimal, API-friendly, Rails-8-idiomatic base for friend-group accounts (FEATURES.md MVP: "minimal email/password or magic-link login"). No controller/view bloat, works cleanly with an API-only + Vue setup (issue a signed session token / JWT). | HIGH |
| **Magic-link invites** | hand-rolled (signed token) | No-account RSVP for invited friends (FEATURES.md differentiator) | Implement with `ActiveSupport::MessageVerifier`/`MessageEncryptor` signed tokens (no extra gem). The invite flow in FEATURES.md ("RSVP without creating an account") is a signed-link → provisional profile → optional upgrade to account. A gem isn't warranted. | MEDIUM |

**Why NOT Devise / authlogic:**
- **Devise:** Overkill for this scope. It ships a full set of controllers/views/registrations that fight an **API-only + Vue** architecture (you'd disable most of it). It's opinionated about sessions/flash/responders that an API-only app doesn't use. Brings ~15 dependencies. Worth it only for a traditional server-rendered Rails app with complex auth flows — not a GraphQL API consumed by a Vue SPA.
- **authlogic:** Older, less actively maintained, fewer Rails-8-era integrations. No advantage over `has_secure_password` for this scope.

PROJECT.md explicitly scopes **OAuth against BGG out** (the BGG token is read from `.env.bggeek` server-side). So auth is purely for the app's own friend-group accounts — `has_secure_password` + bcrypt + signed magic-link tokens is the right-sized solution.

## Alternatives Considered

| Category | Recommended | Alternative | When to Use Alternative |
|----------|-------------|-------------|-------------------------|
| Ruby | **3.4.10** | Ruby 4.0.5 (current stable) | Only after Rails 9 + the full gem ecosystem (and your team) bless Ruby 4. For a greenfield shipping in 2026, 3.4.10 is Rails 8.1's recommended version and avoids new-major risk. |
| Rails | **8.1.3** | Rails 8.0.5 / Rails 7.2 | 8.0 if a specific 8.1 regression bites you (8.0 is security-only after May 2026). 7.2 only if maintaining an existing app — never for greenfield in 2026. |
| GraphQL N+1 batching | **GraphQL::Dataloader** (built-in) | `graphql-batch` (Shopify) | Only if you need batching *outside* GraphQL execution. Dataloader is fiber-based, modern, and the official graphql-ruby recommendation. |
| Validation | **dry-validation + dry-rails** | Rails Strong Parameters | Strong params only for trivial controller-shape filtering — but **never mix the two** (PITFALLS.md #8). Contracts own domain rules; the app uses contracts everywhere. |
| Jobs | **Solid Queue** | Sidekiq + Redis | Only at the 100k+ tier if you need Sidekiq's richer retry/UI, or if you add Redis for another reason. Rails 8's whole point is no-Redis-by-default; don't reintroduce it for v1. |
| Cache | **Solid Cache** | Redis (`redis-rails`) | Only if Solid Cache write contention on the rate-limiter key causes BGG 429s at scale (1k+ tier) — and even then, swap just the rate-limiter backend, not all caching. |
| DB (v1) | **SQLite** (3 files) | PostgreSQL | Postgres from day 1 only if you know you'll need `pg_trgm`/FTS server-side search or expect >1k concurrent users immediately. For v1, SQLite is zero-ops and sufficient. |
| HTTP client | **Faraday 2.14** | HTTParty | HTTParty if you want zero middleware abstraction — but you'd hand-roll the retry/backoff Faraday gives declaratively. Faraday's middleware maps 1:1 to the BGG client design. |
| XML parsing | **Nokogiri** | regex / `rexml` | None. Nokogiri is the only sane choice for BGG's inconsistent XML (PITFALLS.md #4). Never regex. |
| Vue GraphQL client | **@apollo/client 3.13 + @vue/apollo-composable 4.2.2** | urql `@urql/vue 2.1.1` / Apollo 4 + composable v5 beta | urql if you want a Vue-native, currently-maintained major with no legacy-major concern. Apollo 4 **only after** `@vue/apollo-composable@5.0` ships stable (it's beta today). |
| State (server data) | **Apollo `InMemoryCache`** (normalized) | Pinia for server data | **Never** duplicate server data in Pinia (ARCHITECTURE.md Anti-Pattern 4). Pinia = UI/draft state only. |
| Search | **Fuse.js 7.4** (client) | Postgres `pg_trgm`/FTS (server) | Move server-side when shared collections exceed ~300 games (PITFALLS.md perf trap). v1 friend groups are fine client-side. |
| Styling | **Tailwind CSS v4** | UnoCSS | UnoCSS if build speed or atomic-config flexibility matters more than ecosystem/predictability. For this SPA, Tailwind v4 + `@tailwindcss/vite` is the lower-friction default. |
| Auth | **`has_secure_password` + bcrypt + signed magic-links** | Devise / authlogic | Devise only for a server-rendered app with complex auth flows (not API-only + Vue). authlogic: no advantage, less maintained. |
| Deploy | **Kamal 2** (single container) | Two-container (Nginx + Rails) / Kubernetes | Two deploys only if the frontend must scale independently (it won't for this app — PITFALLS.md Anti-Pattern in ARCHITECTURE.md #5). K8s is overkill for a single-VPS friend app. |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| **Redis (Sidekiq / redis-rack-cache)** | Reintroduces an external service to operate/monitor/back up for an app where DB-backed Solid Queue/Cache are fast enough. The "Rails apps need Redis" reflex is the single most-cited Rails 8 anti-pattern (ARCHITECTURE.md Anti-Pattern 2). | Solid Queue + Solid Cache. Add Redis *only* for the rate-limiter at the 1k+ tier, if ever. |
| **`graphql-batch`** | Promise-based, legacy. Dataloader is the modern, fiber-based, built-in replacement and the official graphql-ruby path. | `GraphQL::Dataloader` + `GraphQL::Dataloader::Source` loaders in `app/graphql/loaders/`. |
| **@apollo/client v4 + @vue/apollo-composable (stable)** | The Vue 3 binding is **incompatible** with Apollo 4 today (issue #1597); the v4-compatible binding is beta-only. Adopting it on day one risks a broken data layer. | @apollo/client 3.13.9 + @vue/apollo-composable 4.2.2 (stable), or urql. Revisit Apollo 4 once the Vue binding 5.0 is stable. |
| **graphql-js v17 with Apollo 3.x** | Apollo 3.13.x peer-deps `graphql ^16`, not 17. graphql 17 only validated for Apollo 4. | `graphql ^16.11.0` on the browser side (server graphql-ruby is independent). |
| **Devise** | Full-stack auth engine that fights API-only + Vue (controllers/views/flash you'd disable). Over-engineered for friend-group accounts + magic-link invites. | `has_secure_password` + bcrypt 3.1.22 + signed `ActiveSupport::MessageVerifier` tokens. |
| **Strong Parameters + dry-validation mixed** | Two validation layers fight (strong_params strips keys the contract expects; no coercion). PITFALLS.md #8. | dry-validation contracts (via dry-rails) as the single input-validation boundary; graphql-ruby handles its own arg shape. |
| **Chakra UI** | React-only; v1 used it but the Vue 3 rewrite can't. | Tailwind CSS v4. |
| **Synchronous BGG fetches in GraphQL resolvers** | 5 users × 2 calls × 5s = 50s blocked request; BGG 429/503 storms. ARCHITECTURE.md Anti-Pattern 1. | Persist collections; resolvers read DB; `importCollection` mutation → Solid Queue job (concurrency: 1). |
| **`subtype=boardgame` alone for collections** | BGG bug: expansions come back mislabeled as base games. PITFALLS.md #1. | Two-call workaround (`excludesubtype=boardgameexpansion` + `subtype=boardgameexpansion`, then merge) — port from the reference proxy. |
| **Treating BGG HTTP 202 as 200** | Empty collection returned; user sees "no games." PITFALLS.md #3. | Check status before parsing; retry 202 with delay (≤5×); return a `QUEUED`/`PREPARING` status to the frontend. |
| **Regex/string-splitting BGG XML** | BGG XML has namespaces, mixed content, optional fields — regex can't handle reliably. PITFALLS.md #4. | Nokogiri CSS/XPath with nil-safe field access (`node.at_css("yearpublished")&.[]("value")`). |
| **GraphQL introspection enabled in production** | Exposes the entire schema to attackers. PITFALLS.md security. | `disable_introspection_entry_points` in production. |
| **Two separate deploys (Nginx frontend + Rails API)** | Doubles ops surface (CORS, two TLS, two health checks) for zero benefit at this scale. | One Kamal 2 container: Rails serves SPA (`public/`) + `/graphql`. |
| **Replicating the old proxy's Node-specific workarounds** | Redis keepalive cron, Apollo `RESTDataSource` caching, Vercel cold-start mitigation — solve Node/serverless problems Rails doesn't have. PITFALLS.md R1. | Rails caching (`Rails.cache`) + Solid Cache; Faraday middleware. Do port: rate limiter, expansion workaround, XML normalizer, retry logic. |

## Stack Patterns by Variant

**If Vite 8 (Rolldown) causes tooling friction in Phase 1:**
- Drop to **vite_rails 3.10.0 + Vite 6 + @vitejs/plugin-vue 5.2.x + Vitest 3.2.6** (the conservative, fully-mature combo).
- Because Vite 8 is a 2026 Rolldown-engine rewrite; the testing/codegen ecosystem may lag. Vite 6 is battle-tested and loses nothing functional for this SPA.

**If shared collections grow past ~300 games and Fuse.js search gets sluggish:**
- Move search server-side: Postgres + `pg_trgm` (trigram) or FTS, exposed via a `search` GraphQL query.
- Because PITFALLS.md flags client-side Fuse.js as a perf trap at scale. For v1 friend groups (3–10 users, ~200 games each, deduped) it's fine.

**If you want to avoid the Apollo-3.x-legacy-major concern entirely:**
- Use **urql `@urql/vue 2.1.1`** + `@urql/exchange-graphcache` (normalized cache) + `@urql/exchange-batch` + `graphql ^16`.
- Because urql is Vue-native, on a currently-maintained major, and has no Apollo-4-Vue-beta exposure. You lose some Apollo ecosystem tooling (devtools, rich cache APIs) but gain a lighter, future-proof client.

**If BGG rate-limit write contention on Solid Cache causes 429s at the 1k+ tier:**
- Swap `Bgg::RateLimiter`'s backend to Redis (MX mutex) — keep Solid Queue + Solid Cache for everything else.
- Because the rate-limiter is the one place a DB-backed compare-and-set can race under high concurrency. The `Bgg::RateLimiter` interface stays unchanged.

**If you outgrow SQLite before expected:**
- Migrate to Postgres (one DB, three schemas: app/queue/cache) — `pg` gem, update `database.yml`.
- Because Postgres gives `pg_trgm`/FTS for server-side search, `FOR UPDATE SKIP LOCKED` for Solid Queue efficiency, and read replicas. The 3-DB split moves to 3 schemas.

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| **Rails 8.1.3** | Ruby **≥ 3.2.0**, recommended **3.4.Z** | Verified via Rails upgrading guide + FastRuby table. Ruby 4.0 not yet recommended by Rails. |
| **graphql 2.6.3** | Rails 8.1, Ruby ≥ 2.7.0 | `rails g graphql:install` scaffolds the schema. Use `GraphQL::Dataloader` (built-in). 2.6.4 was yanked — pin 2.6.3. |
| **dry-rails 0.7.0** | dry-validation `~> 1.5` (→ 1.11.1 ✓), dry-schema `~> 1.7` (→ 1.16.0 ✓), dry-system `~> 1.0 < 2` | dry-rails is technically 0.x but is the official dry-rb Rails integration providing `ApplicationContract`/`safe_params`/`Container`/`Deps`. The 1.16.0 dry-schema + 1.11.1 dry-validation combo satisfies its constraints. |
| **Solid Queue 1.4.0** | Rails 8 (preconfigured), Ruby ≥ 3.1, SQLite or Postgres | Use `limits_concurrency` + explicit `retry_on` (no auto-retry). |
| **Solid Cache 1.0.10** | Rails 8 (preconfigured) | Use a separate DB/schema via `connects_to` to isolate cache churn. |
| **Faraday 2.14.3** | Ruby ≥ 3.0 | `faraday-retry` middleware for exp backoff; pair with Nokogiri for BGG. |
| **Nokogiri 1.19.4** | Ruby ≥ 3.2 (native gems for 3.2/3.3/3.4/4.0) | Precompiled native gems — no system libxml2 build. |
| **vite_rails 3.11.0** | **Vite 8** (Rolldown), Rails 8 | Override `sourceCodeDir` to `app/frontend`. Fallback: 3.10.0 + Vite 6. |
| **@vitejs/plugin-vue 6.0.7** | Vite ^5/^6/^7/^8, Vue ^3.2.25 | Confirmed Vite 8 + Vue 3.5.35. |
| **Vue 3.5.35** | vue-router 5.1.0, Pinia 3.0.4, @vueuse/core 14.3.0, @vue/apollo-composable 4.2.2 | All Vue 3.5-compatible. Use `<script setup>` only. |
| **@apollo/client 3.13.9** | **@vue/apollo-composable 4.2.2**, **graphql ^16** | ⚠️ NOT compatible with @vue/apollo-composable + Apollo 4 (binding is beta). NOT graphql 17. |
| **@vue/apollo-composable 4.2.2** | @apollo/client 3.x, Vue 3 (don't install @vue/composition-api) | Don't upgrade to @apollo/client 4 until composable v5 is stable. |
| **urql @urql/vue 2.1.1** | Vue ^2.7/^3, graphql ^0.11..^16 | Vue-native alternative; normalized cache via @urql/exchange-graphcache. |
| **Tailwind CSS v4.3 + @tailwindcss/vite** | Vite 8 | CSS-first config; `@import "tailwindcss"` in entrypoint styles. |
| **rspec-rails 8.0.4** | Rails 8.x/7.2, Ruby ≥ 3.0 | 8.x is the Rails-8 line. |
| **rubocop-rails 2.35.5** | rubocop ≥ 1.75.0 (< 2.0) | Pair with rubocop 1.88.0. |
| **rubocop-rspec 3.10.2** | rubocop 1.x | 3.x extracted Rails/Capybara/FactoryBot cops → add `rubocop-rspec_rails`/`rubocop-capybara`/`rubocop-factory_bot` as needed. |
| **Kamal 2.12.0** | kamal-proxy ≥ 0.9.2 | Run `kamal proxy reboot` after upgrading. |
| **bcrypt 3.1.22** | Rails `has_secure_password`, Ruby any | Minimal auth base. |

## Installation

```bash
# --- Ruby / Rails (backend) ---
rbenv install 3.4.10 && rbenv local 3.4.10          # .ruby-version
gem install rails -v 8.1.3
rails new boardgame-night-rails-vue --api --database=sqlite3
cd boardgame-night-rails-vue

# Solid Queue + Solid Cache + Kamal come preconfigured in Rails 8; verify:
# bin/rails solid_queue:install  (if not present)
# bin/rails solid_cache:install  (if not present)

# GraphQL
bundle add graphql graphiql-rails --group development
rails generate graphql:install            # scaffolds app/graphql/, GraphqlController, graphiql

# Validation + container
bundle add dry-rails
# then create config/initializers/system.rb with Dry::Rails.container { component_dirs.add "app/services" ... }

# BGG integration
bundle add faraday faraday-retry nokogiri

# Auth + env
bundle add bcrypt dotenv-rails

# Dev / test / quality
bundle add rspec-rails --group development,test
bundle add bullet --group development,test
bundle add rack-cors --group development
bundle add rubocop rubocop-rails rubocop-rspec rubocop-rspec_rails rubocop-capybara --group development,test
rails generate rspec:install

# Deploy (already in Rails 8 Gemfile; verify version)
bundle add kamal -v 2.12.0

# --- Frontend (Vue 3 via vite-ruby) ---
bundle add vite_rails
bundle exec vite install                  # generates vite.config.ts, config/vite.json
# Edit config/vite.json → "sourceCodeDir": "app/frontend"

npm install vue@3.5.35 vue-router@^5.1.0 pinia@^3.0.4 @vueuse/core@^14.3.0
npm install fuse.js@^7.4.2

# GraphQL client (stable Apollo 3 path)
npm install @apollo/client@^3.13.9 @vue/apollo-composable@^4.2.2 graphql@^16.11.0 graphql-tag@^2.12.6

# Styling
npm install -D tailwindcss@^4.3 @tailwindcss/vite@^4.3

# Build tooling
npm install -D vite@^8 @vitejs/plugin-vue@^6.0.7 vue-tsc typescript@~5.9

# Testing
npm install -D vitest@^3.2.6 @vue/test-utils @testing-library/vue jsdom
npm install -D @playwright/test@^1.61.1 && npx playwright install

# Codegen (monorepo contract: Rails schema → Vue types)
npm install -D @graphql-codegen/cli@^7.1.3 @graphql-codegen/typescript@^5 @graphql-codegen/typescript-operations@^5 @graphql-codegen/typescript-vue-apollo

# Lint/format
npm install -D eslint@^9 eslint-plugin-vue typescript-eslint@^8 prettier@^3 eslint-config-prettier
```

## Sources

- **RubyGems.org (verified 2026-07-01, HIGH):** rails 8.1.3, puma 8.0.2, graphql 2.6.3, dry-validation 1.11.1, dry-schema 1.16.0, dry-rails 0.7.0, faraday 2.14.3, nokogiri 1.19.4, solid_queue 1.4.0, solid_cache 1.0.10, rspec-rails 8.0.4, rubocop 1.88.0, rubocop-rails 2.35.5, rack-cors 3.0.0, bullet 8.1.3, graphiql-rails 1.10.5, dotenv-rails 3.2.0, bcrypt 3.1.22, kamal 2.12.0, vite_rails 3.11.0.
- **npm registry (verified 2026-07-01, HIGH):** vue 3.5.35, vue-router 5.1.0, pinia 3.0.4, @vueuse/core 14.3.0, fuse.js 7.4.2, @apollo/client 4.2.3 (and 3.13.9 last-3.x), @vue/apollo-composable 4.2.2, @urql/vue 2.1.1, graphql 17.0.1 (pin 16.x for Apollo 3), @vitejs/plugin-vue 6.0.7, vitest 3.2.6, @playwright/test 1.61.1, @graphql-codegen/cli 7.1.3, typescript 6.0.3 (pin ~5.9).
- **Ruby-lang.org (HIGH):** Ruby 3.4.10 (2026-06-30), Ruby 4.0.5 current stable — chose 3.4.10 per Rails recommendation.
- **rubyonrails.org + FastRuby.io compatibility table (HIGH):** Rails 8.1 requires Ruby ≥ 3.2.0, recommends 3.4.Z; 8.1 bug-fix support to Oct 2026, security to Oct 2027; 8.0 security-only after May 2026.
- **Context7 (HIGH):** graphql-ruby Dataloader + `graphql:install` + class-based schema (rmosolgo/graphql-ruby); vite_ruby `gem 'vite_rails'` + `sourceCodeDir` override + Vite 8 upgrade (elmassimo/vite_ruby); dry-rails `ApplicationContract` + `Dry::Rails.container` + `component_dirs.add "app/services"` + `safe_params` (dry-rb/dry-rails); Vue 3.5.35 reactivity + `<script setup>` (vuejs/core); Pinia 3.0.4 setup stores (vuejs/pinia); Tailwind v4 `@tailwindcss/vite` + `@import "tailwindcss"` (tailwindlabs).
- **GitHub issues/releases (HIGH):** vuejs/apollo #1597 (@vue/apollo-composable incompatible with @apollo/client v4; v5 beta pending PR #1609) — drives the Apollo 3.13.x recommendation; vitejs/vite-plugin-vue CHANGELOG (Vite 8 support in plugin-vue 6.0.3+); basecamp/kamal v2.12.0 (requires kamal-proxy 0.9.2); rubocop-rspec 3.x cops extraction.
- **rails/solid_queue + rails/solid_cache README (HIGH):** concurrency controls (`limits_concurrency`), no auto-retry (rely on `retry_on`), Rails 8 preconfiguration, separate-DB guidance.
- **ActiveJob API docs (HIGH):** `retry_on` semantics — `wait: :polynomially_longer` (~3s,18s,83s,258s…), `attempts:`, `discard_on`.
- **Project context (HIGH):** `PROJECT.md` (constraints: rbenv, `.env.bggeek`, BGG 1 req/5s, monorepo, `--api`); `ARCHITECTURE.md` (vite-ruby app/frontend, Dataloader, Solid Queue/Cache, dry-rails ApplicationContract, Apollo normalized cache); `PITFALLS.md` (expansion workaround, 202 retry, XML nil-safety, Solid Queue retry_on, rack-cors, skipProxy, no Redis); `FEATURES.md` (N-user merge, Fuse.js, poll-based suggestions, auth for groups).
- **Reference apps (MEDIUM):** `bgg-graphql-proxy/package.json` (what Rails replaces: Apollo Server + xml2js + Keyv/Redis + Express) and `bggeek-shared-list/package.json` (what Vue 3 replaces: Next.js 15 + Chakra UI v3 + Apollo Client 4 + Fuse.js 7).

---
*Stack research for: Rails 8 API-only + Vue 3 SPA monorepo with GraphQL, dry-validation, and BoardGameGeek XML API v2 integration*
*Researched: 2026-07-01*
