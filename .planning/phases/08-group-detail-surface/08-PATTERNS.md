# Phase 08: Group Detail Surface - Pattern Map

**Mapped:** 2026-07-15
**Files analyzed:** 15
**Analogs found:** 12 / 15

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `app/graphql/types/group_type.rb` | GraphQL type | request-response | `app/graphql/types/group_type.rb` (self) | self — extend |
| `app/graphql/types/query_type.rb` | GraphQL resolver | request-response | `app/graphql/types/query_type.rb` (self) | self — add eager load |
| `app/frontend/apollo/queries/group.graphql` | GraphQL query | request-response | `app/frontend/apollo/queries/group.graphql` (self) | self — bounded reshape |
| `app/frontend/views/GroupView.vue` | view | request-response | `app/frontend/views/GroupView.vue` (self) | self — add skeletons |
| `app/frontend/components/group/GroupDetail.vue` | component | request-response | `app/frontend/components/group/GroupDetail.vue` (self) | self — layout rewrite |
| `app/frontend/components/group/GroupHeader.vue` | component | request-response | `app/frontend/components/group/GroupDetail.vue` header block | partial |
| `app/frontend/components/group/GroupSessionsList.vue` | component | request-response | `app/frontend/components/session/SessionSummary.vue` | partial |
| `app/frontend/components/group/GroupCollectionSpotlight.vue` | component | request-response | `app/frontend/components/collection/GameCard.vue` | role-match |
| `app/frontend/components/group/GroupMembersPanel.vue` | component | request-response | `app/frontend/components/group/MemberList.vue` | exact |
| `app/frontend/components/group/InviteCard.vue` | component | request-response | `app/frontend/components/group/InviteLink.vue` | exact |
| `app/frontend/apollo/mutations/remove_group_member.graphql` | GraphQL mutation | request-response | `app/frontend/apollo/mutations/remove_group_member.graphql` (self) | self — optional extend |
| `app/graphql/mutations/remove_group_member.rb` | GraphQL mutation | request-response | `app/graphql/mutations/remove_group_member.rb` (self) | self — optional extend |
| `spec/graphql/group_query_spec.rb` | test | request-response | `spec/graphql/group_query_spec.rb` (self) | self — extend |
| `spec/frontend/GroupCollectionSpotlight.spec.ts` | test | request-response | `spec/frontend/MemberAvatar.spec.ts` | role-match |
| `spec/frontend/GroupMembersPanel.spec.ts` | test | request-response | `spec/frontend/LoginView.spec.ts` | role-match |

## Pattern Assignments

### `app/graphql/types/group_type.rb` (GraphQL type, request-response)

**Analog:** `app/graphql/types/group_type.rb` (existing) — extend with `sessions` and `collection_spotlight`.

**Imports / type declaration pattern** (lines 1-13):
```ruby
# frozen_string_literal: true

module Types
  class GroupType < Types::BaseObject
    field :id, ID, null: false
    field :name, String, null: false
    field :description, String, null: true
    field :invite_code, String, null: true
    field :owner, Types::UserType, null: false
    field :members, [Types::UserType], null: false
    field :memberships, [Types::GroupMembershipType], null: false
    field :collection, Types::MergedCollectionType, null: false
    field :my_role, Types::GroupRoleEnum, null: true
    # NEW: add sessions and collectionSpotlight fields here
  end
end
```

**Role-aware resolver pattern** (lines 15-17 and 26-29):
```ruby
def memberships
  object.group_memberships.includes(:user).to_a
end

def my_role
  membership = object.group_memberships.find_by(user_id: context[:current_user]&.id)
  membership&.role&.upcase
end
```

**Core pattern: add new fields** (from `08-RESEARCH.md` Pattern 3 & 4):
```ruby
field :sessions, [Types::NightSessionType], null: false

field :collection_spotlight, [Types::MergedThingType], null: false do
  argument :limit, Integer, required: false, default_value: 4
end

def sessions
  visible = %w[invited picking]
  visible << "draft" if %w[owner admin].include?(my_role&.downcase)

  object.night_sessions
    .select { |s| visible.include?(s.state) }
    .sort_by do |s|
      state_order = { "picking" => 0, "invited" => 1, "draft" => 2 }[s.state] || 3
      date_key = if s.state == "draft" && s.scheduled_at.nil?
                     Time.at(999_999_999)
                   else
                     s.scheduled_at || Time.at(0)
                   end
      [state_order, date_key, s.created_at]
    end
end

def collection_spotlight(limit: 4)
  member_ids = object.group_memberships.map(&:user_id)
  return [] if member_ids.empty?

  BggThing
    .select("bgg_things.*, COUNT(bgg_collections.id) AS owner_count")
    .joins(:bgg_collections)
    .where(bgg_collections: { user_id: member_ids })
    .group("bgg_things.id")
    .order("owner_count DESC, average DESC, name ASC")
    .limit(limit)
end
```

**Security / validation pattern:** clamp `limit` to prevent abuse (e.g., `limit = [[limit.to_i, 1].max, 12].min`).

---

### `app/graphql/types/query_type.rb` (GraphQL resolver, request-response)

**Analog:** `app/graphql/types/query_type.rb` (existing `group` resolver).

**Eager-loading resolver pattern** (lines 64-66):
```ruby
def group(token:)
  Group.find_by(invite_code: token) || context[:current_user]&.groups&.find_by(id: token)
end
```

**Core pattern: add eager loading** (from `08-RESEARCH.md` Pattern 2):
```ruby
def group(token:)
  Group.includes(
    :owner,
    { group_memberships: :user },
    { night_sessions: [:host, { attendances: :user }] }
  ).find_by(invite_code: token) ||
    context[:current_user]&.groups&.find_by(id: token)
end
```

**N+1 avoidance pattern:** `NightSessionType#attendee_count` should use loaded records when available (from `08-RESEARCH.md` Pitfall 1):
```ruby
def attendee_count
  if object.association(:attendances).loaded?
    object.attendances.count { |a| a.response == "going" }
  else
    object.attendances.where(response: "going").count
  end
end
```

---

### `app/frontend/apollo/queries/group.graphql` (GraphQL query, request-response)

**Analog:** `app/frontend/apollo/queries/group.graphql` (existing full collection query).

**Bounded hub query pattern** (lines 1-51):
```graphql
query Group($token: String!) {
  group(token: $token) {
    id
    name
    description
    inviteCode
    myRole
    owner { id username displayName }
    members { id username displayName }
    memberships {
      id
      role
      user { id username displayName }
    }
    collection {
      items { ... }
      syncStatuses { ... }
    }
  }
}
```

**Core pattern: reshape to bounded hub query** (from `08-RESEARCH.md` Pattern 1):
```graphql
query Group($token: String!) {
  group(token: $token) {
    id
    name
    description
    inviteCode
    myRole
    owner { id displayName }
    members { id displayName }
    memberships {
      id
      role
      user { id username displayName }
    }
    sessions {
      id
      title
      state
      scheduledAt
      attendeeCount
    }
    collectionSpotlight(limit: 4) {
      id
      name
      thumbnail
      average
      owners { bggUsername }
    }
  }
}
```

**Workflow note:** After editing, run `bin/rails graphql:schema:dump` then `npm run codegen` to regenerate `generated/operations.ts` and `generated/types.ts`.

---

### `app/frontend/views/GroupView.vue` (view, request-response)

**Analog:** `app/frontend/views/GroupView.vue` (existing route wrapper).

**Imports / Apollo query pattern** (lines 1-15):
```vue
<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useGroupQuery } from '@/generated/operations'
import AppShell from '@/components/layout/AppShell.vue'
import GroupDetail from '@/components/group/GroupDetail.vue'
import EmptyState from '@/components/collection/EmptyState.vue'

const route = useRoute()

const token = computed(() => String(route.params.token))
const { result, loading, error } = useGroupQuery(() => ({ token: token.value }))

const group = computed(() => result.value?.group)
</script>
```

**Core pattern: error/empty states** (lines 17-41):
```vue
<template>
  <AppShell>
    <div class="p-4 md:p-6">
      <div v-if="loading" class="text-sm text-neutral-500">Loading group...</div>

      <EmptyState
        v-else-if="error"
        heading="Couldn’t load this page"
        body="Please check your connection and try again."
      />

      <GroupDetail
        v-else-if="group"
        :group="group"
        :loading="loading"
      />

      <EmptyState
        v-else
        heading="Group not found"
        body="This group doesn’t exist or you don’t have access to it."
      />
    </div>
  </AppShell>
</template>
```

**Expected change:** Replace the simple text-loading state with Phase 5 `Skeleton` placeholders for the header, sessions, spotlight, members, and invite cards as specified in `08-UI-SPEC.md` §Loading States.

---

### `app/frontend/components/group/GroupDetail.vue` (component, request-response)

**Analog:** `app/frontend/components/group/GroupDetail.vue` (existing layout).

**Imports / composition pattern** (lines 1-31):
```vue
<script setup lang="ts">
import { computed } from 'vue'
import type { Group, MergedThing } from '@/generated/types'
import { useRemoveGroupMemberMutation, useUpdateGroupMemberRoleMutation } from '@/generated/operations'
import GameGrid from '@/components/collection/GameGrid.vue'
import MemberList from './MemberList.vue'
import InviteLink from './InviteLink.vue'

const allGames = computed(() => (props.group.collection?.items ?? []) as MergedThing[])
const memberships = computed(() => props.group.memberships ?? [])

async function handleRemove(membership: { id: string; user: { id: string } }) {
  await removeMember({ groupId: props.group.id, userId: membership.user.id })
}

async function handleUpdateRole(membership: { id: string; user: { id: string } }, role: string) {
  await updateRole({ groupId: props.group.id, userId: membership.user.id, role })
}
</script>
```

**Core layout pattern** (lines 33-56):
```vue
<template>
  <div class="space-y-6">
    <header class="space-y-2">
      <h1 class="text-2xl font-bold text-neutral-800">{{ group.name }}</h1>
      <p v-if="group.description" class="text-neutral-600">{{ group.description }}</p>
    </header>

    <InviteLink v-if="group.myRole === 'OWNER' || group.myRole === 'ADMIN'" :group="group" />

    <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
      <aside class="lg:col-span-1">
        <MemberList
          :memberships="memberships"
          :group="group"
          @remove="handleRemove"
          @updateRole="handleUpdateRole"
        />
      </aside>

      <section class="lg:col-span-3">
        <GameGrid :games="allGames" :loading="loading" />
      </section>
    </div>
  </div>
</template>
```

**New layout pattern** (from `08-RESEARCH.md` Pattern 5 / `08-UI-SPEC.md` §Responsive Layout):
```vue
<template>
  <div class="space-y-6">
    <GroupHeader :group="group" />

    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <div class="lg:col-span-8 space-y-6">
        <GroupSessionsList :sessions="group.sessions" :group="group" />
        <GroupCollectionSpotlight :games="group.collectionSpotlight" :group="group" />
      </div>

      <aside class="lg:col-span-4 space-y-6 lg:sticky lg:top-6 lg:self-start">
        <GroupMembersPanel :memberships="group.memberships" :group="group" />
        <InviteCard v-if="group.myRole === 'OWNER' || group.myRole === 'ADMIN'" :group="group" />
      </aside>
    </div>
  </div>
</template>
```

**Key preservation:** Keep the `remove` and `updateRole` handlers and pass them into `GroupMembersPanel`; add a `createSession` handler that updates Apollo cache for the new `Group.sessions` list.

---

### `app/frontend/components/group/GroupHeader.vue` (component, request-response)

**Analog:** `app/frontend/components/group/GroupDetail.vue` header block (lines 35-38) + `app/frontend/components/group/InviteLink.vue` role gate (line 40).

**Imports / role gate pattern**:
```vue
<script setup lang="ts">
import type { Group } from '@/generated/types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Icon } from '@/components/ui/icon'

interface Props {
  group: Group
}
const props = defineProps<Props>()

const canCreateNight = computed(() =>
  props.group.myRole === 'OWNER' || props.group.myRole === 'ADMIN'
)
</script>
```

**Core pattern: responsive header** (from `08-UI-SPEC.md` §Group Header):
```vue
<template>
  <header class="space-y-2">
    <div class="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
      <div>
        <h1 class="text-display font-semibold text-on-surface">{{ group.name }}</h1>
        <div class="flex flex-wrap items-center gap-2 mt-2">
          <Badge variant="draft">{{ group.members.length }} members</Badge>
          <p v-if="group.description" class="text-body text-on-surface-variant">
            {{ group.description }}
          </p>
        </div>
      </div>
      <Button v-if="canCreateNight" variant="primary" class="hidden lg:inline-flex">
        <Icon name="add" class="size-4" />
        Create a night
      </Button>
    </div>
    <Button v-if="canCreateNight" variant="primary" class="w-full lg:hidden">
      <Icon name="add" class="size-4" />
      Create a night
    </Button>
  </header>
</template>
```

**No existing analog for:** the full M3-styled responsive header with display typography and mobile CTA placement.

---

### `app/frontend/components/group/GroupSessionsList.vue` (component, request-response)

**Analog:** `app/frontend/components/session/SessionSummary.vue` (if present) or `app/frontend/components/group/GroupDetail.vue` (general list composition). No strong existing analog for a session list in the group context.

**Imports / list pattern**:
```vue
<script setup lang="ts">
import { computed } from 'vue'
import type { Group, NightSession } from '@/generated/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarGroup } from '@/components/ui/avatar'
import EmptyState from '@/components/collection/EmptyState.vue'

interface Props {
  sessions: NightSession[]
  group: Group
}
const props = defineProps<Props>()

const isManager = computed(() =>
  props.group.myRole === 'OWNER' || props.group.myRole === 'ADMIN'
)
</script>
```

**Core pattern: role-aware empty state + row** (from `08-UI-SPEC.md` §Upcoming Sessions List):
```vue
<template>
  <Card>
    <CardHeader>
      <CardTitle>Upcoming sessions</CardTitle>
    </CardHeader>
    <CardContent>
      <EmptyState
        v-if="sessions.length === 0"
        icon="inbox"
        :heading="isManager ? 'Plan your first game night' : 'No nights planned yet'"
        :body="isManager ? 'Create a night to get everyone on the schedule.' : 'Check back later for upcoming game nights.'"
      />

      <ul v-else class="space-y-3">
        <li v-for="session in sessions" :key="session.id">
          <Card
            class="hover:bg-surface-container-high cursor-pointer"
            @click="$router.push(`/s/${session.id}`)"
          >
            <CardContent class="flex items-center gap-4 p-4">
              <!-- date block or Date TBD -->
              <div class="h-14 w-14 rounded-lg bg-surface-container flex flex-col items-center justify-center">
                <span class="text-label uppercase text-on-surface-variant">JUL</span>
                <span class="text-heading text-on-surface">15</span>
              </div>
              <div class="flex-1 min-w-0">
                <h3 class="text-body font-semibold text-on-surface truncate">{{ session.title }}</h3>
                <Badge :variant="session.state.toLowerCase()">{{ session.state }}</Badge>
              </div>
              <div class="flex items-center gap-3">
                <span class="text-label text-on-surface-variant">{{ session.attendeeCount }} going</span>
                <Button
                  :variant="session.state === 'PICKING' ? 'primary' : 'outline'"
                  size="sm"
                  @click.stop="$router.push(`/s/${session.id}`)"
                >
                  {{ session.state === 'PICKING' ? 'Choose a game' : 'View details' }}
                </Button>
              </div>
            </CardContent>
          </Card>
        </li>
      </ul>
    </CardContent>
  </Card>
</template>
```

**No existing analog for:** backend-enforced ordering of `picking` → invited by `scheduledAt` → undated drafts; the data comes from the new `GroupType.sessions` field.

---

### `app/frontend/components/group/GroupCollectionSpotlight.vue` (component, request-response)

**Analog:** `app/frontend/components/collection/GameCard.vue` (compact card with image, rating badge, owner avatars).

**Imports / card pattern** (from `GameCard.vue` lines 1-46):
```vue
<script setup lang="ts">
import { computed } from 'vue'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import MemberAvatar from '@/components/common/MemberAvatar.vue'

const hasAverage = computed(() => props.average != null && props.average > 0)

function openBgg() {
  window.open(`https://boardgamegeek.com/boardgame/${props.id}`, '_blank')
}
</script>
```

**Image + fallback pattern** (from `GameCard.vue` lines 54-65):
```vue
<img
  v-if="thumbnail"
  :src="thumbnail"
  :alt="name"
  class="w-full aspect-[4/3] object-cover bg-surface-container"
/>
<div
  v-else
  class="w-full aspect-[4/3] bg-surface-variant flex items-center justify-center text-on-surface-variant text-sm"
>
  No image
</div>
```

**Core pattern: compact spotlight card** (from `08-RESEARCH.md` / `08-UI-SPEC.md`):
```vue
<script setup lang="ts">
import { computed } from 'vue'
import type { Group, MergedThing } from '@/generated/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarGroup, AvatarGroupCount } from '@/components/ui/avatar'
import { useMemberColor } from '@/composables/useMemberColor'

interface Props {
  games: MergedThing[]
  group: Group
}
const props = defineProps<Props>()

const visibleOwners = (game: MergedThing) => game.owners.slice(0, 3)
const overflow = (game: MergedThing) => Math.max(0, game.owners.length - 3)
</script>

<template>
  <Card>
    <CardHeader class="flex items-center justify-between">
      <CardTitle>Shared collection spotlight</CardTitle>
      <RouterLink
        :to="`/collection?group=${group.inviteCode}`"
        class="text-sm text-primary font-medium hover:underline"
      >
        Browse Library
      </RouterLink>
    </CardHeader>
    <CardContent>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div
          v-for="game in games"
          :key="game.id"
          class="group cursor-pointer"
          @click="window.open(`https://boardgamegeek.com/boardgame/${game.id}`, '_blank')"
        >
          <div class="aspect-[4/3] rounded-lg bg-surface-variant overflow-hidden">
            <img v-if="game.thumbnail" :src="game.thumbnail" :alt="game.name" class="w-full h-full object-cover" />
            <div v-else class="w-full h-full flex items-center justify-center text-on-surface-variant text-sm">No image</div>
          </div>
          <h3 class="mt-2 text-label font-semibold line-clamp-2 text-on-surface">{{ game.name }}</h3>
          <Badge v-if="game.average" variant="invited" class="mt-1">{{ game.average.toFixed(1) }}</Badge>
          <AvatarGroup class="mt-2">
            <Avatar
              v-for="owner in visibleOwners(game)"
              :key="owner.bggUsername"
              :class="useMemberColor(owner.bggUsername)"
              class="h-5 w-5 text-[10px]"
            >
              <AvatarFallback>{{ owner.bggUsername.charAt(0).toUpperCase() }}</AvatarFallback>
            </Avatar>
            <AvatarGroupCount v-if="overflow(game) > 0">+{{ overflow(game) }}</AvatarGroupCount>
          </AvatarGroup>
        </div>
      </div>
    </CardContent>
  </Card>
</template>
```

**No existing analog for:** SQL-ordered owner-count spotlight. The selection logic lives in `GroupType.collection_spotlight`.

---

### `app/frontend/components/group/GroupMembersPanel.vue` (component, request-response)

**Analog:** `app/frontend/components/group/MemberList.vue` (exact role-check, inline remove confirmation, role change).

**Imports / role helpers pattern** (from `MemberList.vue` lines 1-45):
```vue
<script setup lang="ts">
import { ref } from 'vue'
import type { Group, GroupMembership } from '@/generated/types'

const props = defineProps<{
  memberships: GroupMembership[]
  group: Pick<Group, 'id' | 'myRole' | 'owner'>
}>()

const confirmingRemoveId = ref<string | null>(null)

function roleLabel(role: string): string {
  switch (role) {
    case 'OWNER': return 'Owner'
    case 'ADMIN': return 'Admin'
    case 'MEMBER': default: return 'Member'
  }
}

const canManage = (membership: GroupMembership) => {
  return props.group.myRole === 'OWNER' ||
    (props.group.myRole === 'ADMIN' && membership.user.id !== props.group.owner.id)
}

const canChangeRole = (membership: GroupMembership) => {
  return props.group.myRole === 'OWNER' && membership.user.id !== props.group.owner.id
}
</script>
```

**Inline remove confirmation pattern** (from `MemberList.vue` lines 46-57, 109-132):
```vue
<script setup>
function askRemove(membership: GroupMembership) {
  confirmingRemoveId.value = membership.id
}

function confirmRemove(membership: GroupMembership) {
  emit('remove', membership)
  confirmingRemoveId.value = null
}

function cancelRemove() {
  confirmingRemoveId.value = null
}
</script>

<template>
  <div
    v-if="confirmingRemoveId === membership.id"
    class="mt-2 p-2 bg-red-50 rounded border border-red-200 text-sm"
  >
    <p class="text-red-800 mb-2">
      Remove member: {{ membership.user.displayName }} will be removed from the group and their games will no longer appear in the shared collection.
    </p>
    <div class="flex gap-2">
      <button
        type="button"
        class="px-3 py-1.5 bg-red-600 text-white text-xs font-medium rounded hover:bg-red-700"
        @click="confirmRemove(membership)"
      >
        Remove
      </button>
      <button
        type="button"
        class="px-3 py-1.5 bg-white border border-neutral-300 text-neutral-700 text-xs font-medium rounded hover:bg-neutral-50"
        @click="cancelRemove"
      >
        Cancel
      </button>
    </div>
  </div>
</template>
```

**Core pattern: M3 restyle with DropdownMenu + Select** (from `08-UI-SPEC.md` §Members Panel):
```vue
<template>
  <Card>
    <CardHeader><CardTitle>Members</CardTitle></CardHeader>
    <CardContent>
      <ul class="space-y-2">
        <li v-for="membership in memberships" :key="membership.id">
          <div class="flex items-center justify-between p-2">
            <div class="flex items-center gap-3">
              <Avatar :class="useMemberColor(membership.user.username)">
                <AvatarFallback>{{ membership.user.username.charAt(0).toUpperCase() }}</AvatarFallback>
              </Avatar>
              <div>
                <p class="text-sm font-medium text-on-surface">{{ membership.user.displayName }}</p>
                <p class="text-label uppercase tracking-wide text-on-surface-variant">{{ roleLabel(membership.role) }}</p>
              </div>
            </div>
            <DropdownMenu v-if="canManage(membership) || canChangeRole(membership)">
              <DropdownMenuTrigger as-child>
                <Button variant="ghost" size="icon" :aria-label="`Actions for ${membership.user.displayName}`">
                  <Icon name="more_vert" class="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem v-if="canChangeRole(membership)" @click="changeRole(membership, membership.role === 'MEMBER' ? 'ADMIN' : 'MEMBER')">
                  {{ membership.role === 'MEMBER' ? 'Make admin' : 'Change role to member' }}
                </DropdownMenuItem>
                <DropdownMenuItem variant="destructive" @click="askRemove(membership)">
                  Remove from group
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div v-if="confirmingRemoveId === membership.id" role="alert" class="mt-2 p-4 rounded-lg border border-outline bg-error-container">
            <p class="text-sm text-on-surface-variant">
              Remove <span class="font-medium text-on-surface">{{ membership.user.displayName }}</span>? They will be removed from the group and their games will no longer appear in the shared collection.
            </p>
            <div class="flex gap-2 mt-3">
              <Button variant="destructive" size="sm" @click="confirmRemove(membership)">Remove</Button>
              <Button variant="outline" size="sm" @click="cancelRemove">Cancel</Button>
            </div>
          </div>
        </li>
      </ul>
    </CardContent>
  </Card>
</template>
```

**Key difference from analog:** Replace native `<select>` and `<button>` with Phase 5 `Select`/`DropdownMenu`/`Button` primitives; use M3 tokens; no menu unless the caller has an authorized action.

---

### `app/frontend/components/group/InviteCard.vue` (component, request-response)

**Analog:** `app/frontend/components/group/InviteLink.vue` (exact copy-link + email invite logic).

**Imports / mutation pattern** (from `InviteLink.vue` lines 1-33):
```vue
<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Group } from '@/generated/types'
import { useInviteToGroupMutation } from '@/generated/operations'

const props = defineProps<{
  group: Pick<Group, 'id' | 'inviteCode' | 'myRole'>
}>()

const inviteUrl = computed(() => `${window.location.origin}/g/${props.group.inviteCode}`)
const copied = ref(false)
const email = ref('')
const role = ref('MEMBER')
const { mutate: invite, loading, error } = useInviteToGroupMutation()

async function copyLink() {
  try {
    await navigator.clipboard.writeText(inviteUrl.value)
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  } catch {
    // ignore
  }
}

async function sendInvite() {
  if (!email.value) return
  await invite({ groupId: props.group.id, email: email.value, role: role.value })
  email.value = ''
}
</script>
```

**Core pattern: M3 restyle as combined card** (from `08-UI-SPEC.md` §Invite Card):
```vue
<template>
  <Card>
    <CardHeader><CardTitle>Invite people</CardTitle></CardHeader>
    <CardContent class="space-y-4">
      <div class="space-y-2">
        <label class="text-sm font-medium text-on-surface">Invite link</label>
        <div class="flex gap-2">
          <Input :model-value="inviteUrl" readonly aria-label="Invite link" />
          <Button variant="outline" size="icon" @click="copyLink">
            <Icon name="content_copy" class="size-4" />
          </Button>
        </div>
        <p v-if="copied" class="text-sm text-primary" aria-live="polite">Copied!</p>
      </div>

      <div class="border-t border-outline pt-4 space-y-3">
        <form class="flex gap-2" @submit.prevent="sendInvite">
          <Input v-model="email" type="email" required placeholder="Email address" />
          <Select v-model="role">
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="MEMBER">Member</SelectItem>
              <SelectItem v-if="group.myRole === 'OWNER'" value="ADMIN">Admin</SelectItem>
            </SelectContent>
          </Select>
          <Button type="submit" variant="primary" :disabled="loading">Send invite</Button>
        </form>
        <p v-if="error" class="text-sm text-error">{{ error.message }}</p>
      </div>
    </CardContent>
  </Card>
</template>
```

**Key difference from analog:** Use Phase 5 `Card`, `Input`, `Button`, `Select`, `Icon`; split into invite-link section and email-invite section with a divider; use `aria-live="polite"` for copy success.

---

### `app/frontend/apollo/mutations/remove_group_member.graphql` + `app/graphql/mutations/remove_group_member.rb` (GraphQL mutation, request-response)

**Analog:** `app/graphql/mutations/remove_group_member.rb` (existing authorization) and `app/frontend/apollo/mutations/remove_group_member.graphql`.

**Backend authorization pattern** (from `app/graphql/mutations/remove_group_member.rb` lines 10-31):
```ruby
def resolve(group_id:, user_id:)
  raise GraphQL::ExecutionError, "Authentication required" unless context[:current_user]

  group = Group.find_by(id: group_id)
  raise GraphQL::ExecutionError, "Group not found" unless group

  caller_membership = group.group_memberships.find_by(user_id: context[:current_user].id)
  unless caller_membership&.role.in?(%w[owner admin])
    raise GraphQL::ExecutionError, "Only group owners or admins can remove members"
  end

  target_membership = group.group_memberships.find_by(user_id: user_id)
  raise GraphQL::ExecutionError, "Member not found" unless target_membership

  if target_membership.role == "owner"
    raise GraphQL::ExecutionError, "Cannot remove the group owner"
  end

  target_membership.destroy!

  { success: true }
end
```

**Optional extension for Apollo cache** (from `08-RESEARCH.md` Open Question 4 / `08-UI-SPEC.md` §Apollo Cache Interaction):
```ruby
field :membership, Types::GroupMembershipType, null: true
# or
field :removed_membership_id, ID, null: true

def resolve(group_id:, user_id:)
  # ... existing checks ...
  removed_id = target_membership.to_global_id.to_s
  target_membership.destroy!
  { success: true, removed_membership_id: removed_id }
end
```

```graphql
mutation RemoveGroupMember($groupId: ID!, $userId: ID!) {
  removeGroupMember(groupId: $groupId, userId: $userId) {
    success
    removedMembershipId
  }
}
```

**Alternative:** Keep `{ success }` and use `refetchQueries: ['Group']` in the component as a fallback.

---

### `spec/graphql/group_query_spec.rb` (test, request-response)

**Analog:** `spec/graphql/group_query_spec.rb` (existing GraphQL query spec).

**Test pattern** (from `spec/graphql/group_query_spec.rb` lines 1-79):
```ruby
require "rails_helper"

RSpec.describe "group query" do
  let(:query) do
    <<~GRAPHQL
      query Group($token: String!) {
        group(token: $token) {
          id
          name
          inviteCode
          myRole
          # ... existing fields ...
        }
      }
    GRAPHQL
  end

  let(:owner) { User.create!(username: "owner", email: "owner@example.com", password: "password") }
  let(:member) { User.create!(username: "member", email: "member@example.com", password: "password") }
  let(:group) { Group.create!(name: "Night Owls", owner: owner) }

  before do
    GroupMembership.create!(user: owner, group: group, role: "owner")
  end

  it "returns a group by invite_code" do
    result = BoardgameNightSchema.execute(query, variables: { token: group.invite_code }, context: { current_user: owner })
    expect(result["errors"]).to be_nil
    data = result.dig("data", "group")
    expect(data["name"]).to eq("Night Owls")
  end
end
```

**Core pattern: add new assertions** (from `08-RESEARCH.md` / `08-UI-SPEC.md`):
```ruby
it "returns sessions ordered with picking first, then invited by scheduled_at, then drafts" do
  # create sessions in various states and assert order
end

it "hides draft sessions from ordinary members" do
  # create a draft session, query as member, assert not present
end

it "returns collection spotlight ordered by owner count, rating, name" do
  # create multiple BggCollection rows, assert the 4 returned ids
end

it "clamps collectionSpotlight limit" do
  # request limit > 12 and expect clamping or error
end
```

---

## Shared Patterns

### GraphQL Schema / Codegen Workflow

**Source:** `08-RESEARCH.md` §Architecture Patterns / `app/graphql/boardgame_night_schema.rb` (orphan types)
**Apply to:** All GraphQL type/query/mutation changes

1. Add new fields to `GroupType` or `QueryType` as nullable or with safe default arguments.
2. Ensure new types are reachable via `BoardgameNightSchema.orphan_types` (already includes `GroupType`, `NightSessionType`, `MergedThingType`).
3. Run `bin/rails graphql:schema:dump`.
4. Run `npm run codegen`.
5. Verify `generated/operations.ts` and `generated/types.ts` include the new fields and `Group.sessions` / `Group.collectionSpotlight`.

---

### Role-Aware Authorization

**Backend source:** `app/graphql/mutations/create_night_session.rb` lines 39-42 and `app/graphql/mutations/remove_group_member.rb` lines 16-19; `app/graphql/mutations/update_group_member_role.rb` lines 20-23.
**Frontend source:** `app/frontend/components/group/MemberList.vue` lines 37-44.
**Apply to:** `GroupHeader`, `GroupSessionsList`, `GroupMembersPanel`, `InviteCard`.

```ruby
# Backend: check membership role before mutation
caller_membership = group.group_memberships.find_by(user_id: context[:current_user].id)
unless group.owner_id == context[:current_user].id || (membership && %w[owner admin].include?(membership.role))
  raise GraphQL::ExecutionError, "You must be an owner or admin of the group to create a session"
end
```

```typescript
// Frontend: mirror for UX but do not rely on it
const isManager = computed(() =>
  props.group.myRole === 'OWNER' || props.group.myRole === 'ADMIN'
)
```

---

### Apollo Cache Updates for List Mutations

**Source:** `08-RESEARCH.md` Pattern 6 / `08-UI-SPEC.md` §Apollo Cache Interaction.
**Apply to:** `createNightSession` in `GroupHeader` (or `GroupDetail`); `removeGroupMember` in `GroupMembersPanel`.

```typescript
import { gql } from '@apollo/client'
import { useCreateNightSessionMutation } from '@/generated/operations'

const { mutate: createSession } = useCreateNightSessionMutation({
  update(cache, { data }) {
    const session = data?.createNightSession?.session
    if (!session) return

    cache.modify({
      id: cache.identify({ __typename: 'Group', id: props.group.id }),
      fields: {
        sessions(existing = []) {
          const newRef = cache.writeFragment({
            data: session,
            fragment: gql`
              fragment NewSession on NightSession {
                id
                title
                state
                scheduledAt
                attendeeCount
              }
            `
          })
          return [...existing, newRef]
        }
      }
    })
  }
})
```

---

### Material 3 Token Styling

**Source:** `app/frontend/entrypoints/styles.css` lines 6-250.
**Apply to:** All new Vue components.

Use these exact token classes instead of hard-coded colors:
- `bg-surface` / `bg-surface-container` / `bg-surface-container-high`
- `text-on-surface` / `text-on-surface-variant` / `text-primary` / `text-error`
- `border-outline`
- `bg-error-container` / `text-on-error-container` for destructive confirmation
- `shadow-card` / `hover:shadow-md` / `hover:-translate-y-1 transition-all duration-300` for interactive cards

```css
/* Elevation guide from styles.css lines 245-250 */
/* Level 0: bg-surface (page background) */
/* Level 1: bg-surface-container border-outline (cards, sheets) */
/* Level 2: bg-surface-container-high (hovered/raised cards) */
```

---

### Responsive Sticky Side Rail

**Source:** `08-RESEARCH.md` Pattern 5 / `08-UI-SPEC.md` §Responsive Layout.
**Apply to:** `GroupDetail.vue` layout.

```vue
<div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
  <div class="lg:col-span-8 space-y-6">
    <GroupSessionsList />
    <GroupCollectionSpotlight />
  </div>
  <aside class="lg:col-span-4 space-y-6 lg:sticky lg:top-6 lg:self-start">
    <GroupMembersPanel />
    <InviteCard v-if="group.myRole === 'OWNER' || group.myRole === 'ADMIN'" :group="group" />
  </aside>
</div>
```

**Constraint:** DOM order must be `header → sessions → spotlight → members → invite` so mobile stacks correctly without visual reordering.

---

### Primitive Import Paths

**Source:** `app/frontend/components/ui/*` barrel exports (implied by `08-RESEARCH.md` and `05-UI-SPEC.md`).
**Apply to:** All new Vue components.

```typescript
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarGroup, AvatarGroupCount } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { Icon } from '@/components/ui/icon'
```

---

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `app/frontend/components/group/GroupHeader.vue` | component | request-response | No standalone group header component exists; closest analog is the inline header in `GroupDetail.vue`. |
| `app/frontend/components/group/GroupSessionsList.vue` | component | request-response | No group-scoped session list exists in the codebase; sessions are surfaced only in `NightSessionType` / `SessionSummary.vue`. |
| `app/frontend/components/group/GroupCollectionSpotlight.vue` | component | request-response | No compact spotlight/grid-preview component exists; `GameCard.vue` is the closest card analog but not a 4-game grid. |
| Apollo `cache.modify` update pattern | cache utility | request-response | No existing component uses `cache.modify` or `cache.writeFragment`; the pattern must be introduced from Apollo docs / `08-RESEARCH.md`. |
| SQL spotlight ordering by owner count | resolver query | request-response | No existing resolver computes a group-scoped owner-count sort; `BggThing.merged_for_users` is the closest query analog. |

## Metadata

**Analog search scope:** `app/frontend/components/group/*`, `app/frontend/components/collection/*`, `app/frontend/components/ui/*`, `app/frontend/views/*`, `app/frontend/composables/*`, `app/frontend/apollo/queries/*`, `app/frontend/apollo/mutations/*`, `app/graphql/types/*`, `app/graphql/mutations/*`, `app/models/*`, `spec/graphql/*`, `spec/frontend/*`
**Files scanned:** 35+
**Pattern extraction date:** 2026-07-15
