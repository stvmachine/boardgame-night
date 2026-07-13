<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useCollectorsStore } from '@/stores/collectors'
import { useFilterStore } from '@/stores/filters'
import { useUiStore } from '@/stores/ui'
import { useMergedCollectionQuery } from '@/generated/operations'
import { useRefreshCollection } from '@/composables/useRefreshCollection'
import { useAuth } from '@/composables/useAuth'
import { Button } from '@/components/ui/button'
import Icon from '@/components/ui/icon/Icon.vue'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import AppNav from '@/components/layout/AppNav.vue'
import CollectorsSection from '@/components/layout/CollectorsSection.vue'
import MemberAvatar from '@/components/common/MemberAvatar.vue'

const router = useRouter()
const authStore = useAuthStore()
const store = useCollectorsStore()
const filterStore = useFilterStore()
const uiStore = useUiStore()

const { selectedOwners } = storeToRefs(filterStore)
const { collectorsOpen } = storeToRefs(uiStore)

const { refresh, isRefreshing, cooldownFor, initFromSyncStatuses } = useRefreshCollection()

const { result } = useMergedCollectionQuery(
  () => ({ usernames: store.usernames }),
  () => ({ fetchPolicy: 'cache-first' })
)

watch(
  () => result.value?.mergedCollection.syncStatuses,
  (syncStatuses) => {
    if (syncStatuses) {
      initFromSyncStatuses(syncStatuses)
    }
  },
  { immediate: true }
)

const newUsername = ref('')

function add() {
  const value = newUsername.value.trim()
  if (value) {
    store.add(value)
    newUsername.value = ''
  }
}

function remove(username: string) {
  store.remove(username)
}

function selectAllOwners() {
  filterStore.selectAllOwners(store.usernames)
}

function deselectAllOwners() {
  filterStore.deselectAllOwners()
}

function handleRefresh(username: string) {
  refresh(username)
}

async function handleLogout() {
  await useAuth().signOut()
  router.push('/')
}

const isAuthenticated = computed(() => authStore.isAuthenticated)
</script>

<template>
  <div class="p-4 space-y-4 overflow-y-auto flex-1">
    <!-- New Session -->
    <Button
      variant="primary"
      class="w-full"
      @click="router.push('/groups')"
    >
      <Icon name="add" class="mr-2 h-4 w-4" />
      New Session
    </Button>

    <!-- Nav items -->
    <nav class="space-y-1" aria-label="Main navigation">
      <AppNav to="/" icon="home" label="Home" @click="uiStore.closeSidebar" />
      <AppNav to="/collection" icon="view-module" label="Collection" @click="uiStore.closeSidebar" />
      <AppNav to="/hot" icon="local-fire-department" label="Hot" @click="uiStore.closeSidebar" />
      <AppNav to="/groups" icon="group" label="Groups" @click="uiStore.closeSidebar" />
      <AppNav to="/account" icon="person" label="Account" @click="uiStore.closeSidebar" />
    </nav>

    <hr class="border-outline" />

    <!-- Collectors -->
    <Collapsible v-model:open="collectorsOpen">
      <CollapsibleTrigger
        class="flex w-full items-center justify-between rounded-md px-3 py-2 text-sm font-medium text-on-surface hover:bg-surface-container-high focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      >
        <span>Collectors</span>
        <Icon
          name="chevron-right"
          class="h-4 w-4 transition-transform duration-200"
          :class="collectorsOpen ? 'rotate-90' : ''"
        />
      </CollapsibleTrigger>

      <CollapsibleContent class="space-y-3 pt-2">
        <!-- Add collector -->
        <div class="space-y-1">
          <label for="drawer-username" class="text-sm font-medium text-on-surface-variant">
            Add collector
          </label>
          <div class="flex gap-2">
            <input
              id="drawer-username"
              v-model="newUsername"
              type="text"
              placeholder="BGG username"
              class="flex-1 min-w-0 rounded-md border border-outline bg-surface px-3 py-2 text-sm text-on-surface focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary"
              @keydown.enter="add"
            />
            <Button type="button" variant="primary" size="sm" @click="add">
              Add
            </Button>
          </div>
        </div>

        <CollectorsSection
          :usernames="store.usernames"
          :selected="selectedOwners"
          :sync-statuses="result?.mergedCollection.syncStatuses"
          :cooldown-for="cooldownFor"
          :is-refreshing="isRefreshing"
          @toggle="filterStore.toggleOwner"
          @select-all="selectAllOwners"
          @deselect-all="deselectAllOwners"
          @refresh="handleRefresh"
        />

        <div v-if="store.usernames.length === 0" class="text-sm text-on-surface-variant">
          No collectors selected.
        </div>
        <ul v-else class="space-y-2">
          <li
            v-for="username in store.usernames"
            :key="username"
            class="flex items-center justify-between rounded-md border border-outline bg-surface p-2"
          >
            <div class="flex items-center gap-2">
              <MemberAvatar :username="username" size="sm" />
              <span class="text-sm font-medium text-on-surface">{{ username }}</span>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              @click="remove(username)"
            >
              Remove
            </Button>
          </li>
        </ul>
      </CollapsibleContent>
    </Collapsible>
  </div>

  <!-- Bottom section -->
  <div class="p-4 border-t border-outline space-y-1">
    <template v-if="isAuthenticated">
      <AppNav to="/account" icon="settings" label="Settings" @click="uiStore.closeSidebar" />
      <Button
        variant="ghost"
        class="w-full justify-start text-on-surface-variant hover:bg-surface-container-high"
        @click="handleLogout"
      >
        <Icon name="logout" class="mr-3 h-5 w-5" />
        Logout
      </Button>
    </template>
    <template v-else>
      <AppNav to="/login" icon="login" label="Log in" @click="uiStore.closeSidebar" />
      <AppNav to="/signup" icon="person-add" label="Sign up" @click="uiStore.closeSidebar" />
    </template>
  </div>
</template>
