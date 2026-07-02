---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
current_phase: 1
current_phase_name: Foundation & Monorepo Shell
status: executing
stopped_at: Phase 1 context gathered
last_updated: "2026-07-03T08:51:00.000Z"
last_activity: 2026-07-03
last_activity_desc: Completed plan 02 (Vue frontend shell) — 2/3 plans done
progress:
  total_phases: 4
  completed_phases: 0
  total_plans: 3
  completed_plans: 2
  percent: 67
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-06-30)

**Core value:** Let a group of friends merge their BGG collections and pick games everyone can play for boardgame night.
**Current focus:** Phase 1 — Foundation & Monorepo Shell

## Current Position

Phase: 1 (Foundation & Monorepo Shell) — EXECUTING
Plan: 3 of 3
Status: Ready to execute
Last activity: 2026-07-03 — Completed plan 02 (Vue frontend shell)

Progress: [██████░░░░] 67%

## Performance Metrics

**Velocity:**

- Total plans completed: 2
- Average duration: 57 min
- Total execution time: 1h 53m

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 1. Foundation & Monorepo Shell | 2 | 1h 53m | 57 min |
| 2. BGG Integration Layer + Persistence | 0 | — | — |
| 3. GraphQL API + Collection Surface | 0 | — | — |
| 4. Auth + Friend Groups + Session Lifecycle | 0 | — | — |

**Recent Trend:**

- Last 5 plans: 78 min (plan 02), 35 min (plan 01)
- Trend: 78 min (frontend scaffold is heavier than backend scaffold)

*Updated after each plan completion*
| Phase 01 P01 | 35min | 4 tasks | 22 files |
| Phase 01 P02 | 78min | 3 tasks | 23 files |

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- **Roadmap:** v1 scoped to 4 phases (coarse granularity). The game-suggestion engine (SUGG-01/02) is v2-deferred per REQUIREMENTS.md — v1 ships manual game picking (SESS-05), not the engine.
- **Architecture:** Rails 8 API-only + Vue 3 SPA monorepo, single GraphQL endpoint, single Kamal 2 deploy. Rails owns all BGG communication (credentials server-side).
- **Stack pins:** Apollo 3.13.9 + @vue/apollo-composable 4.2.2 (NOT Apollo 4 — incompatible with composable v5 still in beta). GraphQL::Dataloader (not graphql-batch). dry-validation contracts for all mutations (not strong_params).
- [Phase 01]: Ruby 3.4.9 used instead of 3.4.10 (3.4.10 not in ruby-build; latest 3.4.x available) — Version compatibility — 3.4.10 not in ruby-build yet. 3.4.9 is functionally equivalent.
- [Phase 01]: dotenvx keys file renamed from .env.keys to .env.bggeek.keys with -fk flag in Procfile.dev for explicit per-file key association — dotenvx v1.75 defaults to .env.keys; renamed to match plan convention and allow per-file key isolation
- [Phase 01]: Introspection-off test uses subclass approach because the class-body guard is evaluated at load time and cannot be dynamically env-stubbed in RSpec — Rails.env stubbing ineffective for class-body-level guard that runs at load time
- [Phase 1]: Vite root serving via empty publicOutputDir: set publicOutputDir to empty string and autoBuild to false in config/vite.json development section to serve SPA at root URL instead of /vite-dev/ prefix
- [Phase 1]: Rails port forced to 3000 via -p flag in Procfile.dev (Rails 8 defaults to 5000)
- [Phase 1]: Apollo 3.x path maintained: 3.14.1 + @vue/apollo-composable 4.2.2 (Apollo 4 + composable v5 still beta/incompatible)
- [Phase 1]: Playwright webServer uses bin/dev-e2e wrapper for nvm + rbenv init (default shell is fish; bash -c needs explicit init)

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

Last session: 2026-07-03T08:51:00.000Z
Stopped at: Completed plan 02 — Vue frontend shell
Resume file: .planning/phases/01-foundation-monorepo-shell/01-02-SUMMARY.md
