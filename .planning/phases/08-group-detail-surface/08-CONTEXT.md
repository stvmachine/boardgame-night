# Phase 8: Group Detail Surface - Context

**Gathered:** 2026-07-15
**Status:** Ready for planning

<domain>
## Phase Boundary

This phase replaces the existing basic group page with a responsive "Tabletop Social" group hub. It delivers the group header and creation CTA, a role-aware upcoming-sessions list, a four-game shared-collection spotlight, a members panel with authorized per-member actions, and owner/admin invite controls with link copying and the existing email invitation flow.

The phase may extend the Group GraphQL read shape and reuse existing group/session mutations as needed to support this surface. It does not add session history, new membership roles or permissions, self-service group leaving, recurring sessions, voting, the Phase 9 full Collection redesign, or the Phase 10 game-picking redesign.

</domain>

<decisions>
## Implementation Decisions

### Hub Layout and Responsive Order
- **D-01:** On desktop, use a full-width group header above a wide main column and a narrower management side rail. Upcoming sessions and the shared-collection spotlight belong in the main column; members and invite controls belong in the side rail.
- **D-02:** On mobile, stack content in this order: group header, upcoming sessions, shared-collection spotlight, members, invite controls.
- **D-03:** The existing owner/admin-only **Create a night** action appears in the header. It is right-aligned beside the title on desktop and becomes a prominent full-width button below the description on mobile. Do not broaden creation permissions.
- **D-04:** Keep the members/invite side rail sticky on desktop while the main column scrolls. The responsive implementation must stop sticky behavior before the rail can overflow or obscure content on smaller viewports.

### Upcoming Sessions
- **D-05:** Use a role-aware active list. All group members see `invited` and `picking` sessions; owners/admins additionally see `draft` sessions. Exclude `completed` and `cancelled` sessions. An undated draft displays **Date TBD**.
- **D-06:** Order sessions with any `picking` session first, then invited sessions by `scheduledAt` ascending, and undated drafts last. Ordering must be deterministic.
- **D-07:** Make the whole session row navigate to the existing `/s/:id` route. Include a trailing state-aware CTA, such as **Choose a game** for `picking` and **View details** for other visible states.
- **D-08:** Use a role-aware empty state. Owners/admins see **Plan your first game night** with a create action; ordinary members see a neutral **No nights planned yet** message without an unauthorized control.

### Shared Collection Spotlight
- **D-09:** Select exactly four spotlight games deterministically by owner count descending, then BGG rating descending, then game name ascending. This should emphasize games shared by the most group members.
- **D-10:** If fewer than four games have multiple owners, fill the remaining slots with the highest-rated single-owner games. Show an empty state only when the group collection itself has no games.
- **D-11:** Use compact spotlight cards rather than the full Collection `GameCard`: thumbnail, title, rating badge, and an owner stack capped at three avatars plus a `+N` overflow count.
- **D-12:** **Browse Library** navigates to the single Collection surface in group-scoped mode: `/collection?group=<inviteCode>`. Do not create a duplicate full-library page inside Group Detail. Phase 9 should preserve this URL contract when redesigning CollectionView.

### Members and Invite Controls
- **D-13:** Only group owners and admins can see or copy the reusable group invite link. This matches the existing invite authorization boundary.
- **D-14:** Show a per-member action menu only when the current user has an authorized action for that row. Owners may change non-owner roles and remove non-owners; admins may remove non-owners; ordinary members and protected owner rows show no empty or disabled menu.
- **D-15:** Preserve inline member-removal confirmation. Expanding the row must name the member, explain that their games leave the shared collection, and provide explicit **Remove** and **Cancel** controls. Do not replace this with a modal dialog.
- **D-16:** Use one combined **Invite people** card in the side rail. Put the reusable invite-link field and copy control first, then retain the existing email and role invitation form below with clear visual separation.

### The Agent's Discretion
- Exact desktop column ratio, maximum content width, sticky offset, breakpoints, spacing, and skeleton composition, provided D-01 through D-04 remain intact.
- Exact date/time formatting, row density, and state-aware CTA wording for sessions.
- Spotlight-card click behavior and image fallback treatment; **Browse Library** behavior is locked by D-12.
- Copy-success presentation and duration, mutation loading/error feedback, and Apollo cache-update details.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase Scope and Requirements
- `.planning/REQUIREMENTS.md` §Group Detail (`GROUP-07` through `GROUP-11`) — Required header, sessions list, four-game spotlight, members panel, and invite-link copy behavior.
- `.planning/ROADMAP.md` §Phase 8: Group Detail Surface — Phase goal, dependencies, fixed boundary, and success criteria.
- `.planning/PROJECT.md` §Current Milestone: v1.1 UI Redesign + Suggestion Engine — Product context and the Stitch "Tabletop Social" design reference.
- `.planning/STATE.md` — Current milestone position and carried architecture/design-system decisions.

### Prior Phase Contracts
- `.planning/phases/04-auth-friend-groups-session-lifecycle/04-CONTEXT.md` — Existing group roles, invite behavior, dynamic group collection, session lifecycle, and authorization decisions that this phase must preserve.
- `.planning/phases/05-design-system-foundation/05-CONTEXT.md` — Locked Material 3 tokens, primitives, responsive shell, icons, avatars, badges, and component conventions for redesigned views.
- `.planning/phases/05-design-system-foundation/05-UI-SPEC.md` — Verified visual and interaction contract for the "Tabletop Social" design system.

### Milestone Research
- `.planning/research/FEATURES.md` §Group Detail Surface — Milestone feature expectations and the assessment of the existing Group Detail implementation.
- `.planning/research/PITFALLS.md` §Pitfall 5: Group Detail Page N+1 Queries and Pagination — Performance constraints for sessions, memberships, collection preview, and owner attribution.
- `.planning/research/ARCHITECTURE.md` — v1.1 frontend architecture and GraphQL/Apollo integration constraints.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `app/frontend/views/GroupView.vue` already owns the `/g/:token` query/loading/error boundary and renders `GroupDetail` inside `AppShell`.
- `app/frontend/components/group/GroupDetail.vue` is the replacement target. It already composes member management, invite controls, and collection data, but currently renders the entire game grid and no sessions.
- `app/frontend/components/group/MemberList.vue` already implements role labels, owner/admin authorization checks, role changes, and the selected inline removal-confirmation pattern.
- `app/frontend/components/group/InviteLink.vue` already implements clipboard copying and the email/role invitation form; it should be restyled and composed into the combined card from D-16 rather than discarded.
- `app/frontend/components/collection/GameCard.vue` provides image, rating badge, and owner-avatar patterns that can be adapted into a smaller spotlight-specific card.
- Phase 5 primitives under `app/frontend/components/ui/` provide Card, Badge, Avatar, DropdownMenu, Button, Icon, Skeleton, and related accessible building blocks.

### Established Patterns
- Vue components use Composition API with `<script setup lang="ts">`; Apollo owns server data and Pinia remains UI-only state.
- The existing role boundary is owner/admin for invitations and removals, with role changes restricted to owners. This phase changes presentation, not permissions.
- Session states are `draft`, `invited`, `picking`, `completed`, and `cancelled`; routes already navigate session details through `/s/:id`.
- Tailwind v4 classes must use the Material 3 semantic tokens and Phase 5 primitives rather than reintroducing hard-coded neutral/indigo styles.
- GraphQL schema and frontend operation types are generated artifacts; schema changes require schema dump and codegen rather than hand edits.

### Integration Points
- `app/frontend/apollo/queries/group.graphql` currently fetches group identity, memberships, and the full collection but no sessions. It needs a bounded Group Detail read shape.
- `app/graphql/types/group_type.rb` currently resolves memberships and the full dynamic merged collection. It is the main GraphQL integration point for session summaries and a limited spotlight.
- `app/graphql/types/query_type.rb` resolves groups by invite code or member-visible id. Authorization and invite-code exposure must remain consistent with D-13.
- `app/graphql/types/night_session_type.rb` and `app/models/night_session.rb` define the session fields and lifecycle used by D-05 through D-08.
- `app/frontend/router/index.ts` already defines `/g/:token`, `/s/:id`, and `/collection`; D-12 extends CollectionView with a `group` query parameter rather than adding another route.
- Existing mutations `updateGroupMemberRole`, `removeGroupMember`, `inviteToGroup`, and `createNightSession` should be reused; no replacement mutation family is needed.

</code_context>

<specifics>
## Specific Ideas

- The hub should optimize for the recurring visit: see the next active night first, then discover games; management controls remain available without dominating the page.
- "Shared collection" should feel genuinely social, so multi-owner games outrank merely high-rated games.
- Compact owner stacks should show at most three avatars and a `+N` count rather than rendering every owner.
- Preserve the existing email invitation capability while making copy-link sharing the first action in the combined invite card.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 08-Group Detail Surface*
*Context gathered: 2026-07-15*
