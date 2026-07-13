# Architecture Research: v1.1 UI Redesign + Suggestion Engine

**Domain:** Rails 8 API-only + Vue 3 SPA monorepo, GraphQL API, BGG XML API v2 integration, friend groups + boardgame night sessions
**Milestone:** v1.1 — UI Redesign ("Tabletop Social" / Stitch) + Poll-based Suggestion Engine
**Researched:** 2026-07-13
**Confidence:** MEDIUM (integration patterns derived from project context, existing v1.0 architecture, and Tailwind/Material 3 docs; BGG poll XML structure inferred from schema + reference proxy + BGG API docs; no live BGG XML sample fetched because BGG now requires authenticated access)

> **Scope note:** This document focuses on how the new v1.1 features integrate with the existing v1.0 architecture. The base architecture (Rails 8.1 API-only, vite_rails, Apollo Client, GraphQL::Dataloader, Solid Queue/Cache, dry-rails contracts, BGG client) is established in the previous version of this file and in `PROJECT.md`. Do not re-research that base; reuse it.

## Standard Architecture for v1.1

### System Overview

The v1.1 milestone adds two independent but UI-converging workstreams to the existing v1.0 monorepo:

1. **Design-system migration** — replace the ad-hoc Tailwind v4 styling with a structured "Tabletop Social" (Stitch) design system: Material 3 tonal palette, Inter typography, Material Symbols icons, 280px sidebar, rounded-xl cards, status badges, skeleton loaders.
2. **Suggestion engine** — replace the manual "host picks a game" flow with a session-scoped, poll-based scoring engine that uses BGG's community "Best / Recommended / Not Recommended" player-count polls to rank games for the RSVP'd attendees.

Both workstreams touch the same views (Home, Collection, Group Detail, Night Session). The architecture challenge is to keep the data work (polls, scoring) independent from the UI reskin so they can ship in parallel and converge without blocking each other.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         BROWSER (Vue 3 SPA)                                 │
│  ┌──────────────────────┐  ┌──────────────────────┐  ┌──────────────────┐ │
│  │ Stitch Design System │  │ Feature Views        │  │ Apollo + Pinia   │ │
│  │ (tokens, primitives,  │  │ (Home, Collection,  │  │ (server data +   │ │
│  │  layout shell)        │  │  Group, Session)     │  │  UI state)       │ │
│  └──────────────────────┘  └──────────────────────┘  └──────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │ GraphQL POST /graphql
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                      RAILS 8 API-ONLY (single deploy)                         │
│  ┌──────────────────┐  ┌──────────────────┐  ┌─────────────────────────┐  │
│  │ GraphQL Schema   │  │ Suggestions::    │  │ BGG Poll Persistence    │  │
│  │ (new types +     │  │ Engine + scoring │  │ (BggPoll/BggPollResult) │  │
│  │  resolvers)      │  │ services         │  │                         │  │
│  └──────────────────┘  └──────────────────┘  └─────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ Existing v1.0 services: Collections::Merge, Sessions::*, Groups::*, │  │
│  │ Bgg::Client, Solid Queue/Cache, dry-rails contracts                  │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities (v1.1 additions and modifications)

| Component | Responsibility | New or Modified? | Implementation Notes |
|-----------|----------------|------------------|----------------------|
| **Tailwind v4 token layer** | Map Material 3 tonal roles to `@theme` variables | New | Single source of truth in `app/frontend/entrypoints/styles.css` or imported `theme.css` |
| **Stitch primitive components** | Reusable M3-styled building blocks (Surface, Text, Button, Badge, Skeleton, Icon, Avatar) | New | `app/frontend/components/stitch/`; no business logic; props-based |
| **Stitch layout components** | AppShell, Sidebar, MobileDrawer, Navbar, PageHeader | New/Modified | Replace existing `components/layout/*` with token-aware versions |
| **GameCard / SuggestionCard** | Rich game cards with M3 elevation, badges, action buttons | Modified | Consume Stitch primitives; accept `suggestion` prop for score reasons |
| **Home dashboard** | Hero + BGG merge input + personal stats + trending games | Modified | New `HomeView.vue` layout; reuses `hotItems` query |
| **Collection view** | Structured filter sidebar + rich cards + sort + grid/list toggle | Modified | New `CollectionFilters.vue` and `GameGrid.vue` skins; filter logic unchanged |
| **Group Detail view** | Group header + sessions list + shared collection spotlight + members | New | `app/frontend/views/GroupView.vue` already exists; extend with new panels |
| **Picking a Game view** | Session header + attendee-aware suggestions + "Pick this game" cards | Modified | New `NightSessionView.vue` skin; wires to `suggestions` query |
| **Suggestions resolver** | GraphQL resolver for `suggestions(sessionId:)` | New | `app/graphql/resolvers/suggestions_resolver.rb` |
| **Suggestions::Engine** | Pure function: merged collection × session context → ranked shortlist | New | `app/services/suggestions/engine.rb` |
| **Suggestions::Scoring functions** | Player-count suitability, time fit, complexity fit, rating, freshness | New | `app/services/suggestions/player_count_scorer.rb`, etc. |
| **BggPoll / BggPollResult models** | Persist parsed BGG poll data per thing | New | Extend `BggThing` via `has_many :bgg_polls` |
| **Bgg::XmlParser poll extraction** | Parse `<poll>` elements from thing XML | Modified | Add to existing normalizer; handle array-or-single-item shape |
| **Bgg::ImportThingJob** | Background job to enrich thing records with poll data | New | Reuses `Bgg::Client` and rate limiter; concurrency: 1 BGG |
| **Group type extensions** | New fields: `sessions`, `collectionSpotlight`, `inviteCode` | Modified | Add to existing `app/graphql/types/group_type.rb` |
| **NightSession type extensions** | New field: `suggestions` | Modified | Add to existing `app/graphql/types/night_session_type.rb` |

## Recommended Project Structure (additions to v1.0)

```
boardgame-night-rails-vue/
├── app/
│   ├── frontend/
│   │   ├── entrypoints/
│   │   │   ├── styles.css          # ← extend with M3 @theme tokens
│   │   │   └── application.ts
│   │   ├── components/
│   │   │   ├── stitch/             # ← NEW: design-system primitives
│   │   │   │   ├── StSurface.vue
│   │   │   │   ├── StText.vue
│   │   │   │   ├── StButton.vue
│   │   │   │   ├── StBadge.vue
│   │   │   │   ├── StSkeleton.vue
│   │   │   │   ├── StIcon.vue
│   │   │   │   └── StAvatar.vue
│   │   │   ├── layout/             # ← MODIFY: use stitch primitives
│   │   │   │   ├── AppShell.vue
│   │   │   │   ├── Sidebar.vue
│   │   │   │   ├── MobileDrawer.vue
│   │   │   │   └── AppHeader.vue
│   │   │   ├── collection/         # ← MODIFY: new skins, same logic
│   │   │   │   ├── GameCard.vue
│   │   │   │   ├── GameGrid.vue
│   │   │   │   ├── CollectionFilters.vue
│   │   │   │   ├── SortControl.vue
│   │   │   │   └── ResultsSkeleton.vue
│   │   │   ├── group/              # ← MODIFY/ADD: Group Detail panels
│   │   │   │   ├── GroupHeader.vue
│   │   │   │   ├── GroupSessionsList.vue
│   │   │   │   ├── GroupCollectionSpotlight.vue
│   │   │   │   ├── GroupMembersPanel.vue
│   │   │   │   └── InviteLink.vue
│   │   │   ├── session/            # ← MODIFY: suggestion-aware
│   │   │   │   ├── SessionHeader.vue
│   │   │   │   ├── AttendeePicker.vue
│   │   │   │   ├── SuggestionList.vue
│   │   │   │   ├── SuggestionCard.vue
│   │   │   │   └── GamePicker.vue
│   │   │   └── home/               # ← NEW: dashboard components
│   │   │       ├── HomeHero.vue
│   │   │       ├── StatsCard.vue
│   │   │       └── TrendingGames.vue
│   │   ├── views/
│   │   │   ├── HomeView.vue        # ← MODIFY: dashboard layout
│   │   │   ├── CollectionView.vue  # ← MODIFY: new filter sidebar
│   │   │   ├── GroupView.vue       # ← MODIFY: Group Detail surface
│   │   │   └── NightSessionView.vue # ← MODIFY: suggestions skin
│   │   ├── apollo/
│   │   │   ├── queries/
│   │   │   │   ├── group.graphql   # ← extend with sessions, members, spotlight
│   │   │   │   ├── suggestions.graphql # ← NEW
│   │   │   │   └── home_dashboard.graphql # ← NEW (personal stats)
│   │   │   └── mutations/
│   │   │       └── run_suggestions.graphql # ← optional
│   │   └── composables/
│   │       ├── useSuggestions.ts   # ← NEW
│   │       └── useHomeDashboard.ts   # ← NEW
│   ├── graphql/
│   │   ├── types/
│   │   │   ├── group_type.rb         # ← extend
│   │   │   ├── night_session_type.rb # ← extend
│   │   │   ├── suggestion_type.rb    # ← NEW
│   │   │   ├── bgg_poll_type.rb      # ← NEW
│   │   │   └── merged_thing_type.rb  # ← extend with polls
│   │   ├── resolvers/
│   │   │   └── suggestions_resolver.rb # ← NEW
│   │   └── mutations/
│   │       └── run_suggestions.rb    # ← optional NEW
│   ├── models/
│   │   ├── bgg_thing.rb              # ← extend: has_many :bgg_polls
│   │   ├── bgg_poll.rb               # ← NEW
│   │   └── bgg_poll_result.rb        # ← NEW
│   ├── services/
│   │   ├── suggestions/              # ← NEW namespace
│   │   │   ├── engine.rb
│   │   │   ├── player_count_scorer.rb
│   │   │   ├── time_fit_scorer.rb
│   │   │   ├── complexity_scorer.rb
│   │   │   └── explain.rb
│   │   ├── sessions/
│   │   │   └── suggest.rb            # ← NEW or extend existing
│   │   └── bgg/
│   │       ├── xml_parser.rb         # ← extend with poll parsing
│   │       └── endpoints/thing.rb    # ← ensure stats=1 includes polls
│   └── jobs/
│       └── bgg/
│           └── enrich_thing_job.rb   # ← NEW: backfill polls for existing things
├── db/migrate/
│   ├── create_bgg_polls.rb           # ← NEW
│   └── create_bgg_poll_results.rb    # ← NEW
└── schema.graphql                    # ← extend (dump after changes)
```

### Structure Rationale

- **`app/frontend/components/stitch/`**: Isolates the design system from feature components. This lets the redesign proceed in parallel with the suggestion engine work. Once primitives exist, feature components are reskins, not rewrites.
- **`app/frontend/entrypoints/styles.css`**: Tailwind v4 is CSS-first; the entire token system lives here via `@theme`. No `tailwind.config.js`. Light/dark switching is done by changing the values of the CSS custom properties, not by toggling classes at runtime.
- **`app/services/suggestions/`**: The scoring engine is a pure service namespace. It is called from GraphQL resolvers and can be unit-tested without Apollo or Vue. Each scoring function is its own class so weights and heuristics can be tuned independently.
- **`BggPoll` normalized model**: A thing has multiple polls; each poll has multiple results. Normalized storage is preferable to a JSON blob because the suggestion engine queries per-player-count results and because the schema may expose polls directly to the frontend.
- **`Bgg::EnrichThingJob`**: Existing `BggThing` rows from v1.0 do not have poll data. A one-time backfill job (Solid Queue, concurrency: 1 BGG) fetches `thing?id=...&stats=1` for each unique thing and persists the polls. New imports fetch polls automatically.

## Architectural Patterns

### Pattern 1: Material 3 Tokens in Tailwind v4 (CSS-first)

**What:** Map Material 3's tonal palette roles to Tailwind v4 `@theme` variables. The design system becomes a thin layer of CSS custom properties that generate matching utility classes.

**Why use it:** Tailwind v4 removed `tailwind.config.js` in favor of CSS-based `@theme`. The "Tabletop Social" system requires a consistent palette (indigo primary, neutral surfaces, error/tertiary accents), so the tokens should be first-class CSS variables that also produce utilities like `bg-primary-500`, `text-on-surface`, etc.

**Trade-offs:** Disabling the default Tailwind palette (`--color-*: initial`) reduces CSS output but forces every color to be defined in the token file. Keeping the default palette plus M3 tokens is safer for incremental migration but can produce color inconsistencies if designers accidentally mix palettes.

**Example:**
```css
/* app/frontend/entrypoints/styles.css */
@import "tailwindcss";
@import "@fontsource/inter/400.css";
@import "@fontsource/inter/500.css";
@import "@fontsource/inter/600.css";
@import url("https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200");

@theme {
  /* Keep default spacing/breakpoints; override only the color namespace */
  --color-*: initial;

  /* Material 3 tonal roles — example indigo primary palette */
  --color-primary-0: #000000;
  --color-primary-10: #001944;
  --color-primary-20: #002d6d;
  --color-primary-30: #004397;
  --color-primary-40: #1b5bc2;
  --color-primary-50: #4674c6;
  --color-primary-60: #688ee0;
  --color-primary-70: #8aa8fb;
  --color-primary-80: #b3c7ff;
  --color-primary-90: #dae2ff;
  --color-primary-95: #eff4ff;
  --color-primary-99: #fefbff;
  --color-primary-100: #ffffff;

  --color-surface: #f8f9ff;
  --color-surface-variant: #e1e2ec;
  --color-on-surface: #1a1b21;
  --color-on-surface-variant: #44464f;
  --color-outline: #75777f;
  --color-inverse-surface: #2f3036;
  --color-inverse-on-surface: #f2f0f4;
  --color-error: #ba1a1a;
  --color-on-error: #ffffff;
  --color-tertiary: #7d5260;
  --color-on-tertiary: #ffffff;
  --color-secondary: #585e71;
  --color-on-secondary: #ffffff;

  --font-sans: "Inter", ui-sans-serif, system-ui, sans-serif;
  --radius-xl: 0.75rem;
  --radius-2xl: 1rem;
}

/* Dark mode: override token values via a media query or data attribute */
@media (prefers-color-scheme: dark) {
  :root {
    --color-surface: #1a1b21;
    --color-surface-variant: #44464f;
    --color-on-surface: #f8f9ff;
    --color-on-surface-variant: #c5c6d0;
  }
}
```

**Design system component usage:**
```vue
<!-- app/frontend/components/stitch/StButton.vue -->
<script setup lang="ts">
defineProps<{ variant?: 'filled' | 'tonal' | 'outlined' }>()
</script>
<template>
  <button :class="[
    'inline-flex items-center justify-center rounded-xl px-6 py-2.5 text-sm font-medium',
    variant === 'filled' && 'bg-primary-40 text-on-primary',
    variant === 'tonal' && 'bg-primary-90 text-on-primary-container',
    variant === 'outlined' && 'border border-outline text-primary-40',
  ]">
    <slot />
  </button>
</template>
```

### Pattern 2: Poll-Based Suggestion Engine as a Pure Service

**What:** The suggestion engine is a deterministic, explainable scorer. It takes a merged collection and a session context, reads BGG poll data from the database, and returns a ranked shortlist with per-score reasons.

**Why use it:** The engine is a pure function over cached data. It does not call BGG, so it is fast and testable. It is also the right place for the "Schmaus" player-count suitability formula because the formula is a business rule, not a GraphQL concern.

**Trade-offs:** The score is computed live per request. For a group with 500 games this is trivial; for 5,000 games it may need caching or pagination. Compute the shortlist and cache it per session for 5 minutes if needed.

**Example:**
```ruby
# app/services/suggestions/engine.rb
module Suggestions
  class Engine
    DEFAULT_WEIGHTS = {
      players: 0.40,
      time: 0.20,
      complexity: 0.20,
      rating: 0.10,
      freshness: 0.10
    }.freeze

    def initialize(weights: DEFAULT_WEIGHTS)
      @weights = weights
    end

    def call(merged_collection:, session:)
      attendees = session.attendances.going.map(&:user)
      owner_ids = attendees.map(&:bgg_username).to_set
      player_count = attendees.size
      time_budget = session.time_budget_minutes
      complexity_pref = session.complexity_preference

      candidates = merged_collection.items.select do |item|
        item.owners.any? { |o| owner_ids.include?(o.bgg_username) }
      end

      candidates.map do |item|
        score, reasons = score_item(item, player_count, time_budget, complexity_pref)
        Suggestion.new(item:, score:, reasons:)
      end.sort_by(&:score).reverse.first(8)
    end

    private

    def score_item(item, player_count, time_budget, complexity_pref)
      players = PlayerCountScorer.new(item.bgg_thing).call(player_count)
      time = TimeFitScorer.new(item.bgg_thing).call(time_budget)
      complexity = ComplexityScorer.new(item.bgg_thing).call(complexity_pref)
      rating = (item.bgg_thing.average || 0) * 10
      freshness = 50 # default until play logging exists

      score = @weights[:players] * players +
              @weights[:time] * time +
              @weights[:complexity] * complexity +
              @weights[:rating] * rating +
              @weights[:freshness] * freshness

      reasons = Explain.call(
        players:, time:, complexity:, rating:, freshness:,
        item_name: item.bgg_thing.name
      )
      [score.round(2), reasons]
    end
  end
end
```

### Pattern 3: BGG Poll Data Fetch and Storage

**What:** BGG poll data is parsed from the `/thing` XML response and persisted as normalized `BggPoll` + `BggPollResult` rows attached to `BggThing`. The existing `Bgg::Client` fetches thing details; the existing `Bgg::XmlParser` is extended to extract polls.

**Why use it:** The suggestion engine needs fast, set-based access to "Best / Recommended / Not Recommended" votes per player count. Storing polls in the DB (rather than a JSON blob or live BGG call) lets the engine query with SQL and avoids the 1 req/5s BGG limit during suggestion requests.

**Trade-offs:** Poll data is a one-to-many-to-many structure. Normalized storage is slightly more schema work than a JSON column, but it enables indexing and cleaner GraphQL types. If the app later exposes raw polls to the UI, the GraphQL type maps cleanly to the model.

**XML structure:**
```xml
<poll name="suggested_numplayers" title="User Suggested Number of Players" totalvotes="742">
  <results numplayers="1">
    <result value="Best" numvotes="0" />
    <result value="Recommended" numvotes="1" />
    <result value="Not Recommended" numvotes="553" />
  </results>
  <results numplayers="2">
    <result value="Best" numvotes="23" />
    <result value="Recommended" numvotes="312" />
    <result value="Not Recommended" numvotes="201" />
  </results>
  <!-- ... -->
</poll>
```

**Model design:**
```ruby
# app/models/bgg_thing.rb
class BggThing < ApplicationRecord
  has_many :bgg_polls, dependent: :destroy
end

# app/models/bgg_poll.rb
class BggPoll < ApplicationRecord
  belongs_to :bgg_thing
  has_many :bgg_poll_results, dependent: :destroy

  enum name: {
    suggested_numplayers: "suggested_numplayers",
    suggested_playerage: "suggested_playerage",
    language_dependence: "language_dependence"
  }
end

# app/models/bgg_poll_result.rb
class BggPollResult < ApplicationRecord
  belongs_to :bgg_poll

  # value: "Best", "Recommended", "Not Recommended"
  # numplayers: "1", "2", "3+" (only for suggested_numplayers)
  # num_votes: integer
end
```

**Parser addition:**
```ruby
# app/services/bgg/xml_parser.rb (excerpt)
def self.extract_polls(item_node)
  item_node.css("poll").map do |poll_node|
    {
      name: poll_node["name"],
      title: poll_node["title"],
      total_votes: poll_node["totalvotes"].to_i,
      results: poll_node.css("results").map do |results_node|
        {
          numplayers: results_node["numplayers"],
          entries: results_node.css("result").map do |result_node|
            {
              value: result_node["value"],
              num_votes: result_node["numvotes"].to_i
            }
          end
        }
      end
    }
  end
end
```

**Backfill job:**
```ruby
# app/jobs/bgg/enrich_thing_job.rb
class Bgg::EnrichThingJob < ApplicationJob
  limits_concurrency to: 1, key: "bgg_api"
  retry_on Bgg::RateLimitError, wait: :polynomially_longer, attempts: 5

  def perform(bgg_thing_id)
    thing = BggThing.find(bgg_thing_id)
    data = Bgg::Client.new.thing(thing.bgg_id)
    Bgg::PollUpsert.new(thing, data[:polls]).call
  end
end
```

### Pattern 4: Group Detail Page Integration

**What:** The Group Detail page is a new route-level view (`/g/:token` or `/groups/:id`) that surfaces the group header, upcoming sessions, members panel, invite link, and a spotlight of the shared collection. It reuses existing data (Group, Membership, NightSession, MergedCollection) but presents it in a single dashboard-like surface.

**Why use it:** The existing v1.0 `GroupView` is minimal. The v1.1 design calls for a dedicated Group Detail surface that is the primary landing page for a group.

**Trade-offs:** The page naturally requests a lot of nested data (group → sessions → attendees → users → avatars). Use GraphQL::Dataloader to batch user lookups and avoid N+1. Consider exposing `collectionSpotlight` as a separate field with a `limit` arg so the full merged collection is not fetched unless needed.

**GraphQL additions:**
```graphql
# schema additions
type Group {
  id: ID!
  name: String!
  description: String
  owner: User!
  members: [User!]!
  memberships: [GroupMembership!]!
  myRole: GroupRole
  inviteCode: String           # only for owner/admin
  sessions: [NightSession!]!   # upcoming first, then past
  collectionSpotlight(limit: Int = 6): [MergedThing!]!
  collection: MergedCollection!
}

type NightSession {
  id: ID!
  title: String!
  status: String!
  scheduledAt: ISO8601DateTime
  attendees: [Attendance!]!
  pickedGame: MergedThing
  suggestions: [Suggestion!]!   # computed live
}
```

**Vue additions:**
```ts
// app/frontend/router/index.ts
{ path: '/groups/:id', name: 'group', component: () => import('@/views/GroupView.vue') }

// app/frontend/views/GroupView.vue
const { result, loading } = useQuery(
  GroupDocument,
  { id: route.params.id },
  { fetchPolicy: 'cache-first' }
)
```

### Pattern 5: Home Dashboard Redesign

**What:** The Home view becomes a dashboard with three zones: a hero that invites the user to merge a BGG collection, a personal stats card, and a trending games section.

**Why use it:** The redesign moves the app from a utility ("enter username") to a social hub ("your groups, your stats, what's hot"). The data already exists (current user, groups, hot items); the work is presentation and a few new lightweight queries.

**Trade-offs:** Personal stats require a new query (`homeDashboard`) that aggregates data the frontend could otherwise fetch separately. A single query is more cache-friendly and reduces request waterfalls, but it makes the resolver slightly heavier. Keep it simple: count groups, count sessions, count games, next upcoming session.

**GraphQL additions:**
```graphql
type HomeDashboard {
  user: User!
  groupCount: Int!
  upcomingSession: NightSession
  ownedGameCount: Int!
  hotItems: [HotItem!]!
}

type Query {
  homeDashboard: HomeDashboard!
}
```

## Data Flow

### Suggestion Engine Flow (end-to-end)

```
[Host opens session /sessions/:id and clicks "Suggest games"]
    ↓
Vue: useQuery(SuggestionsDocument, { sessionId: 42 })
    ↓
Apollo POST /graphql
    ↓
SuggestionsResolver.load(session_id) → Sessions::Suggest.new.call(session)
    ↓
Sessions::Suggest:
  1. attendees = session.attendances.going
  2. owner_usernames = attendees.map(&:bgg_username)
  3. merged = Collections::Merge.new.call(owner_usernames)
  4. ranked = Suggestions::Engine.new.call(merged_collection: merged, session: session)
    ↓
Suggestions::Engine per candidate:
  - player_count_suitability from BggPoll/BggPollResult (Schmaus formula)
  - time_fit from BggThing playtime
  - complexity_fit from BggThing.average_weight
  - community_rating from BggThing.average
    ↓
Returns [Suggestion] with score + reasons
    ↓
GraphQL response → Apollo cache → SuggestionList.vue renders cards
```

### Group Detail Flow

```
[User navigates to /groups/7]
    ↓
Vue: useQuery(GroupDocument, { id: 7 })
    ↓
Apollo POST /graphql
    ↓
GroupResolver.load(id: 7) → Group.find(id) + authorization
    ↓
GraphQL field resolution (with Dataloader):
  - group.owner → UserLoader.load(owner_id)
  - group.members → MembershipLoader.load(group_id) → UserLoader.load(user_ids)
  - group.sessions → SessionLoader.load(group_id)
  - group.collectionSpotlight(limit: 6) → Collections::Merge.spotlight(group.member_usernames)
  - group.inviteCode → InviteTokenService.for_group(group) if role >= admin
    ↓
GraphQL response → Apollo cache → GroupView renders panels
```

### Home Dashboard Flow

```
[User lands on /]
    ↓
Vue: useQuery(HomeDashboardDocument)
    ↓
Apollo POST /graphql
    ↓
HomeDashboardResolver → HomeDashboardService.call(current_user)
    ↓
HomeDashboardService:
  - user.groups.count
  - user.sessions.upcoming.first
  - user.bgg_collection_items.count (distinct bgg_thing_id)
  - Bgg::Client.hot("boardgame") (Solid Cache, 24h TTL)
    ↓
GraphQL response → Apollo cache → HomeView renders hero + stats + trending
```

## Scaling Considerations

| Scale | v1.1 Adjustments |
|-------|------------------|
| 0–1k users (target) | Single Rails process + Solid Queue worker. SQLite is fine. Poll data stored in DB. Suggestion engine computes live per request. Design-system CSS output is small because tokens are explicit. |
| 1k–10k users | Add Solid Cache shortlist caching per session (5 min TTL). Add DB indexes on `bgg_poll_results(bgg_poll_id, value)` and `bgg_polls(bgg_thing_id, name)`. Consider Postgres for better concurrent query performance. |
| 10k+ users | Move suggestion computation to a materialized view or cached shortlist generated at RSVP close. Pre-compute player-count suitability per (thing, count) pair during import. This is unlikely for a friend-group app. |

### Scaling Priorities for v1.1

1. **First bottleneck: BGG thing enrichment for poll backfill.** The app already has `bgg_things` from v1.0 but without polls. Backfilling 1,000 unique games at 1 req/5s = ~84 minutes. Run `Bgg::EnrichThingJob` in batches with Solid Queue concurrency: 1, and show a progress indicator in the UI.
2. **Second bottleneck: suggestion computation for large groups.** A group of 10 users with 500 unique games = 500 candidates. The engine is O(n) over candidates and O(1) per candidate, so this is fine in Ruby. If groups grow larger, add a `limit` to the merged collection query or cache the shortlist.

## Anti-Patterns

### Anti-Pattern 1: Computing Suggestions by Calling BGG Live

**What people do:** The `suggestions` resolver calls `Bgg::Client.thing` for every candidate to get poll data.
**Why it's wrong:** BGG's 1 req/5s limit makes this unusable for any non-trivial collection. A 50-game suggestion request would take 250 seconds.
**Do this instead:** Persist polls in `BggPoll`/`BggPollResult` during import/enrichment. The resolver reads only from the DB.

### Anti-Pattern 2: Storing Poll Data as an Unstructured JSON Blob

**What people do:** Add a `polls_json` text column to `bgg_things` and store the raw XML-derived hash.
**Why it's wrong:** You lose the ability to query, index, or type the data in GraphQL. The schema becomes a black box.
**Do this instead:** Normalize into `bgg_polls` and `bgg_poll_results`. The engine can query with Active Record, and the GraphQL type maps cleanly.

### Anti-Pattern 3: Mixing Design Tokens with Runtime Theme State in Pinia

**What people do:** Store the current theme (light/dark) as a Pinia state and apply classes at runtime, while also defining CSS tokens.
**Why it's wrong:** Two sources of truth for theme. Flicker on load, complex hydration, and unnecessary JavaScript.
**Do this instead:** Use CSS media queries (`prefers-color-scheme`) or a single `data-theme` attribute on `<html>` that reassigns CSS custom property values. Pinia stores only the user's theme preference (e.g., `'system' | 'light' | 'dark'`), not the computed colors.

### Anti-Pattern 4: Redesigning Feature Components Before Primitives Exist

**What people do:** Start with `HomeView.vue` and sprinkle Tailwind classes directly, then try to refactor into a design system later.
**Why it's wrong:** Inconsistent spacing, colors, and elevations. The redesign becomes a copy-paste mess and harder to maintain.
**Do this instead:** Build the Stitch primitives first (Surface, Text, Button, Badge, Skeleton, Icon, Avatar). Then reskin feature components by replacing old class strings with primitive components. The redesign work becomes mechanical and reviewable.

### Anti-Pattern 5: Returning the Entire Merged Collection in the Group Detail Query

**What people do:** The `Group` type's `collection` field always returns the full merged collection, which the Group Detail page only spotlights.
**Why it's wrong:** Over-fetching and slow initial page loads for large groups. The Collection view already has its own query for the full collection.
**Do this instead:** Add a `collectionSpotlight(limit: Int)` field that returns a small sample. The full collection is fetched only when the user navigates to the Collection view.

### Anti-Pattern 6: Putting the Suggestion Engine in the Frontend

**What people do:** Ship the scoring algorithm to the browser and run it over the merged collection in JavaScript.
**Why it's wrong:** Leaks business logic into the client, duplicates the engine in any non-Vue consumer, and makes A/B testing or weight tuning hard.
**Do this instead:** Keep `Suggestions::Engine` in Rails. The frontend receives a ranked shortlist and renders it.

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| **BGG XML API v2 `/thing`** | Existing `Bgg::Client` with `stats=1` parameter to fetch polls | Polls are included in the standard `/thing` response when `stats=1` is present. Reuse the existing rate limiter and response cache. |
| **Material Symbols** | Google Fonts via CSS `@import` or self-hosted font files | Use the variable font for dynamic weight. Load in `styles.css` to avoid an extra network round-trip from a `<link>` tag. |
| **Inter font** | Fontsource package or Google Fonts | Prefer Fontsource for offline builds and deterministic deploys. |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| **Stitch primitives ↔ feature components** | Props/events | Primitives are agnostic; feature components inject data from Apollo/Pinia. |
| **GraphQL schema ↔ Suggestions::Engine** | Resolver calls service | The resolver owns argument shape and authorization; the engine owns scoring. |
| **BggPoll models ↔ Bgg::XmlParser** | Parser returns hashes; upserter writes rows | Keep parsing and persistence separate for testability. |
| **Bgg::EnrichThingJob ↔ existing import jobs** | Both use `Bgg::Client` and `limits_concurrency to: 1, key: "bgg_api"` | Schedule backfill after the poll parser is deployed. |
| **Group Detail queries ↔ Dataloader** | Loaders batch user/membership/session lookups | Prevents N+1 when resolving the members panel and sessions list. |
| **Home dashboard ↔ Bgg::Client.hot** | Cache-through with 24h TTL | Hot items are already fetched live in v1.0; the dashboard reuses them. |

## Build Order (v1.1)

Phases are ordered to unblock parallel work and respect data dependencies. The design system can proceed in parallel with the poll data layer once the token contract is defined.

| # | Build | Unblocks | Why this order |
|---|-------|----------|----------------|
| 1 | **Design token system** — define M3 roles in `styles.css` (primary, surface, on-surface, error, etc.) and add Inter + Material Symbols. | 2, 5, 6 | The visual contract must exist before components are reskinned. |
| 2 | **Stitch primitives** — `StSurface`, `StText`, `StButton`, `StBadge`, `StSkeleton`, `StIcon`, `StAvatar`. | 3, 5, 6 | Reusable building blocks. Feature reskins become mechanical. |
| 3 | **BGG poll data model + parser** — migrations for `bgg_polls`/`bgg_poll_results`; extend `Bgg::XmlParser` to extract polls; update `Bgg::Endpoints::Thing` to request `stats=1`. | 4 | The engine needs poll data in the DB. |
| 4 | **Backfill existing things** — `Bgg::EnrichThingJob` + a one-time rake task to populate polls for all existing `BggThing` rows. | 5 | Without backfill, the suggestion engine has no poll data for existing collections. |
| 5 | **Poll-based suggestion engine** — `Suggestions::Engine`, scoring classes, `SuggestionsResolver`, `SuggestionType`, `suggestions` query. | 6 | The engine is the headline feature. It depends on poll data and sessions. |
| 6 | **Group Detail surface** — extend `Group` type, build `GroupView` panels (header, sessions, members, invite link, collection spotlight). | 7 | Surfaces existing data in the new design; can be built once primitives exist. |
| 7 | **Home dashboard redesign** — `HomeDashboard` query, `HomeView` dashboard layout, `StatsCard`, `TrendingGames`. | 8 | Reuses hot items query and current user data. |
| 8 | **Collection redesign** — reskin filter sidebar, game cards, sort, grid/list toggle with Stitch primitives. | 9 | Pure UI work; the collection logic is unchanged. |
| 9 | **Picking a Game redesign** — reskin session header, attendee picker, suggestion cards, game picker with Stitch primitives. | (milestone complete) | Converges the engine and the redesign in the most visible user flow. |
| 10 | **Polish + tech debt** — E2E in CI, Action Cable dev config, cleanup legacy BGG classes, update REQUIREMENTS checkboxes. | (ship) | Non-blocking quality gates. |

### Dependency Graph (condensed)

```
1 ──→ 2 ──→ 6 ──→ 9
│     │
│     └──→ 5 ──→ 9
│
3 ──→ 4 ──→ 5
```

**Critical path:** 1 → 2 → 5 → 9 (design system → primitives → suggestion engine → Picking a Game). The poll data work (3 → 4) runs in parallel with the design system but must finish before the engine (5). Group Detail (6) and Home/Collection (7, 8) can be built in parallel once primitives exist.

## Sources

- **Tailwind CSS v4 theme variables** (official docs, fetched 2026-07-13) — CSS-first `@theme` directive, `--color-*` namespace, custom property generation, dark-mode override patterns. Confidence: HIGH (official documentation).
- **Material 3 color system** (material.io, project context) — tonal palette roles (primary, secondary, tertiary, surface, on-surface, error, inverse-surface). Confidence: HIGH (design reference from Stitch project).
- **BGG XML API2 documentation** (official wiki, fetched 2026-07-13) — `/thing` endpoint supports `stats=1`, rate limit 1 req/5s, poll data structure described. Confidence: HIGH (official documentation).
- **Reference GraphQL proxy schema** (`bgg-graphql-proxy/src/schema/schema.graphql`) — defines `Poll`/`PollResult` types with `name`, `title`, `totalVotes`, `results { value, numVotes, level, players }`. Confidence: HIGH (primary source).
- **Reference proxy implementation** (`bgg-graphql-proxy/src/datasources/bggDataSource.ts`) — confirms the proxy returned `polls: []` and did not implement poll parsing; the Rails rewrite must add it. Confidence: HIGH (primary source).
- **Existing project architecture** (`boardgame-night-rails-vue/.planning/research/ARCHITECTURE.md` v1.0, `PROJECT.md`, `FEATURES.md`) — base Rails + Vue + GraphQL + Solid Queue/Cache patterns, suggestion algorithm (Schmaus formula), session lifecycle, feature dependencies. Confidence: HIGH (project context).
- **Web search on Tailwind v4 + Material 3 integration** (general web patterns, LOW confidence via webfetch) — confirmed that CSS custom properties and `@theme` are the idiomatic Tailwind v4 path for design systems.

---
*Architecture research for: v1.1 UI Redesign + Poll-Based Suggestion Engine*
*Researched: 2026-07-13*
