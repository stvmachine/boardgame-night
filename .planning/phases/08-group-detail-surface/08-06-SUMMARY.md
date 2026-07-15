---
phase: 08-group-detail-surface
plan: 06
type: summary
state: complete
commit: 5990ab8
---

# Plan 08-06 Summary — Combined InviteCard, Sticky Hub, and Integrated Gate

## Commits

| Commit | Task | Description |
|--------|------|-------------|
| `e663e03` | Task 1 (backend) | Harden invite authorization with record-owner path and admin escalation guard |
| `8fc5536` | Task 2 (frontend) | Replace InviteLink with combined InviteCard (clipboard copy, email/role form, OWNER/ADMIN visibility) |
| `e7dfdb2` | Task 3 (frontend+E2E) | Finalize sticky hub composition, extend component/E2E tests, pass integrated gate |
| `5990ab8` | Post-review fixes | Spotlight objectid, CardTitle h2 semantics, test integrity, RuboCop 0 offenses |

## Requirements Covered

| Requirement | Status | How |
|-------------|--------|-----|
| GROUP-07 | COVERED | Responsive manager-only header and persisted draft creation (prior plans) |
| GROUP-08 | COVERED | Upcoming sessions with date/status/title/time/attendees (prior plans) |
| GROUP-09 | COVERED | Four-game spotlight and Browse Library (prior plans) |
| GROUP-10 | COVERED | Members, roles, avatars, per-member actions (prior plans, extended in this plan) |
| GROUP-11 | COVERED | Combined manager-only invite card with link copy + email delivery |

## Context Decisions Verified

| Decision | Status | How Verified |
|----------|--------|-------------|
| D-01 Full header; sessions/spotlight main; members/invites rail | VERIFIED | `lg:col-span-8` main + `lg:col-span-4` aside with `lg:sticky lg:top-6 lg:self-start` |
| D-02 Mobile header → sessions → spotlight → members → invite | VERIFIED | DOM order (no `order-*` classes); E2E mobile viewport test |
| D-04 Desktop sticky rail with smaller-screen guard | VERIFIED | `lg:`-only sticky classes on aside; no sticky below `lg` |
| D-13 Owner/admin-only invite link visibility/copy | VERIFIED | InviteCard `v-if="myRole === 'OWNER' || myRole === 'ADMIN'"` in GroupDetail; MEMBER test confirms absence |
| D-16 Combined link-first email-invite card | VERIFIED | `border-t border-outline` divider; copy link section above email form |

## Verification Gate Results

| Check | Result |
|-------|--------|
| RSpec (Group, members, invite, session mutations) | 61 examples, 0 failures |
| Schema dump (`bin/rails graphql:schema:dump`) | IDL + JSON dumped |
| Codegen (`npm run codegen`) | Types + operations generated |
| RuboCop (focused backend files) | 0 offenses (18 auto-corrected, all clean) |
| Vitest (GroupDetail + GroupManagement) | 58/58 passed |
| Vite build (`npm run build`) | Succeeds |
| E2E (`npx playwright test tests/e2e/group_detail.spec.ts`) | 5/5 passed |

## Test Coverage

- **GroupDetail.spec.ts**: 28 tests (header, sessions, spotlight, GroupDetail composition — 8/4 grid, sticky guard, heading hierarchy, source order, no legacy InviteLink)
- **GroupManagement.spec.ts**: 30 tests (GroupMembersPanel: 18, InviteCard: 12 — OWNER/ADMIN/MEMBER visibility, clipboard resolve/reject/2s-clear, role options, mutation call/loading/error/reset)
- **E2E**: 5 tests (owner sessions + create night, member sessions, Members+Invite card visibility + spotlight, copy → Copied!, mobile viewport with five sections)

## Post-Review Fixes (commit `5990ab8`)

| Fix | Description |
|-----|-------------|
| Spotlight objectid | Added explicit non-null `objectid` field to `GroupSpotlightThingType` backed by `thing.objectid`. Updated `GroupCollectionSpotlight.vue` to build BGG URLs with `game.objectid`. Added GraphQL spec proving `objectid` (BGG numeric ID) differs from the DB auto-increment `id`. Frontend test fixtures use distinct `objectid` values. |
| CardTitle h2 semantics | Added `as` prop to shared `CardTitle.vue` with semantic default `h2` via dynamic `<component>`. Existing CardTitle uses across all section cards now render as `<h2>`. Heading hierarchy test restored to assert real `h2` elements. Checked all 4 CardTitle usages — no nested heading issues (all are top-level section headings below the page `h1`). |
| Test integrity | Made Select role option tests deterministic by stubbing `Element.prototype.hasPointerCapture` (jsdom lacks this, causing reka-ui portal open to fail). Role options are now verified via portal content without conditional `if (content)`. Replaced vacuous `MEMBER sees no InviteCard` test with a real `GroupDetail` mount using `MEMBER` role, proving no invite URL/copy button/role select/email form render. |
| RuboCop | Ran `rubocop -a` on the 8 targeted backend files; 18 layout/alignment offenses auto-corrected. Exact `bundle exec rubocop` command now exits with 0 offenses across all 8 files. |

## Threats Mitigated

| Threat | Severity | Mitigation |
|--------|----------|------------|
| T-08-21 Elevation of Privilege (invite role) | HIGH | Backend enforces owner MEMBER/ADMIN vs admin MEMBER-only; tested in Task 1 |
| T-08-22 Information Disclosure (invite link) | HIGH | `v-if` renders InviteCard only for OWNER/ADMIN; MEMBER DOM absence tested |
| T-08-23 Spoofing (clipboard success) | LOW | `Copied!` only after clipboard promise resolves; distinct failure feedback |
| T-08-24 Repudiation (invitation delivery) | MEDIUM | Persisted InviteToken + mail job behavior retained |
| T-08-25 Tampering (slice integration) | MEDIUM | Full integrated gate passes (RSpec → schema → codegen → Vitest → build → E2E) |

## Artifacts Produced

- `app/graphql/types/group_spotlight_thing_type.rb` — `objectid` field for BGG external ID
- `app/frontend/components/ui/card/CardTitle.vue` — semantic `as` prop (default `h2`)
- `app/graphql/mutations/invite_to_group.rb` — hardened authorization
- `app/frontend/components/group/InviteCard.vue` — manager-only invite card
- `app/frontend/components/group/GroupDetail.vue` — final 8/4 grid with sticky aside
- `app/frontend/components/group/InviteLink.vue` — deleted (legacy, no imports remain)
- `spec/graphql/invite_to_group_mutation_spec.rb` — role escalation coverage
- `spec/frontend/GroupDetail.spec.ts` — composition tests
- `spec/frontend/GroupManagement.spec.ts` — InviteCard unit tests
- `tests/e2e/group_detail.spec.ts` — complete browser flow

## Readiness

All Phase 08 requirements (GROUP-07 through GROUP-11) are implemented, tested, and verified. The Group Detail hub is responsive, secure, accessible, generated-contract clean, and end-to-end verified. Phase 08 is ready for integration review.
