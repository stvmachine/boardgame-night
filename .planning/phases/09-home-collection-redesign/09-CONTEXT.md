# Phase 9: Home & Collection Redesign - Context

**Gathered:** 2026-07-15
**Status:** Ready for planning

<domain>
## Phase Boundary

This phase redesigns the existing Home and Collection routes with the established Tabletop Social Material 3 system. It delivers the Home merge hero, authenticated personal stats, a rich Trending on BGG preview, a responsive collection-filter workspace, richer grid/list game cards, the four required sort choices, and loading skeletons.

The phase may extend GraphQL read shapes and existing collection filter/permalink state where required. It must preserve the existing `/hot` route, merged-username and group-scoped collection modes, `/collection?group=<inviteCode>`, background collection imports, collector synchronization, and Apollo-as-server-state architecture. It does not add play logging, a session-history screen, a game-detail route, server-side collection search, or the Phase 10 picking redesign.

</domain>

<decisions>
## Implementation Decisions

### Home Dashboard and Hot Route
- **D-01:** Keep `/hot` as a standalone route and keep the Hot sidebar link. Home also shows a six-game **Trending on BGG** preview with a **View all** link to `/hot`; do not redirect or remove the existing route.
- **D-02:** On desktop, place the merge hero and personal stats card in a wide/narrow dashboard row, then place Trending on BGG below at full width. On mobile, stack hero → stats → trending, keeping the merge action first.
- **D-03:** Preserve the existing multi-username validation/tag behavior from `UsernameForm`, but present it as the redesigned hero with the primary label **Merge collections**. Successful submission continues to the canonical Collection route and existing permalink contract.

### Personal Stats
- **D-04:** Add one authenticated dashboard-stats GraphQL read instead of issuing another full merged-collection query from Home. Apollo remains the source of server data; do not mirror stats in Pinia or derive them from a possibly cold client cache.
- **D-05:** Define the three stats as: distinct base games in the signed-in user's bound BGG collection; distinct groups they own or belong to; and distinct non-cancelled night sessions they host or attend. Counts must be database-backed and authorization-scoped.
- **D-06:** For signed-out visitors, keep the stats card position but show a concise sign-in prompt instead of zeroes or protected data. The merge hero and trending preview remain usable without authentication.

### Trending Cards
- **D-07:** Home trending cards show rank, thumbnail/fallback, name, BGG rating, weight, player range, and play time. Enrich through persisted/batched Rails data; never issue synchronous per-card BGG requests from GraphQL or the browser. Required identity/rank fields always render, while unavailable enrichment uses a neutral `—` fallback.
- **D-08:** Use a responsive six-card grid on Home. The existing `/hot` page may reuse the same redesigned card component with its larger result set, but redesigning Hot-specific navigation or adding new Hot features is outside this phase.

### Collection Filter Workspace
- **D-09:** At `xl` and above, show a 264px Collection-local filter panel beside results with `xl:sticky` positioning. Below `xl`, replace it with a clearly labelled **Filters** button that opens a Sheet; never put filters back into the global 280px navigation sidebar.
- **D-10:** Player count uses a two-thumb inclusive range from 1 through `10+`. A game matches when it supports the entire selected range. Preserve old `players=N` permalinks as `N–N`; serialize a non-default range in a backward-compatible form.
- **D-11:** Play-time buckets are multi-select checkboxes with OR semantics between selected buckets. Complexity is a single-select segmented control: Any, Light, Medium, Heavy. Owner avatar toggles remain multi-select OR. Empty selections mean no restriction.
- **D-12:** Reuse the existing Fuse search, filter utilities, owner synchronization, group mode, auto-import, and URL hydration. Any store/permalink shape migration must retain old URLs and must not allow the reserved `group=<inviteCode>` token to collide with filter state.

### Rich Cards and View Modes
- **D-13:** Grid cards use a vertical layout with a two-line plain-text description; list cards use a horizontal layout with a three-line description. Never render BGG description HTML with `v-html`. Both modes show thumbnail/fallback, rating, title, capped owner avatars, and a three-column footer for players, time, and complexity.
- **D-14:** Card activation opens the corresponding BGG game using `objectid` in a new tab with `noopener,noreferrer`. Nested controls must remain independently keyboard-operable and must not trigger card activation.
- **D-15:** Grid is the default. Persist the grid/list choice in the collection URL as `view=grid|list` so shared permalinks reproduce the presentation; invalid values fall back to grid.
- **D-16:** Skeletons mirror the selected view: vertical card skeletons in grid mode and horizontal row skeletons in list mode. Existing loading, error, empty, refresh, and queued-import behavior must remain intact.

### Sort Contract
- **D-17:** Replace the exposed sort menu with exactly four product-facing choices: **Name A–Z**, **Rating High–Low**, **Weight Light–Heavy**, and **Recently Played**. Preserve deterministic name/id tie-breaks and migrate legacy sort query values where possible.
- **D-18:** Make **Recently Played** functional without adding a history UI: sort by the most recent non-cancelled `NightSession` that selected each game. In group mode, scope history to that group's sessions; in normal mode, scope it to groups the current authenticated user can access. Games without app play history sort last, then by name. Anonymous users receive the same deterministic no-history ordering rather than a disabled control.

### The Agent's Discretion
- Exact card aspect ratio, text-clamp utilities, desktop max width, spacing, filter section grouping, active-filter chip treatment, and Sheet animation, provided the responsive hierarchy and M3 contracts above remain intact.
- Exact GraphQL type names for dashboard stats, hot-item enrichment, and scoped last-played metadata.
- Whether the segmented control is a source-owned reka-ui ToggleGroup or an equivalent accessible primitive, provided it is reusable by Phase 10 and has full keyboard support.
- Exact breakpoint-specific card column counts and the redesigned `/hot` page's result count.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Scope and Requirements
- `.planning/ROADMAP.md` §Phase 9: Home & Collection Redesign — Fixed goal, requirements, dependencies, and success criteria.
- `.planning/REQUIREMENTS.md` §Home Dashboard and §Collection View Redesign — `HOME-01` through `HOME-03` and `COLL-19` through `COLL-23`.
- `.planning/PROJECT.md` §Current Milestone — Tabletop Social redesign goal and product constraints.

### Prior Design and Route Contracts
- `.planning/phases/05-design-system-foundation/05-CONTEXT.md` — M3 tokens/primitives and locked decision that collection filters belong inside CollectionView, not the global sidebar.
- `.planning/phases/05-design-system-foundation/05-UI-SPEC.md` — Typography, spacing, color, accessibility, touch-target, loading, and component contracts.
- `.planning/phases/08-group-detail-surface/08-CONTEXT.md` — Locked `/collection?group=<inviteCode>` Browse Library contract and Phase 8 responsive/component patterns.
- `.planning/phases/08-group-detail-surface/08-UI-SPEC.md` — Current card, heading, focus, avatar-stack, and responsive interaction conventions.

### Milestone Research
- `.planning/research/FEATURES.md` — Dashboard, filter, active-chip, and collection-card feature expectations.
- `.planning/research/ARCHITECTURE.md` — Vue/Apollo/Pinia boundaries and GraphQL integration constraints.
- `.planning/research/PITFALLS.md` — Collection payload, query, and client-side filtering performance risks.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `app/frontend/views/CollectionView.vue` already owns mutually exclusive merged/group queries, group normalization, queued imports, polling, errors, and empty/loading states.
- `app/frontend/composables/useCollectionFilters.ts`, `usePermalink.ts`, and filter/sort/grouping utilities contain the business behavior to migrate rather than rewrite.
- `app/frontend/components/collection/GameGrid.vue`, `GameCard.vue`, `ResultsSkeleton.vue`, and `EmptyState.vue` provide the current grouped/ungrouped rendering and M3 migration base.
- `app/frontend/components/common/MemberAvatar.vue` and `useMemberColor.ts` provide deterministic owner avatars.
- `app/frontend/components/ui/` provides Card, Input, Select, Checkbox, Sheet, Button, Badge, Icon, Skeleton, Tabs, and other accessible source-owned primitives.
- `app/frontend/components/landing/UsernameForm.vue` and `HotList.vue` provide the existing merge validation and hot-query behavior to preserve while redesigning presentation.

### Established Patterns
- Vue 3 `<script setup lang="ts">`; Apollo for server data; Pinia only for UI/filter state.
- Tailwind v4 semantic M3 tokens; no new hard-coded neutral/indigo palette classes.
- Schema and client operations are generated; GraphQL changes require schema dump and codegen.
- Internal navigation uses RouterLink; external BGG activation uses source `objectid` and opener isolation.
- Existing collection and shell E2E selectors/permalink round trips are compatibility contracts, not disposable tests.

### Integration Points
- `app/frontend/views/HomeView.vue` currently composes `UsernameForm` and `HotList`; it becomes the dashboard composition root.
- `app/frontend/components/layout/NavSidebarContent.vue` already queries collection synchronization data; Home stats must avoid introducing another full collection query.
- `app/frontend/components/collection/CollectionFilters.vue`, `SortControl.vue`, and `GroupByToggle.vue` are raw-control replacement targets.
- `app/frontend/stores/filters.ts` and `usePermalink.ts` need backward-compatible range, multi-select time, view-mode, and sort migrations.
- `app/graphql/types/hot_item_type.rb`, the hot resolver/client path, and persisted `BggThing` data are the enrichment boundary for HOME-03.
- Existing `NightSession.picked_game_id` provides authorized app history for functional Recently Played sorting without introducing play logging.

</code_context>

<specifics>
## Specific Ideas

- Home should feel like a dashboard rather than a duplicate collection page: merge first, personal context second, discovery third.
- Collection filters remain powerful but should not create a permanent “sidebar beside a sidebar” at constrained desktop widths.
- Rich cards should remain scannable; descriptions are supporting context, while player/time/complexity stats stay visually consistent across grid and list modes.
- “Recently Played” must work from existing night-session choices rather than shipping a knowingly dead or disabled option.

</specifics>

<deferred>
## Deferred Ideas

- Local play logging and a session-history screen remain v2 work; Phase 9 only derives a last-played sort signal from existing picked night sessions.
- Server-side collection search remains deferred until collection sizes exceed the documented client-side threshold.
- New Hot-specific discovery controls or route consolidation are outside Phase 9.

</deferred>

---

*Phase: 09-Home & Collection Redesign*
*Context gathered: 2026-07-15*
