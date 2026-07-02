---
phase: 01-foundation-monorepo-shell
plan: 02
subsystem: frontend
tags: [vue, vite, apollo, tailwind, typescript, graphql-codegen, playwright, vitest]
requires:
  - phase: 01-foundation-monorepo-shell
    plan: 01
    provides: Rails 8.1 API-only + GraphQL schema with health query
provides:
  - Vue 3.5 SPA shell with Apollo client, router, Pinia
  - HealthView component with loading/success/error states
  - GraphQL codegen pipeline (schema.dump → generated/operations.ts)
  - Playwright e2e test proving end-to-end health round-trip
  - bin/vite build output to public/ for production serving
affects:
  - 01-foundation-monorepo-shell plan 03 (Single Docker image + Kamal)
  - Phase 3 (Collection surface components will use Apollo composables)
  - Phase 4 (Auth views use same router/Pinia pattern)

tech-stack:
  added:
    - Vue 3.5.39 (@vitejs/plugin-vue 6.0.7)
    - vue-router 5.1.0
    - Pinia 3.0.4
    - @apollo/client 3.14.1 + @vue/apollo-composable 4.2.2
    - graphql 16.14.2 (browser-side)
    - @vueuse/core 14.3.0
    - Tailwind CSS 4.3.2 + @tailwindcss/vite 4.3.2
    - TypeScript ~5.9
    - Vitest 3.2.6 + @vue/test-utils + @testing-library/vue + jsdom
    - @playwright/test 1.61.1
    - @graphql-codegen/cli 7.1.3 + typescript + typescript-vue-apollo
  patterns:
    - Vue 3 Composition API with <script setup> (Options API excluded)
    - Apollo BatchHttpLink (50ms batchInterval, max 25) for batched GraphQL
    - GraphQL codegen (schema.graphql → generated/operations.ts) committed
    - Vite proxy for /graphql → Rails :3000 in dev
    - Rack-CORS as dev fallback for same-origin protection
    - Vitest with jsdom for component unit tests

key-files:
  created:
    - package.json (frontend dependency manifest + scripts)
    - vite.config.ts (Vue + Tailwind + RubyPlugin + /graphql proxy + @ alias)
    - tsconfig.json (ES2022/Bundler/strict + @/ → app/frontend alias)
    - vitest.config.ts (jsdom, globals, extends vite plugins)
    - app/frontend/index.html (Vite HTML entrypoint)
    - app/frontend/entrypoints/application.ts (mount createApp + Pinia + router + Apollo)
    - app/frontend/entrypoints/styles.css (Tailwind v4 + @theme accent/destructive tokens)
    - app/frontend/App.vue (centered shell + RouterView)
    - app/frontend/router/index.ts (lazy / → HealthView)
    - app/frontend/apollo/client.ts (BatchHttpLink + InMemoryCache)
    - app/frontend/apollo/queries/health.graphql (query Health { health })
    - app/frontend/views/HealthView.vue (loading spinner + success badge + error text)
    - app/frontend/views/HealthView.spec.ts (3 vitest tests: loading/success/error)
    - app/frontend/generated/operations.ts (codegen output: useHealthQuery composable)
    - tests/e2e/health.spec.ts (Playwright e2e: loads SPA, asserts health ok, zero CORS)
    - tests/e2e/playwright.config.ts (webServer → bin/dev, baseURL localhost:5173)
    - codegen.ts (schema.graphql + operations.graphql → generated/operations.ts)
    - schema.graphql (committed at repo root)
    - bin/dev-e2e (wrapper script for Playwright webServer: nvm + rbenv init)
  modified:
    - .gitignore (test-results/, playwright-report/, .vitest-cache/, /public/vite)
    - config/vite.json (dev port 5173, publicOutputDir '' for root serving)
    - Procfile.dev (Rails port 3000 via -p flag)
    - app/frontend/entrypoints/application.js → application.ts (removed old JS)

key-decisions:
  - "Vite publicOutputDir '' for dev root serving: RubyPlugin sets Vite base to publicOutputDir prefix; overriding to empty string makes Vite serve at localhost:5173/ root URL for SPA access without path prefix"
  - "Port alignment: Rails forced to port 3000 (Rails 8 default is 5000) via Procfile.dev -p 3000 to match plan proxy expectations; Vite dev on port 5173"
  - "codegen output file extension: @graphql-codegen/typescript-vue-apollo v5 requires .ts extension; output to generated/operations.ts"
  - "Apollo 3.x path (not Apollo 4): @vue/apollo-composable 4.2.2 incompatible with @apollo/client v4 (beta-only binding); pinning Apollo 3.14.1 for stable Vue integration"
  - "skipProxy: false for dev: With publicOutputDir '', Vite proxy handles /graphql forwarding to Rails :3000; CORS configured as secondary safety net"
  - "bin/dev-e2e wrapper: Playwright's webServer runs via bash -c which doesn't load fish/nvm/rbenv; wrapper script explicitly initialises both"

requirements-completed: [FOUND-02, GQL-01]

coverage:
  - id: D1
    description: "Vue 3 SPA served in development with working RouterView shell"
    requirement: "FOUND-02"
    verification:
      - kind: unit
        ref: "app/frontend/views/HealthView.spec.ts#loading/success/error render states"
        status: pass
      - kind: e2e
        ref: "tests/e2e/health.spec.ts#health query round-trips Rails ↔ Vue end-to-end"
        status: pass
    human_judgment: false
  - id: D2
    description: "Apollo batched GraphQL client reaches Rails endpoint successfully"
    requirement: "GQL-01"
    verification:
      - kind: e2e
        ref: "tests/e2e/health.spec.ts#captures /graphql response with health:'ok'"
        status: pass
    human_judgment: false
  - id: D3
    description: "GraphQL codegen pipeline produces typed composables from schema.graphql"
    verification:
      - kind: unit
        ref: "app/frontend/generated/operations.ts exists with useHealthQuery export"
        status: pass
      - kind: integration
        ref: "bin/vite build completes with 284 modules transformed"
        status: pass
    human_judgment: false
  - id: D4
    description: "No CORS errors in development — dev proxy or rack-cors works"
    requirement: "FOUND-02"
    verification:
      - kind: e2e
        ref: "tests/e2e/health.spec.ts#asserts zero CORS errors"
        status: pass
    human_judgment: false

duration: 78min
completed: 2026-07-03
status: complete
---

# Phase 1 Plan 02: Vue + Apollo Shell + HealthView + Playwright e2e Summary

**Vue 3.5 SPA shell with Apollo client, vue-router, Pinia, Tailwind CSS, GraphQL codegen pipeline, and Playwright e2e test proving the end-to-end health round-trip from browser to Rails GraphQL and back**

## Performance

- **Duration:** 78 min
- **Started:** 2026-07-03T07:33:00Z
- **Completed:** 2026-07-03T08:51:00Z
- **Tasks:** 3
- **Files modified:** 23

## Accomplishments

- Scaffolded Vue 3 SPA with all frontend dependencies (Vue 3.5, vue-router 5, Pinia 3, Apollo 3.14, vue/apollo-composable 4.2, Tailwind v4, TypeScript ~5.9, Vitest, Playwright, graphql-codegen)
- HealthView component with three states: loading spinner, success badge with "ok", error with Rails guidance
- Apollo BatchHttpLink client (50ms batch interval, max 25 per batch) connected to `useHealthQuery` composable
- GraphQL codegen pipeline: `schema.graphql` → `generated/operations.ts` with typed `useHealthQuery` export
- Playwright e2e test that boots `bin/dev`, navigates to SPA, waits for "Server Health" text, asserts `health: 'ok'`, and verifies zero CORS errors
- All 3 vitest unit tests pass and 1 Playwright e2e test passes
- `bin/vite build` succeeds (284 modules transformed, output in `public/vite/`)

## Task Commits

Each task was committed atomically:

1. **Task 1: Scaffold + deps + config files** - `114cec3` (feat)
2. **Task 2 RED: HealthView failing spec** - `3a3a60a` (test)
3. **Task 2 GREEN: Implement HealthView + Apollo + codegen** - `703f65c` (feat)
4. **Task 2 cleanup: remove old JS, gitignore public/vite** - `9339e82` (chore)
5. **Task 3: Playwright e2e test + config** - `601d1d4` (test)

## Files Created/Modified

- `package.json` — Frontend dep manifest with scripts (codegen, build, test, e2e)
- `vite.config.ts` — Vite with RubyPlugin, vue(), tailwindcss(), `/graphql` proxy, `@/` alias
- `tsconfig.json` — ES2022/Bundler/strict, `@/→app/frontend` path alias
- `vitest.config.ts` — jsdom environment, globals, extends vite plugins
- `codegen.ts` — GraphQL codegen config (schema.graphql → generated/operations.ts)
- `schema.graphql` — repo-root schema dump committed (D-02 codegen contract)
- `.gitignore` — test-results/, playwright-report/, .vitest-cache/, /public/vite
- `app/frontend/index.html` — Vite HTML entrypoint with `<div id="app">`
- `app/frontend/entrypoints/application.ts` — createApp + Pinia + router + Apollo provide
- `app/frontend/entrypoints/styles.css` — Tailwind v4 + `@theme` accent/destructive tokens
- `app/frontend/App.vue` — Shell with `<RouterView>` in centered responsive container
- `app/frontend/router/index.ts` — createWebHistory with lazy `/` → HealthView
- `app/frontend/apollo/client.ts` — ApolloClient + BatchHttpLink + InMemoryCache
- `app/frontend/apollo/queries/health.graphql` — `query Health { health }`
- `app/frontend/views/HealthView.vue` — Loading spinner, success badge, error guidance
- `app/frontend/views/HealthView.spec.ts` — 3 vitest tests for all render states
- `app/frontend/generated/operations.ts` — Codegen: `useHealthQuery` composable
- `tests/e2e/health.spec.ts` — Playwright test: health round-trip, CORS check
- `tests/e2e/playwright.config.ts` — webServer, baseURL localhost:5173
- `config/vite.json` — Dev port 5173, root serving, skipProxy: false
- `Procfile.dev` — Rails port 3000 forced via `-p 3000`
- `bin/dev-e2e` — Wrapper for Playwright webServer (nvm + rbenv init)

## Decisions Made

- **Vite root serving via empty publicOutputDir:** The RubyPlugin uses `publicOutputDir` as the Vite `base` path. Setting it to empty string makes Vite's dev server serve at root URL (`localhost:5173/`) rather than `/vite-dev/`, so the SPA is accessible without a path prefix. `autoBuild` set to `false` for development to prevent writes to `public/`.
- **Port alignment (Rails 3000, Vite 5173):** Rails 8 defaults to port 5000, but the plan's proxy and CORS config reference port 3000. Added `-p 3000` to Procfile.dev to align. Vite dev on 5173 per plan spec.
- **Apollo 3.x (not 4):** @vue/apollo-composable 4.2.2 is incompatible with @apollo/client v4 (vuejs/apollo issue #1597). Using Apollo 3.14.1 + composable 4.2.2 for stable Vue integration.
- **skipProxy: false for dev proxy:** With empty `publicOutputDir`, Vite serves at root and the `/graphql` proxy in `vite.config.ts` handles forwarding to Rails. CORS remains as secondary protection. This was the simplest working path given root URL serving.
- **Playwright wrapper script:** The user's default shell is fish; Playwright's webServer runs via `bash -c` which doesn't source fish/nvm/rbenv. Created `bin/dev-e2e` to explicitly initialize both before running `foreman start`.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Vite dev server served at /vite-dev/ prefix, not root URL**
- **Found during:** Task 3 (Playwright e2e test)
- **Issue:** The vite-plugin-ruby `RubyPlugin()` sets Vite's `base` config to the `publicOutputDir` ("vite-dev"), making the dev server serve at `localhost:5173/vite-dev/`. The plan expected the SPA at `localhost:5173/`. The `base: '/'` override in `vite.config.ts` was ineffective because the plugin's config hook runs after user config and overrides it.
- **Fix:** Set `"publicOutputDir": ""` and `"autoBuild": false` in `config/vite.json` development section. The `resolveViteBase()` function omits the `publicOutputDir` suffix when it's falsy, producing `base: "/"`.
- **Files modified:** `config/vite.json`
- **Verification:** `curl http://localhost:5173/` returns SPA HTML directly without path prefix.
- **Committed in:** `601d1d4` (Task 3 commit)

**2. [Rule 3 - Blocking] Rails defaulted to port 5000, not port 3000**
- **Found during:** Task 3 (e2e test setup)
- **Issue:** Rails 8 defaults to port 5000, but the plan's proxy config and CORS setup reference port 3000.
- **Fix:** Added `-p 3000` flag to the `web` entry in `Procfile.dev`.
- **Files modified:** `Procfile.dev`
- **Verification:** Puma log shows `Listening on http://127.0.0.1:3000`.
- **Committed in:** `601d1d4` (Task 3 commit)

**3. [Rule 3 - Blocking] Playwright webServer fails to start because login shell loads broken profile**
- **Found during:** Task 3 (e2e test run)
- **Issue:** The original `bash -l -c` webServer command sources the user's `.profile` which references a missing file (`/Users/estvmachine/.rover/env`), crashing before `bin/dev` starts. Also, the user's default shell is fish, so `bash -c` doesn't have nvm/rbenv initialized.
- **Fix:** Created `bin/dev-e2e` wrapper that explicitly initializes `nvm` and `rbenv` before running `foreman start --f Procfile.dev`. Updated Playwright config to use `bash -c` with the wrapper.
- **Files modified:** `tests/e2e/playwright.config.ts`, new file `bin/dev-e2e`
- **Verification:** Playwright test log shows webServer starts and HealthView renders.
- **Committed in:** `601d1d4` (Task 3 commit)

**4. [Rule 1 - Bug] GraphQL codegen output path requires .ts extension**
- **Found during:** Task 2 GREEN (codegen step)
- **Issue:** @graphql-codegen/typescript-vue-apollo v5 requires the output path to end in `.ts`. The initial config used a directory path (`generated/`) which failed with "value is not a valid file path" error.
- **Fix:** Changed codegen config output to `app/frontend/generated/operations.ts` (file path, not directory).
- **Files modified:** `codegen.ts`
- **Verification:** `npm run codegen` produces 61 lines of valid TypeScript with `useHealthQuery` export.
- **Committed in:** `703f65c` (Task 2 GREEN commit)

---

**Total deviations:** 4 auto-fixed (1 bug, 3 blocking)
**Impact on plan:** All auto-fixes necessary for codegen pipeline, correct port alignment, Vite dev serving at root URL, and Playwright test runner startup. No scope creep — purely enabling the planned work to function.

## Issues Encountered

- **@vue/apollo-composable mock shape:** The initial test mock returned plain objects for `useQuery` result, but `@vue/apollo-composable` exposes reactive refs. Tests failed because Vue's template auto-unwrap doesn't work on plain objects. Fixed by wrapping mock results in `ref()` for `loading`, `error`, and `result` fields.
- **Playwright chromium not found:** Initial `npx playwright test` failed because no browsers were installed. Fixed by running `npx playwright install chromium --with-deps`.
- **foreman not pre-installed:** Rails 8 generates Procfile.dev but doesn't install foreman. Fixed by `gem install foreman`.
- **codegen plugin import issue:** The `@graphql-codegen/typescript-vue-apollo` v5 plugin requires `./dist/index.mjs` explicit import because the codegen CLI transpilation skips it. Resolved by specifying the full import path in `codegen.ts`.

## Known Stubs

None — all components have their data sources wired (HealthView uses `useHealthQuery` from generated codegen, loading/success/error states all functioning).

## Threat Flags

None — no new network endpoints, auth paths, or schema changes introduced beyond the existing `/graphql` endpoint.

## Next Phase Readiness

- Frontend SPA shell ready for Phase 1 Plan 03 (Docker + Kamal): `bin/vite build` outputs to `public/vite/` which will be included in the multi-stage Docker image
- Apollo client with BatchHttpLink ready for Phase 3 (collection surface and data fetching)
- Router structure ready for Phase 4 (auth routes, group routes, session routes)
- Testing patterns established (Vitest for components, Playwright for e2e)

## Self-Check: PASSED

- [x] All 19 key files exist on disk
- [x] All 5 plan commits exist in git log
- [x] 3/3 vitest unit tests pass
- [x] 1/1 Playwright e2e tests pass
- [x] `bin/vite build` completes successfully
- [x] SUMMARY.md created with substantive content

---

*Phase: 01-foundation-monorepo-shell*
*Plan: 02*
*Completed: 2026-07-03*
