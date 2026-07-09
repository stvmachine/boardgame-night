---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: executing
stopped_at: Phase 04 plans verified, ready for execution
last_updated: "2026-07-09T07:09:50.478Z"
last_activity: 2026-07-09
last_activity_desc: Phase null execution started
progress:
  total_phases: 4
  completed_phases: 3
  total_plans: 21
  completed_plans: 18
  percent: 75
current_phase: 04
current_phase_name: auth-friend-groups-session-lifecycle
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-06-30)

**Core value:** Let a group of friends merge their BGG collections and pick games everyone can play for boardgame night.
**Current focus:** Phase null

## Current Position

Phase: null — EXECUTING
Plan: 1 of ?
Status: Executing Phase null
Last activity: 2026-07-09 — Phase null execution started

Progress: [██████████░░] 75% (Phase 1 ✅, Phase 2 ✅, Phase 3 ✅, Phase 4 planned — 4 phases total)

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
| Phase 03-graphql-api-collection-surface-v1-parity P06 | 27min | 3 tasks | 14 files |
| Phase 03-graphql-api-collection-surface-v1-parity P03 | 30min | 2 tasks | 29 files |
| Phase 03 P03-04 | 29min | 2 tasks | 23 files |
| Phase 03-graphql-api-collection-surface-v1-parity P07 | 130 | 3 tasks | 23 files |
| Phase 03-graphql-api-collection-surface-v1-parity P08 | 7 min | 2 tasks | 7 files |
| Phase 03-graphql-api-collection-surface-v1-parity P09 | 8min | 2 tasks | 7 files |
| Phase 03-graphql-api-collection-surface-v1-parity P10 | 18min | 1 tasks | 10 files |
| Phase 03-graphql-api-collection-surface-v1-parity P11 | 13min | 2 tasks | 6 files |
| Phase 04 P01 | 25min | 2 tasks | 49 files |

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
- [Phase ?]: Created the minimal ui Pinia store in Task 1 because AppHeader requires sidebarOpen; Task 3 only extended it with theme. — AppHeader needs a sidebar toggle as part of the mobile shell, so the ui store was created earlier than the plan scheduled.
- [Phase ?]: Used Fuse keys ['name', 'originalname'] with threshold 0.3 because the generated MergedThing type does not include a nested name.text field. — The planned keys ['name', 'name.text', 'originalname'] assumed a nested name object; the generated MergedThing exposes name as a string, so keys were adjusted to match the available data shape.
- [Phase ?]: Used Bgg::ServiceError instead of Bgg::Errors::ServiceError to match existing codebase convention
- [Phase ?]: Switched Mutations::BaseMutation from GraphQL::Schema::RelayClassicMutation to GraphQL::Schema::Mutation for direct username argument
- [Phase ?]: Used Dry::Validation::Contract for ApplicationContract because Dry::Rails::Contract is not a provided constant
- [Phase ?]: Added cable/cache/queue database roles in test environment to support Solid Cable tests
- [Phase ?]: Added graphql:schema:dump Rake task because the project did not expose one
- [Phase ?]: Split discovery types into separate files per Zeitwerk convention — A single discovery_types.rb defining Types::HotItemType etc. violates Rails Zeitwerk; separate files match class names and avoid NameError on boot.
- [Phase ?]: Implemented format-only username validation; BGG existence check deferred — The plan scoped validateBggUsername to format validation. BGG existence check will be added when the import flow needs to reject non-existent usernames before queueing Solid Queue jobs.
- [Phase 03-graphql-api-collection-surface-v1-parity]: Created a dedicated Pinia filter store so filter and selected-owner state can be shared between Sidebar and CollectionView without prop drilling.
- [Phase 03-graphql-api-collection-surface-v1-parity]: Made the collectors store the canonical owner of the usernames list and route query sync; removed the Sidebar's duplicate URL watcher.
- [Phase 03-graphql-api-collection-surface-v1-parity]: Implemented usePermalink with URLSearchParams and history.replaceState to preserve filters, sort, group, and owner selection across reloads without router navigation loops.
- [Phase 03-graphql-api-collection-surface-v1-parity]: Used a Rails rake task + Playwright globalSetup for e2e fixtures so tests do not depend on live BGG or credentials.
- [Phase ?]: CollapsibleGroup uses initiallyOpen + watcher to allow both local toggles and parent batch control — Keeps the UI-SPEC prop contract while making expand-all/collapse-all functional
- [Phase ?]: Inline SVG chevron used instead of installing lucide-vue-next — Avoids adding a new dependency not required by the plan
- [Phase 03-graphql-api-collection-surface-v1-parity]: Included the existing collector remove list inside the Collectors collapsible section so removal functionality is preserved and the entire collector area is toggled together. — The plan did not explicitly address the pre-existing remove list; keeping it inside the collapsible section preserves the remove action while matching the UI-SPEC sidebar layout.
- [Phase 03-graphql-api-collection-surface-v1-parity]: Bound CollapsibleSection open state directly to uiStore refs and updated them from the emitted toggle event, keeping the component fully controlled without extra model plumbing. — The plan required toggle actions on the ui store; direct assignment from the toggle event avoids double-toggle issues and keeps the component controlled.
- [Phase ?]: Cache raw XML strings in Rails.cache for BGG collection responses because Nokogiri::XML::Document is not Marshal-serializable. — The plan assumed Nokogiri::XML::Document is Marshal-serializable, but Rails.cache raised TypeError. Storing the raw XML string keeps the cache backend-agnostic and avoids depending on Nokogiri internals.
- [Phase ?]: Update QueryType#sync_status_for to read user.last_synced_at so mergedCollection sync statuses return the persisted timestamp. — The plan only specified UserType#sync_status, but mergedCollection uses QueryType#sync_status_for. Returning Time.current there would have continued the WR-03 bug from 03-REVIEW.md.
- [Phase ?]: Memory-only Pinia token (never localStorage) prevents XSS token theft
- [Phase ?]: DB-backed Session with CSPRNG token (not JWT) enables server-side revocation
- [Phase ?]: rack-attack 5/min per IP rate limiting for auth endpoints prevents brute-force

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

Last session: 2026-07-09T07:08:11.955Z
Stopped at: Phase 04 plans verified, ready for execution
Resume file: .planning/phases/04-auth-friend-groups-session-lifecycle/04-01-PLAN.md
