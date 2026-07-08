---
threats_open: 0
phase: 01-foundation-monorepo-shell
asvs_level: 1
block_on: high
---

# SECURITY.md — Phase 1: Foundation & Monorepo Shell

**Audited:** 2026-07-03
**ASVS Level:** 1 (grep-level — mitigation is PRESENT in cited file)
**Block-on threshold:** high (only `critical` / `high` open threats count toward `threats_open`)
**Threats open (≥ block_on):** 0
**Total threats:** 8 — 7 CLOSED (mitigate), 1 CLOSED (accepted)

## Threat Verification

| Threat ID | Category | Severity | Disposition | Evidence | Status |
|-----------|----------|----------|-------------|----------|--------|
| T-1-01 | Information Disclosure — BGG_TOKEN leak in responses | high | mitigate | `app/graphql/types/query_type.rb` — schema only exposes `health` field (no BGG_TOKEN type). `spec/requests/dotenv_spec.rb:15` — `response.body.not_to include(actual_token)` assertion dynamically checks ENV value does not appear in response. | **CLOSED** |
| T-1-02 | Information Disclosure — GraphQL introspection in production | high | mitigate | `app/graphql/boardgame_night_schema.rb:17` — `disable_introspection_entry_points unless Rails.env.development? \|\| Rails.env.test?`. Test at `spec/graphql/boardgame_night_schema_spec.rb:28-45` verifies subclass-based introspection rejection and source-level guard pattern. | **CLOSED** |
| T-1-03 | Spoofing — CORS enabled in production | medium | mitigate | `config/initializers/cors.rb:7` — entire `Rack::Cors` block wrapped in `if Rails.env.development?`. No CORS middleware in production middleware stack. | **CLOSED** |
| T-1-04 | Denial of Service — query depth/complexity | medium | mitigate | `app/graphql/boardgame_night_schema.rb:11` — `max_depth 15`. `app/graphql/boardgame_night_schema.rb:14` — `max_complexity 400`. Additional: `max_query_string_tokens(5000)` at line 30, `validate_max_errors(100)` at line 33. | **CLOSED** |
| T-1-05 | Denial of Service — batched query abuse | medium | mitigate | `app/controllers/graphql_controller.rb:20` — `BoardgameNightSchema.multiplex(queries)`. GraphQL-ruby applies the shared `max_complexity` budget across the entire batch (built-in behavior). No per-query budget bypass possible through multiplex. | **CLOSED** |
| T-1-06 | Credential Theft — `.env.bggeek.keys` / `.env.keys` leaked | high | mitigate | `.gitignore:29-30` — both `env.keys` and `.env.bggeek.keys` listed. `git check-ignore .env.bggeek.keys` exits 0 (confirmed). `.dockerignore:30-31` — both excluded from Docker build context. `config/deploy.yml:44` — `DOTENV_PRIVATE_KEY_BGGEEK` in `env.secret` (injected at runtime, not baked). `lib/tasks/docker_verify.rake:100-113` — automated check confirms key files absent from built image. | **CLOSED** |
| T-1-07 | Tampering — Vite `sourceCodeDir` reversion | low | accept | Documented in accepted risks log below. `config/vite.json` has `skipProxy: true` paired with rack-cors dev-only constraint. Automated gate not warranted for low severity. | **CLOSED** (accepted) |
| T-1-SC | Supply Chain — unauthenticated gem/npm provenance | high | mitigate | `Gemfile:1` — rubygems.org via HTTPS. `Gemfile:43` — `bundler-audit` available for known vulnerability scanning (dev/test). `Gemfile:46` — `brakeman` available for static analysis. Package legitimacy verified at research time via RESEARCH.md slopcheck audit (no SUS packages found). | **CLOSED** |

## Accepted Risks

| ID | Description | Rationale | Severity |
|----|-------------|-----------|----------|
| T-1-07 | Vite `sourceCodeDir` reverting to default value | `config/vite.json` has `skipProxy: true` paired with rack-cors dev-only (documented paired constraint in SKELETON.md). If `sourceCodeDir` reverted, the Vite dev server path would change but CORS still gates to development only. An automated gate is not warranted for this low-severity, low-likelihood risk. | low |

## Unregistered Flags

| Flag | Source | Comment |
|------|--------|---------|
| `secrets-in-image` | 01-03-SUMMARY.md Threat Flags | Maps to T-1-06. Intentional by design: encrypted `.env.bggeek` must be in Docker image for runtime decryption; private decryption key (`DOTENV_PRIVATE_KEY_BGGEEK`) is never baked into image — injected via Kamal `env.secret`. |

No unregistered flags found that lack a threat mapping.

## Security Posture Summary

### Controls Verified (ASVS Level 1)

| Control | Status | File(s) | Depth |
|---------|--------|---------|-------|
| Credential encryption (dotenvx) | ✅ Verified — file committed encrypted; keys gitignored | `.env.bggeek` (dotenvx-encrypted), `.gitignore:29-30`, `config/initializers/dotenv_bggeek.rb`, `Procfile.dev:1`, `lib/tasks/docker_verify.rake:100-113` | Presence in cited file |
| CORS dev-only | ✅ Verified — entire block gated on `if Rails.env.development?` | `config/initializers/cors.rb:7` | Presence in cited file |
| Introspection disabled in production | ✅ Verified — class-body guard with env check | `app/graphql/boardgame_night_schema.rb:17` | Presence in cited file |
| GraphQL DoS limits | ✅ Verified — `max_depth 15`, `max_complexity 400`, `max_query_string_tokens(5000)`, `validate_max_errors(100)` | `app/graphql/boardgame_night_schema.rb:11-33` | Presence in cited file |
| Docker credential exclusion | ✅ Verified — `.env.bggeek.keys`, `.env.keys` excluded from build context | `.dockerignore:30-31` | Presence in cited file |
| Parameter filtering | ✅ Verified — Rails filter configured for sensitive params including `:token`, `:secret`, `:_key` | `config/initializers/filter_parameter_logging.rb:7` | Presence in cited file |
| Gem vulnerability auditing | ✅ Tooling available — not yet automated in CI | `Gemfile:43` (`bundler-audit`), `Gemfile:46` (`brakeman`) | Presence in Gemfile |
| No raw SQL in app | ✅ Verified — zero raw SQL patterns found in `app/` | All `app/` Ruby files (grep for `execute`, `find_by_sql`, raw SQL keywords) | Grep across `app/` |
| Docker build-time security checks | ✅ Verified — Rake task asserts key files absent from built image | `lib/tasks/docker_verify.rake:100-113` | Presence in cited file |

### ASVS Level 1 Verification Depth Notes

For Level 1, each mitigation was verified as **present in the cited file** (grep-level). Key confirmations:

| Check | Method | Result |
|-------|--------|--------|
| `disable_introspection_entry_points` guard in schema | Grep `app/graphql/boardgame_night_schema.rb` | ✅ Found line 17 |
| `max_depth 15` in schema body | Grep `app/graphql/boardgame_night_schema.rb` | ✅ Found line 11 |
| `max_complexity 400` in schema body | Grep `app/graphql/boardgame_night_schema.rb` | ✅ Found line 14 |
| CORS gated to development | Grep `config/initializers/cors.rb` | ✅ `if Rails.env.development?` at line 7 |
| `.env.bggeek.keys` gitignored | `git check-ignore .env.bggeek.keys` | ✅ Exits 0 (ignored) |
| `.env.bggeek` committed (encrypted) | `git ls-files --error-unmatch .env.bggeek` | ✅ Tracked; contains `encrypted:` prefixed values |
| Private key files excluded from Docker | Grep `.dockerignore` | ✅ Lines 30-31 |
| Key file absence verified in Docker build | Rake task `lib/tasks/docker_verify.rake` | ✅ Steps 5-6 |
| Token non-leak test | Grep `spec/requests/dotenv_spec.rb` | ✅ Uses dynamic `ENV["BGG_TOKEN"]` at line 7 |
| `DOTENV_PRIVATE_KEY_BGGEEK` in Kamal secrets | Grep `config/deploy.yml` | ✅ Line 44 |
| `bundler-audit` in Gemfile | Grep `Gemfile` | ✅ Line 43 |
| `brakeman` in Gemfile | Grep `Gemfile` | ✅ Line 46 |

### Gaps / Future Work

The following are **not open threats** (below the `block_on: high` threshold or informational) but are noted for future phases:

| Gap | Severity | Recommendation | Phase |
|-----|----------|---------------|-------|
| No CI/CD security pipeline | medium | Add GitHub Actions workflow running `bundler-audit` and `brakeman` on every PR. Phase 1 has no `.github/workflows/` yet — this is expected for a scaffold. | Future CI phase |
| DNS rebinding protection not configured | medium | Configure `config.hosts` and `config.host_authorization` in `production.rb` before production deployment. Currently commented out (lines 80-86). | Production readiness |
| SSL/TLS not enforced at app level | medium | Enable `config.assume_ssl` and `config.force_ssl` in `production.rb` when TLS termination is configured behind the proxy. | Production readiness |
| `bundler-audit` not runnable due to local Ruby version mismatch | info | Local `bundler` gem version mismatch between `rbenv` Ruby 3.4.9 and Homebrew Ruby 4.0.5. Does not affect production image where `bundle install` runs in Docker. | Environment setup |
| No automated Dependabot configuration | info | No `.github/dependabot.yml` found. Should be added for automated dependency vulnerability alerts. | Future CI phase |
| GraphQL controller error handler logs query text | info | `logger.error` may log query text with sensitive data. Review log retention in production. | Information — not a control gap |

### Review Findings Incorporated

The Phase 1 code review (`01-REVIEW.md`) identified 2 critical and 6 warning findings. All **critical** findings and relevant **warning** findings have been resolved in the current codebase:

| Finding | Severity | Status | Resolution |
|---------|----------|--------|------------|
| CR-01: dotenvx silent error swallowing | Critical | **Resolved** | `config/initializers/dotenv_bggeek.rb:36` — `Rails.logger.warn` added; re-raises in development |
| CR-02: GraphQL controller re-raises errors as 500s | Critical | **Resolved** | `app/controllers/graphql_controller.rb:31-38` — now returns structured `{ errors: [...], data: {} }` response with logging |
| WR-02: Token non-leak test uses sentinel | Warning | **Resolved** | `spec/requests/dotenv_spec.rb:7-15` — now dynamically reads `ENV["BGG_TOKEN"]` instead of hardcoded sentinel |
| WR-05: `JSON.parse` missing `max_nesting` | Warning | **Resolved** | `app/controllers/graphql_controller.rb:47` — `JSON.parse(variables_param, max_nesting: 100)` |

## Dependency Inventory (Security-Relevant)

### Ruby Gems (via Gemfile.lock — 127 gems installed)

Key security-relevant gems:

| Gem | Version | Security Relevance |
|-----|---------|--------------------|
| `rails` | 8.1.x | Core framework — security updates tracked via Rails advisory database |
| `puma` | 8.x | HTTP server — ensure latest patch for HTTP request smuggling fixes |
| `graphql-ruby` | 2.6.3 | GraphQL engine — `max_depth`, `max_complexity`, introspection controls |
| `bcrypt` | 3.1.x | Password hashing — slow hash, no known vulns in 3.1.x series |
| `rack-cors` | 3.0.0 | CORS headers — dev-only gated |
| `solid_queue` | 1.4.x | DB-backed job queue — replaces Redis; concurrency controls for BGG |
| `dotenv-rails` | 3.2.x | ENV loading — dev/test only |
| `bundler-audit` | latest | Vulnerability scanner — dev/test |
| `brakeman` | latest | SAST scanner — dev/test |

### JavaScript Dependencies (via package.json + lock)

| Dependency | Version | Security Relevance |
|------------|---------|--------------------|
| `@apollo/client` | 3.14.x | GraphQL client — normalize cache, batch queries |
| `vue` | 3.5.x | SPA framework — CSP-compatible by default |
| `vite` | 8.x | Build tool — no server runtime risk in production |
| `@vitejs/plugin-vue` | 6.0.x | Vue SFC plugin — build-time only |
| `playwright` | 1.61.x | E2E testing — dev-only |

---

**Audit completed:** 2026-07-03
**Method:** ASVS Level 1 (mitigation presence in cited files)
**Result:** All 8 threats verified — 0 open threats ≥ high severity
**Next action:** None blocking. Document accepted risks and proceed to Phase 2.
