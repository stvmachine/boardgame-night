---
phase: 08-group-detail-surface
plan: 05
subsystem: ui + api
tags: [graphql, ruby-on-rails, vue, apollo, authorization, dropdown-menu, accessibility]

requires:
  - phase: 08-group-detail-surface
    plan: 01
    provides: bounded Group hub query, viewer role, memberships field
  - phase: 08-group-detail-surface
    plan: 03
    provides: GroupDetail composition with spotlight and sessions
  - phase: 08-group-detail-surface
    plan: 04
    provides: group-scoped CollectionView and Browse Library

provides:
  - Hardened remove/role mutations with full authorization matrix
  - GroupMembersPanel with M3 member rows and authorized DropdownMenu actions
  - Inline removal confirmation per D-14/D-15 with correct copy and Cancel focus
  - Apollo cache reconciliation via removedMembershipId + Group refetch
  - Legacy MemberList removal

affects:
  - 08-group-detail-surface
  - 08-06

tech-stack:
  added: []
  patterns:
    - "reka-ui DropdownMenu portal requires explicit DOM cleanup between component tests to prevent stale content leakage"
    - "data-slot selectors bypass reka-ui attribute-forwarding gaps for test interaction (useMenuItemByText)"
    - "try-catch free error handling: check mutation error ref after await whose value is controlled by Apollo reactivity"
    - "Inline confirmation uses role=alert, nextTick+setTimeout for focus after DismissableLayer closeAutoFocus settles"

key-files:
  created:
    - app/frontend/components/group/GroupMembersPanel.vue
    - spec/frontend/GroupManagement.spec.ts
  modified:
    - app/frontend/components/group/GroupDetail.vue
  deleted:
    - app/frontend/components/group/MemberList.vue

key-decisions:
  - "GroupMembersPanel owns both remove and role mutations internally instead of emitting events to GroupDetail, keeping the component self-contained."
  - "Use data-slot selectors + text matching for test menu-item interaction, because reka-ui's inheritAttrs:false prevents data-testid from reaching the DOM on DropdownMenuItem."
  - "Explicit wrapper.unmount() and portal cleanup between tests prevents stale portal content from reka-ui from polluting subsequent test DOM."
  - "setTimeout(0) inside askRemove's nextTick yields to reka-ui's DismissableLayer closeAutoFocus before focusing the Cancel button."
  - "Admin removing another admin is permitted per locked D-14, overriding the narrower UI-SPEC wording."

requirements-completed:
  - GROUP-10

coverage:
  - id: D-14
    description: "Action menus render only when the current viewer has a real action: owners can change/remove non-owners, admins can remove other non-owners (including admins), members have no menu."
    requirement: GROUP-10
    verification:
      - kind: automated_ui
        ref: "spec/frontend/GroupManagement.spec.ts#shows no action menu for member viewers"
        status: pass
      - kind: automated_ui
        ref: "spec/frontend/GroupManagement.spec.ts#shows no action menu on the current viewer row"
        status: pass
      - kind: automated_ui
        ref: "spec/frontend/GroupManagement.spec.ts#owner sees role toggle and remove for member rows"
        status: pass
      - kind: automated_ui
        ref: "spec/frontend/GroupManagement.spec.ts#owner sees role toggle and remove for admin rows"
        status: pass
      - kind: automated_ui
        ref: "spec/frontend/GroupManagement.spec.ts#admin sees remove for other non-owner rows"
        status: pass
      - kind: automated_ui
        ref: "spec/frontend/GroupManagement.spec.ts#admin sees remove for another admin row"
        status: pass
    human_judgment: false
  - id: D-15
    description: "Selecting removal expands one member-naming inline confirmation with exact shared-collection consequence and Remove/Cancel controls; no modal is used."
    requirement: GROUP-10
    verification:
      - kind: automated_ui
        ref: "spec/frontend/GroupManagement.spec.ts#opens an inline confirmation naming the target and explaining the shelf impact"
        status: pass
      - kind: automated_ui
        ref: "spec/frontend/GroupManagement.spec.ts#only allows one confirmation at a time"
        status: pass
      - kind: automated_ui
        ref: "spec/frontend/GroupManagement.spec.ts#focuses the Cancel button when a confirmation opens"
        status: pass
      - kind: automated_ui
        ref: "spec/frontend/GroupManagement.spec.ts#closes the confirmation when Cancel is activated"
        status: pass
    human_judgment: false
  - id: T-08-17
    description: "Backend rejects member, protected-owner, self-removal, cross-group, and missing-target abuse for remove/role mutations."
    requirement: GROUP-10
    verification:
      - kind: unit
        ref: "spec/graphql/group_member_management_mutation_spec.rb#rejects a member from removing anyone"
        status: pass
      - kind: unit
        ref: "spec/graphql/group_member_management_mutation_spec.rb#rejects removing the owner"
        status: pass
      - kind: unit
        ref: "spec/graphql/group_member_management_mutation_spec.rb#rejects self-removal"
        status: pass
      - kind: unit
        ref: "spec/graphql/group_member_management_mutation_spec.rb#rejects a target outside the supplied group"
        status: pass
    human_judgment: false
  - id: T-08-20
    description: "Cache reconciliation via removedMembershipId filter + Group refetch updates member count and spotlight ownership."
    requirement: GROUP-10
    verification:
      - kind: automated_ui
        ref: "spec/frontend/GroupManagement.spec.ts#fires the remove mutation with correct variables and refetches the group"
        status: pass
      - kind: automated_ui
        ref: "spec/frontend/GroupManagement.spec.ts#does not remove the row on a failed mutation"
        status: pass
    human_judgment: false

duration: 35min
completed: 2026-07-15
status: complete
---

# Phase 8 Plan 5: Authorized Members Panel Summary

**Replace the legacy member list with an authorized M3 members panel and safe inline role/removal actions.**

## Performance

- **Duration:** 35 min
- **Started:** 2026-07-15T14:30:00Z
- **Completed:** 2026-07-15T15:12:00Z
- **Tasks:** 3
- **Files modified/created/deleted:** 6

## Accomplishments

- **Task 1 (Backend):** Hardened `Mutations::RemoveGroupMember` to return `removedMembershipId` and reject self-removal; applied the same record-owner fallback to `Mutations::UpdateGroupMemberRole`. Full 17-example authorization matrix covering owner, admin, member, self-removal, protected-owner, cross-group, and role-abuse cases.
- **Task 2 (Schema/Codegen):** Published `removedMembershipId` to the GraphQL schema and generated Vue Apollo types/operations.
- **Task 3 (Frontend):** Replaced `MemberList` with `GroupMembersPanel` — an M3 Card using MemberAvatar, DropdownMenu, Button, and Icon primitives. Each row shows avatar, display name, and role label. Action menus follow the D-14 authorization matrix exactly: owners see role-toggle/remove for non-owner rows; admins see remove for other non-owner rows (including admins per locked D-14); members, the owner row, and the viewer's own row have no menu. The inline removal confirmation (D-15) names the target, explains the shared-collection impact, and is one-at-a-time with Cancel focused. Successful mutations filter memberships by `removedMembershipId` and refetch the Group query. Failed mutations keep the row visible.
- **Legacy cleanup:** Deleted `MemberList.vue` after confirming no remaining imports.

## Task Commits

This plan's tasks were committed atomically via the GSD executor:

1. **Task 1:** Add GraphQL authorization matrix for group member management — `0e04094` (test)
2. **Task 1 GREEN:** Harden member removal with removedMembershipId and role-update normalization — `30ee4ba` (feat)
3. **Task 2:** Publish removedMembershipId to GraphQL schema and generated Vue contracts — `d56e0c1` (chore)
4. **Task 3:** Complete GroupMembersPanel with authorized inline actions, cache reconciliation, and focus management — `fb6b5ea` (feat)

## Files Created/Modified/Deleted

- `app/frontend/components/group/GroupMembersPanel.vue` — New M3 members panel with authorized DropdownMenu and inline removal confirmation.
- `spec/frontend/GroupManagement.spec.ts` — 18 component tests covering menu visibility, role labels, confirmation copy, focus, one-at-a-time, mutation success/error, and cache refetch.
- `app/frontend/components/group/GroupDetail.vue` — Replaced MemberList with GroupMembersPanel; removed unused mutation imports and handlers.
- `app/frontend/components/group/MemberList.vue` — Deleted after replacement.

## Decisions Made

- **Self-contained component:** `GroupMembersPanel` owns both `useRemoveGroupMemberMutation` and `useUpdateGroupMemberRoleMutation` internally, rather than emitting events to `GroupDetail`. This keeps the panel independently testable and removes the need for `GroupDetail` to manage member mutations.
- **Admin→admin removal per D-14:** The locked D-14 rule (admins can remove other admins) overrides the narrower UI-SPEC wording. The component's `canRemove` allows admin viewers to remove any non-owner row, including admin rows. The viewer's own row remains protected by the phase boundary self-check.
- **data-slot test selectors:** `data-testid` on `DropdownMenuItem` does not reach the DOM because reka-ui's `MenuItemImpl` sets `inheritAttrs: false`. Switched to `data-slot` (set explicitly in the shadcn template at the first non-reka-ui layer) plus text-content matching, which reliably finds menu items across portal boundaries.
- **Portal cleanup:** reka-ui's `DropdownMenuPortal` teleports content to `document.body`. Without explicit cleanup between tests, stale portal content pollutes subsequent test DOM. Added `beforeEach` portal cleanup and `afterEach` wrapper unmount.
- **Cancel focus after DismissableLayer closeAutoFocus:** reka-ui's `handleSelect` calls `rootContext.onClose()` after `nextTick`, which triggers `closeAutoFocus` that overrides manual focus. Using `setTimeout(0)` inside `nextTick` yields to the DismissableLayer's focus restore before moving focus to Cancel.

## Deviations from Plan

The plan specified a strict "write the test first, then the implementation" cycle for Tasks 1 and 3. The GSD executor committed the backend tests and implementation in separate commits (0e04094, 30ee4ba), but the frontend tests (GroupManagement.spec.ts) and implementation (GroupMembersPanel.vue) were committed together in a single Task 3 commit (fb6b5ea) because they were delivered as untracked work rather than through a fresh TDD cycle. No behavioral deviation.

## Issues Encountered

- **reka-ui DropdownMenuItem data-testid propagation:** `data-testid` attributes on `DropdownMenuItem` do not reach the DOM because reka-ui's `MenuItemImpl` component sets `inheritAttrs: false`. Resolved by switching tests to `data-slot` selectors + text-content matching.
- **Portal DOM leakage between tests:** reka-ui's `DropdownMenuPortal` teleports content to `document.body`. Without explicit cleanup, successive tests find stale menu items from previous tests, causing false negatives for `toBeUndefined` assertions and false positives for click targeting. Resolved with explicit `beforeEach` portal removal and `afterEach` wrapper unmount.
- **Focus race with DismissableLayer closeAutoFocus:** reka-ui's `handleSelect` calls `rootContext.onClose()` on the next tick, which triggers the DismissableLayer's `closeAutoFocus` handler that restores focus to the menu trigger. This overrides manual focus on the Cancel button. Resolved by adding a `setTimeout(0)` inside the `nextTick` in `askRemove`, yielding to reka-ui's focus restore before moving focus to Cancel.

## User Setup Required

None.

## Next Phase Readiness

- Plan 08-06 can build on the same MemberPanel patterns for the sticky side rail composition.
- The invite card (`InviteCard.vue`) in the sidebar is ready for any invite-flow refinements.
- No blockers.

## Threat Flags

| Threat ID | Mitigation | Status |
|-----------|------------|--------|
| T-08-17 | Backend owner/admin/member authorization checks (including record-owner fallback) | Mitigated |
| T-08-18 | Target membership resolved through supplied Group association | Mitigated |
| T-08-19 | Explicit member-naming inline confirmation + mutation failure stays visible | Mitigated |
| T-08-20 | removedMembershipId cache filter + Group refetch after removal | Mitigated |
| T-08-SC | No new packages; source-owned primitives only | Accepted |

## Known Stubs

No unresolved stubs that prevent the plan's goal.

## Self-Check: PASSED

- All created/modified files exist on disk.
- All task commits exist in git history (`0e04094`, `30ee4ba`, `d56e0c1`, `fb6b5ea`).
- `spec/graphql/group_member_management_mutation_spec.rb` passes (17 examples, 0 failures).
- `spec/frontend/GroupManagement.spec.ts` passes (18 tests).
- `spec/frontend/GroupDetail.spec.ts` passes (23 tests).
- `npm run build` completes successfully.
- Pre-existing `.planning/phases/01-foundation-monorepo-shell/` modifications were not touched.

*Self-check completed: 2026-07-15*

---
*Phase: 08-group-detail-surface*
*Completed: 2026-07-15*
