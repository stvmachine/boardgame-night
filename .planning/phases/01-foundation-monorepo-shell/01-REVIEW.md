---
phase: 01-foundation-monorepo-shell
reviewed: 2026-07-03T10:00:00Z
depth: standard
files_reviewed: 52
files_reviewed_list:
  - .gitignore
  - .ruby-version
  - .nvmrc
  - .rubocop.yml
  - .rspec
  - .github/dependabot.yml
  - .github/workflows/ci.yml
  - Dockerfile
  - .dockerignore
  - Gemfile
  - Procfile.dev
  - Rakefile
  - bin/dev
  - bin/dev-e2e
  - bin/generate-index-html.mjs
  - config.ru
  - config/application.rb
  - config/boot.rb
  - config/cable.yml
  - config/cache.yml
  - config/database.yml
  - config/deploy.yml
  - config/environment.rb
  - config/environments/development.rb
  - config/environments/production.rb
  - config/environments/test.rb
  - config/initializers/cors.rb
  - config/initializers/dotenv_bggeek.rb
  - config/initializers/filter_parameter_logging.rb
  - config/initializers/inflections.rb
  - config/puma.rb
  - config/queue.yml
  - config/recurring.yml
  - config/routes.rb
  - config/vite.json
  - app/controllers/application_controller.rb
  - app/controllers/graphql_controller.rb
  - app/controllers/spa_controller.rb
  - app/graphql/boardgame_night_schema.rb
  - app/graphql/types/query_type.rb
  - app/graphql/types/mutation_type.rb
  - app/graphql/types/base_object.rb
  - app/graphql/types/base_argument.rb
  - app/graphql/types/base_connection.rb
  - app/graphql/types/base_edge.rb
  - app/graphql/types/base_enum.rb
  - app/graphql/types/base_field.rb
  - app/graphql/types/base_input_object.rb
  - app/graphql/types/base_interface.rb
  - app/graphql/types/base_scalar.rb
  - app/graphql/types/base_union.rb
  - app/graphql/types/node_type.rb
  - spec/spec_helper.rb
  - spec/rails_helper.rb
  - spec/graphql/boardgame_night_schema_spec.rb
  - spec/requests/dotenv_spec.rb
  - schema.graphql
  - lib/tasks/docker_verify.rake
  - package.json
  - codegen.ts
  - vite.config.ts
  - vitest.config.ts
  - tsconfig.json
  - app/frontend/index.html
  - app/frontend/App.vue
  - app/frontend/entrypoints/application.ts
  - app/frontend/entrypoints/styles.css
  - app/frontend/router/index.ts
  - app/frontend/apollo/client.ts
  - app/frontend/apollo/queries/health.graphql
  - app/frontend/views/HealthView.vue
  - app/frontend/views/HealthView.spec.ts
  - app/frontend/generated/operations.ts
  - tests/e2e/health.spec.ts
  - tests/e2e/playwright.config.ts
findings:
  critical: 2
  warning: 6
  info: 7
  total: 15
status: issues_found
---

# Phase 1: Code Review Report

**Reviewed:** 2026-07-03T10:00:00Z
**Depth:** standard
**Files Reviewed:** 52
**Status:** issues_found

## Summary

Reviewed 52 source files created/modified during Phase 1 (Foundation & Monorepo Shell). The codebase is well-structured overall, with clear architecture patterns, thorough test coverage, and good security posture around credential handling. Found 2 critical issues, 6 warnings, and 7 info items.

**Key strengths:** Clean separation of Rails GraphQL API from Vue SPA, proper security defaults (introspection disabled in production, CORS gated to dev, credentials encrypted via dotenvx), comprehensive test coverage for the health round-trip.

**Key concerns:** Silent error swallowing in credential initializer hinders debugging; re-raised errors in production GraphQL controller produce poor API responses; orphaned `provideApolloClient` call creates misleading code path; test token sentinel hardcodes a value that diverges from the actual env variable it's supposed to guard.

## Critical Issues

### CR-01: Silent error swallowing in dotenvx credential fallback

**File:** `config/initializers/dotenv_bggeek.rb:35-37`
**Issue:** The `rescue StandardError` block is completely empty. If the `dotenvx get` CLI command fails for any reason (binary not in PATH, incompatible version, corrupted `.env.bggeek` file, JSON parse failure), the error is silently swallowed with zero logging. In development, this means `BGG_TOKEN` would silently be absent and the app would load without BGG credentials, only failing at runtime when BGG integration is attempted. In production (Docker), where the initializer is the **primary** decryption path (the `dotenvx run` CMD wrapper handles decryption before Rails starts), this rescue might catch nothing during normal operation — but if it does, the failure is invisible.

**Fix:** Add a `Rails.logger.warn` call in the rescue block, and optionally re-raise in development to surface issues early:

```ruby
rescue StandardError => e
  Rails.logger.warn("[dotenv_bggeek] dotenvx decryption failed: #{e.message}")
  # In development, surface the error so it's not missed
  raise e if Rails.env.development?
end
```

### CR-02: GraphQL controller re-raises errors in production as unhandled 500s

**File:** `app/controllers/graphql_controller.rb:31-34`
**Issue:** The `rescue StandardError` block re-raises the exception in all environments except development (`raise e unless Rails.env.development?`). In production (and test), this means any unexpected error in the `execute` action bypasses the controller's error handler and propagates to Rails' default exception handling. For an API-only app, Rails returns a generic 500 response with no structured GraphQL-compatible error payload. This differs from the standard graphql-ruby generated controller pattern, which returns structured errors in all environments (with more detail in development).

The error types that could hit this handler before GraphQL-ruby processes them include `JSON::ParserError` in `ensure_hash` (if malformed input is sent as variables) and `ArgumentError` from the `else` branch of `ensure_hash`.

**Fix:** Return a proper GraphQL error response in all environments instead of re-raising, logging the full error server-side:

```ruby
rescue StandardError => e
  logger.error "[GraphqlController] #{e.message}"
  logger.error e.backtrace.first(10).join("\n")
  render json: {
    errors: [{ message: "Internal server error" }],
    data: {}
  }, status: 500
```

Consider also logging the error with a unique error ID for production debugging.

## Warnings

### WR-01: `provideApolloClient` at module scope is a no-op

**File:** `app/frontend/entrypoints/application.ts:13`
**Issue:** `provideApolloClient(apolloClient)` is called at module scope after `createApp(App)` but Vue's `getCurrentInstance()` returns `null` outside a component's `setup()` function. This means the call silently does nothing — no Apollo client is provided by this call. The app works correctly because line 14 (`app.provide(DefaultApolloClient, apolloClient)`) provides the client at the app level, which is where `@vue/apollo-composable`'s `inject` will find it. However, the dead call on line 13 is misleading: a reader who knows the `provideApolloClient` API will think it's configured, not realizing only line 14 is effective.

**Fix:** Remove the redundant `provideApolloClient` call — it serves no purpose and is misleading:

```typescript
const app = createApp(App)
app.use(createPinia())
app.use(router)
app.provide(DefaultApolloClient, apolloClient)  // ← this is sufficient
app.mount('#app')
```

### WR-02: Token non-leak test checks sentinel string, not actual token value

**File:** `spec/requests/dotenv_spec.rb:6,14`
**Issue:** The test asserts `response.body.not_to include("SPEC_SENTINEL_TOKEN_PLACEHOLDER")`. This string was the value of `BGG_TOKEN` when the test was written (a dummy placeholder). If the BGG_TOKEN value is later changed to a real token (e.g., after running `dotenvx set BGG_TOKEN "actual_production_token"`), the test assertion will pass trivially because it's checking for the old string `"SPEC_SENTINEL_TOKEN_PLACEHOLDER"`, not the actual `ENV["BGG_TOKEN"]` value. The test becomes a no-op: it no longer verifies that the actual credential doesn't leak into responses.

**Fix:** Read the actual `ENV["BGG_TOKEN"]` value dynamically instead of hardcoding a sentinel:

```ruby
RSpec.describe "GraphQL endpoint does not leak BGG_TOKEN", type: :request do
  it "returns health ok and does not include the BGG token in the response" do
    actual_token = ENV["BGG_TOKEN"]
    skip "BGG_TOKEN not set" unless actual_token.present?

    post "/graphql", params: { query: "{ health }" }, as: :json

    expect(response).to have_http_status(:ok)
    json = response.parsed_body
    expect(json["data"]["health"]).to eq("ok")
    expect(response.body).not_to include(actual_token)
  end
end
```

Alternatively, if a sentinel approach is preferred, the sentinel should be `let(:expected_token)` derived from the ENV or the dotenvx file directly so the test and the config stay in sync.

### WR-03: Recommended RSpec settings disabled by `=begin` block

**File:** `spec/spec_helper.rb:49-93`
**Issue:** The entire block of recommended RSpec settings starting from `config.filter_run_when_matching :focus` through `config.order = :random` is wrapped in `=begin`/`=end`, commenting them out. This means:

- `config.disable_monkey_patching!` is **off**: RSpec monkey-patches `Object#should` and `Object#should_receive`, which can break standard Ruby and cause confusing test failures
- `config.order = :random` is **off**: specs run in definition order, masking order-dependent test failures
- `config.profile_examples = 10` is **off**: no automatic tracking of slow examples
- `config.filter_run_when_matching :focus` is **off**: the `fit`/`fdescribe` shorthand for focused tests won't work

While these settings are disabled by the Rails RSpec generator template (which produces them as commented recommendations), not enabling them reduces test suite rigor.

**Fix:** Uncomment the block and add `config.example_status_persistence_file_path = "spec/examples.txt"` to `.gitignore`:

```ruby
config.filter_run_when_matching :focus
config.example_status_persistence_file_path = "spec/examples.txt"
config.disable_monkey_patching!
if config.files_to_run.one?
  config.default_formatter = "doc"
end
config.profile_examples = 10
config.order = :random
Kernel.srand config.seed
```

### WR-04: `GraphqlController` errors also re-raised in test environment

**File:** `app/controllers/graphql_controller.rb:32`
**Issue:** The rescue condition `raise e unless Rails.env.development?` means errors are also re-raised in the **test** environment (since `Rails.env.test?` is not checked). If a request spec hits an unexpected error in `execute` (e.g., malformed variables JSON), the error propagates as an unhandled exception instead of a structured response. This makes test failures harder to diagnose — RSpec shows the raw exception rather than a 500 response that can be inspected.

**Fix:** Extend the condition to include test environment, so that `handle_error_in_development` (which logs and returns a JSON error) runs in both development and test:

```ruby
rescue StandardError => e
  raise e unless Rails.env.development? || Rails.env.test?
  handle_error_in_development(e)
end
```

Alternatively, use the graphql-ruby convention of `rescue_from` for controller-level error handling.

### WR-05: `Style/LambdaCall` pattern — `ensure_hash` has no limit on JSON.parse nesting

**File:** `app/controllers/graphql_controller.rb:43`
**Issue:** `JSON.parse(variables_param)` is called without `max_nesting:` limit. An attacker could send a deeply nested JSON array/hash in GraphQL variables to cause stack overflow or excessive CPU/memory consumption during JSON parsing. While GraphQL-ruby has `max_query_string_tokens(5000)` set on the schema (line 30 of `boardgame_night_schema.rb`), this protects query text size but not JSON variable payloads which are parsed separately.

**Fix:** Add a nesting limit to `JSON.parse`:

```ruby
JSON.parse(variables_param, max_nesting: 100) || {}
```

### WR-06: `bin/dev-e2e` silently ignores nvm/rbenv failures

**File:** `bin/dev-e2e:8,11`
**Issue:** The nvm version switch (`nvm use 20.20.2 >/dev/null 2>&1`) discards both stdout and stderr, and the exit code is never checked. If Node 20.20.2 isn't installed or nvm isn't available, the script silently continues with whatever Node is in PATH. Similarly, `eval "$(rbenv init -)"` runs without checking if rbenv is available, and if rbenv init fails, the shell may be left in an inconsistent state.

**Fix:** Add error checking:

```bash
if [ -s "$NVM_DIR/nvm.sh" ]; then
  . "$NVM_DIR/nvm.sh"
  nvm use 20.20.2 || { echo "ERROR: nvm use 20.20.2 failed" >&2; exit 1; }
fi

if command -v rbenv >/dev/null 2>&1; then
  eval "$(rbenv init -)"
fi
```

## Info

### IN-01: `MutationType` exports stale `test_field` with TODO

**File:** `app/graphql/types/mutation_type.rb:5-10`
**Issue:** The type contains leftover scaffolding from `rails g graphql:install` with a `# TODO: remove me` comment. This exposes a `testField` mutation in the production schema that always returns `"Hello World"`. Should be removed before Phase 2 or 3 ships.

### IN-02: `HealthView.spec.ts` imports unused `DeepMockProxy` type

**File:** `app/frontend/views/HealthView.spec.ts:8`
**Issue:** `import type { DeepMockProxy } from 'vitest'` is imported but never used anywhere in the file. With `noUnusedLocals` this would be a compilation error.

### IN-03: `HealthView.spec.ts` uses multiple `as any` type assertions

**File:** `app/frontend/views/HealthView.spec.ts:25,51,62,74`
**Issue:** Four `as any` assertions bypass TypeScript type checking. The mock client (`{ request: vi.fn() } as any`) doesn't match the `ApolloClient` interface shape, and the three test mock return values use `as any` instead of properly typing the return of `useQuery`. Future changes to the Apollo composable types won't be caught.

### IN-04: `dotenv_bggeek.rb` uses backtick shell execution without full-pathed binary

**File:** `config/initializers/dotenv_bggeek.rb:30`
**Issue:** The initializer calls `` `dotenvx get -f ...` `` relying on `dotenvx` being in `PATH`. In Docker, `dotenvx` is installed globally via `npm install -g @dotenvx/dotenvx` and expected to be on PATH. If the PATH changes or the install fails, this silently fails (caught by the empty rescue). Consider resolving the dotenvx binary path explicitly or checking availability before invoking.

### IN-05: `bin/generate-index-html.mjs` hardcodes manifest path and Vite output structure

**File:** `bin/generate-index-html.mjs:9`
**Issue:** The manifest path `"public/vite/.vite/manifest.json"` encodes two levels of Vite configuration (`publicOutputDir` and Vite's own `build.outDir` under `.vite/`). If either the vite-plugin-ruby configuration changes or Vite's outDir changes, this breaks silently at Docker build time (the error check on line 13-16 catches it, but only with an unhelpful "not found in manifest" message). Consider making the path configurable or deriving it from `config/vite.json`.

### IN-06: `bin/generate-index-html.mjs` generates `<meta charset="utf-8">` with wrong casing

**File:** `bin/generate-index-html.mjs:22`
**Issue:** The `charset` attribute is written as `utf-8` (lowercase) while the standard casing is `utf-8`. Both are valid per WHATWG spec, but most generators use `UTF-8`. Not a functional issue but a minor inconsistency with the static `index.html` file (`app/frontend/index.html` which doesn't specify charset at all — actually wait, it does on line 4 with `UTF-8`).

Actually, looking at the generated HTML more carefully, line 22 writes `utf-8` (lowercase). The `app/frontend/index.html` has `UTF-8` (uppercase) on line 4. The generated production output uses `utf-8` — both are valid.

### IN-07: `HealthView.vue` error message references `localhost:3000` in production

**File:** `app/frontend/views/HealthView.vue:21`
**Issue:** The error state text reads: "Make sure Rails is running on localhost:3000, then reload the page." This is development-only guidance. In production, the SPA is served same-origin from Rails, so `localhost:3000` is meaningless to end users. While HealthView is a Phase 1 dev tool, this should be made environment-aware or removed before production deployment.

---

_Reviewed: 2026-07-03T10:00:00Z_
_Reviewer: gsd-code-reviewer (big-pickle)_
_Depth: standard_
