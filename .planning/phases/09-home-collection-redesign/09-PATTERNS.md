# Phase 09: Home & Collection Redesign - Pattern Map

**Mapped:** 2026-07-15
**Files analyzed:** 42
**Analogs found:** 38 / 42

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `app/graphql/types/dashboard_stats_type.rb` | GraphQL type | request-response | `app/graphql/types/user_type.rb` | role-match |
| `app/graphql/types/query_type.rb` | GraphQL resolver | request-response | `app/graphql/types/query_type.rb` (self) | self — add field |
| `app/graphql/loaders/hot_item_thing_loader.rb` | Dataloader | batch | `app/graphql/loaders/owners_loader.rb` | exact |
| `app/graphql/types/hot_item_type.rb` | GraphQL type | request-response | `app/graphql/types/hot_item_type.rb` (self) | self — extend |
| `app/graphql/loaders/last_played_at_loader.rb` | Dataloader | batch | `app/graphql/loaders/polls_loader.rb` | role-match |
| `app/graphql/types/thing_fields.rb` | GraphQL mixin | request-response | `app/graphql/types/thing_fields.rb` (self) | self — add field |
| `app/graphql/types/merged_thing_type.rb` | GraphQL type | request-response | `app/graphql/types/merged_thing_type.rb` (self) | self — inherits field |
| `app/graphql/types/group_type.rb` | GraphQL resolver | request-response | `app/graphql/types/group_type.rb` (self) | self — set context |
| `app/frontend/apollo/queries/dashboard_stats.graphql` | GraphQL query | request-response | `app/frontend/apollo/queries/current_user.graphql` | role-match |
| `app/frontend/apollo/queries/hot_items.graphql` | GraphQL query | request-response | `app/frontend/apollo/queries/hot_items.graphql` (self) | self — extend |
| `app/frontend/apollo/queries/merged_collection.graphql` | GraphQL query | request-response | `app/frontend/apollo/queries/merged_collection.graphql` (self) | self — extend |
| `app/frontend/apollo/queries/group_collection.graphql` | GraphQL query | request-response | `app/frontend/apollo/queries/group_collection.graphql` (self) | self — extend |
| `app/frontend/views/HomeView.vue` | view | request-response | `app/frontend/views/HomeView.vue` (self) | self — rewrite layout |
| `app/frontend/components/landing/HomeHero.vue` | component | request-response | `app/frontend/components/landing/UsernameForm.vue` | exact |
| `app/frontend/components/landing/StatsCard.vue` | component | request-response | `app/frontend/components/group/GroupCollectionSpotlight.vue` card block | partial |
| `app/frontend/components/landing/TrendingGames.vue` | component | request-response | `app/frontend/components/landing/HotList.vue` | exact |
| `app/frontend/components/landing/TrendingGameCard.vue` | component | request-response | `app/frontend/components/group/GroupCollectionSpotlight.vue` spotlight card | exact |
| `app/frontend/views/HotView.vue` | view | request-response | `app/frontend/views/HotView.vue` (self) | self — reuse card |
| `app/frontend/stores/filters.ts` | Pinia store | state transform | `app/frontend/stores/filters.ts` (self) | self — migrate shape |
| `app/frontend/composables/usePermalink.ts` | composable | state transform | `app/frontend/composables/usePermalink.ts` (self) | self — extend |
| `app/frontend/composables/useCollectionFilters.ts` | composable | state transform | `app/frontend/composables/useCollectionFilters.ts` (self) | self — extend |
| `app/frontend/utils/sorting.ts` | utility | state transform | `app/frontend/utils/sorting.ts` (self) | self — reduce options |
| `app/frontend/components/collection/CollectionFilterPanel.vue` | component | state transform | `app/frontend/components/collection/CollectionFilters.vue` | exact |
| `app/frontend/components/collection/PlayerRangeSlider.vue` | component | state transform | `app/frontend/components/ui/slider/` (to add) | no analog |
| `app/frontend/components/collection/TimeBucketCheckboxes.vue` | component | state transform | `app/frontend/components/ui/checkbox/Checkbox.vue` | role-match |
| `app/frontend/components/collection/ComplexityToggleGroup.vue` | component | state transform | `app/frontend/components/ui/toggle-group/` (to add) | no analog |
| `app/frontend/components/collection/OwnerAvatarToggles.vue` | component | state transform | `app/frontend/components/layout/CollectorsSection.vue` | partial |
| `app/frontend/components/collection/ViewModeToggle.vue` | component | state transform | `app/frontend/components/collection/GroupByToggle.vue` | role-match |
| `app/frontend/components/collection/ActiveFilterChips.vue` | component | state transform | `app/frontend/components/collection/CollectionFilters.vue` chips | partial |
| `app/frontend/components/collection/SortControl.vue` | component | state transform | `app/frontend/components/collection/SortControl.vue` (self) | self — replace select |
| `app/frontend/components/collection/GroupByToggle.vue` | component | state transform | `app/frontend/components/collection/GroupByToggle.vue` (self) | self — replace select |
| `app/frontend/components/collection/GameCard.vue` | component | request-response | `app/frontend/components/collection/GameCard.vue` (self) | self — add variants |
| `app/frontend/components/collection/GameGrid.vue` | component | request-response | `app/frontend/components/collection/GameGrid.vue` (self) | self — add view/list |
| `app/frontend/components/collection/ResultsSkeleton.vue` | component | request-response | `app/frontend/components/collection/ResultsSkeleton.vue` (self) | self — add variant |
| `app/frontend/components/collection/EmptyState.vue` | component | request-response | `app/frontend/components/collection/EmptyState.vue` (self) | self — copy updates |
| `app/frontend/components/ui/slider/Slider.vue` | UI primitive | event-driven | shadcn-vue/reka-ui Slider (to scaffold) | no analog |
| `app/frontend/components/ui/toggle-group/ToggleGroup.vue` | UI primitive | event-driven | shadcn-vue/reka-ui ToggleGroup (to scaffold) | no analog |
| `app/frontend/views/CollectionView.vue` | view | request-response | `app/frontend/views/CollectionView.vue` (self) | self — add workspace |
| `spec/graphql/dashboard_stats_query_spec.rb` | test | request-response | `spec/graphql/merged_collection_query_spec.rb` | role-match |
| `spec/graphql/loaders/hot_item_thing_loader_spec.rb` | test | batch | `spec/graphql/loaders/owners_loader_spec.rb` | exact |
| `spec/graphql/loaders/last_played_at_loader_spec.rb` | test | batch | `spec/graphql/loaders/polls_loader_spec.rb` | role-match |
| `spec/frontend/usePermalink.spec.ts` | test | state transform | `spec/frontend/usePermalink.spec.ts` (self) | self — extend |
| `spec/frontend/useCollectionFilters.spec.ts` | test | state transform | `spec/frontend/useCollectionFilters.spec.ts` (self) | self — extend |
| `spec/frontend/filters.spec.ts` | test | state transform | `spec/frontend/filters.spec.ts` (self) | self — extend |
| `spec/frontend/CollectionView.spec.ts` | test | request-response | `spec/frontend/CollectionView.spec.ts` (self) | self — extend |
| `tests/e2e/collection.spec.ts` | E2E test | request-response | `tests/e2e/collection.spec.ts` (self) | self — update selectors |
| `tests/e2e/home.spec.ts` | E2E test | request-response | `tests/e2e/shell.spec.ts` | role-match |

---

## Pattern Assignments

### `app/graphql/types/dashboard_stats_type.rb` (GraphQL type, request-response)

**Analog:** `app/graphql/types/user_type.rb` (scalar fields) / `app/graphql/types/user_sync_status_type.rb` (struct-like return type)

**Imports / type declaration pattern** (from `app/graphql/types/user_sync_status_type.rb` style):
```ruby
# frozen_string_literal: true

module Types
  class UserSyncStatusType < Types::BaseObject
    field :username, String, null: false
    field :status, Types::SyncStatusEnum, null: false
    field :last_synced_at, GraphQL::Types::ISO8601DateTime, null: true
    field :error, String, null: true
    field :game_count, Integer, null: true
  end
end
```

**Core pattern:** dedicated nullable root return type (from `09-RESEARCH.md` §Dashboard Stats):
```ruby
module Types
  class DashboardStatsType < Types::BaseObject
    field :collection_count, Integer, null: false
    field :group_count, Integer, null: false
    field :session_count, Integer, null: false
  end
end
```

**Auth pattern:** root field returns `null` when `context[:current_user]` is absent; resolver only counts the authenticated user's records.

---

### `app/graphql/types/query_type.rb` (GraphQL resolver, request-response)

**Analog:** `app/graphql/types/query_type.rb` (existing `current_user` and `merged_collection` resolvers)

**Imports / field declaration pattern** (lines 18-25):
```ruby
field :hot_items, [ Types::HotItemType ], null: false, description: "The current BoardGameGeek hotness list."
field :current_user, Types::UserType, null: true, description: "The currently authenticated user, or null."
```

**Core pattern: add new root field and set last-played context** (from `09-RESEARCH.md` §GraphQL Additions):
```ruby
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

**Context-setting pattern for last-played** (from `09-RESEARCH.md` §Recently Played Metadata):
```ruby
def merged_collection(usernames:)
  context[:last_played_scope_type] = :user
  context[:last_played_scope_id] = context[:current_user]&.id
  # ... existing return ...
end
```

**Error handling:** return `nil` for unauthenticated dashboard stats; do not raise.

---

### `app/graphql/loaders/hot_item_thing_loader.rb` (Dataloader, batch)

**Analog:** `app/graphql/loaders/owners_loader.rb` (exact `GraphQL::Dataloader::Source` pattern)

**Imports / loader pattern** (from `app/graphql/loaders/owners_loader.rb` lines 1-18):
```ruby
# frozen_string_literal: true

module Loaders
  class OwnersLoader < GraphQL::Dataloader::Source
    def initialize(user_ids = nil)
      super()
      @user_ids = user_ids
    end

    def fetch(thing_ids)
      collections = BggCollection.where(bgg_thing_id: thing_ids)
      collections = collections.where(user_id: @user_ids) if @user_ids
      collections = collections.includes(:user).group_by(&:bgg_thing_id)

      thing_ids.map { |id| collections[id] || [] }
    end
  end
end
```

**Core pattern:** batch by `objectid` and return in input order (from `09-RESEARCH.md`):
```ruby
module Loaders
  class HotItemThingLoader < GraphQL::Dataloader::Source
    def fetch(objectids)
      things = BggThing.where(objectid: objectids.map(&:to_i)).index_by(&:objectid)
      objectids.map { |id| things[id.to_i] }
    end
  end
end
```

**Hazard:** never call `Bgg::Client` live inside the type; this loader is the only enrichment path.

---

### `app/graphql/types/hot_item_type.rb` (GraphQL type, request-response)

**Analog:** `app/graphql/types/hot_item_type.rb` (self) + `app/graphql/types/thing_fields.rb` (dataloader field pattern)

**Imports / field pattern** (from self, lines 1-11):
```ruby
module Types
  class HotItemType < Types::BaseObject
    field :id, ID, null: false, description: "BGG thing ID for this hot item."
    field :rank, Integer, null: false, description: "Rank on the BGG hotness list."
    field :name, String, null: false, description: "Primary name of the game."
    field :year_published, Integer, null: true, description: "Year the game was published."
    field :thumbnail, String, null: true, description: "Thumbnail image URL."
  end
end
```

**Core pattern: enrichment via dataloader** (from `09-RESEARCH.md`):
```ruby
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
# ... etc
```

**Error handling:** missing `BggThing` returns `nil` for all enrichment fields; UI renders `—` fallback.

---

### `app/graphql/loaders/last_played_at_loader.rb` (Dataloader, batch)

**Analog:** `app/graphql/loaders/polls_loader.rb` (single-query aggregation by foreign key)

**Imports / loader pattern** (from `app/graphql/loaders/polls_loader.rb` lines 1-14):
```ruby
module Loaders
  class PollsLoader < GraphQL::Dataloader::Source
    def fetch(thing_ids)
      polls = BggPoll
        .where(bgg_thing_id: thing_ids)
        .includes(:bgg_poll_results)
        .group_by(&:bgg_thing_id)

      thing_ids.map { |id| polls[id] || [] }
    end
  end
end
```

**Core pattern:** scoped `NightSession` aggregation with `group(:picked_game_id).maximum(...)` (from `09-RESEARCH.md`):
```ruby
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

**Hazard:** scope must be set by parent resolver; loader returns `nil` for all items if no scope is provided.

---

### `app/graphql/types/thing_fields.rb` (GraphQL mixin, request-response)

**Analog:** `app/graphql/types/thing_fields.rb` (self) `polls` field using `Loaders::PollsLoader`

**Imports / included block pattern** (lines 7-31):
```ruby
included do
  field :id, GraphQL::Types::ID, null: false
  # ... existing fields ...
  field :polls, [ Types::PollType ], null: false
end

def polls
  dataloader.with(Loaders::PollsLoader).load(object.id)
end
```

**Core pattern: add `last_played_at` field** (from `09-RESEARCH.md`):
```ruby
field :last_played_at, GraphQL::Types::ISO8601DateTime, null: true

def last_played_at
  scope_type = context[:last_played_scope_type]
  scope_id = context[:last_played_scope_id]
  return nil unless scope_type && scope_id

  dataloader.with(Loaders::LastPlayedAtLoader, scope_type, scope_id).load(object.id)
end
```

**Hazard:** this field is added to the shared mixin; both `MergedThing` and `GroupSpotlightThing` (if it includes `ThingFields`) will expose it. Ensure `MergedThingType` includes `ThingFields` already.

---

### `app/graphql/types/merged_thing_type.rb` (GraphQL type, request-response)

**Analog:** `app/graphql/types/merged_thing_type.rb` (self)

**Imports / include pattern** (lines 1-13):
```ruby
module Types
  class MergedThingType < Types::BaseObject
    include Types::ThingFields

    field :owners, [Types::OwnerType], null: false

    def owners
      dataloader.with(Loaders::OwnersLoader).load(object.id)
    end
  end
end
```

**Core pattern:** `last_played_at` is inherited from `ThingFields`; no new code needed here. Verify `MergedThingType` includes `ThingFields`.

---

### `app/graphql/types/group_type.rb` (GraphQL resolver, request-response)

**Analog:** `app/graphql/types/group_type.rb` (self) `collection` resolver

**Core pattern: set last-played scope before returning collection** (from `09-RESEARCH.md`):
```ruby
def collection
  return { items: [], sync_statuses: [] } unless viewer_role

  context[:last_played_scope_type] = :group
  context[:last_played_scope_id] = object.id

  {
    items: BggThing.merged_for_users(object.member_ids),
    sync_statuses: object.members.map { |user| sync_status_for(user) }
  }
end
```

**Hazard:** `viewer_role` check must happen before scope is set so unauthorized group access returns empty collection with no history metadata.

---

### `app/frontend/apollo/queries/dashboard_stats.graphql` (GraphQL query, request-response)

**Analog:** `app/frontend/apollo/queries/current_user.graphql` (simple no-arg authenticated query)

**Current user query pattern** (from `app/frontend/apollo/queries/current_user.graphql`):
```graphql
query CurrentUser {
  currentUser {
    id
    username
    displayName
    email
    isProvisional
    bggUsername
  }
}
```

**Core pattern:**
```graphql
query DashboardStats {
  dashboardStats {
    collectionCount
    groupCount
    sessionCount
  }
}
```

**Error handling:** query returns `null` when signed out; render sign-in prompt instead of zeroes.

---

### `app/frontend/apollo/queries/hot_items.graphql` (GraphQL query, request-response)

**Analog:** `app/frontend/apollo/queries/hot_items.graphql` (self)

**Current query** (lines 1-9):
```graphql
query HotItems {
  hotItems {
    id
    rank
    name
    yearPublished
    thumbnail
  }
}
```

**Core pattern: extend with enrichment fields** (from `09-RESEARCH.md`):
```graphql
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

**Workflow note:** run `bin/rails graphql:schema:dump` then `npm run codegen` after editing.

---

### `app/frontend/apollo/queries/merged_collection.graphql` (GraphQL query, request-response)

**Analog:** `app/frontend/apollo/queries/merged_collection.graphql` (self)

**Current query** (lines 1-33):
```graphql
query MergedCollection($usernames: [String!]!) {
  mergedCollection(usernames: $usernames) {
    items {
      id
      name
      yearPublished
      minPlayers
      maxPlayers
      minPlaytime
      maxPlaytime
      minAge
      image
      thumbnail
      description
      average
      bayesAverage
      usersRated
      averageWeight
      isExpansion
      owners { bggUsername avatar }
    }
    syncStatuses { ... }
  }
}
```

**Core pattern: add `lastPlayedAt`** (from `09-RESEARCH.md`):
```graphql
items {
  ...existingThingFields
  lastPlayedAt
}
```

**Hazard:** ensure `description` is already requested; cards will render it as plain text (no `v-html`).

---

### `app/frontend/apollo/queries/group_collection.graphql` (GraphQL query, request-response)

**Analog:** `app/frontend/apollo/queries/group_collection.graphql` (self)

**Current query** (lines 1-54): requests a subset of thing fields for group items.

**Core pattern: add `lastPlayedAt` and full description fields**:
```graphql
collection {
  items {
    id
    name
    thumbnail
    yearPublished
    minPlayers
    maxPlayers
    minPlaytime
    maxPlaytime
    average
    averageWeight
    description
    lastPlayedAt
    owners { bggUsername avatar }
  }
  syncStatuses { ... }
}
```

---

### `app/frontend/views/HomeView.vue` (view, request-response)

**Analog:** `app/frontend/views/HomeView.vue` (self) + `app/frontend/views/GroupView.vue` (dashboard layout pattern from Phase 8)

**Current pattern** (lines 1-23):
```vue
<script setup lang="ts">
import UsernameForm from '../components/landing/UsernameForm.vue'
import HotList from '../components/landing/HotList.vue'
</script>

<template>
  <div class="max-w-3xl mx-auto px-4 py-8 md:py-12 space-y-12">
    <section class="text-center space-y-4">
      <h1 class="text-3xl md:text-4xl font-bold text-neutral-900">Find the perfect game...</h1>
    </section>
    <section class="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
      <UsernameForm />
    </section>
    <HotList />
  </div>
</template>
```

**Core pattern: dashboard layout** (from `09-UI-SPEC.md` §Home Dashboard Layout):
```vue
<template>
  <div class="p-4 md:p-6 space-y-6">
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <div class="lg:col-span-8">
        <HomeHero />
      </div>
      <div class="lg:col-span-4">
        <StatsCard />
      </div>
    </div>

    <TrendingGames />
  </div>
</template>
```

**Hazard:** mobile source order must be hero → stats → trending. Use `grid` with source order matching mobile; do not use `order-*` utilities that break tab order.

---

### `app/frontend/components/landing/HomeHero.vue` (component, request-response)

**Analog:** `app/frontend/components/landing/UsernameForm.vue` (exact logic to preserve)

**Imports / validation pattern** (from `UsernameForm.vue` lines 1-76):
```vue
<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useDebounceFn } from '@vueuse/core'
import { useValidateBggUsernameMutation, useSearchLazyQuery } from '../../generated/operations'
import { useCollectorsStore } from '@/stores/collectors'

const router = useRouter()
const store = useCollectorsStore()

const usernameInput = ref('')
const searchInput = ref('')
const usernames = ref<string[]>([])
const validationStatus = ref<Record<string, { valid: boolean; exists: boolean; loading: boolean }>>({})

const { mutate: validate } = useValidateBggUsernameMutation()

const { load: search, result: searchResult, loading: searching } = useSearchLazyQuery(
  computed(() => ({ query: searchInput.value }))
)

const debouncedSearch = useDebounceFn(() => { ... }, 300)

function addUsername(username: string) { ... }
function handleUsernameKeydown(e: KeyboardEvent) { ... }
function removeUsername(username: string) { ... }
function showCollection() {
  if (usernames.value.length === 0) return
  store.set(usernames.value)
  router.push({ path: '/collection', query: { usernames: usernames.value.join(',') } })
}
</script>
```

**Core pattern: restyle with M3 tokens** (from `09-UI-SPEC.md` §Home Hero):
```vue
<template>
  <Card>
    <CardContent class="p-6 space-y-4">
      <h1 class="text-[28px] font-semibold leading-tight text-on-surface">
        Find the perfect game for your next board game night
      </h1>
      <p class="text-base text-on-surface-variant">
        Merge your BoardGameGeek collections, filter by players and time, and pick what to play.
      </p>
      <div class="space-y-2">
        <label for="username-input" class="text-sm font-semibold text-on-surface">
          Enter BoardGameGeek usernames
        </label>
        <Input
          id="username-input"
          v-model="usernameInput"
          placeholder="Type a username and press Enter"
          @keydown="handleUsernameKeydown"
        />
        <!-- tags -->
      </div>
      <Button variant="primary" class="w-full" :disabled="usernames.length === 0" @click="showCollection">
        Merge collections
      </Button>
    </CardContent>
  </Card>
</template>
```

**Hazard:** preserve all validation/tag behavior and the existing permalink contract (`/collection?usernames=...`).

---

### `app/frontend/components/landing/StatsCard.vue` (component, request-response)

**Analog:** `app/frontend/components/group/GroupCollectionSpotlight.vue` (Card + CardHeader + CardContent + icon container pattern)

**Imports / query pattern** (from `useAuth.ts` lines 18-23):
```typescript
const { result: currentUserResult, loading: currentUserLoading } = useCurrentUserQuery(
  () => ({}),
  () => ({ fetchPolicy: 'cache-and-network' })
)
const currentUser = computed(() => currentUserResult.value?.currentUser ?? null)
```

**Core pattern:**
```vue
<script setup lang="ts">
import { useDashboardStatsQuery } from '@/generated/operations'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Icon } from '@/components/ui/icon'

const { result, loading } = useDashboardStatsQuery(() => ({}), () => ({ fetchPolicy: 'cache-and-network' }))
const stats = computed(() => result.value?.dashboardStats)
</script>
```

**Card layout pattern** (from `09-UI-SPEC.md` §Stats Card):
```vue
<template>
  <Card>
    <CardContent class="p-6 space-y-4">
      <h2 class="text-xl font-semibold text-on-surface">Your stats</h2>
      <div class="grid grid-cols-3 gap-4">
        <div v-for="stat in statsList" :key="stat.label" class="flex items-center gap-3">
          <div class="h-14 w-14 rounded-lg bg-surface-container-high flex items-center justify-center">
            <Icon :name="stat.icon" class="text-on-surface-variant" />
          </div>
          <div>
            <p class="text-xl font-semibold text-on-surface">{{ stat.value }}</p>
            <p class="text-sm text-on-surface-variant">{{ stat.label }}</p>
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
</template>
```

**Hazard:** do not derive stats from `useMergedCollectionQuery` or Pinia; use the dedicated `DashboardStats` query only.

---

### `app/frontend/components/landing/TrendingGames.vue` (component, request-response)

**Analog:** `app/frontend/components/landing/HotList.vue` (exact query + grid pattern)

**Current pattern** (lines 1-47):
```vue
<script setup lang="ts">
import { useHotItemsQuery } from '../../generated/operations'

const { result, loading } = useHotItemsQuery(() => ({ fetchPolicy: 'cache-first' }))
</script>

<template>
  <section class="space-y-4">
    <h2 class="text-xl font-semibold text-neutral-800">Trending on BoardGameGeek</h2>
    <div v-if="loading" class="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-4">
      <!-- skeletons -->
    </div>
    <div v-else class="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-4">
      <a v-for="item in result?.hotItems" :key="item.id" ...>{{ item.name }}</a>
    </div>
  </section>
</template>
```

**Core pattern: six-card responsive grid + View all link** (from `09-UI-SPEC.md`):
```vue
<template>
  <section class="space-y-4">
    <div class="flex items-center justify-between">
      <h2 class="text-xl font-semibold text-on-surface">Trending on BGG</h2>
      <RouterLink to="/hot" class="text-sm font-medium text-primary hover:underline">View all</RouterLink>
    </div>
    <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
      <TrendingGameCard v-for="item in items" :key="item.id" :item="item" />
    </div>
  </section>
</template>
```

**Hazard:** keep `/hot` as a standalone route; do not redirect or remove the sidebar link.

---

### `app/frontend/components/landing/TrendingGameCard.vue` (component, request-response)

**Analog:** `app/frontend/components/group/GroupCollectionSpotlight.vue` spotlight card (image + title + badge + rank + external BGG link)

**Core pattern: card with rank badge and `—` fallback** (from `09-UI-SPEC.md` §Trending on BGG):
```vue
<script setup lang="ts">
import type { HotItem } from '@/generated/types'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface Props { item: HotItem }
const props = defineProps<Props>()

function openBgg() {
  window.open(`https://boardgamegeek.com/boardgame/${props.item.id}`, '_blank', 'noopener,noreferrer')
}
</script>

<template>
  <Card
    class="cursor-pointer hover:shadow-md hover:-translate-y-1 transition-all duration-300 p-0 gap-0 overflow-hidden"
    @click="openBgg"
  >
    <div class="relative">
      <img v-if="item.thumbnail" :src="item.thumbnail" :alt="item.name" class="w-full aspect-[4/3] object-cover bg-surface-container" />
      <div v-else class="w-full aspect-[4/3] bg-surface-variant flex items-center justify-center text-on-surface-variant text-sm">No image</div>
      <Badge variant="draft" class="absolute top-2 left-2">#{{ item.rank }}</Badge>
    </div>
    <CardContent class="p-3 space-y-1">
      <h3 class="text-sm font-semibold line-clamp-2 leading-tight text-on-surface">{{ item.name }}</h3>
      <p class="text-xs text-on-surface-variant">
        {{ item.average?.toFixed(1) ?? '—' }} · {{ item.averageWeight?.toFixed(1) ?? '—' }} · {{ playerLabel }} · {{ timeLabel }}
      </p>
    </CardContent>
  </Card>
</template>
```

**Hazard:** never issue live BGG requests; all enrichment comes from persisted `BggThing` via the Dataloader.

---

### `app/frontend/views/HotView.vue` (view, request-response)

**Analog:** `app/frontend/views/HotView.vue` (self) + `TrendingGames.vue` grid

**Current pattern** (lines 1-10):
```vue
<script setup lang="ts">
import HotList from '../components/landing/HotList.vue'
</script>

<template>
  <div class="max-w-3xl mx-auto px-4 py-8 md:py-12">
    <h1 class="text-3xl font-bold text-neutral-900 mb-8">Trending Games</h1>
    <HotList />
  </div>
</template>
```

**Core pattern:** replace `HotList` with `TrendingGames` using a larger grid and the same `HotItems` query.

---

### `app/frontend/stores/filters.ts` (Pinia store, state transform)

**Analog:** `app/frontend/stores/filters.ts` (self)

**Current pattern** (lines 1-62):
```typescript
export const useFilterStore = defineStore('filters', () => {
  const query = ref('')
  const playerCount = ref<number | null>(null)
  const timeBucket = ref<number | null>(null)
  const complexityBucket = ref<number | null>(null)
  const ratingMin = ref<number | null>(null)
  const selectedOwners = ref<Set<string>>(new Set())
  const sort = ref<SortOption>('name_asc')
  const groupBy = ref<GroupOption>('none')
  // ... helpers
})
```

**Core pattern: migrated shape** (from `09-RESEARCH.md` §Filter Store Migration):
```typescript
export type SortOption = 'name_asc' | 'rating_desc' | 'weight_asc' | 'recently_played'
export type ViewMode = 'grid' | 'list'

export interface PlayerRange {
  min: number
  max: number
}

const query = ref('')
const playerRange = ref<PlayerRange | null>(null)
const selectedTimeBuckets = ref<Set<number>>(new Set())
const complexityBucket = ref<number | null>(null)
const ratingMin = ref<number | null>(null)
const selectedOwners = ref<Set<string>>(new Set())
const sort = ref<SortOption>('name_asc')
const groupBy = ref<GroupOption>('none')
const view = ref<ViewMode>('grid')
```

**Hazard:** preserve `selectedOwners` synchronization with the collectors store and `groupBy` URL key.

---

### `app/frontend/composables/usePermalink.ts` (composable, state transform)

**Analog:** `app/frontend/composables/usePermalink.ts` (self)

**Current hydration pattern** (lines 41-62):
```typescript
const players = params.get('players')
if (players) filterStore.playerCount = Number(players)

const time = params.get('time')
if (time) filterStore.timeBucket = Number(time)

const complexity = params.get('complexity')
if (complexity) filterStore.complexityBucket = Number(complexity)

const sort = params.get('sort')
if (sort) filterStore.sort = sort as SortOption
```

**Core pattern: range + multi-time + view migration** (from `09-RESEARCH.md` §URL Permalink Contract):
```typescript
// Hydrate
const players = params.get('players')
if (players) {
  const [min, max] = players.split('-').map(Number)
  filterStore.playerRange = { min, max: max ?? min }
}

const time = params.get('time')
if (time) {
  filterStore.selectedTimeBuckets = new Set(time.split(',').map(Number).filter(Boolean))
}

const complexity = params.get('complexity')
if (complexity) {
  const value = Number(complexity)
  filterStore.complexityBucket = value === 4 ? 3 : value
}

const view = params.get('view')
filterStore.view = view === 'list' ? 'list' : 'grid'

const sort = params.get('sort')
if (sort) {
  filterStore.sort = LEGACY_SORT_MAP[sort] ?? 'name_asc'
}
```

**Serialization pattern:**
```typescript
if (filterStore.playerRange) {
  const { min, max } = filterStore.playerRange
  params.set('players', min === max ? String(min) : `${min}-${max}`)
} else {
  params.delete('players')
}

if (filterStore.selectedTimeBuckets.size > 0) {
  params.set('time', Array.from(filterStore.selectedTimeBuckets).join(','))
} else {
  params.delete('time')
}

if (filterStore.view !== 'grid') {
  params.set('view', filterStore.view)
} else {
  params.delete('view')
}
```

**Hazard:** preserve the reserved `group=<inviteCode>` token exactly as it is today; never overwrite it with filter state. Keep the `LEGACY_GROUP_OPTIONS` migration.

---

### `app/frontend/composables/useCollectionFilters.ts` (composable, state transform)

**Analog:** `app/frontend/composables/useCollectionFilters.ts` (self)

**Current filter computation** (lines 69-106):
```typescript
const filteredGames = computed(() => {
  let result: MergedThing[] = games.value

  const q = debouncedQuery.value.trim()
  if (q) result = searchFuse(fuseIndex.value, q) as MergedThing[]

  if (playerCount.value != null) {
    result = result.filter(game => playerCountFilter(game, playerCount.value!))
  }

  if (timeBucket.value != null) {
    const bucket = TIME_BUCKETS.find(b => b.value === timeBucket.value)
    if (bucket) result = result.filter(game => playtimeFilter(game, { min: bucket.min, max: bucket.max }))
  }

  if (complexityBucket.value != null) { ... }

  if (selectedOwners.value.size > 0) {
    result = result.filter(game => game.owners.some(owner => selectedOwners.value.has(owner.bggUsername)))
  }

  return result
})
```

**Core pattern: range + multi-time + updated complexity** (from `09-RESEARCH.md`):
```typescript
if (playerRange.value) {
  const { min, max } = playerRange.value
  result = result.filter(game => game.minPlayers != null && game.maxPlayers != null && game.minPlayers <= min && game.maxPlayers >= max)
}

if (selectedTimeBuckets.value.size > 0) {
  result = result.filter(game =>
    Array.from(selectedTimeBuckets.value).some(value => {
      const bucket = TIME_BUCKETS.find(b => b.value === value)
      return bucket ? playtimeFilter(game, { min: bucket.min, max: bucket.max }) : false
    })
  )
}

if (complexityBucket.value != null) {
  const bucket = COMPLEXITY_BUCKETS.find(b => b.value === complexityBucket.value)
  if (bucket) result = result.filter(game => complexityFilter(game, { min: bucket.min, max: bucket.max }))
}
```

**Hazard:** player range now matches the entire selected range (`game.minPlayers <= min && game.maxPlayers >= max`), not a single count.

---

### `app/frontend/utils/sorting.ts` (utility, state transform)

**Analog:** `app/frontend/utils/sorting.ts` (self)

**Current pattern** (lines 1-51):
```typescript
export type SortOption =
  | 'name_asc' | 'name_desc' | 'rating_asc' | 'rating_desc'
  | 'year_asc' | 'year_desc' | 'weight_asc' | 'weight_desc'
  | 'complexity_asc' | 'complexity_desc'

export function sortGames(games: MergedThing[], sort: SortOption): MergedThing[] {
  // ... switch cases
}
```

**Core pattern: four options + recently played** (from `09-RESEARCH.md`):
```typescript
export type SortOption = 'name_asc' | 'rating_desc' | 'weight_asc' | 'recently_played'

export const SORT_OPTIONS = [
  { value: 'name_asc', label: 'Name A–Z' },
  { value: 'rating_desc', label: 'Rating High–Low' },
  { value: 'weight_asc', label: 'Weight Light–Heavy' },
  { value: 'recently_played', label: 'Recently Played' }
]

export function sortGames(games: MergedThing[], sort: SortOption): MergedThing[] {
  const sorted = [...games]
  switch (sort) {
    case 'name_asc':
      return sorted.sort((a, b) => a.name.localeCompare(b.name) || a.id.localeCompare(b.id))
    case 'rating_desc':
      return sorted.sort((a, b) => (b.average ?? 0) - (a.average ?? 0) || a.name.localeCompare(b.name) || a.id.localeCompare(b.id))
    case 'weight_asc':
      return sorted.sort((a, b) => (a.averageWeight ?? 0) - (b.averageWeight ?? 0) || a.name.localeCompare(b.name) || a.id.localeCompare(b.id))
    case 'recently_played':
      return sorted.sort((a, b) => {
        const aDate = a.lastPlayedAt ? new Date(a.lastPlayedAt).getTime() : 0
        const bDate = b.lastPlayedAt ? new Date(b.lastPlayedAt).getTime() : 0
        if (aDate === 0 && bDate === 0) return a.name.localeCompare(b.name) || a.id.localeCompare(b.id)
        return bDate - aDate || a.name.localeCompare(b.name) || a.id.localeCompare(b.id)
      })
    default:
      return sorted
  }
}
```

**Hazard:** preserve deterministic name/id tie-breaks. Games with no `lastPlayedAt` sort last.

---

### `app/frontend/components/collection/CollectionFilterPanel.vue` (component, state transform)

**Analog:** `app/frontend/components/collection/CollectionFilters.vue` (exact replacement target)

**Current pattern** (lines 1-74): single-value selects stacked vertically with `neutral-*` classes.

**Core pattern: sectioned filter panel with new controls** (from `09-UI-SPEC.md` §Filter Panel Sections):
```vue
<template>
  <div class="space-y-6">
    <div class="space-y-compact">
      <label for="filter-search" class="text-sm font-semibold text-on-surface">Search</label>
      <Input id="filter-search" v-model="query" placeholder="Search games…" />
    </div>

    <div class="space-y-compact">
      <div class="flex items-center justify-between">
        <label class="text-sm font-semibold text-on-surface">Owners</label>
        <div class="flex gap-2 text-sm">
          <button type="button" class="text-primary" @click="selectAll">Select all</button>
          <button type="button" class="text-primary" @click="clear">Clear</button>
        </div>
      </div>
      <OwnerAvatarToggles v-model="selectedOwners" :owners="owners" />
    </div>

    <div class="space-y-compact">
      <div class="flex items-center justify-between">
        <label class="text-sm font-semibold text-on-surface">Players</label>
        <span class="text-sm text-on-surface-variant">{{ playerRangeLabel }}</span>
      </div>
      <PlayerRangeSlider v-model="playerRange" />
    </div>

    <div class="space-y-compact">
      <label class="text-sm font-semibold text-on-surface">Playing time</label>
      <TimeBucketCheckboxes v-model="selectedTimeBuckets" />
    </div>

    <div class="space-y-compact">
      <label class="text-sm font-semibold text-on-surface">Complexity</label>
      <ComplexityToggleGroup v-model="complexityBucket" />
    </div>
  </div>
</template>
```

**Hazard:** this panel is rendered inside both the desktop sticky `aside` and the mobile `Sheet`; state must be the same Pinia store instance.

---

### `app/frontend/components/collection/PlayerRangeSlider.vue` (component, event-driven)

**Analog:** reka-ui `Slider` primitive / shadcn-vue `Slider` (to scaffold; no existing project analog)

**Core pattern** (from `09-RESEARCH.md` §Player Range Slider):
```vue
<script setup lang="ts">
import { Slider } from '@/components/ui/slider'
import type { PlayerRange } from '@/stores/filters'

const model = defineModel<PlayerRange | null>({ default: null })

const value = computed({
  get: () => model.value ? [model.value.min, model.value.max] : [1, 10],
  set: ([min, max]) => { model.value = { min, max } }
})
</script>

<template>
  <div class="space-y-3">
    <div class="flex justify-between text-sm text-on-surface-variant">
      <span>{{ value[0] }}</span>
      <span>{{ value[1] === 10 ? '10+' : value[1] }}</span>
    </div>
    <Slider v-model="value" :min="1" :max="10" :step="1" class="w-full" />
  </div>
</template>
```

**Hazard:** if the shadcn-vue `Slider` wrapper does not expose two-thumb arrays, fall back to raw `reka-ui` `SliderRoot/SliderTrack/SliderRange/SliderThumb`. Verify generated source after `npx shadcn-vue add slider`.

---

### `app/frontend/components/collection/TimeBucketCheckboxes.vue` (component, event-driven)

**Analog:** `app/frontend/components/ui/checkbox/Checkbox.vue` (existing primitive)

**Checkbox primitive pattern** (from `Checkbox.vue` lines 18-33):
```vue
<CheckboxRoot
  data-slot="checkbox"
  :class="cn('border-outline data-checked:bg-primary data-checked:text-on-primary data-checked:border-primary ...')"
>
  <CheckboxIndicator data-slot="checkbox-indicator">
    <Icon name="check" />
  </CheckboxIndicator>
</CheckboxRoot>
```

**Core pattern:**
```vue
<script setup lang="ts">
import { Checkbox } from '@/components/ui/checkbox'
import { TIME_BUCKETS } from '@/composables/useCollectionFilters'

const model = defineModel<Set<number>>({ default: () => new Set() })

function toggle(value: number) {
  const next = new Set(model.value)
  if (next.has(value)) next.delete(value)
  else next.add(value)
  model.value = next
}
</script>

<template>
  <div class="space-y-compact">
    <label v-for="bucket in TIME_BUCKETS" :key="bucket.value" class="flex items-center gap-compact text-on-surface">
      <Checkbox :checked="model.has(bucket.value)" @update:checked="toggle(bucket.value)" />
      <span class="text-sm">{{ bucket.label }}</span>
    </label>
  </div>
</template>
```

---

### `app/frontend/components/collection/ComplexityToggleGroup.vue` (component, event-driven)

**Analog:** reka-ui `ToggleGroup` primitive (to scaffold; no existing project analog)

**Core pattern: controlled single-select with null** (from `09-RESEARCH.md` §Complexity Segmented Control):
```vue
<script setup lang="ts">
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'

const model = defineModel<number | null>({ default: null })

const options = [
  { value: null, label: 'Any' },
  { value: 1, label: 'Light' },
  { value: 2, label: 'Medium' },
  { value: 3, label: 'Heavy' }
]
</script>

<template>
  <ToggleGroup
    :model-value="model?.toString()"
    type="single"
    class="flex w-full rounded-lg border border-outline overflow-hidden"
    @update:model-value="(v) => model = v === 'null' ? null : Number(v)"
  >
    <ToggleGroupItem
      v-for="option in options"
      :key="option.label"
      :value="String(option.value)"
      class="flex-1"
    >
      {{ option.label }}
    </ToggleGroupItem>
  </ToggleGroup>
</template>
```

**Hazard:** component must be reusable for Phase 10; ensure full keyboard support (roving tabindex, arrow keys, Enter/Space).

---

### `app/frontend/components/collection/OwnerAvatarToggles.vue` (component, state transform)

**Analog:** `app/frontend/components/layout/CollectorsSection.vue` (owner toggle list in sidebar)

**Core pattern:** avatar button toggles with `aria-pressed` (from `09-UI-SPEC.md` §Owners):
```vue
<script setup lang="ts">
import { Button } from '@/components/ui/button'
import MemberAvatar from '@/components/common/MemberAvatar.vue'

const model = defineModel<Set<string>>({ default: () => new Set() })
const props = defineProps<{ owners: string[] }>()

function toggle(username: string) {
  const next = new Set(model.value)
  if (next.has(username)) next.delete(username)
  else next.add(username)
  model.value = next
}
</script>

<template>
  <div class="flex flex-wrap gap-2">
    <Button
      v-for="username in owners"
      :key="username"
      type="button"
      :variant="model.has(username) ? 'secondary' : 'outline'"
      size="sm"
      :aria-pressed="model.has(username)"
      :aria-label="`Include games from ${username}`"
      @click="toggle(username)"
    >
      <MemberAvatar :username="username" size="sm" />
      <span class="ml-1.5">{{ username }}</span>
    </Button>
  </div>
</template>
```

---

### `app/frontend/components/collection/ViewModeToggle.vue` (component, state transform)

**Analog:** `app/frontend/components/collection/GroupByToggle.vue` (single-select control pattern)

**Core pattern:** icon-only `ToggleGroup` (from `09-UI-SPEC.md` §View Mode Toggle):
```vue
<script setup lang="ts">
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Icon } from '@/components/ui/icon'
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

---

### `app/frontend/components/collection/SortControl.vue` (component, state transform)

**Analog:** `app/frontend/components/collection/SortControl.vue` (self) + `app/frontend/components/ui/select/SelectTrigger.vue` (primitive)

**Current pattern** (lines 1-20):
```vue
<script setup lang="ts">
import { SORT_OPTIONS, type SortOption } from '@/utils/sorting'
const sort = defineModel<SortOption>('modelValue', { default: 'name_asc' })
</script>

<template>
  <div class="flex items-center gap-2">
    <label for="sort-control" class="text-sm font-medium text-neutral-700">Sort</label>
    <select id="sort-control" v-model="sort" class="...">...</select>
  </div>
</template>
```

**Core pattern: Select primitive + four options** (from `09-UI-SPEC.md`):
```vue
<script setup lang="ts">
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { SORT_OPTIONS, type SortOption } from '@/utils/sorting'

const sort = defineModel<SortOption>('modelValue', { default: 'name_asc' })
</script>

<template>
  <div class="flex items-center gap-2">
    <label for="sort-control" class="text-sm font-semibold text-on-surface">Sort</label>
    <Select v-model="sort">
      <SelectTrigger id="sort-control" class="w-44">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem v-for="option in SORT_OPTIONS" :key="option.value" :value="option.value">
          {{ option.label }}
        </SelectItem>
      </SelectContent>
    </Select>
  </div>
</template>
```

---

### `app/frontend/components/collection/GroupByToggle.vue` (component, state transform)

**Analog:** `app/frontend/components/collection/GroupByToggle.vue` (self) + `Select` primitive

**Core pattern:** same as `SortControl`, but with `GROUP_OPTIONS` and label "Group by".

---

### `app/frontend/components/collection/GameCard.vue` (component, request-response)

**Analog:** `app/frontend/components/collection/GameCard.vue` (self) + `app/frontend/components/group/GroupCollectionSpotlight.vue` (M3 card pattern)

**Current pattern** (lines 1-87):
```vue
<script setup lang="ts">
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import MemberAvatar from '@/components/common/MemberAvatar.vue'

function openBgg() {
  window.open(`https://boardgamegeek.com/boardgame/${props.id}`, '_blank')
}
</script>

<template>
  <Card class="cursor-pointer hover:shadow-md hover:-translate-y-1 transition-all duration-300 p-0 gap-0 overflow-hidden" @click="openBgg">
    <img ... />
    <CardContent class="p-3">
      <h3 ...>{{ name }}</h3>
      <p v-if="meta" ...>{{ meta }}</p>
      <div class="flex items-center gap-2 mt-2">
        <Badge v-if="hasAverage" variant="invited">{{ average?.toFixed(1) }}</Badge>
        <Badge v-if="hasWeight" variant="draft">{{ averageWeight?.toFixed(1) }}</Badge>
      </div>
      <div class="flex -space-x-1 mt-2">
        <MemberAvatar v-for="owner in owners" ... />
      </div>
    </CardContent>
  </Card>
</template>
```

**Core pattern: grid variant** (from `09-UI-SPEC.md` §Rich Game Cards):
```vue
<Card class="cursor-pointer hover:shadow-md hover:-translate-y-1 transition-all duration-300 p-0 gap-0 overflow-hidden" @click="openBgg">
  <img v-if="thumbnail" :src="thumbnail" :alt="name" class="w-full aspect-[4/3] object-cover bg-surface-container" />
  <div v-else class="w-full aspect-[4/3] bg-surface-variant flex items-center justify-center text-on-surface-variant text-sm">No image</div>
  <CardContent class="p-compact space-y-2">
    <h3 class="text-sm font-semibold line-clamp-2 leading-tight text-on-surface" :title="name">{{ name }}</h3>
    <p class="text-sm text-on-surface-variant line-clamp-2">{{ plainDescription }}</p>
    <div class="flex items-center gap-2">
      <Badge v-if="hasAverage" variant="invited">{{ average.toFixed(1) }}</Badge>
      <Badge v-if="hasWeight" variant="draft">{{ averageWeight.toFixed(1) }}</Badge>
    </div>
    <div class="flex -space-x-1">
      <MemberAvatar v-for="owner in visibleOwners" :key="owner.bggUsername" :username="owner.bggUsername" size="xs" />
      <AvatarGroupCount v-if="ownerOverflow > 0">+{{ ownerOverflow }}</AvatarGroupCount>
    </div>
    <div class="grid grid-cols-3 gap-1 text-sm font-semibold text-on-surface-variant pt-2 border-t border-outline">
      <div class="flex items-center gap-1"><Icon name="groups" class="size-3" /> {{ playerLabel }}</div>
      <div class="flex items-center gap-1"><Icon name="schedule" class="size-3" /> {{ timeLabel }}</div>
      <div class="flex items-center gap-1"><Icon name="fitness_center" class="size-3" /> {{ weightLabel }}</div>
    </div>
  </CardContent>
</Card>
```

**Core pattern: list variant:**
```vue
<Card class="cursor-pointer hover:shadow-md transition-all duration-300 p-0 gap-0 overflow-hidden" @click="openBgg">
  <CardContent class="p-compact flex gap-4">
    <img v-if="thumbnail" :src="thumbnail" :alt="name" class="w-24 aspect-[4/3] object-cover rounded-lg bg-surface-container flex-shrink-0" />
    <div v-else class="w-24 aspect-[4/3] bg-surface-variant rounded-lg flex items-center justify-center text-on-surface-variant text-xs flex-shrink-0">No image</div>
    <div class="flex-1 min-w-0 space-y-2">
      <div class="flex items-start justify-between gap-2">
        <h3 class="text-sm font-semibold text-on-surface line-clamp-1">{{ name }}</h3>
        <div class="flex items-center gap-2 flex-shrink-0">
          <Badge v-if="hasAverage" variant="invited">{{ average.toFixed(1) }}</Badge>
          <Badge v-if="hasWeight" variant="draft">{{ averageWeight.toFixed(1) }}</Badge>
        </div>
      </div>
      <p class="text-sm text-on-surface-variant line-clamp-3">{{ plainDescription }}</p>
      <div class="flex items-center justify-between">
        <div class="grid grid-cols-3 gap-4 text-sm font-semibold text-on-surface-variant">
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

**Hazard:**
- Never use `v-html` for the BGG description; render plain text with `line-clamp-2`/`line-clamp-3`.
- Card click must use `noopener,noreferrer` and open `https://boardgamegeek.com/boardgame/${id}`.
- Nested interactive controls must stop propagation or be separate focusable elements.
- Owner avatars use `size="xs"` and are capped at 3 visible + overflow count.

---

### `app/frontend/components/collection/GameGrid.vue` (component, request-response)

**Analog:** `app/frontend/components/collection/GameGrid.vue` (self)

**Current pattern** (lines 1-124): renders grouped/ungrouped grid only.

**Core pattern: branch by view mode** (from `09-UI-SPEC.md`):
```vue
<script setup lang="ts">
interface Props {
  games?: MergedThing[]
  groups?: GameGroup[]
  groupBy?: GroupOption
  view?: ViewMode
  loading?: boolean
}
</script>

<template>
  <div class="space-y-6">
    <template v-if="loading">
      <ResultsSkeleton v-for="i in 12" :key="i" :variant="view" />
    </template>

    <template v-else-if="view === 'list'">
      <div class="space-y-3">
        <GameCard v-for="game in ungroupedGames" :key="game.id" :game="game" variant="list" />
      </div>
    </template>

    <template v-else>
      <div class="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-4">
        <GameCard v-for="game in ungroupedGames" :key="game.id" :game="game" variant="grid" />
      </div>
    </template>
  </div>
</template>
```

**Hazard:** preserve grouped-mode rendering and `CollapsibleGroup` integration; only the leaf card grid changes by view.

---

### `app/frontend/components/collection/ResultsSkeleton.vue` (component, request-response)

**Analog:** `app/frontend/components/collection/ResultsSkeleton.vue` (self)

**Current pattern** (lines 1-19): vertical grid skeleton.

**Core pattern: grid + list variants** (from `09-UI-SPEC.md` §Skeletons):
```vue
<script setup lang="ts">
import { Skeleton } from '@/components/ui/skeleton'

interface Props {
  variant?: 'grid' | 'list'
}
</script>

<template>
  <div v-if="variant === 'list'" class="rounded-xl border border-outline bg-surface-container p-compact flex gap-4 overflow-hidden">
    <Skeleton class="w-24 aspect-[4/3] rounded-lg flex-shrink-0" />
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
  <div v-else class="rounded-xl border border-outline bg-surface-container p-compact space-y-2 overflow-hidden">
    <Skeleton class="aspect-[4/3] w-full" />
    <Skeleton class="h-4 w-3/4" />
    <Skeleton class="h-3 w-1/2" />
    <div class="flex gap-2">
      <Skeleton class="h-5 w-8" />
      <Skeleton class="h-5 w-8" />
    </div>
    <div class="flex -space-x-1 pt-1">
      <Skeleton class="h-5 w-5 rounded-full ring-2 ring-white" />
      <Skeleton class="h-5 w-5 rounded-full ring-2 ring-white" />
    </div>
  </div>
</template>
```

---

### `app/frontend/components/ui/slider/Slider.vue` (UI primitive, event-driven)

**Analog:** shadcn-vue/reka-ui Slider (no project analog; must be added via CLI)

**Acquisition:** `npx shadcn-vue add slider` (per `09-UI-SPEC.md` §Registry Safety).

**Core pattern:** wrap reka-ui `SliderRoot`, `SliderTrack`, `SliderRange`, `SliderThumb`. If the generated wrapper supports a single `v-model` array, bind `[min, max]` directly.

**Hazard:** replace any `@lucide/vue` import with the project's `Icon` wrapper after scaffolding.

---

### `app/frontend/components/ui/toggle-group/ToggleGroup.vue` (UI primitive, event-driven)

**Analog:** shadcn-vue/reka-ui ToggleGroup (no project analog; must be added via CLI)

**Acquisition:** `npx shadcn-vue add toggle-group` (per `09-UI-SPEC.md` §Registry Safety).

**Core pattern:** expose `type="single" | "multiple"` and forward `v-model`.

**Hazard:** must be reusable by Phase 10; ensure keyboard roving tabindex and arrow-key support are preserved from reka-ui.

---

### `app/frontend/views/CollectionView.vue` (view, request-response)

**Analog:** `app/frontend/views/CollectionView.vue` (self) + `app/frontend/views/GroupView.vue` (Phase 8 sticky side-rail layout)

**Current pattern** (lines 1-196): simple top controls + `CollectionFilters` + `GameGrid`.

**Core pattern: filter workspace layout** (from `09-UI-SPEC.md` §Collection Filter Workspace):
```vue
<template>
  <div class="p-4 md:p-6">
    <div class="flex flex-col xl:flex-row gap-6">
      <aside class="hidden xl:block w-[264px] xl:sticky xl:top-6 xl:self-start space-y-6">
        <CollectionFilterPanel />
      </aside>

      <div class="flex-1 min-w-0 space-y-4">
        <div class="flex flex-wrap items-center gap-3">
          <Button variant="outline" class="xl:hidden" @click="filtersOpen = true">
            <Icon name="filter_list" class="mr-2 size-4" />
            Filters
          </Button>
          <SortControl v-model="sort" />
          <GroupByToggle v-model="groupBy" />
          <ViewModeToggle v-model="view" />
          <ActiveFilterChips />
        </div>

        <EmptyState v-if="error" ... />
        <EmptyState v-else-if="usernames.length === 0 && !groupMode && !loading" ... />
        <EmptyState v-else-if="filteredGames.length === 0 && !loading" ... />
        <GameGrid v-else :groups="groupedGames" :view="view" :loading="loading" />
      </div>
    </div>

    <Sheet v-model:open="filtersOpen">
      <SheetContent side="left" class="w-[300px] sm:w-[360px]">
        <SheetHeader>
          <SheetTitle>Filters</SheetTitle>
          <SheetDescription>Filter the shared collection</SheetDescription>
        </SheetHeader>
        <CollectionFilterPanel />
      </SheetContent>
    </Sheet>
  </div>
</template>
```

**Hazard:**
- Never return filters to the 280px global sidebar; use the 264px local sticky panel or Sheet.
- Preserve existing group-mode normalization, polling, queued import, error, empty, and sync-status logic.
- Include `lastPlayedAt` in the active query so the four sorts can run locally.

---

### `spec/graphql/dashboard_stats_query_spec.rb` (test, request-response)

**Analog:** `spec/graphql/merged_collection_query_spec.rb` (GraphQL query spec pattern)

**Test pattern** (from `spec/graphql/merged_collection_query_spec.rb` lines 1-45):
```ruby
require "rails_helper"

RSpec.describe "dashboardStats query" do
  let(:alice) { User.create!(username: "alice", bgg_username: "bggalice", password: "password") }
  let(:bob) { User.create!(username: "bob", bgg_username: "bggbob", password: "password") }

  let(:query) do
    <<~GRAPHQL
      query {
        dashboardStats {
          collectionCount
          groupCount
          sessionCount
        }
      }
    GRAPHQL
  end

  it "returns counts for the authenticated user" do
    result = BoardgameNightSchema.execute(query, context: { current_user: alice })
    expect(result["errors"]).to be_nil
    data = result.dig("data", "dashboardStats")
    expect(data["collectionCount"]).to eq(0)
  end

  it "returns null when signed out" do
    result = BoardgameNightSchema.execute(query)
    expect(result.dig("data", "dashboardStats")).to be_nil
  end
end
```

---

### `spec/graphql/loaders/hot_item_thing_loader_spec.rb` (test, batch)

**Analog:** `spec/graphql/loaders/owners_loader_spec.rb` (exact Dataloader test pattern)

**Test pattern** (from `spec/graphql/loaders/owners_loader_spec.rb` lines 1-31):
```ruby
require "rails_helper"

RSpec.describe Loaders::HotItemThingLoader do
  let(:thing) { BggThing.create!(objectid: 174430, name: "Gloomhaven") }

  it "returns the thing in input order" do
    result = Loaders::HotItemThingLoader.new.fetch([thing.objectid, 999_999])
    expect(result[0]).to eq(thing)
    expect(result[1]).to be_nil
  end
end
```

---

### `spec/graphql/loaders/last_played_at_loader_spec.rb` (test, batch)

**Analog:** `spec/graphql/loaders/polls_loader_spec.rb` (single-query aggregation pattern)

**Test pattern:**
```ruby
require "rails_helper"

RSpec.describe Loaders::LastPlayedAtLoader do
  let(:alice) { User.create!(username: "alice", bgg_username: "bggalice", password: "password") }
  let(:group) { Group.create!(name: "Night Owls", owner: alice) }
  let(:thing) { BggThing.create!(objectid: 1, name: "Game A") }

  before do
    GroupMembership.create!(user: alice, group: group, role: "owner")
  end

  it "returns the latest non-cancelled session date per thing" do
    session = NightSession.create!(group: group, host: alice, picked_game: thing, state: "completed", title: "Night", complexity_preference: "Any", time_budget_minutes: 60)
    session.update!(scheduled_at: Time.new(2026, 7, 1, 12, 0, 0, "+00:00"))

    result = Loaders::LastPlayedAtLoader.new(:group, group.id).fetch([thing.id])
    expect(result[0]).to eq(session.scheduled_at)
  end

  it "excludes cancelled sessions" do
    NightSession.create!(group: group, host: alice, picked_game: thing, state: "cancelled", title: "Night", complexity_preference: "Any", time_budget_minutes: 60)

    result = Loaders::LastPlayedAtLoader.new(:group, group.id).fetch([thing.id])
    expect(result[0]).to be_nil
  end
end
```

---

### `spec/frontend/usePermalink.spec.ts` (test, state transform)

**Analog:** `spec/frontend/usePermalink.spec.ts` (self)

**Core additions** (from `09-RESEARCH.md` §URL Permalink Contract):
```typescript
it('hydrates player range N as N–N', () => {
  setUrl('?players=4')
  mount(TestComponent)
  expect(useFilterStore().playerRange).toEqual({ min: 4, max: 4 })
})

it('hydrates player range N-M', () => {
  setUrl('?players=3-6')
  mount(TestComponent)
  expect(useFilterStore().playerRange).toEqual({ min: 3, max: 6 })
})

it('hydrates multi-time buckets', () => {
  setUrl('?time=1,3')
  mount(TestComponent)
  expect(useFilterStore().selectedTimeBuckets).toEqual(new Set([1, 3]))
})

it('hydrates view mode', () => {
  setUrl('?view=list')
  mount(TestComponent)
  expect(useFilterStore().view).toBe('list')
})

it('serializes view=list and preserves group token', async () => {
  setUrl('?group=NIGHTOWLS')
  mount(TestComponent)
  useFilterStore().view = 'list'
  await nextTick()
  const lastUrl = String(calls[calls.length - 1]?.[2])
  expect(lastUrl).toContain('view=list')
  expect(lastUrl).toContain('group=NIGHTOWLS')
})
```

---

### `spec/frontend/useCollectionFilters.spec.ts` (test, state transform)

**Analog:** `spec/frontend/useCollectionFilters.spec.ts` (self)

**Core additions:**
```typescript
it('filters by player range matching entire selected range', () => {
  const games = ref([
    makeGame({ id: '1', minPlayers: 2, maxPlayers: 4 }),
    makeGame({ id: '2', minPlayers: 1, maxPlayers: 2 })
  ])
  const { playerRange, filteredGames } = useCollectionFilters(games)
  playerRange.value = { min: 3, max: 4 }

  expect(filteredGames.value).toHaveLength(1)
  expect(filteredGames.value[0].id).toBe('1')
})

it('filters by multiple time buckets with OR semantics', () => {
  const games = ref([
    makeGame({ id: '1', minPlaytime: 20, maxPlaytime: 30 }),
    makeGame({ id: '2', minPlaytime: 90, maxPlaytime: 120 }),
    makeGame({ id: '3', minPlaytime: 300, maxPlaytime: 400 })
  ])
  const { selectedTimeBuckets, filteredGames } = useCollectionFilters(games)
  selectedTimeBuckets.value = new Set([1, 3]) // ≤30 and 60-120

  expect(filteredGames.value.map(g => g.id)).toEqual(['1', '2'])
})
```

---

### `tests/e2e/collection.spec.ts` (E2E test, request-response)

**Analog:** `tests/e2e/collection.spec.ts` (self)

**Current player-count test** (lines 34-48):
```typescript
test('filters by player count', async ({ page }) => {
  await page.goto('/collection?usernames=e2e_alice,e2e_bob')
  await page.getByLabel('Players').selectOption('4')
  // ...
})
```

**Core updates:** update selectors to use the new `PlayerRangeSlider` or numeric input fallback, and add permalink round-trip coverage for `view` and `time`.

```typescript
test('preserves view mode and player range via permalink', async ({ page }) => {
  await page.goto('/collection?usernames=e2e_alice,e2e_bob')
  await page.getByRole('button', { name: 'List view' }).click()
  // adjust slider if accessible input exists
  const url = page.url()
  await page.goto(url)
  await expect(page.getByRole('button', { name: 'List view' })).toHaveAttribute('aria-pressed', 'true')
})
```

---

## Shared Patterns

### GraphQL Schema / Codegen Workflow

**Source:** `app/graphql/boardgame_night_schema.rb` (orphan types) and `08-PATTERNS.md` §GraphQL Schema / Codegen Workflow
**Apply to:** All GraphQL type/query/mutation changes

1. Add new fields/types as nullable or with safe default arguments.
2. Ensure new types are reachable via `BoardgameNightSchema.orphan_types` (add `Types::DashboardStatsType` if not reachable through a root field).
3. Run `bin/rails graphql:schema:dump`.
4. Run `npm run codegen`.
5. Verify `generated/operations.ts` and `generated/types.ts` include `DashboardStats`, `HotItem` enrichment, and `lastPlayedAt` on `MergedThing`.

```ruby
# app/graphql/boardgame_night_schema.rb
orphan_types(
  # ... existing types ...
  Types::DashboardStatsType
)
```

---

### Authentication / Apollo Boundary

**Source:** `app/frontend/composables/useAuth.ts` lines 18-23 / `app/frontend/apollo/client.ts` lines 22-30
**Apply to:** `StatsCard.vue`, `DashboardStats` query, `HomeView.vue`

```typescript
const { result: currentUserResult, loading: currentUserLoading } = useCurrentUserQuery(
  () => ({}),
  () => ({ fetchPolicy: 'cache-and-network' })
)
const currentUser = computed(() => currentUserResult.value?.currentUser ?? null)
```

Stats are Apollo server state; do not mirror in Pinia. Use `useDashboardStatsQuery` with the same `cache-and-network` policy.

---

### Error Handling / Empty States

**Source:** `app/frontend/components/collection/EmptyState.vue`
**Apply to:** All new view components

```vue
<EmptyState
  heading="Couldn’t load this page"
  body="Please check your connection and try again."
/>
```

---

### Material 3 Token Styling

**Source:** `app/frontend/entrypoints/styles.css` lines 6-250 / `05-PATTERNS.md` §Material 3 Token Styling
**Apply to:** All new Vue components

Use these token classes:
- `bg-surface` / `bg-surface-container` / `bg-surface-container-high`
- `text-on-surface` / `text-on-surface-variant` / `text-primary` / `text-error`
- `border-outline`
- `shadow-card` / `hover:shadow-md` / `hover:-translate-y-1 transition-all duration-300 motion-reduce:hover:translate-y-0`
- `p-compact` / `gap-compact` / `space-y-compact` (12px compact spacing)

**Hazard:** do not use `bg-indigo-*`, `text-neutral-*`, `bg-red-*`, or `text-white` outside the token system. Verify with `grep -R "bg-indigo\|text-neutral\|bg-red-" app/frontend/components`.

---

### Responsive Sticky Side Rail / Sheet

**Source:** `08-PATTERNS.md` §Responsive Sticky Side Rail and `app/frontend/components/ui/sheet/SheetContent.vue`
**Apply to:** `CollectionView.vue`, `CollectionFilterPanel.vue`

```vue
<aside class="hidden xl:block w-[264px] xl:sticky xl:top-6 xl:self-start space-y-6">
  <CollectionFilterPanel />
</aside>

<Sheet v-model:open="filtersOpen">
  <SheetContent side="left" class="w-[300px] sm:w-[360px]">
    <SheetHeader>
      <SheetTitle>Filters</SheetTitle>
      <SheetDescription>Filter the shared collection</SheetDescription>
    </SheetHeader>
    <CollectionFilterPanel />
  </SheetContent>
</Sheet>
```

**Sheet accessibility pattern** (from `SheetContent.vue` lines 51-59):
```vue
<DialogClose as-child>
  <Button variant="ghost" size="icon" :aria-label="closeAriaLabel">
    <Icon name="close" class="h-4 w-4" />
    <span class="sr-only">{{ closeAriaLabel }}</span>
  </Button>
</DialogClose>
```

---

### Primitive Import Paths

**Source:** `08-PATTERNS.md` §Primitive Import Paths
**Apply to:** All new Vue components

```typescript
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { Avatar, AvatarFallback, AvatarGroup, AvatarGroupCount } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { Icon } from '@/components/ui/icon'
```

After adding `Slider` and `ToggleGroup` via shadcn-vue CLI, import from `@/components/ui/slider` and `@/components/ui/toggle-group`.

---

### Card Activation / External BGG Links

**Source:** `app/frontend/components/group/GroupCollectionSpotlight.vue` lines 31-44
**Apply to:** `GameCard.vue`, `TrendingGameCard.vue`

```typescript
function openGame(game: GroupSpotlightThing) {
  window.open(
    `https://boardgamegeek.com/boardgame/${game.objectid}`,
    '_blank',
    'noopener,noreferrer'
  )
}

function handleKeydown(event: KeyboardEvent, game: GroupSpotlightThing) {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    openGame(game)
  }
}
```

**Hazard:** nested controls must stop propagation or be rendered as separate `<button>` elements.

---

### Avatar Group with Overflow

**Source:** `app/frontend/components/group/GroupCollectionSpotlight.vue` lines 98-113
**Apply to:** `GameCard.vue` (grid and list variants), `OwnerAvatarToggles.vue`

```vue
<AvatarGroup class="flex -space-x-1 *:data-[slot=avatar]:ring-white">
  <Avatar
    v-for="owner in visibleOwners"
    :key="owner.bggUsername"
    :class="useMemberColor(owner.bggUsername)"
    size="xs"
  >
    <AvatarFallback>{{ owner.bggUsername.charAt(0).toUpperCase() }}</AvatarFallback>
  </Avatar>
  <AvatarGroupCount v-if="overflow > 0" class="bg-surface-container-high text-on-surface-variant ring-white">
    +{{ overflow }}
  </AvatarGroupCount>
</AvatarGroup>
```

**Hazard:** override the default `ring-background` with `ring-white` for dark-mode contrast.

---

## No Analog Found

| File | Role | Data Flow | Reason |
|---|---|---|---|
| `app/frontend/components/landing/HomeHero.vue` | component | request-response | No standalone hero component; closest is `UsernameForm.vue` whose logic should be preserved. |
| `app/frontend/components/landing/StatsCard.vue` | component | request-response | No dashboard stats component; closest is `GroupCollectionSpotlight.vue` card pattern. |
| `app/frontend/components/landing/TrendingGameCard.vue` | component | request-response | No rank-badge/trending card; closest is `GroupCollectionSpotlight.vue` spotlight card. |
| `app/frontend/components/collection/PlayerRangeSlider.vue` | component | event-driven | No slider primitive exists yet; must be scaffolded from shadcn-vue/reka-ui. |
| `app/frontend/components/collection/ComplexityToggleGroup.vue` | component | event-driven | No toggle-group primitive exists yet; must be scaffolded from shadcn-vue/reka-ui. |
| `app/frontend/components/collection/ActiveFilterChips.vue` | component | state transform | No active-filter chip component exists; closest is inline owner tag rendering in `CollectionFilters.vue`. |
| `spec/frontend/StatsCard.spec.ts` | test | request-response | No stats card test exists; pattern from `GroupCollectionSpotlight.spec.ts` can be adapted. |
| `tests/e2e/home.spec.ts` | E2E test | request-response | No home dashboard E2E exists; pattern from `shell.spec.ts` and `collection.spec.ts` can be adapted. |

---

## Known Hazards & Constraints

| Hazard | Source | Mitigation in patterns above |
|---|---|---|
| N+1 / live BGG calls for hot enrichment | D-07, Pitfall 2 | Use `Loaders::HotItemThingLoader` reading persisted `BggThing`; never call `Bgg::Client` in resolvers. |
| N+1 for `last_played_at` | D-18, Pitfall 3 | Use `Loaders::LastPlayedAtLoader` with one `NightSession` aggregation per request. |
| Authorization-scoped last played | D-18, Pitfall 4 | Parent resolvers set `context[:last_played_scope_type/:id]`; user mode uses `current_user.group_ids`; group mode uses the group's `id`. |
| Reserved `group=<inviteCode>` collision | D-12, Pitfall 6 | Keep `LEGACY_GROUP_OPTIONS` migration; never write a filter param named `group`; read it first and pass through unchanged. |
| Old `players=N` permalink migration | D-10, Pitfall 5 | Parse `players` as `N` or `N-M`; serialize single-value ranges as `N` and true ranges as `N-M`. |
| Slider/ToggleGroup scaffolding | D-11, UI-SPEC | Add via `npx shadcn-vue add slider toggle-group`; verify two-thumb support and fallback to raw reka-ui if needed. |
| `--spacing-compact` (12px) | 09-UI-SPEC | Use `p-compact`, `gap-compact`, `space-y-compact` for filter panel and card padding. |
| Safe description rendering | D-13, Pitfall 7 | Render BGG description as plain text with `line-clamp`; never use `v-html`. |
| External objectid URLs | D-14 | Use `window.open(..., '_blank', 'noopener,noreferrer')` with `https://boardgamegeek.com/boardgame/${id}`. |
| Preservation of auto-import/group collection mode | D-12 | Keep `CollectionView` polling, `importCollection` mutation, `normalizeGroupItems`, and `watch` on sync statuses. |
| Pinia vs Apollo boundary for stats | D-04, Pitfall 1 | Use `useDashboardStatsQuery` only; do not derive from `useMergedCollectionQuery` or store stats in Pinia. |
| Grid/list skeleton mirroring | D-16 | `ResultsSkeleton` accepts `variant` prop; render correct variant based on `view`. |
| Legacy sort migration | D-17 | Map `name_desc`, `rating_asc`, `year_*`, `weight_desc`, `complexity_*` to the four new options. |
| No hard-coded colors | Pitfall 9 | All new components use M3 tokens from `styles.css`; grep for non-token colors in PR verification. |
| E2E selector compatibility | 09-RESEARCH | Update `collection.spec.ts` selectors from `select` to new `Select`/`Slider`/checkbox/avatar-toggle controls; keep stable `data-testid` and heading-based selectors. |

---

## Metadata

**Analog search scope:** `app/frontend/views/`, `app/frontend/components/collection/`, `app/frontend/components/landing/`, `app/frontend/components/group/`, `app/frontend/components/ui/`, `app/frontend/components/layout/`, `app/frontend/composables/`, `app/frontend/stores/`, `app/frontend/utils/`, `app/frontend/apollo/queries/`, `app/frontend/generated/`, `app/graphql/types/`, `app/graphql/loaders/`, `app/models/`, `spec/graphql/`, `spec/frontend/`, `tests/e2e/`, `.planning/phases/08-group-detail-surface/08-PATTERNS.md`, `.planning/phases/05-design-system-foundation/05-UI-SPEC.md`

**Files scanned:** 55+

**Pattern extraction date:** 2026-07-15
