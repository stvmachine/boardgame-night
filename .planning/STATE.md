---
gsd_state_version: 1.0
milestone: v1.1
milestone_name: UI Redesign + Suggestion Engine
current_phase: 8
current_phase_name: Group Detail Surface
status: verifying
stopped_at: Completed 07-02-PLAN.md
last_updated: "2026-07-14T15:54:27.201Z"
last_activity: 2026-07-14
last_activity_desc: Phase 07 complete, transitioned to Phase 8
progress:
  total_phases: 11
  completed_phases: 7
  total_plans: 32
  completed_plans: 32
  percent: 64
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-07-14)

**Core value:** Let a group of friends merge their BGG collections and pick games everyone can play for boardgame night.
**Current focus:** Phase 07 — suggestion-engine-backend

## Current Position

Phase: 8 — Group Detail Surface
Plan: Not started
Status: Phase complete — ready for verification
Last activity: 2026-07-14 — Phase 07 complete, transitioned to Phase 8

Progress: [██████████░] 97% of planned plans (6 of 11 phases complete; 31/32 plans done)

## Performance Metrics

**Velocity:**

- Total plans completed: 31
- Average duration: ~24 min
- Total execution time: ~3h 8m (v1.0 phases 1-2 baseline)

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 1. Foundation & Monorepo Shell | 3 | 2h 23m | 48 min |
| 2. BGG Integration Layer + Persistence | 3 | ~45m | 15 min |
| 3. GraphQL API + Collection Surface (v1 Parity) | 11 | ~4h 30m | ~25 min |
| 4. Auth + Friend Groups + Session Lifecycle | 4 | ~3h 6m | ~47 min |
| 5. Design System Foundation | TBD | — | — |
| 6. BGG Poll Data Layer | 3 | ~19m | ~6 min |
| 7. Suggestion Engine Backend | TBD | — | — |
| 8. Group Detail Surface | TBD | — | — |
| 9. Home & Collection Redesign | TBD | — | — |
| 10. Picking a Game Redesign | TBD | — | — |
| 11. Polish & E2E Hardening | TBD | — | — |
| 06 | 3 | - | - |
| 07 | 4 | - | - |

**Recent Trend:**

- v1.0 phase 4 velocity: ~47 min/plan (auth, groups, sessions are feature-dense)
- Trend: Plan durations scale with UI + backend integration complexity; expect v1.1 UI phases to land in the 30-60 min/plan range

| Phase 05 P01 | 45min | 8 tasks | 8 files |
| Phase 05 P04 | 15min | 1 tasks | 90 files |
| Phase 05 P03 | 15min | 2 tasks | 18 files |
| Phase 06-bgg-poll-data-layer P01 | 7min | 2 tasks | 10 files |
| Phase 06 P02 | 8min | 2 tasks | 9 files |
| Phase 06-bgg-poll-data-layer P03 | 4 min | 2 tasks | 11 files |
| Phase 07 P01 | 40min | 3 tasks | 11 files |
| Phase 07-suggestion-engine-backend P02 | 40min | 3 tasks | 14 files |
| Phase 07-suggestion-engine-backend P03 | 15min | 3 tasks | 8 files |
| Phase 07 P04 | 15min | 2 tasks | 7 files |

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- **Milestone:** v1.1 roadmap splits into 7 phases (5-11) covering design system, poll data, suggestion engine, Group Detail, Home/Collection redesign, Picking a Game redesign, and E2E/debt hardening.
- **Critical path:** Design tokens → primitives → suggestion engine → Picking a Game. Poll data backfill runs parallel to the design system but must finish before the engine.
- **Architecture:** Keep v1.0 patterns: Rails 8 API-only + Vue 3 SPA monorepo, single GraphQL endpoint, dry-validation contracts, Solid Queue/Cache, no Redis, Apollo 3.x + @vue/apollo-composable 4.2.2.
- **Stack pins:** Tailwind v4 CSS-first `@theme` for M3 tokens; Material Symbols Outlined; Inter font; indigo primary. Apollo 3.13.9 path remains stable (Apollo 4 + composable v5 still beta).
- [Phase ?]: Use shadcn-vue style 'reka-nova' (New York equivalent in shadcn-vue 2.x) because 'New York' is not a valid CLI option; M3 tokens override default colors anyway.
- [Phase ?]: Uninstall @lucide/vue after shadcn-vue init because the project uses @iconify/vue + Material Symbols for icons, not Lucide.
- [Phase ?]: Follow the plan's explicit Button/Badge sizes and variants rather than shadcn defaults; use only default, sm, lg, icon sizes and primary/secondary/outline/ghost/destructive + default/draft/invited/picking/completed variants
- [Phase ?]: Use explicit M3 Tailwind utility classes (bg-primary, bg-surface-container, border-outline) in primitive class strings rather than relying solely on shadcn CSS variables like bg-card
- [Phase ?]: Replace all shadcn-generated @lucide/vue icon imports with the project's Iconify wrapper (Icon) to maintain the single Material Symbols icon dependency from Plan 05-01
- [Phase 05]: Replaced the hardcoded 15-slot avatar palette with M3 token classes and made useMemberColor return a single class string for AvatarFallback.
- [Phase 05]: Migrated GameCard from a custom article to Card/CardContent/Badge primitives using semantic badge variants (invited, draft).
- [Phase 05]: Removed obsolete Sidebar.spec.ts and updated AppShell.spec.ts to test the new NavSidebar/NavDrawer shell.
- [Phase 06-bgg-poll-data-layer]: Schema stores generic poll name so future poll types can reuse tables; only suggested_numplayers parsed for v1 — Keeps schema forward-compatible while limiting v1 scope to the only poll type needed by the suggestion engine
- [Phase 06-bgg-poll-data-layer]: Added nullable level column to bgg_poll_results for forward compatibility — Avoids a future migration if language_dependence or other polls need a level field
- [Phase 06-bgg-poll-data-layer]: poll_data_fetched_at is stamped even when a thing has no suggested_numplayers poll — Prevents infinite backfill loops for games that genuinely lack poll data
- [Phase 06-bgg-poll-data-layer]: PollPersister implemented as class methods matching Bgg::PollPersister.persist_from_thing_xml behavior — Simpler caller API with no instance state needed; aligns with plan specification
- [Phase ?]: Rescued Bgg::ResourceNotFound at batch level in enrichment/backfill jobs so a single missing batch does not discard the entire job. — Follows D-08 skip-and-continue pattern and keeps partial backfill progress even when one batch returns 404.
- [Phase ?]: Backfill logs missing IDs and leaves poll_data_fetched_at nil, allowing retry on the next backfill run. — Matches Open Question 2 resolution: do not mark missing IDs as fetched so a subsequent backfill can retry them.
- [Phase 06-bgg-poll-data-layer]: Used GraphQL::Dataloader::Source for poll loading to keep collection list queries O(1) in database round-trips.
- [Phase 06-bgg-poll-data-layer]: Chose the lower player count on a tie for bestPlayerCount so the suggestion engine favors more inclusive options.
- [Phase ?]: Kept Suggestions::Engine pure: no ActiveRecord queries and no BGG calls inside the service
- [Phase ?]: Used existing Loaders::PollsLoader and Loaders::OwnersLoader with load_all in the resolver for O(1) batching
- [Phase ?]: Adopted the locked A1/A2 smoothing and fallback interpretations: +1 smoothing on 20-49 votes with denominator total+2, and linear 0-60 midpoint fallback
- [Phase 07]: Preference edits are restricted to the session host only (not group admins), per D-06
- [Phase 07]: Omitted optional inputs retain DB defaults or current values via filtered contract payload, never overwritten with nil
- [Phase 07]: Complexity preference stays a plain String column validated by contract/model, not a GraphQL enum
- [Phase 07-03]: Centralized BGG poll category comparisons in BggPollResult predicates keeps the engine free of string matching
- [Phase 07-03]: All score components are clamped to 0..100 before entering the weighted total
- [Phase 07-03]: Outsiders now receive a GraphQL ExecutionError instead of a silent null, satisfying the authorization threat model
- [Phase 07-03]: Ownership reasons use display_name sorted alphabetically so they remain stable across identical scores
- [Phase 07-03]: Thin/missing poll data generates a LOW-confidence reason with consistent limited-community-data wording
- [Phase ?]: Kept Suggestion, SuggestionBreakdown, and ConfidenceLevel out of orphan_types because they are reachable through NightSession.suggestions; the new schema spec provides test-backed proof — Avoids redundant orphan_type registration that would mask broken field connections; runtime reachability tests are the canonical proof
- [Phase ?]: Regenerated schema.graphql/schema.json via bin/rails graphql:schema:dump and client types via npm run codegen without hand-editing generated artifacts — Keeps SDL/JSON and TypeScript as generated, source-derived artifacts; eliminates hand-authored divergence risk
- [Phase ?]: Fixed RuboCop Layout/SpaceInsideArrayLiteralBrackets offenses in Phase 7 production files discovered by the integrated gate — Required for the RuboCop acceptance gate to exit 0; changes are whitespace-only and limited to Phase 7 files

### Pending Todos

None yet.

### Blockers/Concerns

None. Two research flags to watch during Phase 1/5 planning:

- Vite 8 (Rolldown) compatibility with Vitest and graphql-codegen; fallback path ready.
- Live BGG `suggested_numplayers` poll XML validation; parser must be tested against real responses.

## Deferred Items

Items acknowledged and carried forward from v1.1 scoping to v2.0:

| Category | Item | Status | Deferred At |
|----------|------|--------|-------------|
| Voting | VOTE-01, VOTE-02 (ranked voting, "who brings it") | v2.0 | 2026-07-13 |
| RSVP | RSVP-01 (4-state RSVP) | v2.0 | 2026-07-13 |
| Sessions | SESS-07 (recurring sessions) | v2.0 | 2026-07-13 |
| Filters | FACET-01 (mechanic/category faceted filters) | v2.0 | 2026-07-13 |
| Play logging | PLAY-01, FRESH-01, AVAIL-01, HISTORY-01, STATS-01 | v2.0 | 2026-07-13 |

## Session Continuity

Last session: 2026-07-14T15:30:47.879Z
Stopped at: Completed 07-02-PLAN.md
Resume file: None
