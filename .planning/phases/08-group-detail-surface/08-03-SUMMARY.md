---
phase: 08-group-detail-surface
plan: 03
subsystem: ui + api
tags: [graphql, ruby-on-rails, vue, apollo, authorization, tailwind]

requires:
  - phase: 08-group-detail-surface
    plan: 01
    provides: bounded Group hub query, viewer role, sessions field
  - phase: 08-group-detail-surface
    plan: 02
    provides: GroupDetail composition with header and sessions list

provides:
  - Authorized, bounded, deterministic shared-collection spotlight resolver
  - Group-scoped owner attribution batched through OwnersLoader
  - Compact four-game spotlight cards beneath sessions
  - Synchronized schema/codegen client contract
  - Focused backend and frontend regressions for D-09, D-10, D-11

affects:
  - 08-group-detail-surface
  - 08-04

tech-stack:
  added: []
  patterns:
    - "GraphQL wrapper value (GroupSpotlightThing) carries in-group member ids for scoped batched owner loading"
    - "SQL ordering by owner-count DESC, average DESC, LOWER(name) ASC, id ASC with Arel.sql for raw expressions"
    - "Optional immutable user-id scope on Dataloader source preserves existing unscoped consumers"
    - "Compact spotlight card: thumbnail/fallback, rating badge, capped avatar stack + overflow, BGG new-tab opener isolation"

key-files:
  created:
    - app/graphql/types/group_spotlight_thing_type.rb
    - app/frontend/components/group/GroupCollectionSpotlight.vue
  modified:
    - app/graphql/types/group_type.rb
    - app/graphql/loaders/owners_loader.rb
    - spec/graphql/group_query_spec.rb
    - app/frontend/apollo/queries/group.graphql
    - schema.graphql
    - schema.json
    - app/frontend/generated/types.ts
    - app/frontend/generated/operations.ts
    - app/frontend/components/group/GroupDetail.vue
    - spec/frontend/GroupDetail.spec.ts

key-decisions:
  - "Use a dedicated wrapper value (GroupSpotlightThing) to carry the immutable group-member id list for scoped owner loading, keeping the type independent of MergedThingType and the global owner resolver unchanged."
  - "Keep OwnersLoader backward-compatible by making the user-id scope optional; unscoped callers continue to receive all collections in input order."
  - "Apply viewer_role guard to both collection_spotlight and the existing collection resolver so outsiders cannot read the full shelf or its preview."
  - "Use RouterLink for Browse Library and provide a test router in specs; cards use window.open with noopener,noreferrer for BGG activation."

requirements-completed:
  - GROUP-09

coverage:
  - id: D-09
    description: "Spotlight returns at most four games ordered by distinct in-group owner count descending, then average descending, then case-insensitive name ascending, then id ascending."
    requirement: GROUP-09
    verification:
      - kind: unit
        ref: "spec/graphql/group_query_spec.rb#orders multi-owner games before single-owner games"
        status: pass
      - kind: unit
        ref: "spec/graphql/group_query_spec.rb#breaks ties by average descending, then name case-insensitive ascending, then id ascending"
        status: pass
    human_judgment: false
  - id: D-10
    description: "Fewer than four multi-owner games are filled by highest-rated single-owner games; empty state appears only for a truly empty group shelf."
    requirement: GROUP-09
    verification:
      - kind: unit
        ref: "spec/graphql/group_query_spec.rb#fills remaining slots with single-owner games when fewer than four multi-owner games exist"
        status: pass
      - kind: unit
        ref: "spec/graphql/group_query_spec.rb#returns an empty array when the group collection is empty"
        status: pass
    human_judgment: false
  - id: D-11
    description: "Compact spotlight cards show thumbnail/fallback, title, one-decimal rating, and at most three owner avatars plus exact +N overflow."
    requirement: GROUP-09
    verification:
      - kind: automated_ui
        ref: "spec/frontend/GroupDetail.spec.ts#caps owner avatars at three and shows exact +N overflow"
        status: pass
      - kind: automated_ui
        ref: "spec/frontend/GroupDetail.spec.ts#shows thumbnail image when present and fallback when absent"
        status: pass
    human_judgment: false
  - id: T-08-09
    description: "Outsiders receive no spotlight or full collection from a known invite code."
    requirement: GROUP-09
    verification:
      - kind: unit
        ref: "spec/graphql/group_query_spec.rb#returns no collection for outsiders"
        status: pass
      - kind: unit
        ref: "spec/graphql/group_query_spec.rb#returns no spotlight for outsiders"
        status: pass
    human_judgment: false
  - id: T-08-10
    description: "Spotlight owner attribution is scoped to group members only."
    requirement: GROUP-09
    verification:
      - kind: unit
        ref: "spec/graphql/group_query_spec.rb#excludes out-of-group owners from spotlight attribution"
        status: pass
    human_judgment: false
  - id: T-08-11
    description: "collectionSpotlight(limit:) is clamped to 1..12 and executed with a database LIMIT."
    requirement: GROUP-09
    verification:
      - kind: unit
        ref: "spec/graphql/group_query_spec.rb#clamps limits below 1 to 1"
        status: pass
      - kind: unit
        ref: "spec/graphql/group_query_spec.rb#clamps limits above 12 to 12"
        status: pass
    human_judgment: false
  - id: D-01/D-02
    description: "Spotlight is placed after sessions in both DOM/source order and inside the main column."
    requirement: GROUP-09
    verification:
      - kind: automated_ui
        ref: "spec/frontend/GroupDetail.spec.ts#places spotlight after sessions in source order"
        status: pass
    human_judgment: false

duration: 14min
completed: 2026-07-15
status: complete
---

# Phase 8 Plan 3: Shared Collection Spotlight Summary

**Bounded, deterministic four-game shared-collection spotlight with group-scoped owner attribution and compact social cards.**

## Performance

- **Duration:** 14 min
- **Started:** 2026-07-15T03:41:19Z
- **Completed:** 2026-07-15T03:55:05Z
- **Tasks:** 3
- **Files modified:** 11

## Accomplishments

- Implemented an authorized, deterministic `GroupType.collection_spotlight(limit:)` resolver with SQL ordering by owner count, rating, name, and id.
- Created `Types::GroupSpotlightThing` wrapper and type, enabling scoped batched owner loading while keeping the public shape compact.
- Extended `Loaders::OwnersLoader` with an optional immutable user-id scope without changing existing unscoped consumers.
- Applied the same `viewer_role` guard to the existing `GroupType.collection` resolver to prevent full-shelf disclosure to outsiders.
- Published the bounded spotlight client contract by adding `collectionSpotlight(limit: 4)` to `group.graphql` and regenerating `schema.graphql`, `schema.json`, and Vue Apollo types/operations.
- Built `GroupCollectionSpotlight.vue` with compact cards, thumbnail/fallback, rating badge, capped owner avatar stack, exact overflow, and BGG new-tab opener isolation.
- Composed the spotlight immediately after `GroupSessionsList` in `GroupDetail.vue`, preserving the approved source order and desktop/mobile layout.
- Added focused backend and component regressions covering ordering, cardinality, bounds, empty shelves, owner scope, outsider denial, and keyboard/BGG activation.

## Task Commits

Each task was committed atomically:

1. **Task 1 RED:** Add failing GraphQL examples for bounded collection spotlight - `c788a60` (test)
2. **Task 1 GREEN:** Implement bounded, deterministic group collection spotlight - `78877b4` (feat)
3. **Task 2:** Publish bounded spotlight client contract - `507401b` (feat)
4. **Task 3 RED:** Add GroupCollectionSpotlight component specs and GroupDetail composition tests - `f29cf21` (test)
5. **Task 3 GREEN:** Render compact shared-collection spotlight cards beneath sessions - `2531f39` (feat)

## Files Created/Modified

- `app/graphql/types/group_spotlight_thing_type.rb` — Wrapper value and GraphQL type for spotlight items.
- `app/graphql/types/group_type.rb` — Added `collection_spotlight` resolver, applied `viewer_role` guard to `collection`.
- `app/graphql/loaders/owners_loader.rb` — Optional immutable user-id scope.
- `spec/graphql/group_query_spec.rb` — Spotlight ordering, cardinality, bounds, empty state, owner scope, and outsider denial tests.
- `app/frontend/apollo/queries/group.graphql` — Bounded hub query now requests `collectionSpotlight(limit: 4)`.
- `schema.graphql` / `schema.json` — Regenerated from Rails schema.
- `app/frontend/generated/types.ts` / `app/frontend/generated/operations.ts` — Regenerated from schema and operations.
- `app/frontend/components/group/GroupCollectionSpotlight.vue` — New compact four-game spotlight component.
- `app/frontend/components/group/GroupDetail.vue` — Composes spotlight after sessions; removed unused full-collection computed.
- `spec/frontend/GroupDetail.spec.ts` — Spotlight card, overflow, BGG activation, empty state, and source-order tests.

## Decisions Made

- Use a dedicated `GroupSpotlightThing` wrapper to carry the immutable group-member id list, keeping the type independent of `MergedThingType` and the unscoped owner loader untouched.
- Keep the user-id scope optional on `OwnersLoader` so existing collection and suggestion surfaces continue to work without code changes.
- Clamp the `limit` argument to `1..12` at the resolver boundary to prevent unbounded queries.
- Apply the same `viewer_role` guard to the full `collection` resolver, closing the outsider full-shelf disclosure path.
- Use `RouterLink` for Browse Library and provide a test router in specs; cards use `window.open(..., 'noopener,noreferrer')` for BGG activation.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- Rails 8 rejected the raw SQL `ORDER BY` string in `BggThing.order(...)` with `UnknownAttributeReference`. Resolved by wrapping the controlled, non-interpolated expression in `Arel.sql(...)`.
- Component tests initially failed because `RouterLink` requires a provided vue-router instance. Resolved by adding a test router plugin to `GroupCollectionSpotlight` and `GroupDetail` mounts, plus a `/collection` route stub.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Plan 08-04 can extend the `/collection?group=<inviteCode>` route behavior; the Browse Library link is already wired.
- Plan 08-05 can build on the same `GroupCollectionSpotlight` patterns for members and invite controls.
- No blockers.

## Threat Flags

No new security-relevant surface beyond the plan's threat model. All mitigations are implemented:

| Threat ID | Mitigation | Status |
|-----------|------------|--------|
| T-08-09 | `viewer_role` guard on `collection_spotlight` and `collection` | Mitigated |
| T-08-10 | Scoped `OwnersLoader` with frozen group-member ids | Mitigated |
| T-08-11 | `limit` clamped to 1..12 with database `LIMIT` | Mitigated |
| T-08-12 | BGG URL built from typed id, opened with `noopener,noreferrer` | Mitigated |

## Known Stubs

No unresolved stubs that prevent the plan's goal. The **Browse Library** link is intentionally a route shell (`/collection?group=<inviteCode>`) owned by Plan 08-04; it is wired and functional once the route is implemented.

## Self-Check: PASSED

- All created/modified files exist on disk.
- All task commits exist in git history (`c788a60`, `78877b4`, `507401b`, `f29cf21`, `2531f39`).
- `spec/graphql/group_query_spec.rb` passes (22 examples, 0 failures).
- `spec/frontend/GroupDetail.spec.ts` passes (23 tests).
- Full frontend suite passes (107 tests across 19 files).
- `bin/rails graphql:schema:dump` completed successfully.
- `npm run codegen` completed successfully.
- `npm run build` completed successfully.
- Pre-existing `tests/e2e/fixtures/e2e_session.json` modification and `.planning/config.json` changes were not touched.

*Self-check completed: 2026-07-15*

---
*Phase: 08-group-detail-surface*
*Completed: 2026-07-15*
