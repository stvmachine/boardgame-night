---
phase: 08-group-detail-surface
status: passed
score: 5/5
requirements_checked: [GROUP-07, GROUP-08, GROUP-09, GROUP-10, GROUP-11]
verified: 2026-07-15
---

# Phase 08 Verification — Group Detail Surface

## Verdict

Phase 08 achieves its goal: group members can use `/g/:token` as one responsive hub for upcoming sessions, shared-game discovery, member management, and authorized invitation controls.

The configured verifier failed twice without producing an artifact. This fallback verification reconciles the implemented source, six plan summaries, automated evidence, GSD gates, and an independent Oracle review. The Oracle blocker and test/accessibility findings were fixed in `5990ab8`; final verification evidence was updated in `e7280c4`.

## Requirement Evidence

| Requirement | Result | Evidence |
|---|---|---|
| GROUP-07 | PASS | `GroupHeader.vue` shows name, description, member count, and manager-only Create a night. Draft creation is mutation-backed and covered by GraphQL, component, and E2E tests. |
| GROUP-08 | PASS | `GroupType.sessions` enforces role-aware visibility and deterministic ordering. `GroupSessionsList.vue` renders date/state/title/attendees and state-aware navigation; terminal sessions are excluded. |
| GROUP-09 | PASS | `collectionSpotlight(limit: 4)` is authorized, bounded, deterministic, and group-owner scoped. Spotlight cards use the BGG `objectid`, and Browse Library opens `/collection?group=<inviteCode>` through the canonical collection pipeline. |
| GROUP-10 | PASS | `GroupMembersPanel.vue` displays avatars, names, exact roles, authorized row menus, inline named removal confirmation, cache reconciliation, and Group refetch. Direct mutations enforce owner/admin/member/self/cross-group boundaries. |
| GROUP-11 | PASS | `InviteCard.vue` is absent for members and combines the reusable link, resolved clipboard feedback, and email/role invitation flow for owners/admins. Backend authorization prevents admin-to-admin escalation. |

## Decision Coverage

- **D-01–D-04:** Header precedes the 8/4 desktop grid; sessions/spotlight are in the main column; members/invite use an `lg`-only sticky rail; mobile DOM and tab order remain header → sessions → spotlight → members → invite.
- **D-05–D-08:** Server-side session visibility/order, whole-row navigation, state CTAs, and role-aware empty states are test-backed.
- **D-09–D-12:** Four-game spotlight ordering/fallback, capped owner attribution, correct external BGG IDs, and canonical group collection routing are test-backed.
- **D-13–D-16:** Invite visibility, authorized member actions, inline removal confirmation, and combined link-first invite card are implemented and test-backed.

## Security and Accessibility

- Direct GraphQL tests cover outsider shelf access, session creation, member removal/role changes, cross-group IDs, self/owner protection, unauthenticated requests, and invite-role escalation.
- Destructive member removal requires an inline named confirmation and leaves failed mutations visible.
- Invite copy success is announced only after Clipboard API resolution; failure feedback is distinct.
- Card titles render as semantic `h2` elements beneath the page `h1`; interactive controls have accessible names and required touch sizes.
- External BGG links use the source `objectid`, not the local database primary key.

## Automated Evidence

- Focused Phase 08 backend suite: **61 examples, 0 failures**.
- Full frontend suite after post-review fixes: **21 files, 161 tests, all passing**.
- Phase browser flow: **5 Playwright tests passing**, including owner/member views, copy feedback, spotlight, collection navigation, and mobile order.
- Production Vite build: passing.
- Schema dump and GraphQL code generation: passing; schema drift gate clean.
- Focused Phase 08 RuboCop gate: **8 files, 0 offenses**.
- GSD codebase drift: skipped because no structure document exists; no action required.
- GSD UI safety gate: non-blocking with approved `08-UI-SPEC.md` present.

## Remaining Uncertainty

- E2E setup rewrites local fixture IDs, leaving `tests/e2e/fixtures/e2e_group.json` and `e2e_session.json` dirty. These generated/runtime changes were not staged or committed and do not affect the verified behavior.
- Existing Vue Router/injection warnings remain in test output but do not fail tests or indicate a Phase 08 regression.

No requirement gap or high-severity threat remains open.
