---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
current_phase: 03
current_phase_name: graphql-api-collection-surface-v1-parity
status: executing
stopped_at: Completed 03-02-PLAN.md
last_updated: "2026-07-07T05:15:47.725Z"
last_activity: 2026-07-07
last_activity_desc: Phase 03 execution started
progress:
  total_phases: 4
  completed_phases: 2
  total_plans: 13
  completed_plans: 9
  percent: 50
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-06-30)

**Core value:** Let a group of friends merge their BGG collections and pick games everyone can play for boardgame night.
**Current focus:** Phase 03 — graphql-api-collection-surface-v1-parity

## Current Position

Phase: 03 (graphql-api-collection-surface-v1-parity) — EXECUTING
Plan: 4 of 7
Status: Ready to execute
Last activity: 2026-07-07 — Phase 03 execution started

Progress: [██████░░░░] 62% (Phase 1 ✅, Phase 2 ✅ — 4 phases total)

## Performance Metrics

**Velocity:**

- Total plans completed: 6
- Average duration: ~24 min (Phase 2 was faster than Phase 1)
- Total execution time: ~3h 8m (Phase 1: 2h 23m + Phase 2: ~45m)

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 1. Foundation & Monorepo Shell | 3 | 2h 23m | 48 min |
| 2. BGG Integration Layer + Persistence | 3 | ~45m | 15 min |
| 3. GraphQL API + Collection Surface | 0 | — | — |
| 4. Auth + Friend Groups + Session Lifecycle | 0 | — | — |

**Recent Trend:**

- Phase 2 velocity: ~15 min/plan (Client/RateLimiter/Normalizer: 18m, Models/Persister: 12m, CollectionFetcher/Job: ~15m)
- Trend: BGG data layer plans were fast — well-scoped with clear dependencies

*Updated after each plan completion*
| Plan | Duration | Tasks | Files |
|------|----------|-------|-------|
| Phase 01 P01 | 35min | 4 tasks | 22 files |
| Phase 01 P02 | 78min | 3 tasks | 23 files |
| Phase 01 P03 | 30min | 3 tasks | 5 files |
| Phase 02 P01 | 18min | 3 tasks | 10 files |
| Phase 02 P02 | 12min | 3 tasks | 12 files |
| Phase 02 P03 | ~15min | 2 tasks | 5 files |
| Phase 03 P01 | 16min | 2 tasks | 15 files |
| Phase 03 P05 | 3 min | 2 tasks | 8 files |
| Phase 03 P02 | 10min | 2 tasks | 12 files |

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
- **CollectionFetcher merge strategy:** XML-level merge (Nokogiri) of two BGG calls — keeps Normalizer as the sole hash-creation path.
- **ImportCollectionJob param pattern:** Takes username (String), not User object — validates existence on BGG inside the job; looks up local User by bgg_username before persisting.
- **CollectionPersister interface:** `Bgg::CollectionPersister.new(user: user).persist_collection!(collection)` — takes keyword arg, not positional username.
- **Full pipeline complete:** Client → RateLimiter → CollectionFetcher → Normalizer → CollectionPersister → DB — all backed by Solid Queue with concurrency control.
- [Phase 03]: Shared ThingFields module for ThingType and MergedThingType — Keeps the v1-essential field list in one place and avoids drift between ThingType and MergedThingType.
- [Phase 03]: OwnerType delegates to BggCollection.user — Matches the planned OwnersLoader pattern that batches BggCollection records; no extra N+1 because user is eager-loaded.
- [Phase 03]: SyncStatusEnum GraphQL name is SyncStatus — Matches the planned GraphQL contract (SyncStatus enum) while keeping the Ruby class name SyncStatusEnum.
- [Phase 03]: Captured Phase 3 architecture decisions in ADR-003 through ADR-007 — These ADRs document GraphQL Dataloader, Solid trifecta, async BGG import, Apollo cache, and dry-rails contracts
- [Phase 03]: Extended ADR README to index ADR-001 through ADR-007 for full project traceability — Indexing all ADRs in one README makes past decisions discoverable for future maintenance
- [Phase 03]: Marked Phase 3 RESEARCH.md Open Questions as RESOLVED with ADR references — Each open question now points to the ADR that provides the architectural rationale for its resolution
- [Phase ?]: Return UserSyncStatus structs with status READY for all requested usernames on the read path; subscriptions will be added in Plan 03-03.
- [Phase ?]: Use a direct Ruby Struct (SyncStatus) for the UserSyncStatus resolver payload because sync status is currently transient.
- [Phase ?]: GameCard renders owner avatars inline as deterministic colored initials rather than importing the not-yet-existing MemberAvatar component (Plan 03-06).

### Pending Todos

None yet.

### Blockers/Concerns

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

Last session: 2026-07-07T05:15:47.718Z
Stopped at: Completed 03-02-PLAN.md
Resume file: None
