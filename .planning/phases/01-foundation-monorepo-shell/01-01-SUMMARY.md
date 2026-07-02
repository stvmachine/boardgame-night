---
phase: 01-foundation-monorepo-shell
plan: 01
subsystem: api
tags: [rails, graphql, rspec, rack-cors, dotenvx, sqlite, solid-queue, solid-cache, vite-rails]
requires: []
provides:
  - Rails 8.1.3 API-only scaffold with Solid Queue + Cache
  - GraphQL schema with health query, Dataloader, max_depth/max_complexity
  - Apollo-batched multiplex controller
  - dev-only rack-cors for localhost:5173
  - dotenvx-encrypted .env.bggeek with server-side-only credential loading
affects:
  - 01-foundation-monorepo-shell plan 02 (frontend scaffold)
  - 02-bgg-integration (BGG client will use BGG_TOKEN)

tech-stack:
  added:
    - Rails 8.1.3 (API-only)
    - sqlite3 (~> 2.x)
    - solid_queue, solid_cache, solid_cable
    - vite_rails (~> 3.11)
    - graphql (~> 2.6)
    - bcrypt (~> 3.1)
    - rack-cors (~> 3.0, dev/test)
    - bullet (~> 8.1, dev/test)
    - dotenv-rails (~> 3.2, dev/test)
    - rspec-rails (~> 8.0, dev/test)
    - graphiql-rails (~> 1.10, dev)
  patterns:
    - API-only Rails with SPA frontend served from public/
    - GraphQL::Dataloader for N+1 prevention
    - Schema.multiplex for Apollo batched queries
    - dotenvx-encrypted credentials with CLI wrapper + initializer fallback
    - Security hardcoded in schema body (not config)

key-files:
  created:
    - .ruby-version
    - .nvmrc
    - Procfile.dev
    - bin/dev
    - config/vite.json
    - config/database.yml
    - config/initializers/cors.rb
    - config/initializers/dotenv_bggeek.rb
    - app/graphql/boardgame_night_schema.rb
    - app/graphql/types/query_type.rb
    - app/graphql/types/base_object.rb
    - app/graphql/types/mutation_type.rb
    - app/controllers/graphql_controller.rb
    - app/controllers/spa_controller.rb
    - .env.bggeek
    - spec/graphql/boardgame_night_schema_spec.rb
    - spec/requests/dotenv_spec.rb
  modified:
    - Gemfile
    - Gemfile.lock
    - .gitignore
    - config/routes.rb

key-decisions:
  - "Ruby 3.4.9 used instead of 3.4.10 — the planned 3.4.10 was not yet available in ruby-build; 3.4.9 is the latest available patch in the 3.4 series"
  - "dotenvx v1.75 stores keys in a shared .env.keys file by default; renamed to .env.bggeek.keys and configured -fk flag in Procfile.dev for explicit key file association"
  - "introspection-off test uses subclass-based approach since the class-body guard is evaluated at load time and cannot be dynamically switched in RSpec"

patterns-established:
  - "GraphQL schema class body holds security constants (max_depth 15, max_complexity 400) with introspection guard gated on env"
  - "dotenvx integration via two paths: (1) Procfile.dev dotenvx run wrapper (primary), (2) config/initializer fallback when DOTENV_PRIVATE_KEY_BGGEEK is set"
  - "Procfile.dev limited to web + vite; no Solid Queue worker in dev"

requirements-completed: [FOUND-01, FOUND-04, FOUND-05, GQL-01, GQL-04]

coverage:
  - id: D1
    description: "Rails 8.1.3 API-only app initialized with Solid Queue + Solid Cache + Solid Cable, vite_rails, graphql-ruby, bcrypt"
    requirement: FOUND-01
    verification:
      - kind: unit
        ref: "bin/rails -v returns 8.1.3"
        status: pass
    human_judgment: false
  - id: D2
    description: "GraphQL schema with max_depth 15, max_complexity 400, Dataloader, and disable_introspection_entry_points guard"
    requirement: FOUND-04
    verification:
      - kind: unit
        ref: "spec/graphql/boardgame_night_schema_spec.rb#has the disable_introspection_entry_points guard in the schema source"
        status: pass
      - kind: unit
        ref: "spec/graphql/boardgame_night_schema_spec.rb#rejects an introspection query when introspection entry points are disabled"
        status: pass
    human_judgment: false
  - id: D3
    description: "dotenvx-encrypted .env.bggeek committed; .env.bggeek.keys gitignored; BGG_TOKEN loaded server-side only"
    requirement: FOUND-05
    verification:
      - kind: integration
        ref: "spec/requests/dotenv_spec.rb#returns health ok and does not include the BGG token in the response"
        status: pass
    human_judgment: false
  - id: D4
    description: "GraphQL health query endpoint returning ok via both single and multiplex (Apollo batch) paths"
    requirement: GQL-01
    verification:
      - kind: unit
        ref: "spec/graphql/boardgame_night_schema_spec.rb#health query returns ok"
        status: pass
      - kind: unit
        ref: "spec/graphql/boardgame_night_schema_spec.rb#multiplex returns an array of two multiplexed results"
        status: pass
    human_judgment: false
  - id: D5
    description: "Apollo batch queries supported via Schema.multiplex in GraphqlController"
    requirement: GQL-04
    verification:
      - kind: unit
        ref: "spec/graphql/boardgame_night_schema_spec.rb#multiplex returns an array of two multiplexed results"
        status: pass
    human_judgment: false

duration: 35min
completed: 2026-07-03
status: complete
---

# Phase 1 Plan 01: Foundation — Backend Monorepo Shell

**Rails 8.1.3 API-only scaffold with graphql-ruby health endpoint, Apollo multiplex controller, dev-only CORS, and dotenvx-encrypted BGG credentials**

## Performance

- **Duration:** 35 min
- **Started:** 2026-07-03T07:30:00Z
- **Completed:** 2026-07-03T08:05:00Z
- **Tasks:** 3 (1 standard + 2 TDD)
- **Commits:** 4

## Accomplishments

- Rails 8.1.3 API-only scaffold with Solid Queue, Solid Cache, Solid Cable — Ruby 3.4.9, Node 20.20.2
- GraphQL schema (`BoardgameNightSchema`) with `use GraphQL::Dataloader`, `max_depth 15`, `max_complexity 400`, `disable_introspection_entry_points` (production-only)
- `QueryType` with single `health: String` field returning `"ok"`
- `GraphqlController#execute` branches on `params[:_json]` for Apollo batched queries via `Schema.multiplex`
- SPA catch-all route + `SpaController` for serving the Vue frontend (ready for Plan 02)
- `config/initializers/cors.rb` gated on `Rails.env.development?` — allows localhost:5173 → /graphql
- `config/initializers/dotenv_bggeek.rb` — server-side-only fallback decryption of `.env.bggeek` via `dotenvx get`
- `.env.bggeek` committed encrypted with dotenvx; `.env.bggeek.keys` gitignored
- RSpec 8.0.4 test suite with 5 examples, all green (health query, multiplex array, introspection-off, source guard check, non-leak check)

## Task Commits

Each task was committed atomically:

| # | Task | Type | Commit | Description |
|---|------|------|--------|-------------|
| 1 | Pin runtime versions + scaffold Rails 8.1.3 | feat | `68c859d` | Ruby 3.4.9, Node 20, Rails 8.1.3 API-only, Solid trifecta, vite_rails, graphql-ruby, gems |
| 2a | RED: Failing test for GraphQL | test | `c88352f` | RSpec test spec for health query + multiplex + introspection-off |
| 2b | GREEN: GraphQL implementation | feat | `0311150` | BoardgameNightSchema, QueryType, GraphqlController (multiplex), SpaController, CORS, routes |
| 3 | dotenvx-encrypted .env.bggeek | feat | `aba2c07` | Encrypted credential file, server-side initializer, Procfile.dev update, non-leak spec |

## Files Created/Modified

### Created
- `.ruby-version` — Ruby 3.4.9 (planned 3.4.10 unavailable)
- `.nvmrc` — Node 20
- `Procfile.dev` — web (dotenvx-run) + vite; no solid_queue
- `bin/dev` — Executable foreman wrapper
- `config/vite.json` — sourceCodeDir: app/frontend, skipProxy: true
- `config/database.yml` — primary/queue/cache/cable under all envs
- `config/initializers/cors.rb` — Dev-only CORS for localhost:5173
- `config/initializers/dotenv_bggeek.rb` — Server-side fallback decryption
- `app/graphql/boardgame_night_schema.rb` — Schema with security limits
- `app/graphql/types/query_type.rb` — Single health field
- `app/graphql/types/base_object.rb` — Base GraphQL type
- `app/graphql/types/mutation_type.rb` — Empty mutation type
- `app/controllers/graphql_controller.rb` — Multiplex + single query paths
- `app/controllers/spa_controller.rb` — SPA shell serving
- `.env.bggeek` — dotenvx-encrypted BGG_TOKEN
- `spec/graphql/boardgame_night_schema_spec.rb` — 4 RSpec examples
- `spec/requests/dotenv_spec.rb` — 1 RSpec example (non-leak)

### Modified
- `Gemfile` — Added 11 gems across groups
- `Gemfile.lock` — 127 gems installed
- `.gitignore` — keys files, storage data, node_modules, public/dist
- `config/routes.rb` — POST /graphql + root + SPA catch-all

## Decisions Made

- **Ruby 3.4.9 vs 3.4.10:** The plan specified Ruby 3.4.10, but `ruby-build` only offers 3.4.9 as the latest available in the 3.4 series. Using 3.4.9 — functionally equivalent, same minor version. Documented as deviation.
- **dotenvx keys file naming:** dotenvx v1.75 stores private keys in `.env.keys` by default. Renamed to `.env.bggeek.keys` for explicit file association; updated Procfile.dev with `-fk` flag.
- **Introspection-off test strategy:** The class-body guard `unless Rails.env.development? || Rails.env.test?` is evaluated at load time, making `allow(Rails).to receive(:env)` ineffective. Used a subclass with `disable_introspection_entry_points` in class body for the test, plus a source-level guard check.
- **`--skip-git` for rails new:** The repo already has a `.git` directory, so `--skip-git` was necessary. `.gitignore` manually created with appropriate entries.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Ruby 3.4.10 not available in ruby-build**
- **Found during:** Task 1 (Runtime version pins)
- **Issue:** `rbenv install 3.4.10` failed — version not found in `ruby-build`. Latest available 3.4.x is `3.4.9`.
- **Fix:** Installed Ruby 3.4.9 instead. Updated `.ruby-version` to `3.4.9`.
- **Files modified:** `.ruby-version`
- **Verification:** `ruby -v` prints `ruby 3.4.9`
- **Committed in:** `68c859d` (Task 1 commit)

**2. [Rule 3 - Blocking] rack-cors and dotenv-rails gems added only to :test group instead of [:development, :test]**
- **Found during:** Task 2 (CORS initializer loading)
- **Issue:** `bundle add rack-cors --group development --group test` incorrectly added gems to only `:test` group. Rails runner crashed because `Rack::Cors` constant was uninitialized in development.
- **Fix:** Updated Gemfile to use `group: [:development, :test]` for `rack-cors`, `dotenv-rails`, `bullet`, and `rspec-rails`.
- **Files modified:** `Gemfile`, `Gemfile.lock`
- **Verification:** Rails runner boots without CORS error; RSpec runs in test env.
- **Committed in:** `0311150` (Task 2 commit)

**3. [Rule 3 - Blocking] dotenvx keys file naming mismatch**
- **Found during:** Task 3 (dotenvx integration)
- **Issue:** dotenvx v1.75 writes private keys to `.env.keys` by default, not `.env.bggeek.keys`. The `Procfile.dev` `dotenvx run` wrapper failed to find the key.
- **Fix:** Renamed `.env.keys` to `.env.bggeek.keys` and added `-fk .env.bggeek.keys` to the `web:` line in `Procfile.dev`.
- **Files modified:** `.env.bggeek.keys` (moved), `Procfile.dev`
- **Verification:** `dotenvx run -f .env.bggeek -fk .env.bggeek.keys -- printenv BGG_TOKEN` prints the decrypted token.
- **Committed in:** `aba2c07` (Task 3 commit)

---

**Total deviations:** 3 auto-fixed (3 blocking)
**Impact on plan:** All auto-fixes were version/CLI compatibility issues. No scope creep — all plan objectives achieved.

## Issues Encountered

- **dotenvx `get` command outputs JSON, not key=value:** The initializer's `dotenvx get -f .env.bggeek` outputs JSON. The initializer was written to parse JSON with `JSON.parse`. This works correctly when `DOTENV_PRIVATE_KEY_BGGEEK` is set.
- **graphql-ruby generator names schema after Rails app:** Generated `boardgame_night_rails_vue_schema.rb` — renamed to `boardgame_night_schema.rb` to match the plan's expected class name `BoardgameNightSchema`.
- **Newer dotenvx behavior:** v1.75 embeds the public key in the `.env` file header and stores private keys separately. No separate `.env.bggeek.keys` was auto-created — had to rename from the default `.env.keys`.

## User Setup Required

None — no external service configuration required for this plan. The dummy BGG_TOKEN is a placeholder; a real BGG token can be added later by:
1. Setting a real `BGG_TOKEN=real_token` in a temporary plaintext file
2. Running `dotenvx set -f .env.bggeek BGG_TOKEN "real_token"`
3. Deleting the plaintext file

## Next Phase Readiness

- Backend GraphQL API ready for consumption by Plan 02 (Vue frontend scaffold)
- Procfile.dev has `vite:` line ready for Vite dev server
- CORS configured for `localhost:5173` (dev server origin)
- SPA catch-all route ready to serve Vue build from `public/`
- No blocker for Plan 02

---

*Phase: 01-foundation-monorepo-shell*
*Completed: 2026-07-03*
