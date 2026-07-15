# Phase 9: Home & Collection Redesign - Research

**Researched:** 2026-07-15
**Domain:** Rails 8 API-only + Vue 3 SPA monorepo, GraphQL, Tailwind v4 / Material 3, reka-ui/shadcn-vue, boardgame-night Home dashboard + Collection redesign
**Confidence:** HIGH (existing codebase and project docs are primary sources; official docs corroborated for reka-ui, shadcn-vue, Apollo, and GraphQL patterns)

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Keep `/hot` as a standalone route and keep the Hot sidebar link. Home also shows a six-game **Trending on BGG** preview with a **View all** link to `/hot`; do not redirect or remove the existing route.
- **D-02:** On desktop, place the merge hero and personal stats card in a wide/narrow dashboard row, then place Trending on BGG below at full width. On mobile, stack hero → stats → trending, keeping the merge action first.
- **D-03:** Preserve the existing multi-username validation/tag behavior from `UsernameForm`, but present it as the redesigned hero with the primary label **Merge collections**. Successful submission continues to the canonical Collection route and existing permalink contract.
- **D-04:** Add one authenticated dashboard-stats GraphQL read instead of issuing another full merged-collection query from Home. Apollo remains the source of server data; do not mirror stats in Pinia or derive them from a possibly cold client cache.
- **D-05:** Define the three stats as: all distinct games in the signed-in user's bound BGG collection, including both base games and expansions and matching the UI label **Games in your collection**; distinct groups they own or belong to; and distinct non-cancelled night sessions they host or attend. Counts must be database-backed and authorization-scoped. Do not add subtype persistence, migration, or backfill work for this stat.
- **D-06:** For signed-out visitors, keep the stats card position but show a concise sign-in prompt instead of zeroes or protected data. The merge hero and trending preview remain usable without authentication.
- **D-07:** Home trending cards show rank, thumbnail/fallback, name, BGG rating, weight, player range, and play time. Enrich through persisted/batched Rails data; never issue synchronous per-card BGG requests from GraphQL or the browser. Required identity/rank fields always render, while unavailable enrichment uses a neutral `—` fallback.
- **D-08:** Use a responsive six-card grid on Home. The existing `/hot` page may reuse the same redesigned card component with its larger result set, but redesigning Hot-specific navigation or adding new Hot features is outside this phase.
- **D-09:** At `xl` and above, show a 264px Collection-local filter panel beside results with `xl:sticky` positioning. Below `xl`, replace it with a clearly labelled **Filters** button that opens a Sheet; never put filters back into the global 280px navigation sidebar.
- **D-10:** Player count uses a two-thumb inclusive range from 1 through `10+`. A game matches when it supports the entire selected range. Preserve old `players=N` permalinks as `N–N`; serialize a non-default range in a backward-compatible form.
- **D-11:** Play-time buckets are multi-select checkboxes with OR semantics between selected buckets. Complexity is a single-select segmented control: Any, Light, Medium, Heavy. Owner avatar toggles remain multi-select OR. Empty selections mean no restriction.
- **D-12:** Reuse the existing Fuse search, filter utilities, owner synchronization, group mode, auto-import, and URL hydration. Any store/permalink shape migration must retain old URLs and must not allow the reserved `group=<inviteCode>` token to collide with filter state.
- **D-13:** Grid cards use a vertical layout with a two-line plain-text description; list cards use a horizontal layout with a three-line description. Never render BGG description HTML with `v-html`. Both modes show thumbnail/fallback, rating, title, capped owner avatars, and a three-column footer for players, time, and complexity.
- **D-14:** Card activation opens the corresponding BGG game using `objectid` in a new tab with `noopener,noreferrer`. Nested controls must remain independently keyboard-operable and must not trigger card activation.
- **D-15:** Grid is the default. Persist the grid/list choice in the collection URL as `view=grid|list` so shared permalinks reproduce the presentation; invalid values fall back to grid.
- **D-16:** Skeletons mirror the selected view: vertical card skeletons in grid mode and horizontal row skeletons in list mode. Existing loading, error, empty, refresh, and queued-import behavior must remain intact.
- **D-17:** Replace the exposed sort menu with exactly four product-facing choices: **Name A–Z**, **Rating High–Low**, **Weight Light–Heavy**, and **Recently Played**. Preserve deterministic name/id tie-breaks and migrate legacy sort query values where possible.
- **D-18:** Make **Recently Played** functional without adding a history UI: sort by the most recent non-cancelled `NightSession` that selected each game. In group mode, scope history to that group's sessions; in normal mode, scope it to groups the current authenticated user can access. Games without app play history sort last, then by name. Anonymous users receive the same deterministic no-history ordering rather than a disabled control.

### The Agent's Discretion

- Exact card aspect ratio, text-clamp utilities, desktop max width, spacing, filter section grouping, active-filter chip treatment, and Sheet animation, provided the responsive hierarchy and M3 contracts above remain intact.
- Exact GraphQL type names for dashboard stats, hot-item enrichment, and scoped last-played metadata.
- Whether the segmented control is a source-owned reka-ui ToggleGroup or an equivalent accessible primitive, provided it is reusable by Phase 10 and has full keyboard support.
- Exact breakpoint-specific card column counts and the redesigned `/hot` page's result count.

### Deferred Ideas (OUT OF SCOPE)

- Local play logging and a session-history screen remain v2 work; Phase 9 only derives a last-played sort signal from existing picked night sessions.
- Server-side collection search remains deferred until collection sizes exceed the documented client-side threshold.
- New Hot-specific discovery controls or route consolidation are outside Phase 9.

</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| HOME-01 | Home page displays a hero section with BGG username merge input and "Merge collections" button | Redesign `UsernameForm` → `HomeHero.vue`; preserve validation/tag logic and `usernames` permalink; navigate to `/collection`. |
| HOME-02 | Home page displays a personal stats card (user's collection size, group count, session count) | Add new `DashboardStats` GraphQL type/query; counts resolved from DB; signed-out prompt per D-06. |
| HOME-03 | Home page displays a "Trending on BGG" section with game cards (thumbnail, rating badge, rank, weight, players, play time) | Extend `HotItemType` with persisted `BggThing` enrichment via `Loaders::HotItemThingLoader`; new `TrendingGameCard` component. |
| COLL-19 | Collection view has a structured filter sidebar (search input, owner avatar toggles, player count range slider, play-time checkbox groups, complexity segmented buttons) | Add `CollectionFilterPanel` with 264px sticky `xl:` panel and Sheet fallback; migrate `playerCount` → range, `timeBucket` → multi-select, `complexityBucket` → single-select; owner toggles stay in sidebar. |
| COLL-20 | Collection game cards display thumbnail, rating badge, name, owner avatar(s), description, and 3-column stats footer (players, time, complexity) | Redesign `GameCard.vue` with grid/list variants; plain-text description; `AvatarGroup`; `Badge` for rating; footer columns. |
| COLL-21 | Collection view has a sort dropdown (Name A-Z, Rating High-Low, Weight Light-Heavy, Recently Played) | Replace `SORT_OPTIONS` with four values; add `lastPlayedAt` metadata; sort client-side with name/id tie-break. |
| COLL-22 | Collection view has a grid/list view toggle | Add `view` Pinia state + URL param; `ToggleGroup` single-select; default grid. |
| COLL-23 | Collection view shows skeleton loaders during data fetching | Add grid/list skeleton variants; keep existing loading/error/empty/import states. |

</phase_requirements>

## Summary

Phase 9 redesigns the Home and Collection surfaces with the Tabletop Social Material 3 system. The work is split into three vertical concerns: a **Home dashboard** (hero + stats + trending preview), a **Collection filter/workspace** (sticky filter panel, range slider, multi-select time buckets, segmented complexity, grid/list toggle), and a **rich card system** (grid/list variants, plain-text descriptions, three-column footer, accessible activation). All of it reuses existing Apollo server-state, Pinia UI-state boundaries, and Phase 5 primitives.

The most consequential technical decisions are:
1. **Dashboard stats** ship as a single authenticated GraphQL query (`dashboardStats`) rather than deriving from a full collection fetch or duplicating in Pinia.
2. **Hot-item enrichment** reads from the persisted `BggThing` table via a `GraphQL::Dataloader` source; no synchronous BGG calls per card.
3. **Recently Played** sort is enabled by adding a batched `lastPlayedAt` metadata field to `MergedThing`/`ThingFields`, resolved with a `Loaders::LastPlayedAtLoader` scoped to the current collection mode (group or signed-in user).
4. **Collection filters** are migrated from single-value selects to a range (players), multi-select set (time buckets), and single-select segmented control (complexity), while preserving old URL permalinks and the reserved `group` query parameter.
5. **Responsive filter workspace** uses a 264px sticky panel at `xl:` and a Sheet below, never returning filters to the 280px global sidebar.

**Primary recommendation:** Implement Phase 9 in four coarse slices — (1) backend GraphQL extensions (dashboard stats, hot enrichment, last-played loader), (2) Home dashboard components, (3) Collection filter workspace and state/URL migration, (4) rich cards, grid/list, and skeletons — running schema dump + codegen after slice 1 and keeping existing E2E permalink contracts green throughout.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Home dashboard layout & responsive order | Browser / Client | — | DOM order and CSS grid determine the mobile/desktop layout; no server rendering. |
| Dashboard stats aggregation | API / Backend | — | Counts must be DB-backed, authorization-scoped, and not derived from a full collection query. |
| Hot-item enrichment | API / Backend | — | Persisted `BggThing` data is the source; Dataloader batches per-card lookups. |
| Recently Played metadata | API / Backend | — | `NightSession.picked_game_id` scoping differs by group/user mode; backend must enforce authorization. |
| Collection filter workspace | Browser / Client | API / Backend | Filters are client-side UI state; URL is the only server-facing contract. |
| Filter logic (range, multi-select, sort) | Browser / Client | — | Pure computation over already-fetched `MergedThing` array. |
| Grid/list view toggle | Browser / Client | — | URL-persisted UI state only. |
| Card rendering & activation | Browser / Client | — | Accessibility and presentation; BGG link is external. |
| Apollo/Pinia boundary | Browser / Client | — | Server data in Apollo; UI state in Pinia. |

## Existing Architecture

### System Architecture Diagram (Phase 9 scope)

```mermaid
flowchart LR
    A[Browser / Vue 3] -->|Apollo POST /graphql| B[Rails 8 API]
    B --> C[GraphQL Schema]
    C --> D[QueryType / DashboardStats]
    C --> E[HotItemType + HotItemThingLoader]
    C --> F[MergedThingType + LastPlayedAtLoader]
    C --> G[MergedCollectionType / GroupType.collection]
    A --> H[/ route]
    H --> I[HomeView.vue]
    I --> J[HomeHero]
    I --> K[StatsCard]
    I --> L[TrendingGames]
    A --> M[/collection route]
    M --> N[CollectionView.vue]
    N --> O[CollectionFilterPanel]
    N --> P[SortControl + ViewToggle]
    N --> Q[GameGrid / GameList]
    Q --> R[GameCard grid/list]
    A --> S[/hot route]
    S --> T[HotView.vue]
    T --> U[TrendingGameCard]
```

### Key Existing Files

| File | Current Responsibility | Phase 9 Change |
|------|------------------------|----------------|
| `app/frontend/views/HomeView.vue` | Composes `UsernameForm` + `HotList` | New dashboard layout: `HomeHero`, `StatsCard`, `TrendingGames` |
| `app/frontend/views/CollectionView.vue` | Merged/group query, filter state, polling | Add filter workspace layout, `view` state, last-played sort input |
| `app/frontend/components/landing/UsernameForm.vue` | Multi-username validation/tags | Preserve logic, restyle as `HomeHero` |
| `app/frontend/components/landing/HotList.vue` | Hot preview grid | Replace with `TrendingGames` + redesigned card; enrich data |
| `app/frontend/components/collection/CollectionFilters.vue` | Single-value filter selects | Replace with `CollectionFilterPanel` (range, checkboxes, segmented control) |
| `app/frontend/components/collection/GameGrid.vue` | Grouped/ungrouped grid | Add grid/list branching, skeleton variants |
| `app/frontend/components/collection/GameCard.vue` | Vertical card | Add grid/list variants, description, footer columns |
| `app/frontend/components/collection/ResultsSkeleton.vue` | Vertical card skeleton | Add list row skeleton variant |
| `app/frontend/stores/filters.ts` | Filter + sort + group-by state | Migrate to range, multi-select time, view mode, four sorts |
| `app/frontend/composables/usePermalink.ts` | URL sync | Add range/time/view/sort migration, preserve `group` token |
| `app/frontend/composables/useCollectionFilters.ts` | Filter computation | Add range filter, multi-time bucket OR, update complexity semantics |
| `app/frontend/utils/sorting.ts` | Sort options + `sortGames` | Reduce to four sorts; add `recently_played` |
| `app/frontend/utils/grouping.ts` | Group-by logic | Unchanged; preserve grouping toggle |
| `app/frontend/components/layout/AppShell.vue` | 280px sidebar + main | Unchanged; Collection filter panel is local, not in sidebar |
| `app/graphql/types/query_type.rb` | Root fields | Add `dashboard_stats`; enrich `hot_items` resolver context |
| `app/graphql/types/hot_item_type.rb` | Hot item fields | Add `average`, `averageWeight`, `minPlayers`, `maxPlayers`, `minPlaytime`, `maxPlaytime` |
| `app/graphql/types/thing_fields.rb` | Shared thing fields | Add `last_played_at` |
| `app/graphql/types/merged_thing_type.rb` | Merged thing + owners | Inherits `last_played_at` from `ThingFields` |
| `app/graphql/types/user_type.rb` | User fields | Optional: not needed if `DashboardStats` is a separate type |

### Data Flows

1. **Home dashboard**: `HomeView` runs `DashboardStats` query + `HotItems` query in parallel. Stats are signed-out safe (signed-out shows prompt). Trending cards render from `HotItem` with persisted `BggThing` enrichment.
2. **Collection**: `CollectionView` runs `MergedCollection` or `GroupCollection` query. After loading, the full `MergedThing[]` array is filtered/sorted/grouped client-side. The filter panel mutates Pinia state, which `usePermalink` serializes to URL. `lastPlayedAt` is included in the query so the four sorts can run locally.
3. **Hot route**: `HotView` runs the same `HotItems` query, possibly with a larger `limit`, and reuses `TrendingGameCard`.

## Recommended Data Contracts

### GraphQL Additions

#### 1. Dashboard Stats

```graphql
# app/frontend/apollo/queries/dashboard_stats.graphql
query DashboardStats {
  dashboardStats {
    collectionCount
    groupCount
    sessionCount
  }
}
```

```ruby
# app/graphql/types/dashboard_stats_type.rb
module Types
  class DashboardStatsType < Types::BaseObject
    field :collection_count, Integer, null: false
    field :group_count, Integer, null: false
    field :session_count, Integer, null: false
  end
end

# app/graphql/types/query_type.rb
field :dashboard_stats, Types::DashboardStatsType, null: true

def dashboard_stats
  return nil unless context[:current_user]
  user = context[:current_user]
  {
    collection_count: user.bgg_things.distinct.count,
    group_count: user.groups.count,
    session_count: NightSession
      .where("host_id = ? OR id IN (SELECT night_session_id FROM attendances WHERE user_id = ? AND response = ?)", user.id, user.id, "going")
      .where.not(state: "cancelled")
      .distinct
      .count
  }
end
```

**Why this shape:** A dedicated return type keeps the dashboard-specific aggregation out of `UserType`, which is fetched in many contexts (shell, account, group memberships). It returns `null` for signed-out users so the frontend can render the sign-in prompt without exposing zeroes. [VERIFIED: existing codebase patterns; D-04/D-05]

#### 2. Hot Item Enrichment

```graphql
# Extend app/frontend/apollo/queries/hot_items.graphql
query HotItems {
  hotItems {
    id
    rank
    name
    yearPublished
    thumbnail
    average
    averageWeight
    minPlayers
    maxPlayers
    minPlaytime
    maxPlaytime
  }
}
```

```ruby
# app/graphql/types/hot_item_type.rb
module Types
  class HotItemType < Types::BaseObject
    field :id, ID, null: false
    field :rank, Integer, null: false
    field :name, String, null: false
    field :year_published, Integer, null: true
    field :thumbnail, String, null: true
    field :average, Float, null: true
    field :average_weight, Float, null: true
    field :min_players, Integer, null: true
    field :max_players, Integer, null: true
    field :min_playtime, Integer, null: true
    field :max_playtime, Integer, null: true

    private

    def thing
      dataloader.with(Loaders::HotItemThingLoader).load(object[:id])
    end

    def average
      thing.then { |t| t&.average }
    end

    def average_weight
      thing.then { |t| t&.average_weight }
    end

    def min_players
      thing.then { |t| t&.min_players }
    end

    def max_players
      thing.then { |t| t&.max_players }
    end

    def min_playtime
      thing.then { |t| t&.min_playtime }
    end

    def max_playtime
      thing.then { |t| t&.max_playtime }
    end
  end
end
```

```ruby
# app/graphql/loaders/hot_item_thing_loader.rb
module Loaders
  class HotItemThingLoader < GraphQL::Dataloader::Source
    def fetch(objectids)
      things = BggThing.where(objectid: objectids.map(&:to_i)).index_by(&:objectid)
      objectids.map { |id| things[id.to_i] }
    end
  end
end
```

**Why this shape:** Hot items are already returned as plain hashes from the BGG `/hot` endpoint. The `HotItemThingLoader` batches a single `BggThing` query by `objectid` for the entire hot list, so all six enrichment fields resolve in O(1) DB round-trips. If a thing has not been imported by any user, fields return `null` and the UI renders `—`. [VERIFIED: existing Dataloader pattern; D-07]

#### 3. Recently Played Metadata

```graphql
# Extend app/frontend/apollo/queries/merged_collection.graphql
query MergedCollection($usernames: [String!]!) {
  mergedCollection(usernames: $usernames) {
    items {
      id
      ...existingThingFields
      lastPlayedAt
    }
  }
}

# Extend app/frontend/apollo/queries/group_collection.graphql similarly
```

```ruby
# app/graphql/types/thing_fields.rb
included do
  # ... existing fields ...
  field :last_played_at, GraphQL::Types::ISO8601DateTime, null: true
end

def last_played_at
  scope_type = context[:last_played_scope_type]
  scope_id = context[:last_played_scope_id]
  return nil unless scope_type && scope_id

  dataloader.with(Loaders::LastPlayedAtLoader, scope_type, scope_id).load(object.id)
end
```

```ruby
# app/graphql/loaders/last_played_at_loader.rb
module Loaders
  class LastPlayedAtLoader < GraphQL::Dataloader::Source
    def initialize(scope_type, scope_id)
      super()
      @scope_type = scope_type
      @scope_id = scope_id
    end

    def fetch(thing_ids)
      session_dates = case @scope_type
                      when :group
                        NightSession
                          .where(group_id: @scope_id, picked_game_id: thing_ids)
                          .where.not(state: "cancelled")
                          .group(:picked_game_id)
                          .maximum("COALESCE(scheduled_at, created_at)")
                      when :user
                        group_ids = GroupMembership.where(user_id: @scope_id).pluck(:group_id)
                        NightSession
                          .where(group_id: group_ids, picked_game_id: thing_ids)
                          .where.not(state: "cancelled")
                          .group(:picked_game_id)
                          .maximum("COALESCE(scheduled_at, created_at)")
                      else
                        {}
                      end

      thing_ids.map { |id| session_dates[id] }
    end
  end
end
```

```ruby
# app/graphql/types/query_type.rb
# In merged_collection resolver, set the user scope for last-played
context[:last_played_scope_type] = :user
context[:last_played_scope_id] = context[:current_user]&.id

# In group_type.rb collection resolver, set the group scope
context[:last_played_scope_type] = :group
context[:last_played_scope_id] = object.id
```

**Why this shape:** `last_played_at` is a derived, authorization-scoped scalar. It is added to the shared `ThingFields` module so both `MergedThing` and `GroupSpotlightThing` (or any future thing type) expose it without duplication. The Dataloader batches all things in the current collection into one `NightSession` aggregation per request, preventing N+1. The `context` scope is set by the parent resolver because the authorization boundary differs between merged (signed-in user's groups) and group modes (the specific group). [CITED: GraphQL::Dataloader docs; D-18]

### Alternative: Extending `UserType` instead of a separate `DashboardStats`

Adding `collectionCount`, `groupCount`, and `sessionCount` to `UserType` is possible, but it scatters dashboard concerns into a type used by the app shell, account page, and group memberships. A dedicated `dashboardStats` query is preferred because it is self-documenting, avoids accidental over-fetching in other queries, and can return `null` for signed-out users naturally. [VERIFIED: existing GraphQL schema patterns]

## Frontend State/URL Contract

### Filter Store Migration

Current `app/frontend/stores/filters.ts` holds single-value `playerCount`, `timeBucket`, `complexityBucket`, and `ratingMin`. The recommended new shape:

```typescript
// app/frontend/stores/filters.ts (migrated)
export type SortOption = 'name_asc' | 'rating_desc' | 'weight_asc' | 'recently_played'
export type ViewMode = 'grid' | 'list'

export interface PlayerRange {
  min: number
  max: number
}

export const useFilterStore = defineStore('filters', () => {
  const query = ref('')
  const playerRange = ref<PlayerRange | null>(null)     // replaces playerCount
  const selectedTimeBuckets = ref<Set<number>>(new Set()) // replaces timeBucket
  const complexityBucket = ref<number | null>(null)       // still single-select, new values 1|2|3
  const ratingMin = ref<number | null>(null)             // keep for backward-compatible URL parsing
  const selectedOwners = ref<Set<string>>(new Set())
  const sort = ref<SortOption>('name_asc')
  const groupBy = ref<GroupOption>('none')
  const view = ref<ViewMode>('grid')
  // ... existing helpers ...
})
```

### URL Permalink Contract

| State | Read (hydration) | Write (serialization) | Backward Compatibility |
|-------|------------------|-------------------------|------------------------|
| Search | `q` | `q` if non-empty | unchanged |
| Player range | `players` as `N` or `N-M` | `players=N` if min==max; `players=N-M` if min<max | `players=N` still parsed as `N–N` [D-10] |
| Time buckets | `time` as single `N` or comma list `N,M` | `time=N,M,...` if selected; delete if empty | old `time=N` parsed as single-element set |
| Complexity | `complexity` as `1\|2\|3` | `complexity=N` if selected; delete if Any | old `complexity=4` maps to Heavy (`3`); old `complexity=3` maps to Heavy |
| Rating min | `ratingMin` | `ratingMin` if present | keep parsing; UI may not expose control |
| Sort | `sort` | `sort` if non-default | legacy values `name_asc`, `rating_desc`, `weight_asc`, `complexity_asc` migrate; unknowns fall back to `name_asc` |
| Group by | `groupBy` | `groupBy` | legacy `group=players/rating/bestPlayers/owner` still migrated per Phase 8 |
| View | `view` | `view` if `list` | invalid values → grid |
| Owners | `owners` | comma list if subset | unchanged |
| Group token | `group` | preserved exactly; never overwritten by filter state | unchanged [D-12] |

**Important:** The `group` query parameter is reserved for the group invite token (`/collection?group=<inviteCode>`). The filter permalink logic must read it before any filter params, migrate the legacy grouping values, and write it back unchanged. [VERIFIED: Phase 8 implementation in `usePermalink.ts`]

### Sort Migration Mapping

```typescript
const LEGACY_SORT_MAP: Record<string, SortOption> = {
  name_asc: 'name_asc',
  name_desc: 'name_asc',      // no descending name; fallback
  rating_asc: 'rating_desc',  // default to high-low
  rating_desc: 'rating_desc',
  year_asc: 'name_asc',
  year_desc: 'name_asc',
  weight_asc: 'weight_asc',
  weight_desc: 'weight_asc',  // no descending weight; fallback
  complexity_asc: 'weight_asc',
  complexity_desc: 'weight_asc'
}
```

### Player Range Filter Semantics

- Slider has discrete steps 1–10. The label for `max === 10` is rendered as `10+`.
- A selected range `[min, max]` matches a game when `game.minPlayers <= min && game.maxPlayers >= max` (the game supports every player count in the range).
- If the user selects `4` as both min and max, the game must support exactly 4 players (minPlayers ≤ 4 ≤ maxPlayers). This preserves the old `players=4` behavior.
- Default `null` means no restriction.

### Time Bucket Multi-Select Semantics

- `selectedTimeBuckets` is a `Set<number>` of bucket values.
- A game matches if it matches **any** selected bucket: `game.minPlaytime <= bucket.max && game.maxPlaytime >= bucket.min` (existing `playtimeFilter` covers the bucket range).
- Empty set means no restriction.

### Complexity Segmented Control Semantics

Recommended mapping (agent's discretion, but locked for this research):

| Label | Value | Weight Range | Migrates From |
|-------|-------|--------------|---------------|
| Any | `null` | no restriction | `null` |
| Light | `1` | 0–2 | `complexity=1` |
| Medium | `2` | 2–3 | `complexity=2` |
| Heavy | `3` | 3+ | `complexity=3` and `complexity=4` |

Use the existing `COMPLEXITY_BUCKETS` structure but expose only three user-facing labels, with Heavy covering the old Medium-Heavy (3–4) and Heavy (4+) ranges. The underlying `complexityFilter` remains unchanged. [D-11]

## UI/Accessibility Patterns

### 1. Responsive Filter Workspace (D-09)

```vue
<!-- CollectionView.vue layout -->
<template>
  <div class="p-4 md:p-6">
    <div class="flex flex-col xl:flex-row gap-6">
      <!-- Desktop filter panel -->
      <aside class="hidden xl:block w-[264px] xl:sticky xl:top-6 xl:self-start space-y-6">
        <CollectionFilterPanel />
      </aside>

      <!-- Mobile filter trigger + results -->
      <div class="flex-1 min-w-0 space-y-4">
        <div class="flex flex-wrap items-center gap-3">
          <Button variant="outline" class="xl:hidden" @click="filtersOpen = true">
            <Icon name="filter_list" class="mr-2 size-4" />
            Filters
          </Button>
          <SortControl v-model="sort" />
          <ViewModeToggle v-model="view" />
        </div>
        <GameGrid :groups="groupedGames" :view="view" :loading="loading" />
      </div>
    </div>

    <Sheet v-model:open="filtersOpen">
      <SheetContent side="left" class="w-[300px] sm:w-[360px]">
        <SheetHeader>
          <SheetTitle>Filters</SheetTitle>
        </SheetHeader>
        <CollectionFilterPanel />
      </SheetContent>
    </Sheet>
  </div>
</template>
```

**Why:** The 264px width matches the Phase 5 sidebar density without duplicating the 280px global nav. `xl:sticky` keeps the panel visible while the game list scrolls. The Sheet below `xl` avoids a sidebar-within-sidebar problem. [D-09]

### 2. Player Range Slider (reka-ui / shadcn-vue)

```vue
<!-- PlayerRangeSlider.vue -->
<script setup lang="ts">
import { Slider } from '@/components/ui/slider'
import type { PlayerRange } from '@/stores/filters'

const model = defineModel<PlayerRange | null>({ default: null })

const value = computed({
  get: () => model.value ? [model.value.min, model.value.max] : [1, 10],
  set: ([min, max]) => {
    model.value = { min, max }
  }
})
</script>

<template>
  <div class="space-y-3">
    <div class="flex justify-between text-sm text-on-surface-variant">
      <span>{{ value[0] }}</span>
      <span>{{ value[1] === 10 ? '10+' : value[1] }}</span>
    </div>
    <Slider
      v-model="value"
      :min="1"
      :max="10"
      :step="1"
      :min-steps-between-thumbs="0"
      class="w-full"
    />
  </div>
</template>
```

**Accessibility:** reka-ui `Slider` renders two `<input type="range">` thumbs, supports arrow keys, PageUp/PageDown, Home/End, and follows the [Slider WAI-ARIA design pattern](https://www.w3.org/WAI/ARIA/apg/patterns/slidertwothumb/). The two-thumb range is native in reka-ui 2.10.1 by binding an array of two values. [CITED: reka-ui Slider docs; shadcn-vue Slider docs]

**Caveat:** The shadcn-vue `Slider` component may only accept a single array value; verify the generated `Slider.vue` in `components/ui/slider` if installed via CLI. If the shadcn-vue wrapper does not expose `min-steps-between-thumbs`, fall back to the raw reka-ui `SliderRoot` / `SliderTrack` / `SliderRange` / `SliderThumb` primitives. [CITED: reka-ui Slider docs]

### 3. Complexity Segmented Control (reka-ui ToggleGroup / shadcn-vue ToggleGroup)

```vue
<!-- ComplexityToggleGroup.vue -->
<script setup lang="ts">
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'

const model = defineModel<number | null>({ default: null })
</script>

<template>
  <ToggleGroup
    v-model="model"
    type="single"
    class="flex w-full"
  >
    <ToggleGroupItem value="null" class="flex-1">Any</ToggleGroupItem>
    <ToggleGroupItem :value="1" class="flex-1">Light</ToggleGroupItem>
    <ToggleGroupItem :value="2" class="flex-1">Medium</ToggleGroupItem>
    <ToggleGroupItem :value="3" class="flex-1">Heavy</ToggleGroupItem>
  </ToggleGroup>
</template>
```

**Accessibility:** `ToggleGroup` with `type="single"` behaves like a radio group: roving tabindex, arrow-key navigation, Enter/Space to select, and one value always selected. To allow an unselected "Any" state, use controlled mode and convert the string `'null'` to `null` internally, or manage state so that clicking the selected item deselects it. [CITED: reka-ui ToggleGroup docs; shadcn-vue ToggleGroup docs]

**Recommendation:** Since "Any" must be selectable as a reset state and the control is single-select, treat it as a controlled component: store the internal model as `number | null`, and render four buttons where the first represents `null`. This avoids reka-ui's constraint that `type="single"` usually requires a value. The component should still be implemented as a reusable wrapper (`ComplexityToggleGroup`) for Phase 10 reuse. [D-11, agent's discretion]

### 4. Grid/List View Toggle

```vue
<!-- ViewModeToggle.vue -->
<script setup lang="ts">
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import type { ViewMode } from '@/stores/filters'

const model = defineModel<ViewMode>({ default: 'grid' })
</script>

<template>
  <ToggleGroup v-model="model" type="single" class="flex">
    <ToggleGroupItem value="grid" aria-label="Grid view">
      <Icon name="grid_view" class="size-4" />
    </ToggleGroupItem>
    <ToggleGroupItem value="list" aria-label="List view">
      <Icon name="view_list" class="size-4" />
    </ToggleGroupItem>
  </ToggleGroup>
</template>
```

### 5. Rich Game Cards

#### Grid Card

```vue
<Card class="cursor-pointer hover:shadow-md hover:-translate-y-1 transition-all duration-300 p-0 gap-0 overflow-hidden" @click="openBgg">
  <img v-if="thumbnail" :src="thumbnail" :alt="name" class="w-full aspect-[4/3] object-cover bg-surface-container" />
  <div v-else class="w-full aspect-[4/3] bg-surface-variant flex items-center justify-center text-on-surface-variant text-sm">No image</div>
  <CardContent class="p-3 space-y-2">
    <h3 class="text-sm font-semibold line-clamp-2 leading-tight text-on-surface" :title="name">{{ name }}</h3>
    <p class="text-xs text-on-surface-variant line-clamp-2">{{ plainDescription }}</p>
    <div class="flex items-center gap-2">
      <Badge v-if="hasAverage" variant="invited">{{ average.toFixed(1) }}</Badge>
      <Badge v-if="hasWeight" variant="draft">{{ averageWeight.toFixed(1) }}</Badge>
    </div>
    <div class="flex -space-x-1">
      <MemberAvatar v-for="owner in visibleOwners" :key="owner.bggUsername" :username="owner.bggUsername" size="xs" />
      <AvatarGroupCount v-if="ownerOverflow > 0">+{{ ownerOverflow }}</AvatarGroupCount>
    </div>
    <div class="grid grid-cols-3 gap-1 text-xs text-on-surface-variant pt-1 border-t border-outline">
      <div class="flex items-center gap-1"><Icon name="groups" class="size-3" /> {{ playerLabel }}</div>
      <div class="flex items-center gap-1"><Icon name="schedule" class="size-3" /> {{ timeLabel }}</div>
      <div class="flex items-center gap-1"><Icon name="fitness_center" class="size-3" /> {{ weightLabel }}</div>
    </div>
  </CardContent>
</Card>
```

#### List Card

```vue
<Card class="cursor-pointer hover:shadow-md transition-all duration-300 p-0 gap-0 overflow-hidden" @click="openBgg">
  <CardContent class="p-3 flex gap-4">
    <img v-if="thumbnail" :src="thumbnail" :alt="name" class="w-24 h-18 aspect-[4/3] object-cover rounded-lg bg-surface-container flex-shrink-0" />
    <div v-else class="w-24 h-18 bg-surface-variant rounded-lg flex items-center justify-center text-on-surface-variant text-xs flex-shrink-0">No image</div>
    <div class="flex-1 min-w-0 space-y-2">
      <div class="flex items-start justify-between gap-2">
        <h3 class="text-sm font-semibold text-on-surface line-clamp-1">{{ name }}</h3>
        <div class="flex items-center gap-2 flex-shrink-0">
          <Badge v-if="hasAverage" variant="invited">{{ average.toFixed(1) }}</Badge>
          <Badge v-if="hasWeight" variant="draft">{{ averageWeight.toFixed(1) }}</Badge>
        </div>
      </div>
      <p class="text-xs text-on-surface-variant line-clamp-3">{{ plainDescription }}</p>
      <div class="flex items-center justify-between">
        <div class="grid grid-cols-3 gap-4 text-xs text-on-surface-variant">
          <span class="flex items-center gap-1"><Icon name="groups" class="size-3" /> {{ playerLabel }}</span>
          <span class="flex items-center gap-1"><Icon name="schedule" class="size-3" /> {{ timeLabel }}</span>
          <span class="flex items-center gap-1"><Icon name="fitness_center" class="size-3" /> {{ weightLabel }}</span>
        </div>
        <div class="flex -space-x-1">
          <MemberAvatar v-for="owner in visibleOwners" ... />
          <AvatarGroupCount v-if="ownerOverflow > 0">+{{ ownerOverflow }}</AvatarGroupCount>
        </div>
      </div>
    </div>
  </CardContent>
</Card>
```

**Key details:**
- Description is rendered as plain text (`{{ description }}`) with `line-clamp-2`/`line-clamp-3`. **Never** use `v-html` on BGG description HTML. [D-13]
- Card click opens BGG in a new tab; internal controls (buttons, toggles) must have `@click.stop` so they don't trigger card navigation. [D-14]
- Owner avatars are capped at 3 visible + `+N` overflow using `AvatarGroup` and `AvatarGroupCount`. [CITED: Phase 8 UI-SPEC]
- Footer icons use Material Symbols names `groups`, `schedule`, `fitness_center` per `FEATURES.md`. [CITED: FEATURES.md]

### 6. Skeletons

- **Grid skeleton:** reuse the existing `ResultsSkeleton.vue` vertical shape (4:3 rectangle, title line, meta line, two badge rectangles, two avatar circles).
- **List skeleton:** new horizontal row shape: a 4:3 thumbnail rectangle on the left, three text lines on the right, and two small badge rectangles. Render the same number of rows as the grid skeleton count (e.g., 12) to keep perceived density consistent.

```vue
<!-- ResultsSkeleton.vue variant -->
<div class="rounded-xl border border-outline bg-surface-container p-3 flex gap-4 overflow-hidden">
  <Skeleton class="w-24 h-18 aspect-[4/3] rounded-lg flex-shrink-0" />
  <div class="flex-1 space-y-2">
    <Skeleton class="h-4 w-3/4" />
    <Skeleton class="h-3 w-full" />
    <Skeleton class="h-3 w-2/3" />
    <div class="flex gap-2 pt-1">
      <Skeleton class="h-5 w-8" />
      <Skeleton class="h-5 w-8" />
    </div>
  </div>
</div>
```

## Authorization/Performance

### Authorization

| Feature | Threat | Mitigation |
|---------|--------|------------|
| Dashboard stats | Exposing another user's counts | Query returns `null` when `context[:current_user]` is absent; only counts the authenticated user's own records. |
| Recently Played (merged mode) | Leaking session history from groups the viewer is not in | Scope limited to `current_user.group_ids` via `GroupMembership`. Anonymous users get `null` for all `last_played_at`. |
| Recently Played (group mode) | Outsiders seeing group session history | Group resolver already checks `viewer_role` before returning `collection`; `last_played_at` is scoped to the same `group_id`. |
| Hot enrichment | No auth concern; public BGG data | Reads from persisted `BggThing`; no protected data. |

### Performance

| Risk | Mitigation |
|------|------------|
| Dashboard stats queries multiple tables | Single query per request; counts are indexed foreign keys. No N+1 because we count, not iterate. |
| Hot enrichment N+1 | `Loaders::HotItemThingLoader` batches by `objectid` → one `BggThing` query for the entire hot list. |
| Recently Played N+1 | `Loaders::LastPlayedAtLoader` batches by `thing_ids` → one `NightSession` aggregation per request. |
| Large collection sorting | Client-side sort over already-fetched `MergedThing[]`. Collections are expected to be <300 games for v1 (Fuse.js threshold). |
| Sheet re-mounting filters | `CollectionFilterPanel` can be mounted inside the Sheet with `v-if` or kept in a single instance; avoid duplicating state by using the same Pinia store. |
| Sticky filter panel overflow | `xl:sticky xl:top-6 xl:self-start` ensures the panel only sticks when it fits; below `xl` it becomes a Sheet. |

## Testing Strategy

### Unit / Component Tests (Vitest)

| Target | What to test |
|--------|--------------|
| `useCollectionFilters` | range filter matches entire selected range; multi-time-bucket OR; complexity mapping; selected owners AND; empty selections = no restriction |
| `usePermalink` | old `players=4` → range [4,4]; `time=1,3` → set {1,3}; `complexity=4` → Heavy; `view=grid` default; `group=TOKEN` preserved; legacy sort migrations |
| `sortGames` | four sorts work; `recently_played` puts nulls last, then name; name/rating/weight tie-breaks by name/id |
| `GameCard` | renders description as plain text (no `v-html`); grid vs list layout; BGG link has `noopener,noreferrer`; nested controls stop propagation |
| `CollectionFilterPanel` | slider updates range; checkboxes toggle time buckets; segmented control selects complexity; Sheet trigger exists below `xl` |
| `TrendingGameCard` | renders `—` when enrichment is null; rank badge visible; BGG link correct |
| `StatsCard` | signed-out prompt; signed-in counts render; loading skeleton |

### GraphQL Specs (RSpec)

| Target | What to test |
|--------|--------------|
| `dashboard_stats` query | returns counts for authenticated user; returns `null` when signed out; counts distinct things/groups/sessions |
| `HotItemType` enrichment | returns persisted `average`, `averageWeight`, etc.; returns `null` for unknown objectid; loads via Dataloader (one query) |
| `LastPlayedAtLoader` | group mode returns max date per picked game; user mode returns only user's group sessions; cancelled sessions excluded; no enrichment for anonymous |
| `merged_collection` query | includes `lastPlayedAt` and resolves via loader |
| `group.collection` query | includes `lastPlayedAt` scoped to group |

### E2E Tests (Playwright) — preserve existing contracts

| Contract | Test update |
|----------|-------------|
| `/collection?usernames=...` loads games | Keep existing; update selectors if card markup changes (e.g., `data-testid` stable). |
| Sidebar collectors | Keep existing; owner toggles now live in the Collection filter panel, not the global sidebar, so update selectors from `NavSidebarContent` to `CollectionFilterPanel`. |
| Player count filter | Existing test selects "Players" by label. Update to use the range slider or a numeric input fallback; verify the same games remain visible. |
| Sort by rating | Update selector from `select` to the new sort dropdown/toggle. |
| Permalink round trip | Extend to cover player range, multi-time, view mode, and `group` preservation. |
| Hot route | Add `/hot` smoke test with the redesigned card. |
| Home dashboard | Add signed-in stats visibility, signed-out prompt, trending cards, hero merge flow. |

## Implementation Order

### Slice 1: Backend GraphQL Extensions (unblocks everything)

1. Add `DashboardStatsType` and `dashboard_stats` query in `QueryType`.
2. Add hot-enrichment fields to `HotItemType` and create `Loaders::HotItemThingLoader`.
3. Add `last_played_at` to `ThingFields`; create `Loaders::LastPlayedAtLoader`; wire scope context in `QueryType#merged_collection` and `GroupType#collection`.
4. Run `bin/rails graphql:schema:dump` and `npm run codegen`.
5. RSpec: dashboard stats, hot enrichment, last-played loader.

### Slice 2: Home Dashboard

1. Create `app/frontend/apollo/queries/dashboard_stats.graphql` and generated composable.
2. Create `HomeHero.vue` (restyled `UsernameForm` logic).
3. Create `StatsCard.vue` (signed-out prompt + signed-in counts + skeleton).
4. Create `TrendingGameCard.vue` and `TrendingGames.vue` (six-card grid, uses `HotItems` query with new fields).
5. Rewrite `HomeView.vue` dashboard layout.
6. Rewrite `HotView.vue` to reuse `TrendingGameCard` with a larger result set.
7. Vitest for `StatsCard`, `TrendingGameCard`; E2E for Home dashboard.

### Slice 3: Collection Filter Workspace & State Migration

1. Migrate `filters.ts` to range, multi-time, view mode, and four sort options.
2. Update `useCollectionFilters` for range/multi-time filtering.
3. Update `usePermalink` for new params and backward-compatible migration.
4. Update `sorting.ts` for four sorts + `recently_played`.
5. Install/add `Slider` and `ToggleGroup` shadcn-vue wrappers (or raw reka-ui wrappers) in `components/ui/`.
6. Create `PlayerRangeSlider.vue`, `TimeBucketCheckboxes.vue`, `ComplexityToggleGroup.vue`, `ViewModeToggle.vue`.
7. Create `CollectionFilterPanel.vue` (desktop sticky panel + Sheet content).
8. Rewrite `CollectionFilters.vue` to delegate to `CollectionFilterPanel` or replace it.
9. Update `CollectionView.vue` layout and query to include `lastPlayedAt`.
10. Vitest for state/URL/filter logic; E2E for permalink round trip and filter interactions.

### Slice 4: Rich Cards, Grid/List, and Skeletons

1. Update `MergedCollection` and `GroupCollection` GraphQL queries to request `description`, `lastPlayedAt`, etc.
2. Redesign `GameCard.vue` with `variant: 'grid' | 'list'` and plain-text description.
3. Update `GameGrid.vue` to switch between grid and list layouts and render correct skeleton.
4. Update `ResultsSkeleton.vue` for list row variant.
5. Add `SortControl` dropdown with four options; add `ViewModeToggle`.
6. Update `CollectionView.vue` to compose cards, sort, view toggle, and filter panel.
7. Vitest for `GameCard` variants; E2E for grid/list toggle, card activation, and skeleton states.

### Dependency Order

```
Slice 1 ──→ Slice 2
        ──→ Slice 3 ──→ Slice 4
```

Slice 1 must land first because it changes the schema and generated types. Slice 2 and Slice 3 can proceed in parallel once codegen is updated. Slice 4 depends on Slice 3 (filter state and queries) and Slice 1 (card data). Phase 10 can reuse the `Slider`, `ToggleGroup`, `GameCard`, and `ComplexityToggleGroup` components produced in Slices 3 and 4. [D-11, agent's discretion]

## Pitfalls

### Pitfall 1: Duplicating Server Data in Pinia for Stats

**What goes wrong:** Home stats are mirrored in a Pinia store and derived from the cached collection, or the full collection is fetched to count games. This violates D-04 and D-05 and causes stale data.

**Why it happens:** The existing `NavSidebarContent.vue` already runs `useMergedCollectionQuery` to show sync status. It's tempting to reuse that result for counts.

**How to avoid:** Use a dedicated `DashboardStats` GraphQL query. Keep stats in Apollo's normalized cache. Only Pinia holds UI state (sidebar open, filters, view mode). [D-04]

**Warning signs:** `HomeView.vue` imports `useMergedCollectionQuery` or `useCollectorsStore` to compute stats; a `stats` Pinia store appears.

### Pitfall 2: Synchronous BGG Calls for Hot Enrichment

**What goes wrong:** The `HotItemType` resolver calls `Bgg::Client.new.thing(id)` for each card, triggering live BGG requests per card and likely 429/503 errors.

**Why it happens:** The hot XML only provides id/name/year/thumbnail; developers fetch the rest live instead of reading the persisted `BggThing` table.

**How to avoid:** Enrich hot items only from `BggThing` via a Dataloader. If a game hasn't been imported, show `—` fallback. Do not fetch live BGG data in a GraphQL resolver. [D-07]

**Warning signs:** `Bgg::Client` appears in `HotItemType`; hot page load is slow; BGG rate limit errors in logs.

### Pitfall 3: N+1 on Last Played Metadata

**What goes wrong:** `last_played_at` is resolved per thing with a separate `NightSession` query, causing one query per game.

**Why it happens:** The resolver naively queries `NightSession.where(picked_game_id: object.id).maximum(...)` for each item.

**How to avoid:** Batch with `Loaders::LastPlayedAtLoader`. The loader receives all `thing_ids` for the current collection and issues one aggregation query. [D-18]

**Warning signs:** Rails log shows repeated `NightSession` queries for a single collection request; collection load time scales with game count.

### Pitfall 4: Wrong Recently Played Authorization Scope

**What goes wrong:** In normal mode, an anonymous user sees all sessions, or a signed-in user sees sessions from groups they don't belong to.

**Why it happens:** The `last_played_at` resolver ignores the current user or uses the wrong group scope.

**How to avoid:** The parent resolver must set `context[:last_played_scope_type]` and `context[:last_played_scope_id]`. The loader uses `current_user.group_ids` for user mode and the exact `group_id` for group mode. Return `null` when no scope is set. [D-18]

**Warning signs:** Signed-out users see "Recently Played" sorting that appears to have data; games from unrelated groups appear recent.

### Pitfall 5: Old `players=N` Permalinks Break

**What goes wrong:** The new range filter rejects the old `players=4` URL, showing no filters or an invalid state.

**Why it happens:** `playerRange` is now an object `{min, max}`, but the permalink hydration expects a number.

**How to avoid:** Parse `players` as either `N` (set both min and max to N) or `N-M` (set range). Serialize back to `N` for single-value ranges and `N-M` for true ranges. [D-10]

**Warning signs:** Existing E2E test `filters by player count` fails; reload with `players=4` does not restore the filter.

### Pitfall 6: Colliding `group` Query Parameter

**What goes wrong:** The collection filter permalink writes `groupBy=owner` and accidentally overwrites the reserved `group=<inviteCode>` token, or the Phase 8 migration no longer works.

**Why it happens:** The new filter state includes a view param and possibly other params; the logic that separates legacy grouping values from the invite token is missed.

**How to avoid:** Preserve the existing `LEGACY_GROUP_OPTIONS` migration in `usePermalink.ts`. Never write a filter param named `group`. Always read `route.query.group` first and pass it through unchanged. [D-12]

**Warning signs:** `/collection?group=ABC123` after changing filters loses the group mode; the URL becomes `/collection?groupBy=...`.

### Pitfall 7: Rendering BGG Description HTML Unsafely

**What goes wrong:** Rich cards use `v-html` on the BGG description, which can contain arbitrary HTML, links, or malformed tags.

**Why it happens:** Designers want the formatted description. BGG descriptions are not sanitized or trusted.

**How to avoid:** Render the description as plain text with `line-clamp`. If formatting is needed, run a sanitization pass (e.g., `DOMPurify`) and only then `v-html`, but the phase requirement is plain text. [D-13]

**Warning signs:** `v-html` appears in `GameCard.vue`; card content contains raw HTML tags or broken links.

### Pitfall 8: Nested Controls Trigger Card Activation

**What goes wrong:** Clicking a sort dropdown, owner avatar, or future action button inside a card navigates to BGG because the card has a click handler.

**Why it happens:** The card wrapper listens to `@click`, and internal interactive elements bubble.

**How to avoid:** Mark internal interactive elements with `@click.stop` or check `event.target`. Use semantic elements: the card is a link/clickable region, internal controls are `<button>` elements that stop propagation. [D-14]

**Warning signs:** Owner avatar stack or sort control click opens BGG in a new tab.

### Pitfall 9: M3 Token Drift / Hard-Coded Colors

**What goes wrong:** New components use `bg-indigo-600`, `text-neutral-500`, or other non-token colors, breaking dark mode and the Tabletop Social contract.

**Why it happens:** Developers copy old v1.0 class strings or design mock-ups with hex values.

**How to avoid:** Use Phase 5 primitives and tokens: `bg-primary`, `bg-surface-container`, `text-on-surface`, `border-outline`, `text-on-surface-variant`, `text-primary`, `text-error`. Run `grep -R "bg-indigo\|text-neutral\|bg-red-" app/frontend/components` as a verification. [CITED: 05-UI-SPEC.md]

**Warning signs:** Cards have a different background from the sidebar in dark mode; status badges use non-semantic colors.

### Pitfall 10: Missing Sheet Accessibility

**What goes wrong:** The mobile filter Sheet is not labelled, focus is not trapped, or the close button lacks an accessible label.

**Why it happens:** The Sheet content is treated like a generic drawer without using `SheetTitle`, `SheetDescription`, and the built-in focus trap.

**How to avoid:** Always include `SheetHeader` with `SheetTitle` inside `SheetContent`. The existing `SheetContent.vue` already includes a close button with `closeAriaLabel`. Use `aria-label="Filters"` on the trigger button. [CITED: reka-ui Dialog docs; 05-UI-SPEC.md]

**Warning signs:** Screen reader does not announce the drawer title; focus moves behind the Sheet overlay.

## Planner Checklist

Before creating `PLAN.md` files, the planner should verify:

- [ ] Slice 1 (backend GraphQL) is planned first and includes schema dump + codegen.
- [ ] `DashboardStats` is a dedicated query, not an extension of `UserType` or a derived client-side count.
- [ ] Hot enrichment uses `Loaders::HotItemThingLoader` and does not call `Bgg::Client` live.
- [ ] `last_played_at` uses `Loaders::LastPlayedAtLoader` with `context[:last_played_scope_type]` set by parent resolvers.
- [ ] Filter state migration preserves all old URL params: `players=N`, `time=N`, `complexity=N`, `sort`, `ratingMin`, `group` token.
- [ ] New URL params are documented: `players=N-M`, `time=N,M`, `complexity=1|2|3`, `view=grid|list`, `sort=name_asc|rating_desc|weight_asc|recently_played`.
- [ ] The 280px global sidebar is not used for collection filters; the 264px `xl:` sticky panel and Sheet are the only filter containers.
- [ ] `Slider` and `ToggleGroup` are sourced from the existing reka-ui/shadcn-vue stack (no new icon or UI library).
- [ ] `GameCard` never uses `v-html` for the BGG description.
- [ ] Card nested controls stop event propagation so they don't open BGG.
- [ ] Grid/list skeletons are both implemented and mirror their respective card shapes.
- [ ] Existing E2E contracts (collection permalink, collector toggles, player filter, sort) are either preserved or explicitly updated with stable selectors.
- [ ] Phase 10 reuse is considered for `ComplexityToggleGroup`, `PlayerRangeSlider`, `GameCard`, and `ViewModeToggle`.

## Sources

### Primary (HIGH confidence)

- **Existing codebase (inspected 2026-07-15):** `app/frontend/views/HomeView.vue`, `CollectionView.vue`, `app/frontend/components/landing/UsernameForm.vue`, `HotList.vue`, `app/frontend/components/collection/CollectionFilters.vue`, `GameGrid.vue`, `GameCard.vue`, `ResultsSkeleton.vue`, `EmptyState.vue`, `app/frontend/stores/filters.ts`, `app/frontend/composables/usePermalink.ts`, `useCollectionFilters.ts`, `app/frontend/utils/sorting.ts`, `app/frontend/utils/grouping.ts`, `app/frontend/components/layout/AppShell.vue`, `NavSidebarContent.vue`, `app/frontend/entrypoints/styles.css`, `app/frontend/components/ui/*`, `app/graphql/types/query_type.rb`, `hot_item_type.rb`, `thing_fields.rb`, `merged_thing_type.rb`, `group_type.rb`, `app/graphql/loaders/owners_loader.rb`, `polls_loader.rb`, `app/services/bgg/client.rb`, `app/models/bgg_thing.rb`, `app/models/night_session.rb`, `app/models/user.rb`, `db/schema.rb`, `schema.graphql`, `app/frontend/generated/operations.ts`.
- **Phase 9 Context (user decisions):** `.planning/phases/09-home-collection-redesign/09-CONTEXT.md` — D-01 through D-18.
- **Phase 8 Research/Patterns:** `.planning/phases/08-group-detail-surface/08-RESEARCH.md` and `08-PATTERNS.md` — bounded GraphQL queries, Dataloader patterns, responsive sticky layout, Apollo cache updates, M3 token usage.
- **Phase 5 Context & UI-SPEC:** `.planning/phases/05-design-system-foundation/05-CONTEXT.md` and `05-UI-SPEC.md` — M3 tokens, primitives, responsive shell, badge/avatar/card specs.
- **Milestone research:** `.planning/research/FEATURES.md`, `.planning/research/PITFALLS.md`, `.planning/research/ARCHITECTURE.md` — dashboard/filter/card expectations, Apollo/Pinia boundaries, N+1 risks, GraphQL schema evolution.
- **Project requirements:** `.planning/REQUIREMENTS.md` — HOME-01/02/03, COLL-19/20/21/22/23.

### Secondary (MEDIUM confidence)

- **reka-ui Slider API:** `https://reka-ui.com/docs/components/slider` (fetched 2026-07-15) — two-thumb range, keyboard navigation, `min-steps-between-thumbs`. [CITED: reka-ui.com]
- **reka-ui ToggleGroup API:** `https://reka-ui.com/docs/components/toggle-group` (fetched 2026-07-15) — single/multiple type, roving tabindex, keyboard interactions. [CITED: reka-ui.com]
- **shadcn-vue Slider:** `https://www.shadcn-vue.com/docs/components/slider.html` (fetched 2026-07-15) — single-component wrapper around reka-ui. [CITED: shadcn-vue.com]
- **shadcn-vue ToggleGroup:** `https://www.shadcn-vue.com/docs/components/toggle-group.html` (fetched 2026-07-15) — `type="single"` and `type="multiple"` usage. [CITED: shadcn-vue.com]
- **Apollo Client mutations and cache updates:** `https://www.apollographql.com/docs/react/data/mutations` (project knowledge) — `update` callback, `cache.modify`. [CITED: apollographql.com]
- **GraphQL::Dataloader overview:** `https://graphql-ruby.org/dataloader/overview.html` (project knowledge) — batch loading with `GraphQL::Dataloader::Source`. [CITED: graphql-ruby.org]
- **GraphQL schema design:** `https://graphql.org/learn/schema-design/` (project knowledge) — add-only evolution, nullable new fields. [CITED: graphql.org]
- **Tailwind v4 responsive sticky:** `https://tailwindcss.com/docs/position` (project knowledge) — `sticky` utility and responsive variants. [CITED: tailwindcss.com]

### Tertiary (LOW confidence)

- **Material 3 dashboard/card patterns:** Inferred from `05-UI-SPEC.md` and general M3 documentation; no live external doc fetch succeeded for specific dashboard component pages. [ASSUMED]
- **Exact heavy-complexity weight threshold (3+ vs 4+):** Left to agent's discretion per CONTEXT.md; recommended mapping is Light 0–2, Medium 2–3, Heavy 3+ to reuse existing buckets with minimal migration. [ASSUMED]

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — versions are pinned in `Gemfile`/`package.json` and inspected directly; `reka-ui` 2.10.1 and `shadcn-vue` 2.7.4 are the current installed versions.
- Architecture: HIGH — derived from existing code, ADRs, and phase context; GraphQL/Apollo/Dataloader patterns corroborated by official docs and Phase 8 research.
- Pitfalls: HIGH — PITFALLS.md and Phase 8 research already identified N+1, Apollo cache, and dark-mode drift risks; code inspection confirmed the specific Phase 9 integration points.

**Research date:** 2026-07-15
**Valid until:** 2026-08-15 (stable stack; revisit only if reka-ui/shadcn-vue APIs change in a way that breaks the slider/toggle-group patterns above)
