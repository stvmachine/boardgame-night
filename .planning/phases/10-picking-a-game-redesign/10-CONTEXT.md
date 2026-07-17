# Phase 10: Picking a Game Redesign - Context

**Gathered:** 2026-07-17
**Status:** Ready for planning

<domain>
## Phase Boundary

This phase replaces the existing full-collection `GamePicker` with the persisted, attendee-aware top-eight shortlist already computed by the Phase 7 suggestion engine. It redesigns the `PICKING` state of `/s/:id` with a responsive session header, confirmed-attendee context, locked session preferences, explainable suggestion cards, and a host-only **Pick this game** action that transitions the session to its existing completed summary.

The phase may extend the session GraphQL query and add a narrowly scoped host-only mutation needed to make the required **Edit Details** control functional during picking. It must preserve the session state machine, server-side suggestion ranking, Apollo-as-server-state architecture, group authorization, and existing `pickGame` transition. It does not add voting, a browse-all fallback, session history, play logging, new suggestion weights, preference editing after picking starts, or a new game-detail route.

</domain>

<decisions>
## Implementation Decisions

### Picking Header and Attendee Context
- **D-01:** Replace the current generic `PICKING` branch header with one dedicated session header above the shortlist. Show session title, Picking status badge, scheduled date/time, confirmed-going attendee avatars with a visible count, and a host-only **Edit Details** button.
- **D-02:** Use the existing attendance payload and `MemberAvatar` pattern. Display going attendees only, cap the visible stack with a `+N` overflow count, and keep the numeric attendee count readable beside the avatars.
- **D-03:** Show the active time budget and complexity preference as read-only context near the suggestion heading. Preferences remain locked once picking begins, preserving Phase 7 and ADR-012; do not expose `updateSessionPreferences` from this screen.

### Functional Edit Details
- **D-04:** Add a narrowly scoped, host-only `updateSessionDetails` mutation and dry-validation contract so **Edit Details** is functional rather than decorative. It may update `title`, `description`, `scheduledAt`, `location`, and `capacity` while the session is `draft`, `invited`, or `picking`, without changing state.
- **D-05:** The details mutation must not accept `timeBudgetMinutes` or `complexityPreference`; those influence the shortlist and stay locked during picking. It must not broaden edit permissions beyond the session host.
- **D-06:** Reuse the existing session form fields and visual patterns where practical, but present editing as a focused modal/Sheet/inline panel with **Save details** semantics—not the draft-only **Schedule & send invites** action. Successful save updates the Apollo-normalized session and returns to the same picking screen.

### Suggestion Data and Ordering
- **D-07:** Select `suggestions`, `timeBudgetMinutes`, and `complexityPreference` in the main `nightSession` operation and regenerate client types/composables. The resolver already returns `null` outside picking, so no second query or duplicated server-data store is needed.
- **D-08:** Use the server-ranked top eight exclusively and preserve response order. Do not re-score, re-sort, or re-filter the shortlist in the browser, and do not retain the old full `GroupCollectionQuery` Browse All fallback.
- **D-09:** Handle resolver semantics explicitly: `null` means suggestions are unavailable outside picking; an empty list while picking means no eligible shortlist. Use attendee count to distinguish **No confirmed players yet** from **No games fit this night**.

### Suggestion Card Composition
- **D-10:** Extend the Phase 9 rich `GameCard` through optional suggestion context rather than duplicating its image, title, description, owner, and players/time/complexity anatomy. Collection rendering must remain byte-for-byte/behaviorally unchanged when suggestion props are absent.
- **D-11:** Each suggestion card shows score, confidence, and backend-generated reason chips in addition to the required image, title, duration, description, player count, and owners. Do not add five numeric breakdown bars to the default card; keep the primary explanation scannable through confidence and reason chips.
- **D-12:** Preserve plain-text descriptions, persisted BGG `objectid` navigation, `noopener,noreferrer`, keyboard activation, and nested-control guards from Phase 9. The action slot contains the primary **Pick this game** button and must not trigger card navigation.

### Pick Permissions and Transition
- **D-13:** Authorized group members may view the ranked suggestions, but only the session host sees an enabled **Pick this game** action. Non-host members see neutral host-choice guidance rather than a control that will fail authorization.
- **D-14:** Reuse the existing `pickGame` mutation unchanged. Disable the selected action while the mutation is pending, prevent duplicate submissions, surface mutation errors in place, and rely on the returned normalized `NightSession` to transition the view to `SessionSummary`; do not build a parallel Pinia copy or optimistic completed state.
- **D-15:** Initial loading uses suggestion-card-shaped skeletons. Preserve explicit query error and empty states so the picking surface never silently falls back to the full collection.

### The Agent's Discretion
- Exact desktop grid column count, mobile card stacking, attendee-avatar cap, score formatting, confidence color mapping, reason-chip wrapping, and whether the details editor uses a Dialog, Sheet, or inline expansion.
- Exact copy for mutation errors and non-host guidance, provided permissions are clear and failures remain visible.
- Whether suggestion-only optional props live directly on `GameCard` or in a thin source-owned wrapper that delegates the entire base card anatomy; no duplicated card implementation is allowed.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Scope and Product Contracts
- `.planning/ROADMAP.md` §Phase 10: Picking a Game Redesign — Fixed phase goal and success criteria.
- `.planning/REQUIREMENTS.md` §Picking a Game (`PICK-01` through `PICK-03`) — Required session header, attendee-aware suggestions, and host pick action.
- `.planning/PROJECT.md` §Current Milestone — Tabletop Social redesign and architecture constraints.
- `.planning/phases/05-design-system-foundation/05-UI-SPEC.md` — Typography, M3 tokens, cards, badges, avatars, loading states, accessibility, and responsive contracts.
- `.planning/phases/09-home-collection-redesign/09-CONTEXT.md` — Locked rich-card, plain-text description, BGG link, grid/list, and skeleton behavior reused here.

### Session Lifecycle and Authorization
- `docs/adr/012-session-lifecycle-state-machine.md` — Authoritative draft → invited → picking → completed/cancelled transitions and host-only actions.
- `app/models/night_session.rb` — Current state predicates and session relationships.
- `app/graphql/mutations/pick_game.rb` — Host-only pick authorization, picking-state guard, and group-collection membership validation.
- `spec/graphql/pick_game_mutation_spec.rb` — Mutation security and lifecycle regression contract.
- `app/graphql/mutations/update_session_preferences.rb` — Existing preference lock once picking starts; must remain unchanged.
- `docs/adr/008-authentication-session-strategy.md` — Bearer-token current-user boundary.

### Suggestion Engine Contract
- `.planning/phases/07-suggestion-engine-backend/07-CONTEXT.md` — Locked top-eight ranking, score fields, confidence semantics, reasons, candidate pool, and preference rules.
- `.planning/research/FEATURES.md` §Poll-Based Suggestion Engine — Product scoring and explainability specification.
- `app/services/suggestions/engine.rb` — Actual deterministic scoring and reason generation.
- `app/graphql/types/night_session_type.rb` — Suggestion resolver state/auth/Dataloader behavior.
- `app/graphql/types/suggestion_type.rb` — Suggestion GraphQL shape.
- `app/graphql/types/suggestion_breakdown_type.rb` — Numeric breakdown shape.
- `spec/requests/night_session_suggestions_spec.rb` — Authoritative resolver, ranking, confidence, authorization, and batching behavior.

### Frontend Integration
- `app/frontend/views/NightSessionView.vue` — `/s/:id` state-driven composition root and current picking branch.
- `app/frontend/components/session/GamePicker.vue` — Existing full-collection picker to replace.
- `app/frontend/components/session/SessionEditor.vue` — Draft editor field/validation patterns to adapt for details editing.
- `app/frontend/components/session/SessionSummary.vue` — Existing completed-state destination after a pick.
- `app/frontend/apollo/queries/night_session.graphql` — Session operation to extend with suggestions and preferences.
- `app/frontend/components/collection/GameCard.vue` — Rich safe card anatomy and action slot.
- `app/frontend/components/collection/GameGrid.vue` — Reusable grid/action-slot and loading patterns.
- `app/frontend/components/common/MemberAvatar.vue` — Deterministic attendee avatars.
- `docs/adr/006-vue-apollo-normalized-cache.md` — Apollo server-data source-of-truth rule.
- `tests/e2e/session_lifecycle.spec.ts` — Browser lifecycle journey to update for the redesigned picker.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `NightSessionView.vue` already swaps dedicated components by session state and will remain the composition root.
- `GameCard.vue` and `GameGrid.vue` already provide the rich anatomy, safe external activation, action-slot isolation, skeletons, and responsive layout foundation.
- `MemberAvatar.vue`, Badge, Button, Card, Dialog/Sheet, EmptyState, and Skeleton primitives already match the Tabletop Social system.
- `SessionEditor.vue` and `sessionDraft.ts` provide existing detail fields and validation patterns, though the picking editor needs save-only semantics and must not reuse draft scheduling behavior.
- `SessionSummary.vue` already handles the normalized completed result after `pickGame`.

### Established Patterns
- Vue 3 `<script setup lang="ts">`; Apollo owns server data; Pinia is UI/draft state only.
- GraphQL mutations use a dry-validation contract and explicit authorization/state guards.
- GraphQL schema and frontend types are generated; schema changes require schema dump and codegen.
- Session state controls component composition; mutations return the updated entity so Apollo drives the next visible state.
- Material 3 semantic utilities and source-owned primitives replace hard-coded palette or one-off component styling.

### Integration Points
- Extend `night_session.graphql` and generated operations with suggestions and preference fields.
- Replace `GamePicker.vue`'s `useGroupCollectionQuery` and client player-range filter with `session.suggestions`.
- Add and register `updateSessionDetails` plus its GraphQL operation, contract, and focused authorization/state tests.
- Wire host-only header editing and suggestion picking through `NightSessionView.vue` without changing route structure.
- Extend Phase 9 card tests plus session component/E2E coverage while preserving collection regressions.

</code_context>

<specifics>
## Specific Ideas

- The picking screen should feel decisive rather than like another collection browser: session context first, a short explainable ranking second, one strong pick action per card.
- The heading should communicate attendee count directly: **Game Suggestions (Filtered for N Players)**, with time and complexity filters adjacent but read-only.
- Backend-generated reason chips such as player-count fit and owner names are the primary explanation; confidence is supporting context rather than a dense analytics panel.
- Editing ordinary session details must not silently change the shortlist or reopen lifecycle states.

</specifics>

<deferred>
## Deferred Ideas

- Attendee voting/ranked ballots and “who brings it” ownership assignment remain v2 work.
- A Browse All/full group collection fallback is intentionally excluded; the existing Collection route remains the browsing surface.
- Editing time budget or complexity after picking begins remains forbidden by the Phase 7 contract.
- Session history, play logging, and a dedicated re-pick flow remain outside Phase 10.

</deferred>

---

*Phase: 10-Picking a Game Redesign*
*Context gathered: 2026-07-17*
