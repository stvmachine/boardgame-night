# Pitfalls Research: v1.1 UI Redesign + Suggestion Engine

**Domain:** Rails 8 API + Vue 3 SPA monorepo with GraphQL, Tailwind v4, Material 3 / Stitch design system, and BoardGameGeek XML API v2 integration
**Researched:** 2026-07-13
**Confidence:** HIGH (Tailwind v4, Material Symbols, Apollo Client, and Rails N+1 guidance verified against official docs; BGG poll structure inferred from XML API documentation and known BGG API behavior; recommendation pitfalls verified against ML/recommendation-systems literature)

## Critical Pitfalls

### Pitfall 1: Material 3 Design System / Material Symbols Integration Mistakes

**What goes wrong:**
The redesign introduces Material 3 tokens (Inter font, indigo/Material tonal palette, Material Symbols icons, 280px sidebar, rounded-xl cards) but the implementation undermines performance and consistency: icons load as a 3 MB+ variable font because the team forgot to subset and pin axes; the whole app shows a flash of unstyled text (FOUT) or invisible ligatures during load; dark-mode surface colors are hand-picked and drift from the light palette; icons render at the wrong optical size or weight because Vue components don't pass `opsz`/`wght` values consistently.

**Why it happens:**
Material Symbols is a single font file with 2,500+ glyphs and four variable axes (FILL, wght, GRAD, opsz). The default Google Fonts URL loads every glyph and every axis, which is fine for prototyping but not for production. Ligature-based icons rely on the font being present before rendering; without `font-display: block` and preloading, users see the literal text `arrow_forward` briefly or blank squares. Tailwind v4's CSS-first `@theme` makes it easy to define custom color tokens, but without a source-of-truth mapping to Material 3 color roles (primary, on-primary, surface, surface-variant, inverse-surface, etc.), light and dark modes diverge. Designers reference the Stitch Figma file; engineers hardcode hex values in components, and the two palettes drift within a few sprints.

**How to avoid:**
1. **Subset and lock Material Symbols axes in production.** Use the Google Fonts `icon_names` parameter to load only icons used in the app (drops payload from ~295 KB to ~1-3 KB per icon set). Pin the axes you actually need, e.g. `FILL@0..1,opsz@24,wght@400` instead of the full variable range. Example:
   ```html
   <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:FILL,opsz,wght@0..1,24,400&icon_names=home,group,settings,add,close,menu,light_mode,dark_mode,chevron_right,search,filter_list,sort,refresh,person,logout&display=block" rel="stylesheet" />
   ```
2. **Preload the icon font** in the Rails SPA shell (`app/views/application/index.html.erb` or equivalent) so the font is in flight before the CSSOM is built:
   ```html
   <link rel="preload" href="https://fonts.gstatic.com/s/materialsymbolsoutlined/v1..." as="font" type="font/woff2" crossorigin>
   ```
3. **Use `font-display: block`** in the Google Fonts URL (already shown above) to prevent ligature text flashing before the icon font loads.
4. **Map Stitch/Material 3 tokens to Tailwind v4 `@theme` variables once.** Create a single `app/frontend/styles/theme.css` that defines `--color-primary`, `--color-on-primary`, `--color-surface`, `--color-surface-variant`, `--color-outline`, `--color-inverse-surface`, etc., and the corresponding light/dark values. Use `prefers-color-scheme` or a `.dark` class selector. Every component uses these tokens; never hardcode a hex value outside the theme file.
5. **Create a single `<MaterialIcon>` Vue component** that enforces consistent `opsz`, `wght`, `GRAD`, and `FILL` values. Do not scatter raw `<span class="material-symbols-outlined">` across the codebase. Example:
   ```vue
   <span class="material-symbols-outlined" :style="{ fontVariationSettings: axes }">{{ name }}</span>
   ```
6. **Avoid the "variable font for everything" trap.** If the app only needs one static weight and no fill animation, request a static instance rather than the full variable font. Only request the full variable range if you are animating FILL or wght.

**Warning signs:**
- Lighthouse "Reduce unused font bytes" flags Material Symbols as the largest asset.
- Users see the literal text `arrow_forward` or `close` before icons render.
- Icons look too heavy at small sizes or too thin at large sizes (wrong `opsz`/`wght`).
- Dark mode cards use a different gray than the sidebar; some surfaces use `--color-neutral-200` while others use a hand-coded `#e5e7eb`.
- Adding a new icon requires editing the Google Fonts URL in three places.

**Phase to address:**
Design-system foundation phase (the first phase of the redesign). The token file, icon component, and font-loading strategy must be in place before any screens are rebuilt.

---

### Pitfall 2: Tailwind v4 CSS-First Config Conflicts During Design System Migration

**What goes wrong:**
The app is already on Tailwind v4 with a minimal CSS-first setup (`@import "tailwindcss";` plus a few `@theme` variables). The redesign introduces a comprehensive token system, but migration mistakes break existing components: old utilities like `rounded-sm`/`shadow-sm` no longer mean what they meant in v3; custom utilities defined with `@layer utilities` are silently ignored; `@apply` inside Vue `<style>` blocks fails because the new theme variables are not visible to separately bundled CSS; the team accidentally imports the default Tailwind color palette alongside the custom palette, causing token collisions and bloated CSS.

**Why it happens:**
Tailwind v4 is a major rewrite: it removes `@tailwind` directives, replaces `tailwind.config.js` with CSS `@theme`, changes default scales (e.g., `rounded-sm` → `rounded-xs`, `shadow-sm` → `shadow-xs`), removes deprecated utilities (`bg-opacity-*`, `flex-shrink-*`), renames utilities (`outline-none` → `outline-hidden`), and changes how custom utilities/components are registered (`@utility` instead of `@layer utilities`). Vue SFC `<style>` blocks are bundled separately from the main CSS, so they can't see theme variables unless you use `@reference`. The v3-to-v4 upgrade tool handles simple migrations, but design-system migrations are never simple and often leave behind stale `@apply` and `@layer` blocks.

**How to avoid:**
1. **Run `npx @tailwindcss/upgrade` in a branch** and review the diff, but do not treat it as the final state. The tool will migrate `tailwind.config.js` to `@config`, but the goal is to replace it with a clean CSS-first `@theme` file.
2. **Replace the old config with a single `@theme` file.** Define the full Stitch palette in `app/frontend/styles/theme.css` and import it before any components. If you must keep a legacy `tailwind.config.js`, load it explicitly with `@config` only for plugins that v4 does not yet support.
3. **Reset the default color namespace** if the custom palette is comprehensive:
   ```css
   @theme {
     --color-*: initial;
     --color-primary: #4f46e5;
     --color-on-primary: #ffffff;
     /* ... all custom colors ... */
   }
   ```
   This prevents accidental use of `bg-red-500` when the design system only wants `bg-error` or `bg-destructive`.
4. **Audit renamed utilities.** Replace `rounded-sm` with `rounded-xs`, `shadow` with `shadow-sm`, `outline-none` with `outline-hidden`, and `flex-shrink-*` with `shrink-*` across the codebase. Do this as a single mechanical commit before the redesign starts.
5. **Use `@reference "../styles/theme.css"` in Vue `<style>` blocks** whenever you need `@apply` with custom utilities or theme variables. Better yet, avoid `@apply` entirely and use the generated CSS variables directly (`color: var(--color-primary)`), which works across all bundles without `@reference`.
6. **Register custom utilities with `@utility`, not `@layer utilities`.** For example, the status-badge styles should be defined as `@utility badge-pill { ... }` in the global theme CSS so they work with variants.
7. **Keep the default Tailwind spacing/typography scale unless the design system explicitly overrides it.** Replacing `--spacing` or the full font scale is high-risk; limit the first migration to colors, shadows, and radii.

**Warning signs:**
- `rounded-sm` produces a different radius than the design spec.
- `outline-none` no longer hides the focus ring in forced-colors mode.
- Custom classes in `@layer utilities` are not picked up by Tailwind.
- Vue SFC styles fail to compile with "unknown utility" errors.
- Production CSS is much larger than expected because both default and custom palettes are generated.

**Phase to address:**
Design-system foundation phase, immediately after the token file is created. Do this before migrating any existing screens to the new visual style.

---

### Pitfall 3: BGG Poll Data Pitfalls in the Suggestion Engine

**What goes wrong:**
The suggestion engine weights scores using BGG's "Suggested Number of Players" poll data, but the implementation produces bad results: games with no poll data get a zero score and disappear; games with few votes get ranked higher than games with thousands of votes because the raw "Best" vote count is used without normalization; the `numplayers` attribute contains strings like `"2"`, `"3-4"`, `"4+"`, or `"2, 3, 4"` that the parser treats inconsistently; fetching poll data requires an extra `/thing?id=...&stats=1` call per game, which exhausts the BGG rate limit; cached thing data is reused without invalidating the new poll fields, so the suggestion engine runs on stale data.

**Why it happens:**
BGG's `/thing` endpoint returns three polls (`suggested_numplayers`, `suggested_playerage`, `language_dependence`) under `<statistics>`. Each poll has `<results numplayers="N">` with `<result value="Best" numvotes="...">`, `<result value="Recommended" numvotes="...">`, and `<result value="Not Recommended" numvotes="...">`. The structure is not identical for every game; some polls are missing entirely, some have `totalvotes="0"`, and the `numplayers` string can represent a single count, a range, or a "plus" count. The existing `BggThing` model already stores statistics (`average`, `bayes_average`, `users_rated`, `average_weight`, `num_comments`) but has no columns for poll data. The v1 normalizer in `app/services/bgg.rb` doesn't currently parse polls, and the old proxy normalized `polls: []` without storing them. Any new feature that reads polls must either extend the XML normalizer or fetch thing data on demand, which adds BGG API calls.

**How to avoid:**
1. **Add a structured `player_poll_scores` JSON column to `bgg_things`.** Store the parsed "best" and "recommended" scores per player count, normalized by total votes. Do not store raw vote counts only; precompute a score like `best_score = best_votes / total_votes` and `recommend_score = (best + recommended) / total_votes`. This makes the suggestion engine queryable and avoids re-parsing XML on every suggestion request.
2. **Normalize the `numplayers` string defensively.** Use a `Bgg::PollNormalizer` service that handles:
   - `"2"` → `[2]`
   - `"3-4"` → `[3, 4]`
   - `"4+"` → `[4, 5, 6, ... up to maxPlayers]`
   - `"2, 3, 4, 5, 6, 7, 8, 9, 10+"` → split on comma and strip.
   Always fall back to `min_players..max_players` if the poll is missing or malformed.
3. **Require a minimum vote threshold.** Treat polls with `totalvotes < 10` (or similar) as "insufficient data" and fall back to the min/max player count heuristic, not to zero. This prevents niche games from dominating or disappearing.
4. **Fetch poll data as part of the existing `/thing` import, not on demand.** The `ImportCollection` flow already enqueues background jobs to fetch and cache thing details. Extend `Bgg::ThingNormalizer` to parse `<poll name="suggested_numplayers">` and persist the scores. Do not make a separate `/thing` call from the suggestion engine; read from the database.
5. **Respect the BGG rate limit when backfilling polls.** If you need to retroactively populate poll data for existing `bgg_things`, enqueue one `FetchBggThingJob` per game with `limits_concurrency to: 1, key: "bgg_api"` and a 5-second delay between jobs. The existing `Bgg::RateLimiter` and `retry_on` must apply. A backfill of 1,000 games will take ~85 minutes; plan for it.
6. **Cache-invalidation strategy:** version the cache key for thing data to include a "poll schema version". When the normalizer changes, the old cached XML is invalidated. Use `Rails.cache` with a 7-day TTL for thing data and a 30-day TTL for poll scores (polls rarely change). If the suggestion engine scores are computed on the fly, cache the computed shortlist per `(session_id, attendee_ids)` with a short TTL (5 minutes) because session state changes frequently.

**Warning signs:**
- Suggested games exclude well-known titles that happen to have no BGG poll votes.
- A 2-player-only game scores highly for a 6-player session because `numplayers="2"` was misinterpreted as a range.
- The `/thing` endpoint is hit repeatedly during the "Pick a Game" flow, causing 503 responses.
- Suggestion results differ between the first load and a refresh because the cache contains stale XML without poll fields.
- Games with identical mechanics but very different player counts receive the same score.

**Phase to address:**
Suggestion-engine backend phase. The poll parsing and persistence must be built before the scoring algorithm can be tested reliably. This is also a prerequisite for the "attendee-aware filtered suggestions" feature.

---

### Pitfall 4: Suggestion Engine Algorithm Pitfalls

**What goes wrong:**
The poll-based suggestion engine produces recommendations that feel random or unfair: new groups with no play history get an empty or generic shortlist (cold start); the algorithm over-fits to the exact player count and ignores games that are "good with 3-5" when 4 people are attending; a single owner's collection dominates the results because the score isn't normalized across owners; the "explainability" UI shows a raw numeric score with no human-readable reason; the engine becomes slow when the shared collection exceeds a few hundred games because it recomputes everything in the GraphQL resolver; or the algorithm suggests expansions that nobody has the base game for.

**Why it happens:**
Recommendation systems are easy to prototype and hard to get right. A naive implementation sums poll scores for each game and sorts, but that ignores ownership distribution, complexity preference, play time, and the fact that BGG polls are noisy. Cold start is real: a group with no session history has no signal about what they actually enjoy. Over-fitting to player count happens when the algorithm requires an exact match to `numplayers`. Performance degrades when scoring is done synchronously in a resolver that loops over every game in the merged collection. Explainability fails when the score is a black-box weighted average rather than a set of transparent criteria.

**How to avoid:**
1. **Start with a rule-based, explainable score, not a learned model.** The v1.1 engine should be a weighted sum of transparent factors:
   - Player-count fit (from BGG poll or fallback heuristic) — high weight.
   - Play-time fit vs. session duration preference — medium weight.
   - Complexity fit vs. group average `average_weight` — medium weight.
   - Ownership breadth (how many attendees own it) — medium weight.
   - BGG community rating (`bayes_average`) — low weight, only as a tie-breaker.
   Return each factor as a separate field in the GraphQL type so the UI can show "Good with 4 players · Owned by 3 of you · About 90 min · Weight 2.8".
2. **Handle cold start explicitly.** For new groups or sessions with no picked games, fall back to:
   - Games owned by the most attendees.
   - BGG "Hot Items" filtered by the session's player count and time budget.
   - A curated "starter night" list if the group has fewer than 10 candidate games.
3. **Normalize by owner count, not raw score.** A game owned by 4 attendees should be weighted more than a game owned by 1 attendee with a slightly higher poll score. Use `ownership_score = attendees_who_own / total_attendees` as a multiplicative factor, not an additive bonus.
4. **Exclude expansions without a base game in the merged pool.** The existing `BggThing` model hardcodes `is_expansion` to `false`; the redesign should either set this correctly during import or use the BGG links to identify base games. The suggestion engine must filter expansions unless the base game is also owned by at least one attendee.
5. **Compute the shortlist in a background job or service object, not the resolver.** The resolver should read a precomputed `suggestion_shortlists` table or cache keyed by `(group_id, session_id, attendee_ids_hash)`. This keeps the GraphQL query fast and the algorithm testable in isolation.
6. **Cap the shortlist and paginate.** Return the top 20-30 suggestions; don't send the entire scored collection to the frontend. The UI can show "See more" if needed.
7. **Avoid ML for v1.1.** Collaborative filtering or neural recommenders require session/play history data the app does not yet have. They are also not explainable. Keep the algorithm deterministic and debuggable.

**Warning signs:**
- The same 5 popular BGG titles appear for every session regardless of the group.
- The explanation panel just says "Score: 0.73" with no human-readable breakdown.
- Suggestions change dramatically when one attendee's collection is added or removed (over-fitting to ownership).
- "Pick a Game" takes 5+ seconds to load for large groups.
- Suggested expansions show up without their base game.

**Phase to address:**
Suggestion-engine backend phase, alongside the poll-data parsing work. The algorithm should be unit-tested with fixtures before the redesigned "Pick a Game" UI is wired up.

---

### Pitfall 5: Group Detail Page N+1 Queries and Pagination

**What goes wrong:**
The new Group Detail surface loads a group header, upcoming sessions, the shared collection spotlight, and a members panel. Without careful eager loading, the page triggers N+1 queries: 1 query for the group, 1 per session host, 1 per session attendee, 1 per member avatar, 1 per collection item owner, plus queries for sync status per member. On a group with 10 members and 50 shared games, this can be 100+ queries per page load, causing the GraphQL resolver to time out or the UI to show skeleton loaders for seconds.

**Why it happens:**
The existing `GroupType` resolver already shows the pattern:
```ruby
field :members, [Types::UserType], null: false
field :collection, Types::MergedCollectionType, null: false

def collection
  {
    items: BggThing.merged_for_users(object.member_ids),
    sync_statuses: object.members.map { |user| sync_status_for(user) } # members may not be loaded
  }
end
```
`BggThing.merged_for_users` performs a `JOIN` but does not eager load `bgg_collections` or `users` for each item. The `sync_statuses` call iterates `object.members` without ensuring they are loaded. The `memberships` field uses `includes(:user)`, but `members` does not. Any new Group Detail query that adds `night_sessions` with `attendees` and `host` will multiply these problems.

**How to avoid:**
1. **Eager load the entire Group Detail graph in one query object.** Build a `GroupDetailQuery` object (or service) that returns the group with `includes(:owner, { group_memberships: :user }, { night_sessions: [:host, { attendances: :user }] })`. Do not rely on GraphQL field resolvers to load associations on demand.
2. **Use `preload`/`eager_load` consistently for collection items.** When returning the merged collection for the group, eager load the owners through `bgg_collections`: `BggThing.merged_for_users(member_ids).includes(bgg_collections: :user)` or `preload` if the query has no conditions on the joined tables. Measure with `Bullet` in development/test.
3. **Paginate the shared collection spotlight.** The full merged collection may be hundreds of games. The Group Detail page should show only a curated subset (e.g., "Top 12 owned by most members") and link to the full Collection view. Use a database query with `LIMIT 12` and `ORDER BY` ownership count, not an in-memory sort after loading everything.
4. **Avoid loading full collection owner lists for every card in the spotlight.** For the Group Detail preview, show only the count of owners and the top 3 avatars, computed in SQL with `COUNT` and a window function if needed. Load full owner lists only on the Collection page.
5. **Precompute member sync status.** The existing `sync_status_for` method calls `user.bgg_collections.any?` and `user.bgg_collections.count`. These should be batched with a `UsersLoader` (`GraphQL::Dataloader`) or preloaded with `includes(:bgg_collections)`. Better: store a `last_synced_at` and `sync_status` column on `users` that is updated by the import job, so the resolver doesn't query the collection table at all.
6. **Set a query timeout.** Configure the GraphQL controller to abort queries that run longer than 5 seconds in production, returning a partial result with a "slow query" warning. This prevents the whole page from hanging when an N+1 slips through.

**Warning signs:**
- Bullet logs "N+1 Query" warnings for `GroupType`.
- Group Detail load time increases linearly with the number of members or games.
- The Rails log shows 100+ SQL queries for a single Group Detail GraphQL request.
- The shared collection spotlight renders all 200+ games before the user can interact with the page.
- Member avatars load one by one after the page skeleton appears.

**Phase to address:**
Group Detail phase. Eager loading and pagination should be designed into the `GroupType` resolver and the new `GroupDetail` component, not retrofitted after performance complaints.

---

### Pitfall 6: Apollo Cache Invalidation and Pinia Store Conflicts

**What goes wrong:**
After the redesign, users create a group or pick a game, but the UI still shows the old state: the new group doesn't appear in the sidebar, the picked game isn't reflected on the session page, the attendee count doesn't update after an RSVP, or the collection filter state persists across sessions. The team added `refetchQueries` to every mutation but some queries are inactive, so nothing refreshes; or they duplicated server data in Pinia and now the Apollo cache and Pinia store disagree.

**Why it happens:**
Apollo Client's normalized cache is the single source of truth for server data, but mutations don't automatically update every list that should contain the new/modified object. The app already uses `useRefreshCollection` and watches `syncStatuses` to sync Pinia with Apollo, but this pattern is fragile. `refetchQueries` only works if the target query is active (currently mounted). Adding data to a list requires either returning the new object in the mutation response and using an `update` callback with `cache.modify`, or refetching the parent query. Pinia is intended for UI-only state (filters, sidebar open/close, draft session), but it's tempting to store server-derived data (like the list of groups) there for easy access, creating two sources of truth.

**How to avoid:**
1. **Server data lives in Apollo; Pinia holds UI-only state.** The existing `useCollectorsStore`, `useFilterStore`, and `useUiStore` follow this pattern. Extend it strictly: do not add group lists, session lists, or user profiles to Pinia. Use Apollo `useQuery`/`useMutation` directly or wrap them in lightweight composables.
2. **Return modified objects in mutation responses.** Every mutation that creates or updates a group, session, attendance, or game pick should return the affected object(s) with `__typename` and `id`. Apollo will normalize and update the cache automatically for those objects.
3. **Use `update` callbacks to append to list fields.** For mutations that add items to a list (e.g., `createGroup`), provide an `update` function that uses `cache.modify` to add the new `Group` reference to the cached list of groups. Example:
   ```ts
   update(cache, { data: { createGroup } }) {
     cache.modify({
       fields: {
         groups(existing = []) {
           const newRef = cache.writeFragment({ data: createGroup, fragment: GroupFragment });
           return [...existing, newRef];
         }
       }
     });
   }
   ```
4. **Use `refetchQueries` as a fallback, not the primary strategy.** Refetching is fine for low-frequency mutations (e.g., deleting a group) but wasteful for common actions. Prefer surgical cache updates. When you do refetch, use active query names and consider `awaitRefetchQueries: true` for user-facing actions.
5. **Evict or invalidate stale queries when necessary.** If a mutation changes data that is hard to update surgically (e.g., recalculating a suggestion shortlist), use `cache.evict` or `INVALIDATE` to force affected queries to refetch. Be careful: evicting a list can cause a loading flash.
6. **Choose fetch policies deliberately.** For the Group Detail page, use `cache-and-network` for the first load (fast response + freshness) and `cache-first` for subsequent navigation. For the "Pick a Game" shortlist, use `network-only` or `cache-first` with a short TTL because the score depends on live session state. Use `nextFetchPolicy` to demote `network-only` to `cache-first` after the first fetch.
7. **Pinia and Apollo sync only at the UI boundary.** If a component needs both Apollo data and Pinia UI state, derive it in the component with `computed`, not by copying Apollo data into Pinia. The existing `Sidebar.vue` watching `syncStatuses` to update `useRefreshCollection` is acceptable because it is a one-way, ephemeral sync; do not store the collection itself in Pinia.

**Warning signs:**
- After creating a group, the user must refresh the page to see it in the sidebar.
- After picking a game, the session page still shows "Picking" instead of "Completed".
- RSVP count in the UI doesn't match the server state until the page is refreshed.
- The same data appears in both a Pinia store and an Apollo query, and they get out of sync.
- `refetchQueries` works on one screen but not another because the query name is inactive.

**Phase to address:**
GraphQL/frontend integration phase. Define the cache strategy (mutation `update` callbacks, fetch policies, Pinia boundaries) when the redesigned components are first wired to the API, not after user-reported stale-data bugs pile up.

---

### Pitfall 7: GraphQL Schema Evolution Breaking the Existing Frontend

**What goes wrong:**
The redesign adds new fields and types to the GraphQL schema (e.g., `SuggestionScore`, `PollResult`, `GroupDetail`, dark-mode/theme fields, `MaterialIcon` enums). A minor mistake in the schema change causes the existing Vue frontend to break: a previously non-null field is now nullable, an enum value is renamed, a mutation returns a new type without the old fields, or the generated TypeScript types drift from the actual schema. The monorepo's codegen CI check fails, but someone bypasses it.

**Why it happens:**
GraphQL is versionless, but that only works if you add fields and never remove or rename them without deprecation. The existing app already has a stable schema and uses `@graphql-codegen` to generate types. The redesign adds features that require schema changes. If the team treats the schema as an afterthought, they will introduce breaking changes (e.g., changing `Thing.average` from `Float` to `Float!` to fix a null issue, which can break queries that didn't request it). Also, the existing frontend's generated types and composables must be regenerated after every schema change; the monorepo's contract depends on this.

**How to avoid:**
1. **Follow the GraphQL schema evolution rule: add only, deprecate before removing.** All new fields should be optional/nullable unless you are absolutely certain every client will request them. If you must change a field type, add the new field with a different name and mark the old one `@deprecated`.
2. **Use `@deprecated` with a reason and planned removal date.** Example:
   ```graphql
   type Thing {
     average: Float @deprecated(reason: "Use rating.average instead. Removed in v1.3")
   }
   ```
3. **Regenerate types as part of the build.** Keep `schema.graphql` committed and run `graphql-codegen` in CI. Fail the build if the committed schema and the generated types are out of sync. The existing monorepo already has this contract; enforce it.
4. **Add new types for redesign-specific concerns rather than overloading existing types.** Create `SuggestionScore` and `SuggestionReason` types instead of bolting fields onto `Thing`. This keeps the existing `Thing` contract stable and lets the new UI evolve independently.
5. **Version internal feature flags, not the schema.** If the redesign needs to ship incrementally, use nullable fields that the new UI checks for, or use a `featureFlags` query. Do not introduce a `/graphql/v2` endpoint.
6. **Test schema changes against the existing frontend.** Before merging a schema change, run the existing frontend tests and Playwright E2E suite to catch broken queries. The existing app has 11 E2E tests; don't let them bit-rot during the redesign.
7. **Document breaking changes.** If a truly breaking change is unavoidable, document it in `docs/adr/` and update the frontend in the same commit/PR.

**Warning signs:**
- `graphql-codegen` produces TypeScript errors after pulling main.
- The Vue app crashes with "Cannot read properties of undefined" because a field is now nullable.
- A query that worked yesterday now returns a GraphQL validation error.
- The committed `schema.graphql` no longer matches the Rails-generated schema.
- Two frontend components request the same entity with different field sets, causing cache normalization issues.

**Phase to address:**
GraphQL schema design phase, at the start of each redesign feature. Schema changes should be planned before implementation, not added ad hoc during component development.

---

### Pitfall 8: Dark Mode Implementation Drift and Responsive Regressions

**What goes wrong:**
The redesign ships dark mode, but it's inconsistent: some cards invert correctly while others keep a light background; text becomes unreadable on a custom status badge; the sidebar is always light even when the rest of the app is dark; the mobile drawer uses a different dark surface than the desktop sidebar; or switching themes causes a full-page flash because the theme class is set in JavaScript after hydration. On mobile, the 280px sidebar doesn't collapse, causing horizontal scroll or clipped content; the collection grid uses 4 columns on small screens; filter badges wrap awkwardly.

**Why it happens:**
Dark mode is not just "invert colors"; it requires a complete set of surface/on-surface/variant/outline tokens. Tailwind v4's default `dark:` variant uses `prefers-color-scheme`, but a manual toggle requires `@custom-variant dark (&:where(.dark, .dark *))`. If the team mixes both strategies, the class-based manual toggle and the OS preference fight. Responsive regressions happen because the redesign changes the sidebar width, card grid, and filter layout without re-testing every breakpoint. The existing `Sidebar.vue` and `MobileDrawer.vue` components need to be updated together.

**How to avoid:**
1. **Pick one dark-mode strategy and commit to it.** For a manual toggle, define:
   ```css
   @custom-variant dark (&:where(.dark, .dark *));
   ```
   in `theme.css` and apply the `.dark` class to `document.documentElement` based on localStorage + `matchMedia`. Do not rely on `prefers-color-scheme` unless the app has no manual toggle.
2. **Use the Material 3 surface color roles everywhere.** Every background should be `bg-surface`, `bg-surface-container`, or `bg-surface-container-high`; every text should be `text-on-surface` or `text-on-surface-variant`. Status badges should use `bg-primary-container text-on-primary-container`. If a component ever uses `bg-white` or `text-black`, it is a bug in dark mode.
3. **Design the dark palette in the same `@theme` block as the light palette.** Define each color role twice, once outside a media query for light and once inside `.dark` or `@media (prefers-color-scheme: dark)`. Do not create a separate `dark.css` file that engineers forget to import.
4. **Update the sidebar and mobile drawer together.** Both should share the same surface container color, width tokens (e.g., `--sidebar-width: 280px`), and collapse behavior. The mobile drawer should be an overlay, not a persistent 280px column.
5. **Test responsive breakpoints with actual device widths.** The collection grid should use `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`, not a fixed `grid-cols-4`. The filter sidebar should become a collapsible panel on `md:` and below.
6. **Avoid theme flashing on load.** Set the `.dark` class in a small script in the Rails SPA shell before the Vue app mounts, reading from `localStorage` and `matchMedia`. This prevents a white-to-dark flash.

**Warning signs:**
- Toggling dark mode leaves a white rectangle around the sidebar.
- Text on a custom badge is low-contrast in one theme.
- The mobile layout looks broken after the redesign but desktop looks fine.
- The app flashes light then dark on initial load.
- `dark:` utilities don't work because the `.dark` class is missing from the root element.

**Phase to address:**
UI redesign phase, integrated with the design-system foundation. Test dark mode and responsiveness on every redesigned screen before marking it complete.

---

## Technical Debt Patterns

Shortcuts that seem reasonable during the redesign but create long-term problems.

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Load the full Material Symbols variable font without subsetting | Works on first prototype, no need to maintain an icon list | 3 MB+ font payload, slow first paint, FOUT | Never for production. Only for a design-system spike. |
| Hardcode hex colors in components instead of theme variables | Faster styling, no need to learn token names | Light/dark drift, inconsistent palette, painful redesigns | Never. All colors must come from `@theme` variables. |
| Store server data (groups, sessions) in Pinia for "convenience" | Easy access from any component | Cache/server state divergence, stale data bugs | Never. Use Apollo's normalized cache. |
| Fetch BGG poll data on demand in the suggestion resolver | No schema migration needed | Rate-limit storms, 5+ second suggestion loads | Never. Persist poll scores during thing import. |
| Use raw vote counts for player-count fit | Simple to implement | Over-ranks niche games with few voters | Never. Normalize by total votes and apply a minimum threshold. |
| Return the entire scored collection to the frontend | Simple GraphQL type, no pagination | Slow UI, large payloads, poor UX | Never. Cap the shortlist at 20-30 and paginate. |
| Add new GraphQL fields as non-null because "they're always present" | Simpler types | Breaks existing queries when the field is missing or nullable | Never for new fields; keep new fields nullable. |
| Skip E2E tests during redesign because "we'll fix them later" | Faster iteration | Regressions go unnoticed, existing flows break | Never. Keep the E2E suite green or mark known failures explicitly. |
| Recompute the suggestion shortlist in the resolver | No new DB table or cache | Unbounded latency as collections grow | Prototype only. Ship with precomputed/cache-backed shortlist. |
| Leave `@layer utilities` custom classes in place after v4 migration | Avoids rewriting utility code | Custom utilities don't work with variants in v4 | Only during migration spike. Replace with `@utility` before merge. |

## Integration Gotchas

Common mistakes when connecting the new redesign features to the existing Rails + Vue system.

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Material Symbols + Vite | Loading the font via a CSS `@import` without preloading | Use `<link rel="preload">` in the SPA shell + `display=block` in the Google Fonts URL. |
| Tailwind v4 + Vue SFC styles | Using `@apply` with theme variables that aren't visible | Use `@reference` to import the theme file, or better, use CSS variables directly (`color: var(--color-primary)`). |
| Tailwind v4 + custom utilities | Defining utilities with `@layer utilities` | Use `@utility` so variants (`hover`, `dark`, `md`) work. |
| BGG thing XML + polls | Treating `polls` as always present and well-shaped | Use Nokogiri nil-safe access; handle missing polls, zero total votes, and range strings like `3-4` and `4+`. |
| BGG poll backfill | Running backfill jobs without `limits_concurrency` | Enqueue one job per thing with `limits_concurrency to: 1, key: "bgg_api"` and `retry_on`. |
| Apollo mutations + lists | Adding `refetchQueries` and hoping it updates the sidebar | Return modified objects + use `update` with `cache.modify` for list fields. |
| Apollo + Pinia | Copying query results into a store to share data | Derive UI state from Apollo in components; keep Pinia for UI-only state. |
| GraphQL schema evolution | Renaming or changing a field type without `@deprecated` | Add new fields, deprecate old ones, regenerate types, run existing tests. |
| Group Detail resolver | Returning `members` and `collection` without eager loading | Use `includes`/`preload` for the full graph; measure with Bullet. |
| Dark mode | Mixing `prefers-color-scheme` and a manual `.dark` class | Choose one strategy; for manual toggle, define `@custom-variant dark` and set `.dark` class before hydration. |
| Suggestion engine | Summing raw poll votes without normalization | Precompute `best_score` and `recommend_score` per player count, normalized by total votes, with a minimum threshold. |
| Responsive layout | Hardcoding the 280px sidebar on all breakpoints | Use a collapsible drawer on mobile; reserve the fixed sidebar for `lg` and up. |

## Performance Traps

Patterns that work for small collections or fast connections but fail at scale.

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Full Material Symbols variable font | Largest Contentful Paint (LCP) > 2.5s on mobile, font warnings in Lighthouse | Subset to used icons, pin axes, preload | Any production user, especially on slow 3G |
| Synchronous suggestion scoring in resolver | "Pick a Game" page takes 5-10s to load for large groups | Precompute shortlist in a service/cache keyed by session + attendees | 5+ attendees or 100+ shared games |
| Loading full collection owner lists for every card | Large JSON payloads, slow render of collection grid | Limit owners to count + top 3 avatars on previews; load full owners on demand | Group Detail preview or large collections |
| N+1 on Group Detail | 100+ SQL queries per page load, slow TTFB | Eager load associations; use Dataloader for per-user fields; precompute sync status | 5+ members or 5+ sessions |
| Recomputing suggestion scores on every render | UI freezes when toggling attendees | Memoize scores in Vue `computed` or fetch precomputed shortlist from server | Real-time attendee toggling |
| Apollo `refetchQueries` on every mutation | Extra network requests, cascading loading states | Use surgical `update` callbacks; refetch only when necessary | Common actions like RSVP, pick game |
| Client-side Fuse.js on the full merged collection | UI jank when searching 300+ games | Move search indexing to backend (Postgres `pg_trgm` or full-text search) via GraphQL | 300+ shared games |
| No pagination on shared collection spotlight | Group Detail renders all games before interactive | Use `LIMIT`/offset or cursor pagination; show only curated subset | 50+ shared games |
| Loading thing images without lazy loading | All thumbnails load at once, data usage spikes | Use `loading="lazy"` or a virtual scroller for long lists | 50+ game cards |

## UX Pitfalls

Common user experience mistakes specific to the redesign and suggestion engine.

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Icon font not loaded before first paint | Users see broken ligature text or blank squares | Preload + `font-display: block` + subset. |
| Dark mode toggle flashes the old theme | Jarring white-to-dark transition | Set `.dark` class in the SPA shell before Vue hydration. |
| Suggestion scores are opaque | Users don't trust or understand why a game is recommended | Return per-factor reasons (player fit, time, complexity, ownership) and display them as badges. |
| Cold-start group gets empty suggestions | New users think the app is broken | Fall back to "Hot Items", most-owned games, or a starter-night list. |
| Expansions suggested without base game | Users click an expansion they can't play | Filter expansions out unless the base game is in the merged pool. |
| Filter state persists across sessions | A user returns to a new session and sees old filters | Scope filter state to the route/session; reset on navigation. |
| Group Detail shows too much at once | Cognitive overload, slow to load | Show a curated spotlight (top 12) and link to full Collection. |
| Member sync status hidden | Users don't know whose collection is stale | Show per-member sync status in the members panel; disable refresh when on cooldown. |
| Picking a game doesn't update the session UI | Users think the pick didn't save | Use Apollo `update` callback + optimistic UI so the status changes immediately. |
| Responsive sidebar always open | Mobile users can't see content | Use a collapsible drawer on mobile; persist open/closed in Pinia UI state. |

## "Looks Done But Isn't" Checklist

Things that appear complete but are missing critical pieces.

- [ ] **Material Symbols:** Font is subsetted to used icons and axes are pinned; `display=block` and preload are configured. Verify in Lighthouse that font payload is under 50 KB.
- [ ] **Material Symbols:** A single `<MaterialIcon>` component enforces `opsz`/`wght`/`GRAD`/`FILL` values. Verify no raw `material-symbols-outlined` spans exist.
- [ ] **Theme tokens:** All colors, shadows, and radii are defined in `@theme` and no hex values are hardcoded in components. Verify with a grep for `#` outside the theme file.
- [ ] **Dark mode:** Theme class is set before hydration and every surface uses `bg-surface`/`text-on-surface`. Verify by toggling and checking all redesigned screens.
- [ ] **Tailwind v4:** All old `@layer utilities` are replaced with `@utility`; all renamed utilities are updated. Verify with a project-wide search for `@layer utilities` and `outline-none`.
- [ ] **BGG polls:** `Bgg::ThingNormalizer` parses `suggested_numplayers` and persists normalized `player_poll_scores`. Verify with a fixture XML that includes a poll.
- [ ] **BGG polls:** Missing or low-vote polls fall back to min/max player heuristic, not zero. Verify with a game that has `totalvotes="0"`.
- [ ] **Suggestion engine:** Scores are computed in a service/cache, not the GraphQL resolver. Verify that the resolver reads from a cached/precomputed shortlist.
- [ ] **Suggestion engine:** Recommendations are explainable (player fit, time, complexity, ownership). Verify the UI shows human-readable reasons.
- [ ] **Suggestion engine:** Expansions are filtered out unless the base game is owned. Verify with an expansion in the test fixtures.
- [ ] **Group Detail:** The resolver eager loads members, sessions, attendances, and collection owners. Verify with Bullet that no N+1 warnings are logged.
- [ ] **Group Detail:** Shared collection spotlight is paginated or limited to a curated subset. Verify it does not load the full merged collection.
- [ ] **Apollo cache:** Mutations for create group, pick game, and RSVP use `update` callbacks to update relevant lists. Verify list UIs update without a refresh.
- [ ] **Pinia boundaries:** No server-derived data (groups, sessions, collection) is stored in Pinia. Verify with a review of store definitions.
- [ ] **GraphQL schema:** New fields are nullable and old fields are deprecated before removal. Verify `schema.graphql` and generated types are in sync.
- [ ] **Responsive:** Sidebar collapses on mobile; collection grid uses responsive columns. Verify at 320px, 768px, and 1440px widths.
- [ ] **E2E:** Existing E2E tests pass or have explicit failures documented. Verify in CI.

## Recovery Strategies

If a pitfall slips through, how to recover.

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Material Symbols loaded full font | LOW | Add `icon_names` and pin axes; update the preload link. ~1-2 hours. |
| Tailwind v4 `@layer utilities` not migrated | LOW | Replace with `@utility` and update any `@apply` references. ~2-4 hours. |
| Color token drift / hardcoded hex | MEDIUM | Audit components, replace hex with theme variables, add lint rule. ~4-8 hours. |
| BGG polls not parsed | MEDIUM | Extend `Bgg::ThingNormalizer`, add migration, backfill via job. ~1-2 days. |
| Suggestion engine scoring in resolver | MEDIUM | Extract service, add cache table, update resolver. ~1-2 days. |
| Group Detail N+1 | LOW to MEDIUM | Add eager loading to `GroupType`, measure with Bullet. ~2-6 hours. |
| Apollo cache stale after mutations | MEDIUM | Add `update` callbacks to mutations, audit fetch policies. ~4-8 hours. |
| Pinia store duplicated server data | MEDIUM | Refactor store to UI-only state, remove server-derived fields. ~1 day. |
| GraphQL breaking change shipped | MEDIUM to HIGH | Revert or add compatibility fields, regenerate types, notify frontend. ~1-2 days. |
| Dark mode inconsistent | LOW | Audit surfaces, replace literals with theme tokens, fix toggle script. ~2-4 hours. |
| Responsive regressions | LOW | Audit breakpoints, fix sidebar/grid/filter layout. ~2-4 hours per screen. |
| Suggestion engine over-fits to ownership | MEDIUM | Add normalization, cold-start fallback, and ownership breadth factor. ~4-8 hours. |

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Material Symbols subsetting/font loading | Design-system foundation | Lighthouse font payload < 50 KB; no ligature text flash |
| Tailwind v4 CSS-first config conflicts | Design-system foundation | Build passes; no `@layer utilities`; all renamed utilities updated |
| Color token drift / dark mode | Design-system foundation | Grep finds no hex values outside theme file; dark mode tested on all screens |
| BGG poll parsing | Suggestion engine backend | Fixture test with poll XML; missing/low-vote polls fallback correctly |
| BGG poll backfill rate limiting | Suggestion engine backend | 5 simultaneous jobs show only 1 running at a time; no 503s |
| Suggestion engine scoring | Suggestion engine backend | Unit tests for player fit, time, complexity, ownership; resolver reads cache |
| Suggestion engine explainability | Suggestion engine backend | UI shows per-factor badges; no opaque numeric-only score |
| Suggestion engine cold start | Suggestion engine backend | New group sees fallback suggestions; no empty state |
| Group Detail N+1 | Group Detail | Bullet reports zero N+1 warnings; log shows ≤ 10 queries |
| Group Detail pagination | Group Detail | Spotlight loads ≤ 12 items; full collection uses Collection view |
| Apollo cache invalidation | GraphQL/frontend integration | Mutations update lists without refresh; E2E covers create/pick/RSVP flows |
| Pinia store boundaries | GraphQL/frontend integration | Stores contain no server-derived data; audit passes |
| GraphQL schema evolution | GraphQL/frontend integration | CI `schema.graphql` + codegen diff is empty; existing tests pass |
| Dark mode/responsive | UI redesign | Manual QA at 320/768/1440px and dark/light toggles |
| Existing E2E suite | Tech-debt cleanup | E2E runs in CI with zero unexpected failures |

## Sources

- **Tailwind CSS v4 Docs (HIGH):** Theme variables (`@theme`), CSS-first configuration, `@utility`, `@reference`, dark mode `@custom-variant`, upgrade guide. https://tailwindcss.com/docs/theme, https://tailwindcss.com/docs/dark-mode, https://tailwindcss.com/docs/upgrade-guide
- **Google Fonts Material Symbols Guide (HIGH):** Variable axes (FILL, wght, GRAD, opsz), subsetting with `icon_names`, font-display, self-hosting. https://developers.google.com/fonts/docs/material_symbols
- **Material 3 Design Docs (HIGH):** Color system, surface roles, dark theme guidance. https://m3.material.io/styles/color/system/overview
- **Apollo Client 3 Docs (HIGH):** Mutation `update` callbacks, `cache.modify`, `refetchQueries`, `onQueryUpdated`, fetch policies (`cache-and-network`, `nextFetchPolicy`), normalized cache. https://www.apollographql.com/docs/react/data/mutations, https://www.apollographql.com/docs/react/data/queries, https://www.apollographql.com/docs/react/caching/cache-interaction
- **GraphQL.org Schema Design (HIGH):** Versionless schema evolution, deprecation, nullability best practices. https://graphql.org/learn/schema-design/
- **Rails Active Record Querying Guide (HIGH):** Eager loading, `includes`, `preload`, `eager_load`, N+1 prevention. https://guides.rubyonrails.org/active_record_querying.html
- **web.dev Optimize WebFont Loading (HIGH):** Preload, `font-display`, Font Loading API, critical rendering path. https://web.dev/articles/optimize-webfont-loading
- **Google Machine Learning Recommendation Systems (MEDIUM):** Candidate generation, content-based filtering, cold start, retrieval/scoring/re-ranking, explainability trade-offs. https://developers.google.com/machine-learning/recommendation
- **BGG XML API2 Official Wiki (MEDIUM):** `/thing` endpoint poll structure (`suggested_numplayers`, `suggested_playerage`, `language_dependence`), rate-limit guidance (5s between requests). https://boardgamegeek.com/wiki/page/BGG_XML_API2
- **Project source code (HIGH):** `app/models/bgg_thing.rb`, `app/graphql/types/group_type.rb`, `app/frontend/entrypoints/styles.css`, `app/frontend/components/layout/Sidebar.vue`, `app/frontend/components/collection/GameCard.vue`, `app/services/bgg.rb`, `bgg-graphql-proxy/src/datasources/bggDataSource.ts`.
- **Reference apps (HIGH):** `bgg-graphql-proxy` (XML normalization, rate limiting, expansion workaround), `bggeek-shared-list` (legacy UI patterns, Fuse.js search, grouping/sorting logic).

---
*Pitfalls research for: v1.1 UI Redesign + Suggestion Engine*
*Researched: 2026-07-13*


