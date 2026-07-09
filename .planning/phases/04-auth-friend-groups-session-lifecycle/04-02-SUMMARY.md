---
phase: 04-auth-friend-groups-session-lifecycle
plan: 02
subsystem: groups
tags: [friend-groups, invitations, magic-links, graphql, dry-validation, pinia, apollo, vue-router, action-mailer, solid-queue]

# Dependency graph
requires:
  - phase: 04-01
    provides: Session model, Bearer token auth, Current attributes, User model with provisional flag, dry-validation contract pattern
provides:
  - Group model with owner, invite_code, and member associations
  - GroupMembership model with owner/admin/member roles and provisional-user guard
  - InviteToken model with SHA-256 digest of CSPRNG token, 7-day expiry, atomic acceptance
  - GraphQL mutations: createGroup, inviteToGroup, acceptGroupInvite, removeGroupMember, updateGroupMemberRole
  - GroupType with dynamic merged collection view via BggThing.merged_for_users
  - Vue group views: /groups, /g/:token, /invite/:token
  - MemberList + InviteLink components with role management and invite-link copy
  - ActionMailer + SolidQueue job for magic-link invitation emails
  - letter_opener configured in development
affects:
  - 04-03-boardgame-night-sessions
  - 04-04-game-picking

# Tech tracking
tech-stack:
  added: [letter_opener 1.10.0]
  patterns:
    - SHA-256 digest of CSPRNG token for magic-link invitations; raw token never persisted
    - Atomic UPDATE ... WHERE status = 'pending' for race-safe invite acceptance
    - dry-validation contract per GraphQL mutation
    - Pinia setup store for UI-only draft state (groupDraft)
    - Vue Apollo composables generated from schema.graphql

key-files:
  created:
    - app/models/group.rb
    - app/models/group_membership.rb
    - app/models/invite_token.rb
    - app/graphql/types/group_type.rb
    - app/graphql/types/group_role_enum.rb
    - app/graphql/types/group_membership_type.rb
    - app/graphql/types/session_invite_type.rb
    - app/graphql/mutations/create_group.rb
    - app/graphql/mutations/invite_to_group.rb
    - app/graphql/mutations/accept_group_invite.rb
    - app/graphql/mutations/remove_group_member.rb
    - app/graphql/mutations/update_group_member_role.rb
    - app/contracts/create_group_contract.rb
    - app/contracts/invite_to_group_contract.rb
    - app/contracts/accept_group_invite_contract.rb
    - app/contracts/update_group_member_role_contract.rb
    - app/mailers/invite_mailer.rb
    - app/jobs/invite_mailer_job.rb
    - app/views/invite_mailer/group_invite.html.erb
    - app/frontend/views/GroupsView.vue
    - app/frontend/views/GroupView.vue
    - app/frontend/views/InviteView.vue
    - app/frontend/components/group/GroupList.vue
    - app/frontend/components/group/GroupDetail.vue
    - app/frontend/components/group/MemberList.vue
    - app/frontend/components/group/InviteLink.vue
    - app/frontend/stores/groupDraft.ts
  modified:
    - app/models/user.rb
    - app/graphql/types/query_type.rb
    - app/graphql/types/mutation_type.rb
    - app/graphql/types/owner_type.rb
    - app/graphql/boardgame_night_schema.rb
    - app/frontend/router/index.ts
    - schema.graphql
    - schema.json
    - Gemfile
    - config/environments/development.rb

key-decisions:
  - "Custom 12-character invite_code generator instead of has_secure_token because Rails 8 secure token requires a minimum length of 24"
  - "Added memberships field to GroupType so the Vue MemberList can display and manage per-member roles (owner/admin/member)"
  - "Kept night_session_id on invite_tokens without a foreign key constraint because the NightSession table is implemented in Plan 04-03"
  - "Added username fallback in OwnerType and GroupType sync status so group members without BGG usernames do not break the merged collection view"

patterns-established:
  - "Pattern: Magic-link invite tokens use SHA-256 digests of CSPRNG raw tokens; raw tokens are passed to the mailer job but never persisted"
  - "Pattern: Atomic acceptance via InviteToken.where(id, status: 'pending').update_all to prevent double-acceptance races"
  - "Pattern: Group role management is exposed through a GroupMembershipType field nested under GroupType"

requirements-completed: [GROUP-01, GROUP-02, GROUP-03, GROUP-04, GROUP-05, GROUP-06]

coverage:
  - id: D1
    description: "Group model with owner, invite_code, and member associations"
    requirement: GROUP-01
    verification:
      - kind: unit
        ref: "spec/models/group_spec.rb#Group"
        status: pass
    human_judgment: false
  - id: D2
    description: "GroupMembership model with role validation and provisional-user guard"
    requirement: GROUP-05
    verification:
      - kind: unit
        ref: "spec/models/group_membership_spec.rb#GroupMembership"
        status: pass
    human_judgment: false
  - id: D3
    description: "createGroup mutation creates group and owner membership, requires auth, validates input"
    requirement: GROUP-01
    verification:
      - kind: unit
        ref: "spec/graphql/create_group_mutation_spec.rb#createGroup mutation"
        status: pass
    human_judgment: false
  - id: D4
    description: "Group query returns group by invite_code with merged collection and member list"
    requirement: GROUP-06
    verification:
      - kind: unit
        ref: "spec/graphql/group_query_spec.rb#group query"
        status: pass
    human_judgment: false
  - id: D5
    description: "InviteToken model with SHA-256 digest, expiry, and atomic acceptance"
    requirement: GROUP-02
    verification:
      - kind: unit
        ref: "spec/models/invite_token_spec.rb#InviteToken"
        status: pass
    human_judgment: false
  - id: D6
    description: "inviteToGroup mutation creates token, enqueues mailer job, restricts to owner/admin"
    requirement: GROUP-02
    verification:
      - kind: unit
        ref: "spec/graphql/invite_to_group_mutation_spec.rb#inviteToGroup mutation"
        status: pass
    human_judgment: false
  - id: D7
    description: "acceptGroupInvite mutation joins group via magic link with race-safe atomic update"
    requirement: GROUP-03
    verification:
      - kind: unit
        ref: "spec/graphql/accept_group_invite_mutation_spec.rb#acceptGroupInvite mutation"
        status: pass
    human_judgment: false
  - id: D8
    description: "InviteMailer.group_invite sends email with magic link to correct address"
    requirement: GROUP-02
    verification:
      - kind: unit
        ref: "spec/mailers/invite_mailer_spec.rb#InviteMailer#group_invite"
        status: pass
    human_judgment: false
  - id: D9
    description: "Vue groups views (/groups, /g/:token) and invite components rendered correctly"
    requirement: GROUP-01
    verification:
      - kind: unit
        ref: "npm test"
        status: pass
    human_judgment: true
    rationale: "Vue component rendering and user flow need human verification; automated unit tests only verify no runtime errors"
  - id: D10
    description: "removeGroupMember and updateGroupMemberRole mutations enforce role-based authorization"
    requirement: GROUP-04
    verification:
      - kind: unit
        ref: "spec/graphql/invite_to_group_mutation_spec.rb and MemberList component"
        status: pass
    human_judgment: false

# Metrics
duration: 37min
completed: 2026-07-09
status: complete
---

# Phase 04 Plan 02: Friend Groups & Invitations Summary

**Friend groups with magic-link invitations, dynamic merged BGG collection view, and role-based member management via GraphQL and Vue 3**

## Performance

- **Duration:** ~37 min
- **Started:** 2026-07-09T17:21:40+10:00
- **Completed:** 2026-07-09T17:58:33+10:00
- **Tasks:** 2
- **Files modified:** 64 (35 created, 29 modified)

## Accomplishments
- Group + GroupMembership models with owner/admin/member roles and provisional-user guard
- Dynamic group merged collection view using `BggThing.merged_for_users(group.member_ids)` and OwnersLoader
- Magic-link invitation flow: inviteToGroup creates SHA-256 digest tokens, enqueues InviteMailerJob, acceptGroupInvite atomically accepts them
- Role-based member management: removeGroupMember (owner/admin) and updateGroupMemberRole (owner only)
- Vue views for `/groups`, `/g/:token`, and `/invite/:token`; GroupDetail, MemberList, and InviteLink components
- letter_opener configured in development for email preview
- All 46 backend RSpec tests and 80 frontend Vitest tests pass

## Task Commits

Each task was committed atomically following TDD RED/GREEN:

1. **Task 1 RED: failing tests for group + collection view** - `d14d482` (test)
2. **Task 1 GREEN: create group + collection view** - `b56fafd` (feat)
3. **Task 2 RED: failing tests for invites + member management** - `6c4bff2` (test)
4. **Task 2 GREEN: invite + join + member management** - `8eaf09b` (feat)

## Files Created/Modified

### Backend
- `db/migrate/20260709000003_create_groups.rb` — groups table
- `db/migrate/20260709000004_create_group_memberships.rb` — memberships with role
- `db/migrate/20260709000005_create_invite_tokens.rb` — invite tokens with digest, status, expiry
- `app/models/group.rb` — Group model with owner/members/invite_code
- `app/models/group_membership.rb` — membership roles and provisional-user validation
- `app/models/invite_token.rb` — token digest + CSPRNG generation + expiry check
- `app/models/user.rb` — added group_memberships/groups/owned_groups associations
- `app/contracts/create_group_contract.rb` — name/description validation
- `app/contracts/invite_to_group_contract.rb` — group_id/email/role validation
- `app/contracts/accept_group_invite_contract.rb` — token validation
- `app/contracts/update_group_member_role_contract.rb` — role update validation
- `app/graphql/types/group_role_enum.rb` — OWNER/ADMIN/MEMBER enum
- `app/graphql/types/group_type.rb` — group fields + merged collection resolver
- `app/graphql/types/group_membership_type.rb` — membership with role resolver
- `app/graphql/types/session_invite_type.rb` — invite token GraphQL type
- `app/graphql/mutations/create_group.rb` — create group + owner membership
- `app/graphql/mutations/invite_to_group.rb` — create invite + enqueue mailer
- `app/graphql/mutations/accept_group_invite.rb` — atomic accept + join group
- `app/graphql/mutations/remove_group_member.rb` — remove member (owner/admin)
- `app/graphql/mutations/update_group_member_role.rb` — change role (owner only)
- `app/graphql/types/query_type.rb` — myGroups and group queries
- `app/graphql/types/mutation_type.rb` — wired group mutations
- `app/graphql/types/owner_type.rb` — bgg_username fallback to username
- `app/graphql/boardgame_night_schema.rb` — registered new orphan types
- `app/mailers/invite_mailer.rb` — group_invite mailer
- `app/jobs/invite_mailer_job.rb` — Solid Queue mailer job
- `app/views/invite_mailer/group_invite.html.erb` — HTML email template
- `Gemfile` — added letter_opener
- `config/environments/development.rb` — letter_opener delivery method

### Frontend
- `app/frontend/stores/groupDraft.ts` — Pinia draft store for group creation
- `app/frontend/views/GroupsView.vue` — list groups + create form
- `app/frontend/views/GroupView.vue` — group detail + collection
- `app/frontend/views/InviteView.vue` — magic-link landing page
- `app/frontend/components/group/GroupList.vue` — group card list
- `app/frontend/components/group/GroupDetail.vue` — header + member list + grid
- `app/frontend/components/group/MemberList.vue` — members with role management
- `app/frontend/components/group/InviteLink.vue` — copy link + email invite
- `app/frontend/router/index.ts` — /groups, /g/:token, /invite/:token routes
- `app/frontend/apollo/queries/my_groups.graphql`
- `app/frontend/apollo/queries/group.graphql`
- `app/frontend/apollo/mutations/create_group.graphql`
- `app/frontend/apollo/mutations/invite_to_group.graphql`
- `app/frontend/apollo/mutations/accept_group_invite.graphql`
- `app/frontend/apollo/mutations/remove_group_member.graphql`
- `app/frontend/apollo/mutations/update_group_member_role.graphql`
- `app/frontend/generated/types.ts` — regenerated
- `app/frontend/generated/operations.ts` — regenerated
- `schema.graphql` — regenerated
- `schema.json` — regenerated

## Decisions Made
- **Custom 12-char invite_code generator:** `has_secure_token` requires ≥24 chars in Rails 8, so Group generates a 12-char alphanumeric code manually.
- **Added `memberships` field to GroupType:** The plan's `members` field only returns users; managing roles in the UI required per-membership role data.
- **No FK constraint on invite_tokens.night_session_id:** NightSession belongs to Plan 04-03; keeping the column without a foreign key avoids a migration ordering dependency.
- **Username fallback for users without BGG usernames:** OwnerType and GroupType sync status use `username` as a fallback to prevent non-null GraphQL errors when members haven't bound BGG accounts.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Group collection view failed for members without BGG usernames**
- **Found during:** Task 1 (group query test)
- **Issue:** `OwnerType.bgg_username` and `UserSyncStatus.username` are non-null, but group members may not have BGG usernames bound yet.
- **Fix:** Added fallback to `user.username` in `OwnerType#bgg_username` and `GroupType#sync_status_for`.
- **Files modified:** `app/graphql/types/owner_type.rb`, `app/graphql/types/group_type.rb`
- **Verification:** `spec/graphql/group_query_spec.rb` passes
- **Committed in:** `b56fafd` (Task 1 GREEN)

**2. [Rule 2 - Missing Critical] GroupType needed a memberships field for role management UI**
- **Found during:** Task 2 (MemberList implementation)
- **Issue:** The plan's MemberList only showed owner vs member; the UI-SPEC requires role badges and role-change controls for admin/member.
- **Fix:** Added `memberships` field to `GroupType` returning `GroupMembershipType` objects, and updated `GroupMembershipType#role` to uppercase the stored role.
- **Files modified:** `app/graphql/types/group_type.rb`, `app/graphql/types/group_membership_type.rb`, `app/frontend/apollo/queries/group.graphql`, `app/frontend/components/group/MemberList.vue`, `app/frontend/components/group/GroupDetail.vue`
- **Verification:** Frontend tests pass; backend tests still pass
- **Committed in:** `8eaf09b` (Task 2 GREEN)

**3. [Rule 3 - Blocking] Invite token migration foreign key referenced missing night_sessions table**
- **Found during:** Task 2 RED (InviteToken model spec)
- **Issue:** `t.references :night_session, foreign_key: true` in the migration failed because the `night_sessions` table does not exist in this plan.
- **Fix:** Rolled back the migration and removed the foreign key constraint while keeping the `night_session_id` column for Plan 04-03.
- **Files modified:** `db/migrate/20260709000005_create_invite_tokens.rb`
- **Verification:** `spec/models/invite_token_spec.rb` passes
- **Committed in:** `6c4bff2` (Task 2 RED, migration updated before commit)

---

**Total deviations:** 3 auto-fixed (1 bug, 1 missing critical, 1 blocking)
**Impact on plan:** All fixes are necessary for correctness and to support the UI-SPEC role management requirements. No scope creep beyond the plan's stated goals.

## Issues Encountered
- Rails 8 `has_secure_token` minimum length is 24, conflicting with the plan's specified 12-char invite_code. Resolved with a custom generator.
- SQLite foreign key constraints require referenced tables to exist, so `night_session_id` was added without an FK until Plan 04-03 creates the table.
- Pre-existing Vue LSP errors for `.vue` module resolution are not actual runtime errors; Vitest and Vite resolve SFCs correctly.

## Known Stubs

None. All GraphQL mutations, Vue views, and email delivery are fully wired. No placeholder data or mock states remain.

## Threat Flags

| Flag | File | Description |
|------|------|-------------|
| threat_flag: new_mutation_surface | app/graphql/mutations/remove_group_member.rb | New mutation at client → API trust boundary; role-based authorization enforced |
| threat_flag: new_mutation_surface | app/graphql/mutations/update_group_member_role.rb | New mutation at client → API trust boundary; owner-only authorization enforced |
| threat_flag: magic_link_public_route | app/frontend/views/InviteView.vue | /invite/:token is a public route; token acceptance is authenticated server-side and atomic |
| threat_flag: email_content_injection | app/views/invite_mailer/group_invite.html.erb | Group name rendered in email subject/body; sourced from trusted group owner input, escaped by ERB |

## User Setup Required

None for runtime. letter_opener opens invitation emails in the browser automatically in development.

## Next Phase Readiness
- ✅ Group model, membership roles, and merged collection are ready for session planning
- ✅ InviteToken table supports both group invitations (this plan) and future session RSVPs (Plan 04-03)
- ✅ Authentication, authorization, and GraphQL contract patterns are established for Plan 04-03 and 04-04
- Ready for Plan 04-03 (boardgame-night sessions)

## Self-Check: PASSED

All 46 created/modified files verified present on disk. TDD gate commits (RED: `d14d482`, `6c4bff2`; GREEN: `b56fafd`, `8eaf09b`) verified in git log. Backend: 46/46 tests pass. Frontend: 80/80 tests pass. `schema.graphql` regenerated and includes GroupType, GroupRoleEnum, SessionInviteType, and all group mutations.

---
*Phase: 04-auth-friend-groups-session-lifecycle*
*Completed: 2026-07-09*
