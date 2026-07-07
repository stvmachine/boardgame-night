# Phase 3: GraphQL API + Collection Surface (v1 Parity) - Research

**Researched:** 2026-07-07
**Domain:** Rails 8 API-only GraphQL + Vue 3 SPA collection browsing surface
**Confidence:** HIGH

## Summary

Phase 3 wires the Phase 2 BGG persistence layer into a Vue 3 collection browsing UI through a Rails GraphQL API. The backend work is additive to existing Phase 2 services: new GraphQL types, Dataloader sources, dry-validation contracts, a Solid Cable subscription for sync status, and a migration to persist BGG statistics on `bgg_things`. The frontend work is the bulk of the visible surface: N-user merge, Fuse.js fuzzy search, player/time/complexity filters, sorting/grouping, member color avatars, permalink state, responsive sidebar/drawer layout, and hot items.

The project already has the monorepo shell (Rails 8.1.3 + Vue 3.5.39 + Vite 8.1.3 + Apollo 3.14.1 + Pinia 3.0.4 + Tailwind CSS 4.3.2), the GraphQL schema scaffold with Dataloader, and the BGG persistence layer. The remaining Phase 3 work is filling in the GraphQL surface, extending `Bgg::CollectionPersister`, consolidating duplicate import jobs, adding the subscription link, and porting the v1 reference UI patterns from `bggeek-shared-list`.

**Primary recommendation:** Build the GraphQL schema with `GraphQL::Dataloader::Source` loaders (not custom batch code), use `dry-rails` `ApplicationContract` for mutation input validation, use `Solid Cable` + `graphql-ruby-client` for real-time sync status, keep all search/filter/sort/group logic client-side over Apollo's normalized cache, and persist statistics columns on `bgg_things` so the GraphQL type can expose rating/complexity data without extra BGG calls.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** v1-essential `ThingType` only — fields: `id`, `name`, `yearPublished`, `minPlayers`, `maxPlayers`, `minPlaytime`, `maxPlaytime`, `minAge`, `image`, `thumbnail`, `description`, `average`, `bayesAverage`, `usersRated`, `averageWeight`, `isExpansion`, `owners`. Skip polls, comments, versions, expansions, categories, mechanics, designers, etc. — v2 additions. **[NEEDS ADR: ADR-003]**
- **D-02:** `mergedCollection(usernames: [String!]!): MergedCollection!` — server-side merge via `BggThing.merged_for_users` scope. One DB query, deduped things with owner arrays.
- **D-03:** Individual columns on `bgg_things` for statistics: `average`, `bayes_average`, `users_rated`, `average_weight`, `num_comments`. Clean, queryable, indexable. Migration needed — `Normalizer` already produces these fields, `CollectionPersister` doesn't persist them yet.
- **D-04:** Skip thing detail queries (`thing(id)`, `things(ids)`). Game cards link to BGG (`https://boardgamegeek.com/boardgame/{id}`).
- **D-05:** Minimal `UserType`: `username` + `avatar` only. Full profile is v2.
- **D-06:** Two mutations with dry-validation contracts: `importCollection(username: String!): ImportResult` and `validateBggUsername(username: String!): ValidationResult`. Start the contract-first pattern in Phase 3.
- **D-07:** Dedicated `HotItemType` and `SearchResultType` — only fields BGG actually returns for each endpoint.
- **D-08:** `MergedCollection` wrapper type: `{ items: [MergedThing!]!, syncStatuses: [UserSyncStatus!]! }`.
- **D-09:** Auto-import on submit: inline validation → `importCollection` mutation → subscribe to `collectionSynced` → skeleton loaders → render when ready.
- **D-10:** Per-user status cards in sidebar with colored badges and game count.
- **D-11:** GraphQL subscriptions for real-time sync status via Solid Cable. `SubscriptionType` with `collectionSynced(username: String!): SyncStatus!`. `ImportCollectionJob` broadcasts lifecycle stages.
- **D-12:** Manual refresh with 15-min cooldown; stale-while-revalidate.
- **D-13:** ADRs in `docs/adr/` with MADR format.
- **D-14:** Real-time `history.replaceState` permalink updates on every filter/search/sort/grouping/owner-toggle change.
- **D-15:** Owner filter encoded in URL (`&owners=alice,bob`).
- **D-16:** Omit default/empty values from URL.
- **D-17:** No legacy `/u/:usernames` compat — only `/collection?usernames=` format.
- **D-18:** Three routes: `/`, `/collection`, `/hot`.
- **D-19:** Sidebar + topbar layout. Left sidebar for user list/sync status/owner toggles; main content for game grid; top bar for app name, nav, username input.
- **D-20:** `md` breakpoint (768px) for sidebar → mobile drawer.
- **D-21:** Auto-fill grid with `minmax(180px, 1fr)`.

### the agent's Discretion
- Exact ADR numbering (ADR-003 through ADR-007 are suggested; adjust if prior ADRs exist)
- Component file structure within `app/frontend/components/` (feature folders vs flat)
- Pinia store file naming and composition
- Fuse.js key configuration (preserve v1 keys: `name`, `name.text`, `originalname`, threshold 0.3, 300ms debounce)
- Exact filter UI component choices (sliders vs dropdowns)
- Skeleton loader design and animation
- Color palette for sync status badges and owner colors (port `memberColors` from reference UI)

### Deferred Ideas (OUT OF SCOPE)
- HTTP QUERY method for search
- Server-side search (Postgres `pg_trgm`/FTS) — v2 when collections exceed ~300 games
- Thing detail pages
- Legacy `/u/:usernames` permalink compat
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| COLL-01 | User can validate a BGG username exists before fetching its collection (inline valid/invalid state) | `validateBggUsername` mutation + `Bgg::Client#user` lookup; contract validates input shape |
| COLL-02 | User can merge N BGG users' collections into a single deduplicated view (dedup by BGG objectId, owner list per game) | `mergedCollection(usernames:)` query + `BggThing.merged_for_users` scope + owner loader |
| COLL-03 | User can fuzzy-search the merged collection by game name (Fuse.js, multi-key, debounced) | `@vueuse/integrations/useFuse` over Apollo cached `MergedThing` array |
| COLL-04 | User can filter by number of players (range check: min ≤ n ≤ max) | Client-side filter over cached data, same pattern as v1 `filterByNumPlayers` |
| COLL-05 | User can filter by playing time (bucketed: ≤30, 30–60, 60–120, 120–180, 180–240, 240+ min) | Client-side filter, same buckets as v1 `filterByPlayingTime` |
| COLL-06 | User can filter by complexity/weight (Light ≤2, Medium 2–3, Medium-Heavy 3–4, Heavy ≥4) | New filter using `averageWeight` persisted on `bgg_things` |
| COLL-07 | User can sort by name/rating/year/complexity asc/desc | Port v1 `sorting.ts` comparators; add complexity sort |
| COLL-08 | User can group by player count, rating, best-player-count, or none | Port v1 `grouping.ts`; best-players still uses heuristic for v1 |
| COLL-09 | User sees member color avatars (deterministic per-username color) as owner badges | Port v1 `memberColors.ts` hash-to-palette algorithm |
| COLL-10 | User can share a permalink URL for a set of usernames (URL state sync, copy-to-clipboard) | `URLSearchParams` + `history.replaceState`; omit defaults |
| COLL-11 | User sees hot/trending BGG games on the landing page | `hotItems` query backed by `Bgg::Client#hot` with 24h cache |
| COLL-12 | User sees a game card with thumbnail, name, rating, players, time, complexity, owner avatars | Tailwind v4 card component matching v1 `GameCard.tsx` layout |
| COLL-13 | User sees loading, empty, and error states with per-user error isolation | Per-user `UserSyncStatus` in `MergedCollection`; status enum READY/SYNCING/QUEUED/ERROR |
| COLL-14 | User can collapse/expand filter, search, and collector sections | Pinia `uiStore` + Tailwind transitions |
| COLL-15 | User can select-all/deselect-all members to control which owners' games show | Owner toggle state in Pinia `filtersStore` |
| COLL-16 | Layout is responsive (desktop fixed sidebar + mobile full-screen drawer, grid 1→5 cols) | Tailwind responsive utilities + `md` breakpoint drawer |
| COLL-17 | GraphQL collection queries use Dataloader to batch expansion/base-game lookups | `GraphQL::Dataloader::Source` loaders in `app/graphql/loaders/` |
| COLL-18 | BGG collection data is cached with stale-while-revalidate; user can trigger manual refresh (15-min cooldown) | `cached_at` already implicit via `BggCollection`; refresh mutation enqueues job with cooldown check |
| GQL-02 | GraphQL schema exposes queries for things, search, users, collections, hot items | `QueryType` additions: `mergedCollection`, `hotItems`, `search`, `user` |
| GQL-05 | GraphQL type definitions generated from Rails schema and committed | `rails graphql:schema:dump` → `schema.graphql` → `npm run codegen` → `app/frontend/generated/operations.ts` |
</phase_requirements>

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| GraphQL schema / resolvers | API / Backend (Rails) | — | Rails is the single GraphQL source of truth per PROJECT.md |
| Dataloader batching | API / Backend | — | `GraphQL::Dataloader` runs inside schema execution |
| Mutation input validation | API / Backend | — | `dry-rails` `ApplicationContract` on every mutation |
| BGG import jobs | API / Backend (Solid Queue) | — | `Bgg::ImportCollectionJob` already exists; add subscription broadcasts |
| Real-time sync status | API / Backend + Browser | — | Solid Cable (server) + Apollo ActionCableLink (browser) |
| Merged collection query | API / Backend | — | Pure DB query via `BggThing.merged_for_users` |
| Search / filter / sort / group | Browser (Vue) | — | Client-side over Apollo cache per CONTEXT.md; v1 parity |
| Fuzzy search | Browser | — | Fuse.js via `@vueuse/integrations/useFuse` |
| Permalink state | Browser | — | `URLSearchParams` + `history.replaceState` |
| Responsive layout | Browser | — | Tailwind CSS v4 + Vue conditional rendering |
| Codegen contract | Build tooling | — | `schema.graphql` committed + `npm run codegen` in CI |

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `graphql` (Ruby gem) | 2.6.3 [CITED: Gemfile.lock] | GraphQL server, Dataloader, subscriptions | Already installed; class-based schema is the modern graphql-ruby convention |
| `dry-rails` | 0.7.0 [CITED: hanakai.org/learn/dry/dry-rails] | Auto-registered container + `ApplicationContract` + `safe_params` | Official dry-rb Rails integration; CONTEXT.md D-06 mandates contract-first mutations |
| `solid_cable` | 4.0.0 [CITED: Gemfile.lock] | DB-backed Action Cable adapter for subscriptions | Rails 8 default; no Redis; already in Gemfile |
| `@rails/actioncable` | 8.1.300 [VERIFIED: npm registry] | Browser ActionCable consumer | Required for `graphql-ruby-client` `ActionCableLink`; official Rails package |
| `graphql-ruby-client` | 1.15.1 [CITED: graphql-ruby.org/javascript_client/apollo_subscriptions] [WARNING: flagged as suspicious — verify before using] | Apollo Link for ActionCable subscriptions | Official graphql-ruby JavaScript client; `ActionCableLink` is the documented integration |
| `@apollo/client` | 3.14.1 [CITED: package.json] | GraphQL client + normalized cache | Already installed; stable with `@vue/apollo-composable` 4.2.2 |
| `@vue/apollo-composable` | 4.2.2 [VERIFIED: npm registry] | Vue 3 Composition API for Apollo | Already installed; stable Vue 3 binding for Apollo 3.x |
| `fuse.js` | 7.4.2 [VERIFIED: npm registry] | Client-side fuzzy search | Matches v1 keys/threshold/debounce; OK legitimacy verdict |
| `@vueuse/integrations` | 14.3.0 [VERIFIED: npm registry] | `useFuse` composable | Official VueUse integration for Fuse.js; OK verdict |
| `vue` | 3.5.39 [CITED: package.json] | SPA framework | Already installed; Composition API only |
| `vue-router` | 5.1.0 [VERIFIED: npm registry] | SPA routing | Already installed; OK verdict |
| `pinia` | 3.0.4 [VERIFIED: npm registry] | UI-only state | Already installed; OK verdict |
| `@vueuse/core` | 14.3.0 [VERIFIED: npm registry] | Composition utilities (`useDebounce`, `useStorage`) | Already installed; OK verdict |
| `tailwindcss` + `@tailwindcss/vite` | 4.3.2 [CITED: package.json] | Utility-first styling | Already installed; CSS-first config |
| `@graphql-codegen/cli` | 7.1.3 [CITED: package.json] | Generate TS types + Vue Apollo composables | Already installed; schema-first contract |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@graphql-codegen/typescript-vue-apollo` | 5.0.1 [VERIFIED: npm registry] | Vue Apollo composable generation | Codegen plugin for typed `useXxxQuery`; OK verdict |
| `vue-tsc` | 3.3.6 [CITED: package.json] | SFC type-checking | CI type-check step |
| `vitest` | 3.2.6 [CITED: package.json] | Vue unit tests | Already installed |
| `@vue/test-utils` | 2.4.11 [CITED: package.json] | Vue component testing | Already installed |
| `playwright` | 1.61.1 [CITED: package.json] | E2E tests | Already installed |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `GraphQL::Dataloader` | `graphql-batch` (Shopify) | `graphql-batch` is promise-based and legacy; Dataloader is fiber-based, built-in, and the official graphql-ruby recommendation [CITED: graphql-ruby.org/dataloader/overview.html] |
| `Solid Cable` | Redis + `redis` cable adapter | Redis reintroduces an external service; Solid Cable is the Rails 8 default and sufficient for sync-status broadcasts [CITED: github.com/rails/solid_cable] |
| Client-side Fuse.js | Server-side Postgres `pg_trgm` | Server-side scales better past ~300 games, but CONTEXT.md defers it to v2; Fuse.js preserves v1 behavior |
| `graphql-ruby-client` ActionCableLink | Hand-rolled WebSocket link | graphql-ruby-client handles `X-Subscription-ID` and reconnection; don't hand-roll |

**Installation:**

```bash
# Ruby / Rails
eval "$(rbenv init - zsh)"
bundle add dry-rails
bin/rails solid_cable:install   # creates cable schema + config/cable.yml update if needed
bin/rails db:prepare

# JavaScript
npm install @rails/actioncable graphql-ruby-client fuse.js @vueuse/integrations
```

**Version verification:**

```bash
# Ruby gems
gem search '^dry-rails$' -r     # → dry-rails (0.7.0)
gem search '^solid_cable$' -r   # → solid_cable (4.0.0)

# npm packages
npm view @rails/actioncable version          # → 8.1.300
npm view graphql-ruby-client version         # → 1.15.1
npm view fuse.js version                     # → 7.4.2
npm view @vueuse/integrations version        # → 14.3.0
```

## Package Legitimacy Audit

> Run before emitting recommendations. `dry-rails` is a Ruby gem; `graphql-ruby-client` returned `SUS` (too-new) despite authoritative source and high downloads.

| Package | Registry | Age | Downloads | Source Repo | Verdict | Disposition |
|---------|----------|-----|-----------|-------------|---------|-------------|
| `dry-rails` | RubyGems | Dec 2022 | 909k total | github.com/dry-rb/dry-rails | OK (manual) | Approved — official dry-rb Rails integration, verified via `gem search` and RubyGems.org |
| `solid_cable` | RubyGems | pre-Rails 8 | default in Rails 8 | github.com/rails/solid_cable | OK | Already in Gemfile.lock |
| `@rails/actioncable` | npm | Mar 2026 | 1.7M/wk | github.com/rails/rails | OK | Approved |
| `graphql-ruby-client` | npm | Jun 2026 | 165k/wk | github.com/rmosolgo/graphql-ruby | SUS (too-new) | Flagged — planner adds `checkpoint:human-verify` before install; authoritative repo confirmed |
| `fuse.js` | npm | Jun 2026 | 10.2M/wk | github.com/krisk/Fuse | OK | Approved |
| `@vueuse/integrations` | npm | May 2026 | 2.1M/wk | github.com/vueuse/vueuse | OK | Approved |
| `@apollo/client` | npm | Jul 2026 | 6.4M/wk | github.com/apollographql/apollo-client | SUS (too-new) | Already installed in package.json; no new install needed |
| `graphql` (js) | npm | Jul 2026 | 38.7M/wk | github.com/graphql/graphql-js | SUS (too-new) | Already installed in package.json |
| `tailwindcss` | npm | Jun 2026 | 118M/wk | github.com/tailwindlabs/tailwindcss | SUS (too-new) | Already installed in package.json |
| `@graphql-codegen/cli` | npm | Jul 2026 | 6.4M/wk | github.com/dotansimha/graphql-code-generator | SUS (too-new) | Already installed in package.json |

**Packages removed due to [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** `graphql-ruby-client` — the npm legitimacy seam flagged it as "too-new" (published 2026-06-12). It is the official graphql-ruby JavaScript client (`rmosolgo/graphql-ruby`), so the flag is a recency artifact, but the planner should insert a `checkpoint:human-verify` before installing.

## Architecture Patterns

### System Architecture Diagram

```
[Browser]
   │
   │ HTTPS POST /graphql (Apollo batched queries)
   │ HTTPS WS /cable     (ActionCable subscription for collectionSynced)
   ▼
[Rails 8 API-only]
   ├── GraphqlController ──→ BoardgameNightSchema.execute / .multiplex
   │                         ├── Types::QueryType (mergedCollection, hotItems, search, user)
   │                         ├── Types::MutationType (importCollection, validateBggUsername)
   │                         ├── Types::SubscriptionType (collectionSynced)
   │                         └── GraphQL::Dataloader
   │                               ├── Loaders::OwnersLoader (thing_id → owners)
   │                               └── Loaders::UsersLoader (username → User)
   ├── app/contracts/ (dry-rails ApplicationContract)
   ├── app/services/bgg/ (Client, CollectionFetcher, CollectionPersister, Normalizer)
   └── app/jobs/bgg/import_collection_job.rb (Solid Queue, concurrency: 1)
           │
           ▼ broadcasts SyncStatus via Solid Cable
[Browser]
   ├── Apollo Client (InMemoryCache + split link: ActionCableLink / BatchHttpLink)
   ├── Pinia stores (UI-only: filters, sidebar, draft usernames)
   ├── Fuse.js search via @vueuse/integrations/useFuse
   └── Tailwind CSS responsive layout
```

### Recommended Project Structure Additions

```
app/
├── contracts/
│   ├── application_contract.rb
│   ├── import_collection_contract.rb
│   └── validate_bgg_username_contract.rb
├── graphql/
│   ├── boardgame_night_schema.rb
│   ├── loaders/
│   │   ├── owners_loader.rb          # batch owners per bgg_thing_id
│   │   └── users_loader.rb           # batch User by bgg_username
│   ├── mutations/
│   │   ├── base_mutation.rb
│   │   ├── import_collection.rb
│   │   └── validate_bgg_username.rb
│   ├── subscriptions/
│   │   ├── base_subscription.rb
│   │   └── collection_synced.rb
│   └── types/
│       ├── merged_collection_type.rb
│       ├── merged_thing_type.rb
│       ├── owner_type.rb
│       ├── sync_status_type.rb
│       ├── user_sync_status_type.rb
│       ├── hot_item_type.rb
│       ├── search_result_type.rb
│       ├── import_result_type.rb
│       ├── validation_result_type.rb
│       ├── query_type.rb
│       ├── mutation_type.rb
│       └── subscription_type.rb
├── jobs/bgg/import_collection_job.rb  # extend with broadcasts
├── services/bgg/collection_persister.rb  # persist statistics columns
└── frontend/
    ├── apollo/
    │   ├── client.ts                  # split link for subscriptions
    │   ├── queries/
    │   │   ├── merged_collection.graphql
    │   │   ├── hot_items.graphql
    │   │   └── user.graphql
    │   ├── mutations/
    │   │   ├── import_collection.graphql
    │   │   └── validate_bgg_username.graphql
    │   └── subscriptions/
    │       └── collection_synced.graphql
    ├── components/
    │   ├── layout/
    │   │   ├── AppShell.vue
    │   │   ├── Sidebar.vue
    │   │   ├── MobileDrawer.vue
    │   │   └── Navbar.vue
    │   ├── collection/
    │   │   ├── GameCard.vue
    │   │   ├── GameCardGrid.vue
    │   │   ├── Results.vue
    │   │   ├── SortBar.vue
    │   │   ├── FilterPanel.vue
    │   │   ├── CollapsibleGroup.vue
    │   │   └── ResultsSkeleton.vue
    │   └── common/
    │       ├── UsernameInput.vue
    │       ├── MemberAvatar.vue
    │       └── CopyLinkButton.vue
    ├── composables/
    │   ├── usePermalink.ts
    │   ├── useFilteredCollection.ts
    │   └── useMemberColors.ts
    ├── lib/
    │   ├── sorting.ts
    │   ├── grouping.ts
    │   ├── memberColors.ts
    │   └── permalink.ts
    ├── stores/
    │   ├── filters.ts
    │   └── ui.ts
    ├── views/
    │   ├── HomeView.vue
    │   ├── CollectionView.vue
    │   └── HotView.vue
    └── generated/
        └── operations.ts
```

### Pattern 1: GraphQL::Dataloader::Source for Batch Loading

**What:** `GraphQL::Dataloader::Source` subclasses collect all requested keys during query execution and fetch them in one batch. Use for owners per thing and users per username.

**When to use:** Any GraphQL field that would otherwise produce N+1 queries or lookups.

**Example:**

```ruby
# Source: graphql-ruby.org/dataloader/overview.html
class Loaders::OwnersLoader < GraphQL::Dataloader::Source
  def fetch(thing_ids)
    # Returns an array of owners arrays in the same order as thing_ids
    owners_by_thing_id = BggCollection
      .where(bgg_thing_id: thing_ids)
      .includes(:user)
      .group_by(&:bgg_thing_id)

    thing_ids.map { |id| owners_by_thing_id[id] || [] }
  end
end

# In MergedThingType
field :owners, [Types::OwnerType], null: false

def owners
  dataloader.with(Loaders::OwnersLoader).load(object.id)
end
```

### Pattern 2: Contract-First Mutation with dry-rails

**What:** Every mutation instantiates a `dry-rails` `ApplicationContract` subclass, validates/coerces input, and raises `GraphQL::ExecutionError` with validation errors on failure.

**When to use:** All mutations (`importCollection`, `validateBggUsername`, and every Phase 4 mutation).

**Example:**

```ruby
# Source: hanakai.org/learn/dry/dry-rails
class ApplicationContract < Dry::Rails::Contract
  config.messages.backend = :i18n
end

class ImportCollectionContract < ApplicationContract
  params do
    required(:username).filled(:string, max_size?: 50)
    optional(:force).value(:bool)
  end
end

# In mutation
class Mutations::ImportCollection < BaseMutation
  argument :username, String, required: true
  argument :force, Boolean, required: false, default_value: false

  field :success, Boolean, null: false
  field :job_id, String, null: true
  field :errors, Types::ValidationErrorsType, null: true

  def resolve(args)
    contract = ImportCollectionContract.new.call(args.to_h)
    if contract.failure?
      return { success: false, errors: contract.errors.to_h }
    end

    job = Bgg::ImportCollectionJob.perform_later(contract.values[:username])
    { success: true, job_id: job.job_id }
  end
end
```

### Pattern 3: Solid Cable Subscription for Sync Status

**What:** `collectionSynced(username: String!)` subscription broadcasts `SyncStatus` updates from `ImportCollectionJob`. Frontend uses Apollo `ActionCableLink` for subscriptions and HTTP link for queries/mutations.

**When to use:** Any time the UI needs real-time progress from a background job.

**Example:**

```ruby
# Source: graphql-ruby.org/subscriptions/subscription_classes.html
class Types::SubscriptionType < Types::BaseObject
  field :collection_synced, subscription: Subscriptions::CollectionSynced
end

class Subscriptions::CollectionSynced < Subscriptions::BaseSubscription
  argument :username, String, required: true
  field :username, String, null: false
  field :status, Types::SyncStatusEnum, null: false
  field :last_synced_at, GraphQL::Types::ISO8601DateTime, null: true
  field :error, String, null: true
end

# In ImportCollectionJob
def perform(username)
  broadcast(username, :SYNCING)
  # ... fetch + persist ...
  broadcast(username, :READY)
rescue => e
  broadcast(username, :ERROR, error: e.message)
end

private

def broadcast(username, status, error: nil)
  BoardgameNightSchema.subscriptions.trigger(
    :collection_synced,
    { username: username },
    { username: username, status: status, last_synced_at: Time.current, error: error }
  )
end
```

### Pattern 4: Apollo Split Link for Subscriptions

**What:** Route subscription operations to `ActionCableLink` and all other operations to `BatchHttpLink`.

**When to use:** When the frontend needs both HTTP GraphQL and ActionCable subscriptions.

**Example:**

```typescript
// Source: graphql-ruby.org/javascript_client/apollo_subscriptions.html
import { ApolloClient, ApolloLink, HttpLink, InMemoryCache, split } from '@apollo/client/core'
import { createConsumer } from '@rails/actioncable'
import ActionCableLink from 'graphql-ruby-client/subscriptions/ActionCableLink'

const cable = createConsumer('/cable')
const httpLink = new HttpLink({ uri: '/graphql', credentials: 'include' })
const actionCableLink = new ActionCableLink({ cable })

const isSubscription = ({ query: { definitions } }: any) =>
  definitions.some(
    (def: any) => def.kind === 'OperationDefinition' && def.operation === 'subscription'
  )

const link = split(isSubscription, actionCableLink, httpLink)

export const apolloClient = new ApolloClient({
  link,
  cache: new InMemoryCache(),
  connectToDevTools: import.meta.env.DEV,
})
```

### Pattern 5: Client-Side Fuse.js Search

**What:** Use `@vueuse/integrations/useFuse` to fuzzy-search the merged collection with the same keys/threshold/debounce as v1.

**When to use:** Search input in the collection sidebar.

**Example:**

```typescript
// Source: vueuse.org/integrations/useFuse
import { useFuse } from '@vueuse/integrations/useFuse'
import { computed } from 'vue'

const props = defineProps<{ games: MergedThing[] }>()
const searchQuery = defineModel<string>('searchQuery', { default: '' })

const { results } = useFuse(searchQuery, computed(() => props.games), {
  fuseOptions: {
    keys: ['name', 'name.text', 'originalname'],
    threshold: 0.3,
    isCaseSensitive: false,
  },
  matchAllWhenSearchEmpty: true,
})

const filteredGames = computed(() => results.value.map(r => r.item))
```

### Anti-Patterns to Avoid

- **N+1 owner lookups in `MergedThingType.owners`:** Always use `Loaders::OwnersLoader`; never query owners inside a per-item resolver loop.
- **Duplicating server data in Pinia:** Apollo `InMemoryCache` is the single source of server truth. Pinia holds only UI state (filters, sidebar open, draft usernames).
- **Synchronous BGG calls in resolvers:** `validateBggUsername` may call BGG live (it's fast), but `mergedCollection` must read from DB only and trigger background imports via mutation.
- **Rescuing `StandardError` in `GraphqlController`:** This turns `GraphQL::ExecutionError` into HTTP 500. Narrow the rescue to `GraphQL::ExecutionError` (return 200 with GraphQL errors) and log unexpected errors separately.
- **Manual WebSocket subscription handling:** Use `graphql-ruby-client` `ActionCableLink`; do not hand-roll cable subscription parsing.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Batch-loading associations | Custom memoization in resolvers | `GraphQL::Dataloader::Source` | Fiber-backed batching with per-query caching; official graphql-ruby API |
| GraphQL subscription transport | Raw WebSocket + message parsing | `graphql-ruby-client/subscriptions/ActionCableLink` | Handles `X-Subscription-ID`, reconnections, and Apollo integration |
| Fuzzy search | `String.includes` loop | `fuse.js` + `@vueuse/integrations/useFuse` | Tuned fuzzy matching, multi-key search, debounce already solved |
| Mutation input validation | `raise` checks in resolver | `dry-rails` `ApplicationContract` | Reusable, testable, coercion, i18n error messages |
| Permalink encode/decode | Manual string splitting | `URLSearchParams` | Handles encoding, arrays, defaults, edge cases |
| Sort/group utilities | Inline comparator functions | Port v1 `sorting.ts` / `grouping.ts` | Proven comparators; preserves v1 behavior |
| Member color assignment | Random colors per render | Port v1 `memberColors.ts` | Deterministic hash-to-palette gives consistent avatars |
| Responsive drawer | CSS-only show/hide without state | Vue conditional + Tailwind `md:` utilities | Accessible, testable, consistent breakpoint handling |

**Key insight:** The hard problems in this phase are integration boundaries (GraphQL Dataloader, Apollo subscriptions, contract validation). The UI logic is mostly a faithful port of the v1 reference app into Vue 3 + Tailwind. Don't rebuild solved integration pieces.

## Common Pitfalls

### Pitfall 1: `GraphqlController` Rescues `GraphQL::ExecutionError` as HTTP 500

**What goes wrong:** The current `GraphqlController#execute` rescues `StandardError` and renders HTTP 500 with `"Internal server error"`. Validation errors raised by contracts appear as opaque 500s instead of GraphQL `errors` arrays.

**Why it happens:** GraphQL execution errors are expected business failures and should return HTTP 200 with `{ errors: [...] }`. Only unexpected server errors should be HTTP 500.

**How to avoid:** Rescue `GraphQL::ExecutionError` separately, returning `{ errors: [{ message: e.message, extensions: e.extensions }] }` with status 200. Let other exceptions bubble to Rails error reporting (or rescue narrowly and log).

**Warning signs:** Apollo receives `500 Internal server error` for validation failures; frontend can't show field-level errors.

### Pitfall 2: Two `ImportCollectionJob` Classes Diverge

**What goes wrong:** `app/jobs/import_collection_job.rb` and `app/jobs/bgg/import_collection_job.rb` both exist. The duplicate can run instead of the namespaced one, bypassing subscription broadcasts or retry policy.

**Why it happens:** Phase 2 created both; Phase 3 needs a single canonical job.

**How to avoid:** Delete `app/jobs/import_collection_job.rb` and update any callers to `Bgg::ImportCollectionJob`. Add subscription broadcast points inside `Bgg::ImportCollectionJob` only.

### Pitfall 3: Solid Cable Schema Missing

**What goes wrong:** `db/cable_schema.rb` is empty. `solid_cable` is configured in production but the messages table hasn't been created.

**Why it happens:** Rails 8 includes `solid_cable` in the Gemfile but `bin/rails solid_cable:install` hasn't run.

**How to avoid:** Run `bin/rails solid_cable:install` then `bin/rails db:prepare`. Verify `db/cable_schema.rb` contains a `solid_cable_messages` table.

### Pitfall 4: Owner Display Uses `User#username` Instead of `User#bgg_username`

**What goes wrong:** The v1 merge experience shows BGG usernames as owners. `User#username` is the app account name; a user might have `username: "alice"` and `bgg_username: "bggalice"`. Owner badges and status cards would show the wrong name.

**Why it happens:** Model has two username fields; Phase 4 auth needs app usernames, but Phase 3 collection surface needs BGG usernames.

**How to avoid:** GraphQL `OwnerType` and `UserSyncStatusType` expose `bgg_username`. `UserType` can expose both. Look up local users by `bgg_username` in `ImportCollectionJob` and `Loaders::UsersLoader`.

### Pitfall 5: `BggThing.merged_for_users` Takes User IDs But Query Receives BGG Usernames

**What goes wrong:** The existing scope expects `user_ids`, but `mergedCollection(usernames:)` receives BGG usernames.

**Why it happens:** Phase 2 scope was designed around `user_id`; Phase 3 query args are BGG usernames.

**How to avoid:** Add `BggThing.merged_for_bgg_usernames(bgg_usernames)` that joins through `bgg_collections` → `users` and filters on `users.bgg_username IN (...)`. Use `Loaders::UsersLoader` to resolve each username to a `User` only if needed (e.g., for `avatar`).

### Pitfall 6: Statistics Columns Not Persisted

**What goes wrong:** `ThingType` exposes `average`, `bayesAverage`, etc., but `BggThing` has no such columns and `CollectionPersister` doesn't write them. All games appear unrated.

**Why it happens:** Phase 2 `Bgg::Normalizer` produces stats; Phase 2 persister ignored them.

**How to avoid:** Migration to add `average`, `bayes_average`, `users_rated`, `average_weight`, `num_comments` (decimal/integer) to `bgg_things`; update `Bgg::CollectionPersister#upsert_thing!` to assign them.

### Pitfall 7: Client-Side Fuse.js on Large Collections

**What goes wrong:** Fuse.js over 500+ games causes UI jank.

**Why it happens:** v1 used Fuse.js client-side for small collections. CONTEXT.md explicitly defers server-side search to v2, but a user could paste 10 large collections.

**How to avoid:** Keep Fuse.js for v1 friend groups (3–10 users, ~200 games each) per CONTEXT.md. Add a performance note/telemetry; if collections exceed ~300 games, defer to Phase 5 server-side search.

### Pitfall 8: Subscription Scope Mismatch

**What goes wrong:** Multiple users subscribe to `collectionSynced(username: "alice")`; broadcasts intended for one client reach all.

**Why it happens:** `GraphQL::Schema.subscriptions.trigger` routes by arguments by default. If subscription args don't include a unique scope, updates may leak.

**How to avoid:** Use argument-based scoping (`username` in the subscription args) so each subscriber only receives updates for the usernames they requested. No `subscription_scope` needed for this use case.

## Code Examples

### GraphQL Dataloader Owner Loader

```ruby
# Source: graphql-ruby.org/dataloader/overview.html
class Loaders::OwnersLoader < GraphQL::Dataloader::Source
  def fetch(thing_ids)
    collections = BggCollection
      .where(bgg_thing_id: thing_ids)
      .includes(:user)
      .group_by(&:bgg_thing_id)

    thing_ids.map { |id| collections[id] || [] }
  end
end
```

### Apollo Client Split Link with ActionCable

```typescript
// Source: graphql-ruby.org/javascript_client/apollo_subscriptions.html
import { ApolloClient, ApolloLink, HttpLink, InMemoryCache, split } from '@apollo/client/core'
import { createConsumer } from '@rails/actioncable'
import ActionCableLink from 'graphql-ruby-client/subscriptions/ActionCableLink'

const cable = createConsumer('/cable')
const httpLink = new HttpLink({ uri: '/graphql', credentials: 'include' })
const actionCableLink = new ActionCableLink({ cable })

const isSubscription = ({ query: { definitions } }: any) =>
  definitions.some(
    (def: any) => def.kind === 'OperationDefinition' && def.operation === 'subscription'
  )

export const apolloClient = new ApolloClient({
  link: split(isSubscription, actionCableLink, httpLink),
  cache: new InMemoryCache(),
  connectToDevTools: import.meta.env.DEV,
})
```

### VueUse Fuse Search Composable

```typescript
// Source: vueuse.org/integrations/useFuse
import { useFuse } from '@vueuse/integrations/useFuse'
import { computed, ref } from 'vue'

const search = ref('')
const games = ref<MergedThing[]>([])

const { results } = useFuse(search, games, {
  fuseOptions: {
    keys: ['name', 'name.text', 'originalname'],
    threshold: 0.3,
  },
  matchAllWhenSearchEmpty: true,
})
```

### Permalink Encode/Decode with URLSearchParams

```typescript
// Source: bggeek-shared-list/src/utils/permalink.ts (adapted)
export function encodePermalink(usernames: string[], filters: Filters): string {
  const params = new URLSearchParams()
  if (usernames.length) params.set('usernames', usernames.join(','))
  if (filters.players) params.set('players', String(filters.players))
  if (filters.time) params.set('time', String(filters.time))
  if (filters.complexity) params.set('complexity', filters.complexity)
  if (filters.sort && filters.sort !== 'name_asc') params.set('sort', filters.sort)
  if (filters.group && filters.group !== 'none') params.set('group', filters.group)
  if (filters.owners.length) params.set('owners', filters.owners.join(','))
  return `/collection?${params.toString()}`
}

export function decodePermalink(params: URLSearchParams): { usernames: string[]; filters: Filters } {
  return {
    usernames: params.get('usernames')?.split(',').filter(Boolean) || [],
    filters: {
      players: Number(params.get('players')) || null,
      time: Number(params.get('time')) || null,
      complexity: params.get('complexity') || null,
      sort: params.get('sort') || 'name_asc',
      group: params.get('group') || 'none',
      owners: params.get('owners')?.split(',').filter(Boolean) || [],
    },
  }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `graphql-batch` (Shopify) | `GraphQL::Dataloader` (built-in) | graphql-ruby 1.10+ | Fiber-based, built-in, official recommendation |
| Apollo Client RESTDataSource + Redis | Rails `Bgg::Client` + Solid Cache | Phase 2 | Removes Node/serverless-specific workarounds |
| Redis ActionCable adapter | `solid_cable` (DB-backed) | Rails 8 default | No Redis dependency for subscriptions |
| v1 hardcoded 2-user merge | N-user merge via `mergedCollection(usernames: [String!]!)` | Phase 3 | Removes v1 ceiling; supports friend groups later |
| v1 best-players heuristic | Still heuristic for v1; BGG poll data deferred to v2 | Phase 3 vs Phase 5 | Preserves v1 parity now; upgrades later |
| v1 `/u/:usernames` route | `/collection?usernames=` query params | Phase 3 | Simpler routing; full filter state in URL |

**Deprecated/outdated:**
- `graphql-batch`: legacy promise-based batching; use `GraphQL::Dataloader`.
- `@apollo/client` v4 + `@vue/apollo-composable` v5 beta: incompatible as of mid-2026; stay on Apollo 3.14.x + composable 4.2.2.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `solid_cable` 4.0.0 (already in Gemfile.lock) can be enabled with `bin/rails solid_cable:install` + `db:prepare` | Standard Stack, Environment | If install fails, subscription feature is blocked |
| A2 | `@vue/apollo-composable` 4.2.2 is compatible with `@apollo/client` 3.14.1 (both already installed) | Standard Stack | Already used in `HealthView.vue`; low risk |
| A3 | `graphql-ruby-client` 1.15.1 is the correct Apollo 3 ActionCable link | Standard Stack | If incompatible, subscription link breaks; flagged as SUS for human verify |
| A4 | `Bgg::Normalizer` already emits `average`, `bayes_average`, `users_rated`, `average_weight`, `num_comments` keys | Standard Stack, Pitfall 6 | If keys differ, persister must be adjusted |
| A5 | v1 reference `filterByNumPlayers` and `filterByPlayingTime` logic should be ported verbatim | Phase Requirements | If thresholds differ, v1 parity is broken |
| A6 | Client-side Fuse.js remains acceptable for v1 friend-group sizes | Architecture Patterns | If a user loads very large collections, UI may jank; deferred to v2 |

**If this table is empty:** All claims in this research were verified or cited — no user confirmation needed.

## Open Questions (RESOLVED)

1. **RESOLVED: Does `User` need a `bgg_avatar_url` column for `UserType.avatar`?**
    - What we know: `UserType` per D-05 has `avatar`. BGG `/user` endpoint returns an avatar URL.
    - Resolution: Plan 03-01 Task 1 adds `bgg_avatar_url` to `users` via migration; Plan 03-02 Task 2 persists it during `validateBggUsername` / import job. See ADR-005 (async import pipeline) and ADR-006 (Apollo normalized cache for user data).

2. **RESOLVED: What is the exact shape of statistics fields returned by `Bgg::Normalizer`?**
    - What we know: `CollectionPersister` currently assigns from `item[:stats]`. D-03 lists `average`, `bayes_average`, `users_rated`, `average_weight`, `num_comments`.
    - Resolution: Plan 03-01 Task 1 inspects `app/services/bgg/normalizer.rb`, maps the collection XML rating-block keys `:users_rated`, `:average`, `:bayes_average`, `:average_weight`, and `:num_comments` under `item[:stats]`, and updates the persister accordingly. See ADR-005 (async import pipeline).

3. **RESOLVED: Should `validateBggUsername` cache/persist the BGG user record?**
    - What we know: The mutation validates inline. For repeated validation, a cache would reduce BGG calls.
    - Resolution: Plan 03-02 Task 2 calls `Bgg::Client#user` live with BGG HTTP-level caching (30 min TTL implied by `Faraday`/`Rails.cache`); no DB persistence of the validation lookup is needed for v1 because the avatar column is persisted only during the import job. See ADR-007 (dry-rails validation contracts).

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Ruby (rbenv) | Rails backend | ✓ | 3.4.9 | system Ruby 4.0.5 (not recommended) |
| Node.js | Vite/Vue build | ✓ | v20.20.2 | — |
| npm | package install | ✓ | 10.8.2 | — |
| Bundler | Ruby gems | ✓ | via rbenv | — |
| Docker | Kamal deploy / CI | ✓ | 29.5.3 | — |
| PostgreSQL | optional scaling DB | ✓ | 18.4 (client) | SQLite (default, already configured) |
| Redis | none (by design) | ✗ | — | Solid Queue + Solid Cable (no Redis) |
| Kamal CLI | deployment | ✓ | 2.12.0 (via rbenv shim) | — |

**Missing dependencies with no fallback:**
- none

**Missing dependencies with fallback:**
- none

## Security Domain

> `security_enforcement` is enabled in `.planning/config.json` (ASVS Level 1).

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | No user auth in this phase (Phase 4) |
| V3 Session Management | no | No sessions in this phase |
| V4 Access Control | no | Collections are public BGG data; no private data exposed yet |
| V5 Input Validation | yes | `dry-rails` `ApplicationContract` for all mutation args; GraphQL arg types |
| V6 Cryptography | no | No crypto operations in this phase |
| V7 Error Handling | yes | Narrow rescue in `GraphqlController`; don't leak backtraces in production |
| V8 Data Protection | yes | BGG credentials stay server-side; `.env.bggeek` not exposed to frontend |
| V12 File Upload | no | No uploads |

### Known Threat Patterns for the Stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| GraphQL query depth/complexity abuse | Denial of Service | `max_depth 15`, `max_complexity 400` already in `BoardgameNightSchema`; no expensive nested fields exposed in v1 |
| GraphQL introspection in production | Information Disclosure | `disable_introspection_entry_points unless Rails.env.development? || Rails.env.test?` already set |
| BGG credentials leaked to browser | Information Disclosure | BGG token loaded server-side from `.env.bggeek`; never sent to Vue |
| Open BGG proxy via GraphQL | Information Disclosure / Abuse | v1 data is public; still rate-limit GraphQL endpoint with Rack::Attack if adding auth in Phase 4 |
| XSS via BGG description HTML | Cross-Site Scripting | Render descriptions as text (`{{ }}`) or sanitize server-side; never `v-html` raw BGG HTML |
| Subscription scope leakage | Information Disclosure | Subscribe with `username` argument; `trigger` uses matching args so updates route only to interested subscribers |

## Sources

### Primary (HIGH confidence)
- `graphql-ruby.org/dataloader/overview.html` — `GraphQL::Dataloader`, `Source#fetch`, `dataloader.with(...).load(...)`.
- `graphql-ruby.org/subscriptions/subscription_classes.html` — subscription classes, `subscribe`/`update`, `NO_UPDATE`, `trigger`.
- `graphql-ruby.org/subscriptions/action_cable_implementation.html` — ActionCable as transport.
- `graphql-ruby.org/javascript_client/apollo_subscriptions.html` — Apollo `split` link + `ActionCableLink`.
- `hanakai.org/learn/dry/dry-rails` — `ApplicationContract`, auto-registration, container setup.
- `vueuse.org/integrations/useFuse` — `useFuse` API, Fuse.js options.
- `github.com/rails/solid_cable` — installation, `config/cable.yml`, DB-backed adapter.

### Secondary (MEDIUM confidence)
- `bggeek-shared-list/src/utils/{sorting.ts,grouping.ts,memberColors.ts,permalink.ts,search.ts}` — v1 logic to port.
- `bggeek-shared-list/src/components/{GameCard.tsx,Results.tsx,ImprovedSearchSidebar.tsx}` — v1 UI patterns.
- `bgg-graphql-proxy/src/schema/schema.graphql` — reference GraphQL contract to adapt.
- Project files: `Gemfile.lock`, `package.json`, `app/graphql/boardgame_night_schema.rb`, `app/services/bgg/collection_persister.rb`, `app/jobs/bgg/import_collection_job.rb`.

### Tertiary (LOW confidence)
- None. All Phase 3 recommendations are grounded in existing project research (`STACK.md`, `ARCHITECTURE.md`, `PITFALLS.md`, `FEATURES.md`) or official docs fetched in this session.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — versions verified against npm/RubyGems; Apollo 3 path already installed; only `graphql-ruby-client` flagged for human verification.
- Architecture: HIGH — Dataloader, Solid Cable, dry-rails, and Apollo subscriptions patterns are all documented official approaches.
- Pitfalls: HIGH — derived from current codebase inspection plus project `PITFALLS.md`.

**Research date:** 2026-07-07
**Valid until:** 2026-08-07 (stable stack; revisit if Apollo 4 / composable v5 stabilizes)
