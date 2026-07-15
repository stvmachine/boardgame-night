---
phase: 08-group-detail-surface
plan: 01
subsystem: api
tags: [graphql, ruby-on-rails, vue, apollo, authorization]

requires:
  - phase: 04-auth-friend-groups-session-lifecycle
    provides: group roles, session lifecycle, membership authorization
  - phase: 07-suggestion-engine-backend
    provides: persisted BGG data and NightSession type used by session summaries

provides:
  - Authoritative role-aware Group sessions field with deterministic ordering
  - Eager-loaded Group resolver with bounded N+1 behavior
  - Bounded Group hub GraphQL operation and dedicated full-collection operation
  - Regenerated schema and Vue Apollo client contracts
  - GamePicker migrated to the full-collection operation

affects:
  - 08-group-detail-surface

tech-stack:
  added: []
  patterns:
    - "Bounded GraphQL hub query: group.graphql fetches only hub-visible fields while group_collection.graphql fetches the full shelf."
    - "Eager-loaded associations in QueryType#group with loaded-association fallback in NightSessionType."
    - "Server-side role/state filtering for session visibility (D-05)."

key-files:
  created:
    - app/frontend/apollo/queries/group_collection.graphql
  modified:
    - app/graphql/types/group_type.rb
    - app/graphql/types/query_type.rb
    - app/graphql/types/night_session_type.rb
    - spec/graphql/group_query_spec.rb
    - app/frontend/apollo/queries/group.graphql
    - app/frontend/apollo/mutations/create_night_session.graphql
    - app/frontend/components/session/GamePicker.vue
    - schema.graphql
    - schema.json
    - app/frontend/generated/types.ts
    - app/frontend/generated/operations.ts

key-decisions:
  - "Use Float::INFINITY as the sort sentinel for undated drafts so they correctly sort after dated drafts; use raw epoch integers for all other date keys."
  - "Keep the loaded-association fallback in NightSessionType so standalone session queries continue to work without eager loads."
  - "Migrate GamePicker to useGroupCollectionQuery to preserve the full collection consumer without changing filtering or pick behavior."

patterns-established:
  - "GroupType#viewer_role derives OWNER from group.owner_id before consulting loaded memberships, matching the existing record-owner authorization contract."
  - "GraphQL session visibility is enforced server-side by state filtering and role gating, not recreated in the client."

requirements-completed:
  - GROUP-08

coverage:
  - id: D1
    description: "Role-aware Group sessions backend with visibility, ordering, and attendee-count eager loading."
    requirement: GROUP-08
    verification:
      - kind: unit
        ref: "spec/graphql/group_query_spec.rb#sessions examples"
        status: pass
    human_judgment: false
  - id: D2
    description: "Bounded Group hub operation and full-collection operation split, both parseable and codegen-ready."
    requirement: GROUP-08
    verification:
      - kind: integration
        ref: "node --input-type=module parse check of group.graphql, group_collection.graphql, create_night_session.graphql"
        status: pass
    human_judgment: false
  - id: D3
    description: "GamePicker compiles against the generated useGroupCollectionQuery and production build succeeds."
    requirement: GROUP-08
    verification:
      - kind: automated_ui
        ref: "npm run build"
        status: pass
    human_judgment: false

duration: 35min
completed: 2026-07-15
status: complete
---

# Phase 08 Plan 01: Group Detail Read Contract Summary

**Role-aware Group sessions field, bounded/full operation split, and generated client contracts, with GamePicker migrated to the full-collection operation.**

## Performance

- **Duration:** 35 min
- **Started:** 2026-07-15T17:45:00Z
- **Completed:** 2026-07-15T18:20:00Z
- **Tasks:** 3
- **Files modified:** 11

## Accomplishments
- Implemented `GroupType#viewer_role` and `GroupType#sessions` with server-side D-05/D-06 filtering and deterministic sorting.
- Eager-loaded `QueryType#group` and loaded-association fallback in `NightSessionType` to bound query counts.
- Split `group.graphql` into a bounded hub query and a new `group_collection.graphql` full-collection operation.
- Expanded `create_night_session.graphql` with `attendeeCount` and `attendances` for downstream Apollo cache insertion.
- Regenerated `schema.graphql`, `schema.json`, `generated/types.ts`, and `generated/operations.ts` from source.
- Migrated `GamePicker.vue` to `useGroupCollectionQuery` while preserving search, player-range warning, and pick behavior.

## Task Commits

Each task was committed atomically:

1. **Task 1: Implement the authoritative role-aware sessions field (RED)** - `854c28b` (test)
2. **Task 1: Implement the authoritative role-aware sessions field (GREEN)** - `2a27834` (feat)
3. **Task 2: Define bounded hub and full-collection operation documents** - `f176193` (feat)
4. **Task 3: Generate client contracts and migrate GamePicker** - `a243bb1` (feat)

## Files Created/Modified
- `app/graphql/types/group_type.rb` - Added `viewer_role` helper and `sessions` field; updated `my_role` to use the helper.
- `app/graphql/types/query_type.rb` - Added eager loading of owner, memberships, and night sessions with attendances/users.
- `app/graphql/types/night_session_type.rb` - Use loaded associations for `attendances` and `attendee_count` when available.
- `spec/graphql/group_query_spec.rb` - Visibility matrix, ordering, nil `scheduledAt`, attendee-count, and N+1 regression coverage.
- `app/frontend/apollo/queries/group.graphql` - Bounded hub query (identity, role, memberships, sessions with attendee summaries).
- `app/frontend/apollo/queries/group_collection.graphql` - Full collection operation with member `bggUsername`.
- `app/frontend/apollo/mutations/create_night_session.graphql` - Expanded session payload with `attendeeCount` and `attendances`.
- `app/frontend/components/session/GamePicker.vue` - Migrated from `useGroupQuery` to `useGroupCollectionQuery`.
- `schema.graphql` / `schema.json` - Regenerated from the Rails schema.
- `app/frontend/generated/types.ts` / `app/frontend/generated/operations.ts` - Regenerated from schema and operation documents.

## Decisions Made
- Sort undated drafts after dated drafts using `Float::INFINITY` rather than a far-future `Time` sentinel, ensuring the sentinel is always greater than any real date.
- Keep the database fallback in `NightSessionType#attendee_count` and `#attendances` so standalone `nightSession` queries remain correct without eager loads.
- Use a minimal query in the N+1 regression test to isolate session/attendance eager loading from the unrelated collection/sync-status queries.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- Initial test expected global IDs for session `id` fields, but the schema returns raw database IDs. Updated the test to compare raw IDs.
- The `Time.at(999_999_999)` sentinel from the research example evaluates to 2001, so it would place undated drafts before dated drafts. Switched to `Float::INFINITY` with integer epoch keys.
- `state.update-progress` and `state.sync` reported updated progress but did not persist the body progress-bar text in `STATE.md`. Manually corrected the progress line to match the handler's intended output after confirming no other pending changes.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Plan 08-02 can consume `Group.sessions`, `Group.memberships`, `Group.myRole`, and the expanded create-session payload.
- Plan 08-04 can consume `GroupCollection` with member BGG usernames.
- No blockers.

## Self-Check: PASSED

- All created/modified files exist on disk.
- All task commits exist in git history (854c28b, 2a27834, f176193, a243bb1).
- Focused `spec/graphql/group_query_spec.rb` passes (12 examples, 0 failures).
- `bin/rails graphql:schema:dump` completed successfully.
- `npm run codegen` completed successfully.
- `npm run build` completed successfully.
- Pre-existing `tests/e2e/fixtures/e2e_session.json` remains untouched.

*Self-check completed: 2026-07-15*

---
*Phase: 08-group-detail-surface*
*Completed: 2026-07-15*
