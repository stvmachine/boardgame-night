---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
current_phase: 2
current_phase_name: BGG Integration Layer + Persistence
status: ready
stopped_at: Phase 2 Plan 02 complete
last_updated: "2026-07-03T01:45:00Z"
last_activity: 2026-07-03
last_activity_desc: Phase 1 ✅, ready for Phase 2
progress:
  total_phases: 4
  completed_phases: 1
  total_plans: 7
  completed_plans: 5
  percent: 57
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-06-30)

**Core value:** Let a group of friends merge their BGG collections and pick games everyone can play for boardgame night.
**Current focus:** Phase 2 — BGG Integration Layer + Persistence

## Current Position

Phase: 2 — BGG Integration Layer + Persistence
Plan: 2 — Migrations, Models, CollectionPersister ✅
Status: Plan 02 complete (3/3 tasks, 59/59 tests)
Last activity: 2026-07-03 — Phase 2 Plan 02 ✅

Progress: [███░░░░░░░] 29% (Phase 1 complete, Phase 2 Plan 02 complete — 4 phases total)

## Performance Metrics

**Velocity:**

- Total plans completed: 6
- Average duration: 48 min
- Total execution time: 2h 23m

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 1. Foundation & Monorepo Shell | 3 | 2h 23m | 48 min |
| 2. BGG Integration Layer + Persistence | 2 | ~30m | 15m |
| 3. GraphQL API + Collection Surface | 0 | — | — |
| 4. Auth + Friend Groups + Session Lifecycle | 0 | — | — |
| 1 | 3 | - | - |

**Recent Trend:**

- Last 5 plans: 78 min (plan 02), 35 min (plan 01), 30 min (plan 03)
- Trend: Docker/deploy scaffolding is fastest (30 min)

*Updated after each plan completion*
| Phase 01 P01 | 35min | 4 tasks | 22 files |
| Phase 01 P02 | 78min | 3 tasks | 23 files |
| Phase 01 P03 | 30min | 3 tasks | 5 files |
| Phase 02 P01 | 18min | 3 tasks | 10 files |
| Phase 02 P02 | 12min | 3 tasks | 12 files |

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- **Roadmap:** v1 scoped to 4 phases (coarse granularity). The game-suggestion engine (SUGG-01/02) is v2-deferred per REQUIREMENTS.md — v1 ships manual game picking (SESS-05), not the engine.
- **Architecture:** Rails 8 API-only + Vue 3 SPA monorepo, single GraphQL endpoint, single Kamal 2 deploy. Rails owns all BGG communication (credentials server-side).
- **Stack pins:** Apollo 3.14.1 + @vue/apollo-composable 4.2.2 (Apollo 4 incompatible with composable v5 still in beta). GraphQL::Dataloader (not graphql-batch). dry-validation contracts (not strong_params).
- **Ruby version:** 3.4.9 used (3.4.10 not in ruby-build); functionally equivalent.
- **Docker build:** `npm install --ignore-scripts --force` used instead of `npm ci` — fsevents is a non-optional dep but macOS-only; `--force` needed for Linux Docker build.
- **SPA serving:** Vite build manifest → `bin/generate-index-html.mjs` generates `public/index.html` because `vite-plugin-ruby` only outputs hashed assets + manifest, not an HTML entry file.
- **E2E testing:** Playwright webServer uses `bin/dev-e2e` wrapper for nvm + rbenv init (default shell is fish).
- **Migration 1 (CreateUsers):** Includes email, password_digest, bgg_username from the start (instead of deferring to Phase 4) — avoids incremental column-add migrations.
- **User model:** Uses `has_secure_password` from Phase 2; specs provide passwords on create; provisional profiles created by CollectionPersister need password handling.
- **Normalizer key mapping:** Collection items use `:id` key (from `item["objectid"]`) — CollectionPersister must match this.
- **Expansion filtering:** D-10 filtering happens at the BGG API level via `excludesubtype=boardgameexpansion` in CollectionFetcher (Plan 03), not in Normalizer or CollectionPersister.
- **Model testing:** Uses shoulda-matchers for one-liner validation/association specs; direct model construction (no FactoryBot).

### Pending Todos

None yet.

### Blockers/Concerns

- **Phase 2 (research-flagged HIGH):** BGG quirks (202 semantics, expansion-subtype bug, mixed-content XML arrays) + cross-worker rate-limit locking on SQLite need fixture-driven research during planning.
- **Phase 4 (research-flagged MEDIUM):** The no-account-RSVP → provisional-profile → optional-upgrade attendee/invite data model needs design before execution.

## Deferred Items

Items acknowledged and carried forward (v2 per REQUIREMENTS.md):

| Category | Item | Status | Deferred At |
|----------|------|--------|-------------|
| Suggestion engine | SUGG-01 (session-scoped poll-based scoring) | v2 | 2026-07-01 |
| Suggestion engine | SUGG-02 (BGG-poll best-player-count filter) | v2 | 2026-07-01 |
| Voting | VOTE-01, VOTE-02 (ranked voting, "who brings it") | v2 | 2026-07-01 |
| RSVP | RSVP-01 (4-state RSVP) | v2 | 2026-07-01 |
| Sessions | SESS-07 (recurring) | v2 | 2026-07-01 |
| Filters | FACET-01 (mechanic/category facets) | v2 | 2026-07-01 |
| Play logging | PLAY-01, FRESH-01, AVAIL-01, HISTORY-01, STATS-01 | v2 | 2026-07-01 |

## Session Continuity

Last session: 2026-07-03T01:45:00Z
Stopped at: Phase 2 Plan 02 complete — ready for Plan 02-03 (CollectionFetcher + ImportCollectionJob)
Resume file: .planning/phases/02-bgg-integration-layer-persistence/02-03-PLAN.md
