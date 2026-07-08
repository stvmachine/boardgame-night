# Phase 4: Auth + Friend Groups + Session Lifecycle — Context

**Gathered:** 2026-07-09
**Status:** Ready for planning

<domain>
## Phase Boundary

The account, group, and night-session surface that turns the collection-sharing app into a boardgame-night organizer. This phase delivers: user sign-up/login/logout with persisted sessions, BGG username binding, friend groups with invite links, a group-level merged collection view, and boardgame-night sessions with magic-link invitations, binary RSVP, and manual game picking.

**Deliverables:**
- Rails 8 authentication generator adapted for API-only Bearer tokens (`Session` model, `Current`, `Authentication` concern, password-reset mailers).
- `User` model extended with `provisional:boolean` and `invite_token` for no-account RSVP.
- New models: `Group`, `GroupMembership`, `Session`, `Attendance`, `InviteToken`.
- GraphQL types: `UserType` (extended), `GroupType`, `SessionType`, `SessionInviteType`, `SessionStateEnum`, `GroupRoleEnum`, `AttendanceType`.
- GraphQL mutations: `signUp`, `signIn`, `signOut`, `bindBggUsername`, `createGroup`, `inviteToGroup`, `acceptGroupInvite`, `createSession`, `scheduleSession`, `startPicking`, `pickGame`, `cancelSession`, `reopenSession`, `rsvp`, `upgradeToAccount`.
- Vue views: `/login`, `/signup`, `/groups`, `/g/:token` (group), `/s/:id` (session), `/account`.
- Vue components: auth forms, group list, group detail, session editor, RSVP dashboard, game picker, session summary.
- Magic-link email delivery for group invitations and session invitations.

**Not in scope:**
- Game suggestion engine (SUGG-01/02) — v2 deferred.
- Ranked voting / "who brings it" (VOTE-01/02) — v2 deferred.
- 4-state RSVP (RSVP-01) — v1 ships binary `going` / `not_going`.
- Recurring sessions (SESS-07) — v2 deferred.
- Server-side search or Postgres migration — v2 deferred.
- Mobile native app or OAuth against BGG — out of scope per PROJECT.md.

</domain>

<decisions>
## Implementation Decisions

### Authentication & Session Strategy

- **D-01:** Use the **Rails 8 built-in authentication generator adapted for API-only Bearer tokens**. Run `bin/rails generate authentication`, add a `token` column to `sessions`, and modify the `Authentication` concern to resolve the session from the `Authorization: Bearer <token>` header. The frontend stores the token in a JS module-scoped variable or Pinia store (never `localStorage`) and sends it via an Apollo `setContext` link. Logout destroys the `Session` row. **[ADR-008]**
- **D-02:** Password reset and per-device session tracking come from the generator for free. No JWT or Devise. **[ADR-008]**

### No-Account RSVP / Provisional Profiles

- **D-03:** Use **provisional `User` rows** for no-account invitees. Add `provisional:boolean` to `users` and auto-generate `guest_*` usernames. RSVPs are stored in a new `attendances` table linked to that user. Upgrade to a full account is a single `UPDATE`. **[ADR-009]**
- **D-04:** GraphQL `UserType` exposes `isProvisional: Boolean!` and `displayName: String!` so guests and full users share one type; no polymorphic union. **[ADR-009]**
- **D-05:** Group memberships validate that the user is not provisional; only full accounts can pool collections. **[ADR-009]**

### Magic-Link Group & Session Invitations

- **D-06:** Use a persisted **`InviteToken` table** for targeted invitations. Columns: `group_id`, `inviter_id`, `email`, `role`, `token_digest` (SHA-256 of raw CSPRNG token), `status`, `expires_at`, `accepted_by_id`, `accepted_at`, optional `rsvp_session_id`. Atomic acceptance with `UPDATE ... WHERE status = 'pending'`. **[ADR-010]**
- **D-07:** Group invitations and session invitations share the same token table where applicable; session-specific no-account RSVP uses the same row with `status = 'rsvped'`. **[ADR-010]**
- **D-08:** Reusable group join codes (`groups.invite_code`) are a secondary, optional mechanism for open enrollment; they are not the primary targeted invite flow. **[ADR-010]**

### Group Collection View

- **D-09:** Compute the group merged collection **dynamically** from members' `bgg_collections` via the existing `BggThing.merged_for_users` scope and `OwnersLoader`. No snapshot table or cache layer for v1. **[ADR-011]**
- **D-10:** A group's merged collection is always fresh; any member BGG refresh is reflected immediately. **[ADR-011]**

### Session Lifecycle State Machine

- **D-11:** Use a **manual 4-state machine**: `draft → invited → picking → completed`. Merge the original `scheduled` and `rsvp_open` states into `invited` because sending invites is effectively opening RSVPs for a friend-group app. **[ADR-012]**
- **D-12:** Transitions are explicit host-driven mutations: `scheduleSession`, `startPicking`, `pickGame`, `cancelSession`, `reopenSession`. Guard clauses prevent invalid transitions. **[ADR-012]**
- **D-13:** Host may advance early even if not everyone has RSVPed; warnings are non-blocking. Editing `scheduled_at` after invites are sent requires confirmation. **[ADR-012]**

### Claude's Discretion

- Exact column names for `Group` and `Session` (beyond the decision records).
- UI form layout and validation copy for auth/signup.
- Whether to use a dedicated `Api::SessionsController` or expose login/signup as GraphQL mutations; the research recommends JSON endpoints for the initial SPA page load, but GraphQL mutations are acceptable if simpler for the codebase.
- Email delivery mechanism (Action Mailer with Mailpit in dev, or a delivery service in production).
- Rate-limiting strategy for login attempts (Rack::Attack recommended by research).

### Folded Todos

None.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Architecture Decision Records (new for Phase 4)
- `docs/adr/008-authentication-session-strategy.md` — Session strategy: Rails 8 auth generator + Bearer token.
- `docs/adr/009-provisional-user-accounts-rsvp.md` — No-account RSVP data model.
- `docs/adr/010-group-invitation-tokens.md` — Magic-link invitation token table.
- `docs/adr/011-group-collection-view.md` — Dynamic group merged collection.
- `docs/adr/012-session-lifecycle-state-machine.md` — Session state machine.

### Prior Phase ADRs
- `docs/adr/001-monorepo-rails-api-vue-spa.md` — Monorepo, GraphQL as single API, Apollo Client setup.
- `docs/adr/003-graphql-n-plus-one-dataloader.md` — `GraphQL::Dataloader` and `OwnersLoader` pattern.
- `docs/adr/004-solid-queue-cache-cable.md` — Solid Queue / Solid Cache / Solid Cable (no Redis).
- `docs/adr/005-bgg-collection-import-pipeline.md` — BGG import job patterns.
- `docs/adr/007-dry-rails-validation-contracts.md` — Every mutation uses a dry-validation contract.

### Project Requirements & Planning
- `.planning/REQUIREMENTS.md` §AUTH-01 through AUTH-04, GROUP-01 through GROUP-06, SESS-01 through SESS-06, GQL-03.
- `.planning/ROADMAP.md` §Phase 4 — Goal, mode, dependencies, success criteria.
- `.planning/PROJECT.md` — Core value, constraints, key decisions.
- `.planning/STATE.md` — Current project state and carried concerns.

### Prior Phase Context
- `.planning/phases/03-graphql-api-collection-surface-v1-parity/03-CONTEXT.md` — Collection UI, GraphQL types, Pinia stores, Apollo patterns.
- `.planning/phases/02-bgg-integration-layer-persistence/02-CONTEXT.md` — BGG services, models, merge scope.
- `.planning/phases/01-foundation-monorepo-shell/01-CONTEXT.md` — Monorepo, codegen, CORS, deploy.

### Research Docs
- `.planning/research/ARCHITECTURE.md` — System overview, project structure, patterns.
- `.planning/research/PITFALLS.md` — Critical pitfalls.
- `.planning/research/STACK.md` — Technology stack decisions.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `app/models/user.rb` — Already has `has_secure_password`; extend with `provisional` and `invite_token`.
- `app/models/bgg_thing.rb` and `app/models/bgg_collection.rb` — Existing merge scope and ownership model for the group collection view.
- `app/graphql/loaders/owners_loader.rb` — Batch-loads owners per thing; reusable for `GroupType.things`.
- `app/graphql/types/user_type.rb` — Add `isProvisional` and `displayName` fields.
- `app/frontend/apollo/client.ts` — Add `setContext` auth link to attach Bearer token.
- `app/frontend/entrypoints/application.ts` — Pinia + Apollo already wired; add auth composable/provider.
- `app/frontend/components/common/MemberAvatar.vue` — Reusable for group member/session attendee lists.
- `app/frontend/stores/collectors.ts` / `filters.ts` / `ui.ts` — Pattern for adding new Pinia stores (session draft, group draft, auth UI).
- `app/frontend/views/CollectionView.vue` — Existing collection grid can be reused for session game picking (filtered by attendees).
- `app/contracts/application_contract.rb` — Base contract for all new validation contracts.
- `app/graphql/types/mutation_type.rb` — Add new mutations alongside existing `importCollection` and `validateBggUsername`.
- `app/graphql/types/query_type.rb` — Add `currentUser`, `group`, `session`, `myGroups`, etc.
- `app/frontend/router/index.ts` — Add routes for `/login`, `/signup`, `/g/:token`, `/s/:id`, `/account`.

### Established Patterns
- **GraphQL mutation shape:** dry-validation contract → mutation class → service/model call. Every new mutation must have a contract in `app/contracts/`.
- **Apollo Client:** normalized `InMemoryCache`, batch HTTP link, Action Cable split for subscriptions. Auth token via `setContext` link.
- **Pinia stores:** UI-only state only. Server state lives in Apollo cache.
- **Solid Queue jobs:** Use `limits_concurrency` for BGG jobs; use explicit `retry_on`/`discard_on`.
- **RSpec + shoulda-matchers:** Use for model validation/association specs; no FactoryBot.

### Integration Points
- **Authentication middleware:** `GraphqlController` currently passes an empty `context: {}`. Update to include `current_user` resolved from the Bearer token (or session cookie fallback if needed).
- **Session token flow:** Login/signup returns token → frontend stores in memory → Apollo link attaches header → `Authentication` concern resolves `Current.user`.
- **Group collection resolver:** Reuse `BggThing.merged_for_users(group.member_ids)` and wrap with `MergedCollection` type.
- **Session invite email:** Action Mailer + Solid Queue; magic link route `/invite/:token` handled by Vue, which calls the `rsvp` mutation.
- **Protected routes:** Vue router guards check for a valid auth token or session; unauthenticated users redirected to `/login` with `redirectTo` preserved.

</code_context>

<specifics>
## Specific Ideas

- Use `ActiveSupport::MessageVerifier` for signed session-payload tokens (e.g., `rsvp` token) and `generates_token_for` for password reset / email verification, but **not** for group invitation tokens (those need the `InviteToken` table for audit/revocation).
- Guest username pattern: `guest_#{SecureRandom.hex(6)}` (e.g., `guest_a1b2c3d4`). UI never displays the generated username; use `displayName` (email or "Guest").
- Group join via reusable code: a short, human-typed code like `BOARD-NIGHT-2026` stored in `groups.invite_code`, separate from the targeted `InviteToken` flow.
- Session state UI: `draft` → editor form; `invited` → RSVP dashboard; `picking` → game grid filtered by attendee count; `completed` → read-only summary.
- Game picking filters: reuse collection filter composables but constrain by `attendee_count` between `min_players` and `max_players` (warn if outside range).
- Route `/s/:id` should resolve the session and render the correct state view; `/invite/:token` is a dedicated RSVP landing page.
- Add `Rack::Attack` rate limiting on login/signup endpoints to prevent brute force.
- Use `sessionStorage` (not `localStorage`) if the user wants to survive a tab refresh; otherwise keep the token in memory and require re-login on refresh.
- Email delivery: Action Mailer with `mailpit` or `letter_opener` in dev; production config left as a placeholder (SMTP/Postmark/etc.) until deploy.

</specifics>

<deferred>
## Deferred Ideas

- **Game suggestion engine (SUGG-01/02)** — v2; v1 uses manual host pick from group collection.
- **Ranked voting / "who brings it" (VOTE-01/02)** — v2; no voting in v1.
- **4-state RSVP (RSVP-01)** — v2; v1 ships binary `going`/`not_going`.
- **Recurring sessions (SESS-07)** — v2.
- **Session auto-advance / nudging** — can be added later with a Solid Queue recurring job without changing the state machine.
- **Server-side search for group collections** — v2; currently client-side Fuse.js is sufficient.

### Reviewed Todos (not folded)

None.

</deferred>

---

*Phase: 4-Auth + Friend Groups + Session Lifecycle*
*Context gathered: 2026-07-09*
