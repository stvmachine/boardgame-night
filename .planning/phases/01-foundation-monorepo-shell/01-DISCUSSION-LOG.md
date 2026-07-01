# Phase 1: Foundation & Monorepo Shell - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-07-01
**Phase:** 1-Foundation & Monorepo Shell
**Areas discussed:** Monorepo layout, GraphQL schema starting point, Dev server orchestration, Kamal 2 deploy verification target

---

## Monorepo Layout

### Q1: How should the monorepo be shaped?

| Option | Description | Selected |
|--------|-------------|----------|
| Rails-rooted app/frontend | Rails at root; Vue in app/frontend/ via vite_rails. Single bin/dev. Simplest Kamal story. | ✓ |
| Side-by-side backend/+frontend/ | Two top-level dirs, own manifests. Would fight vite_rails integration. | |
| Rails-rooted top-level frontend/ | Rails at root, Vue in top-level frontend/. Middle ground, slight deviation from vite_rails convention. | |

**User's choice:** Rails-rooted app/frontend
**Notes:** Matches STACK.md recommendation.

### Q2: Where do shared types and the Rails GraphQL schema live?

| Option | Description | Selected |
|--------|-------------|----------|
| app/frontend/generated + committed schema.graphql | Codegen output in app/frontend/generated/; schema.graphql at repo root. Both committed. | ✓ |
| frontend types in shared/ dir, schema in app/graphql/ | Different organization, same committed-contract approach. | |
| You decide | Agent picks conventional location. | |

**User's choice:** app/frontend/generated + committed schema.graphql
**Notes:** Standard vite_rails + codegen contract.

### Q3: Where does .env.bggeek live and how is it loaded?

| Option | Description | Selected |
|--------|-------------|----------|
| Repo root, dotenv-rails scoped load | .env.bggeek at root (gitignored), Dotenv.load('.env.bggeek'). | |
| config/credentials + .env.bggeek fallback | BGG token in Rails credentials as primary, .env.bggeek dev-only. | |
| You decide | Agent follows PROJECT.md .env.bggeek mandate. | ✓ |

**User's choice:** You decide
**Notes:** User then corrected: wants dotenvx to encrypt .env.bggeek so it can be committed to the repo. See Q3b.

### Q3b: How should dotenvx manage the encrypted .env.bggeek?

| Option | Description | Selected |
|--------|-------------|----------|
| Encrypted .env.bggeek committed + .env.bggeek.key gitignored | dotenvx encrypts in place; encrypted file committed; key gitignored or DOTENV_PRIVATE_KEY env var. | |
| Encrypted .env.bggeek + key in Rails credentials | Two layers: dotenvx encrypts token, Rails credentials hold the dotenv private key. | |
| You decide the wiring | Agent picks cleanest dotenvx + Rails integration during planning. | ✓ |

**User's choice:** You decide the wiring
**Notes:** User explicitly wants dotenvx to encrypt .env.bggeek so it can be committed. Overrides STACK.md's plain dotenv-rails recommendation. Exact wiring (dotenv gem encrypted support vs custom loader) deferred to planning.

### Q4: How are Ruby + Node versions pinned?

| Option | Description | Selected |
|--------|-------------|----------|
| .ruby-version + .nvmrc | rbenv .ruby-version + .nvmrc for Node. Works with any node manager. | ✓ |
| .ruby-version + package.json engines + Volta | rbenv + Volta pins Node in package.json. Opinionated. | |
| .tool-versions (asdf) | Single file for both via asdf. Conflicts with rbenv mandate. | |

**User's choice:** .ruby-version + .nvmrc

### Q5: Where do test fixtures and specs live?

| Option | Description | Selected |
|--------|-------------|----------|
| Rails convention: spec/ + co-located Vue tests | RSpec in spec/; Vue tests co-located (Component.spec.ts); Playwright in tests/e2e/. | ✓ |
| Separate tests/frontend/ dir | All frontend tests in top-level tests/frontend/. | |
| You decide | Agent picks — likely co-located. | |

**User's choice:** Rails convention: spec/ + app/frontend tests co-located

---

## GraphQL Schema Starting Point

### Q1: How much of the GraphQL schema should exist at end of Phase 1?

| Option | Description | Selected |
|--------|-------------|----------|
| Minimal hello + health query | Just enough to prove the contract. Phase 3 builds the real schema. | ✓ |
| Port reference proxy schema as typed skeleton | Copy all types with stubbed resolvers. Bigger Phase 1, Phase 3 fills in. | |
| Phase-1 types only (Query + Mutation shell) | Proves schema/Dataloader/batch without BGG domain types. Middle ground. | |

**User's choice:** Minimal hello + health query

### Q2: Should the reference proxy's schema.graphql be referenced/copied in Phase 1?

| Option | Description | Selected |
|--------|-------------|----------|
| Deferred to Phase 3 — not touched | Phase 1 ships minimal contract only. | |
| Copy schema.graphql into .planning/research/ as reference doc | Makes reference discoverable for Phase 3 planning. No Rails code ported. | ✓ |
| You decide | Agent picks — likely defer. | |

**User's choice:** Copy schema.graphql into .planning/research/ as a reference doc

### Q3: How should GraphQL security limits be configured?

| Option | Description | Selected |
|--------|-------------|----------|
| Hardcoded in schema class with Rails.env guard | max_depth, max_complexity, disable_introspection in schema class. Simple, visible. | ✓ |
| Values in config/graphql.yml, env-aware | Limits read from config file. More flexible but adds indirection. | |
| You decide | Agent picks — likely hardcoded. | |

**User's choice:** Hardcoded in schema class with Rails.env guard

---

## Dev Server Orchestration

### Q1: How should bin/dev compose Rails + Vite in development?

| Option | Description | Selected |
|--------|-------------|----------|
| vite_rails bin/dev (Procfile.dev under the hood) | Rails 8 default. bin/dev runs foreman with Procfile.dev (web + vite). | ✓ |
| Overmind/foreman with explicit Procfile.dev | Write Procfile.dev yourself. More control. | |
| Two manual terminals | bin/rails s + bin/vite dev separately. Breaks bin/dev criterion. | |

**User's choice:** vite_rails bin/dev (Procfile.dev under the hood)

### Q2: How does /graphql reach Rails in development?

| Option | Description | Selected |
|--------|-------------|----------|
| Vite server.proxy + skipProxy: true (no rack-cors) | Vite proxies /graphql → Rails. Dev mirrors prod. No CORS needed. | |
| rack-cors in development only | Vue hits localhost:3000/graphql directly; rack-cors allows cross-origin in dev. | ✓ |
| Both — Vite proxy primary, rack-cors as fallback | Vite proxy for SPA + rack-cors for GraphiQL. | |

**User's choice:** rack-cors in development only
**Notes:** User initially had no idea and asked for education. Agent explained Vite proxy (dev mirrors prod, no CORS) vs rack-cors (dev-only hack, dev diverges from prod). User chose rack-cors after being informed. Preference for SPA hitting Rails directly in dev.

### Q3: Should Solid Queue run in dev via bin/dev, or separately?

| Option | Description | Selected |
|--------|-------------|----------|
| Not in Phase 1 (Recommended) | Phase 1 has no background jobs. bin/dev runs just web + vite. Phase 2 adds it. | ✓ |
| Include now, idle until Phase 2 | Worker boots but has no jobs. Phase 2 just adds jobs. | |
| You decide | Agent picks — likely not in Phase 1. | |

**User's choice:** Not in Phase 1 (Recommended)
**Notes:** User initially had no idea what Solid Queue or Procfile.dev were. Agent explained: Procfile.dev lists processes bin/dev starts; Solid Queue is Rails 8's built-in background job system (like a to-do list for slow work). User then chose not to include it in Phase 1.

---

## Kamal 2 Deploy Verification Target

### Q1: What does 'deploys as a single container' mean for Phase 1 verification?

| Option | Description | Selected |
|--------|-------------|----------|
| Docker image builds locally — no real VPS deploy in Phase 1 | Scaffold Dockerfile + deploy.yml. Verify docker build . succeeds. No registry push. | ✓ |
| Deploy to a real VPS in Phase 1 | Full kamal setup + deploy + health check. Requires VPS + registry + SSH. | |
| You decide | Agent picks — likely build locally. | |

**User's choice:** Docker image builds locally — no real VPS deploy in Phase 1

### Q2: Should the Dockerfile build Vue in the build stage, or expect pre-built assets?

| Option | Description | Selected |
|--------|-------------|----------|
| Multi-stage: build Vue inside Docker (Recommended) | Node stage runs bin/vite build → public/. One docker build produces complete image. | ✓ |
| Pre-build Vue locally, Docker only builds Rails | Run bin/vite build locally first. Simpler Dockerfile but requires pre-build step. | |
| You decide | Agent picks — likely multi-stage. | |

**User's choice:** Multi-stage: build Vue inside Docker (Recommended)

### Q3: Should config/deploy.yml be scaffolded in Phase 1, or deferred?

| Option | Description | Selected |
|--------|-------------|----------|
| Scaffold now with placeholders (Recommended) | Generate config/deploy.yml with placeholder server/registry values. Reviewable now. | ✓ |
| Defer entirely to when you have a VPS | No deploy.yml in Phase 1. Only Dockerfile. Kamal setup is a later step. | |
| You decide | Agent picks — likely scaffold with placeholders. | |

**User's choice:** Scaffold now with placeholders (Recommended)

---

## the agent's Discretion

- **Env wiring (D-03):** Exact mechanism for loading dotenvx-encrypted .env.bggeek in Rails (dotenv gem encrypted support vs custom initializer vs build-step decrypt). Locked constraint: encrypted file committed, key gitignored.
- **GraphQL limit values (D-08):** Specific max_depth and max_complexity numeric values.
- **Health query shape (D-06):** Whether health query returns string, JSON status, or structured HealthCheck type.

## Deferred Ideas

None — discussion stayed within phase scope.