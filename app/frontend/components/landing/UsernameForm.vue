<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useDebounceFn } from '@vueuse/core'
import {
  useValidateBggUsernameMutation,
  useSearchLazyQuery
} from '../../generated/operations'
import { useCollectorsStore } from '@/stores/collectors'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import Icon from '@/components/ui/icon/Icon.vue'

import { nextTick } from 'vue'

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

const debouncedSearch = useDebounceFn(() => {
  if (searchInput.value.trim().length >= 2) {
    search()
  }
}, 300)

function addUsername(username: string) {
  const normalized = username.trim().toLowerCase()
  if (!normalized || usernames.value.includes(normalized)) return

  usernames.value.push(normalized)
  validationStatus.value[normalized] = { valid: false, exists: false, loading: true }

  validate({ username: normalized }).then((res) => {
    const result = res?.data?.validateBggUsername?.validationResult
    if (result) {
      validationStatus.value[normalized] = {
        valid: result.valid,
        exists: result.exists,
        loading: false
      }
    }
  }).catch(() => {
    validationStatus.value[normalized] = { valid: false, exists: false, loading: false }
  })
}

function handleUsernameKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' || e.key === ',') {
    e.preventDefault()
    addUsername(usernameInput.value)
    usernameInput.value = ''
  }
}

function removeUsername(username: string) {
  usernames.value = usernames.value.filter(u => u !== username)
  delete validationStatus.value[username]
}

async function showCollection() {
  if (usernames.value.length === 0) return
  store.set(usernames.value)
  await nextTick()
  router.push({ path: '/collection', query: { usernames: usernames.value.join(',') } })
}

function handleSearchInput() {
  debouncedSearch()
}

const canShowCollection = computed(() => usernames.value.length > 0)
</script>

<template>
  <div class="space-y-4">
    <div class="space-y-2">
      <label for="username-input" class="text-sm font-semibold text-on-surface">
        Enter BoardGameGeek usernames
      </label>
      <div class="flex flex-col sm:flex-row gap-2">
        <Input
          id="username-input"
          v-model="usernameInput"
          type="text"
          placeholder="Add a BGG username"
          @keydown="handleUsernameKeydown"
        />
        <Button
          type="button"
          class="shrink-0"
          :disabled="!canShowCollection"
          @click="showCollection"
        >
          Merge collections
        </Button>
      </div>

      <div v-if="usernames.length > 0" class="flex flex-wrap gap-2 pt-2">
        <Badge
          v-for="username in usernames"
          :key="username"
          variant="draft"
          class="gap-1 px-2.5 py-1 text-sm"
        >
          <Icon
            v-if="validationStatus[username]?.loading"
            name="progress_activity"
            class="size-3.5 animate-spin"
            aria-hidden="true"
          />
          <span
            v-else-if="validationStatus[username]?.valid && validationStatus[username]?.exists"
            class="text-success"
            title="Valid BGG user"
          >✓</span>
          <span
            v-else-if="validationStatus[username]?.valid && !validationStatus[username]?.exists"
            class="text-warning"
            title="Format valid, but user not found on BGG"
          >?</span>
          <span
            v-else
            class="text-error"
            title="Invalid username"
          >✕</span>
          <span class="text-on-surface">{{ username }}</span>
          <button
            type="button"
            class="text-on-surface-variant hover:text-error"
            aria-label="Remove username"
            @click="removeUsername(username)"
          >
            ×
          </button>
        </Badge>
      </div>
    </div>

    <div class="space-y-2">
      <label for="search-input" class="text-sm font-semibold text-on-surface">
        Search BGG games
      </label>
      <Input
        id="search-input"
        v-model="searchInput"
        type="text"
        placeholder="Search games…"
        @input="handleSearchInput"
      />

      <div v-if="searching" class="text-sm text-on-surface-variant">Searching…</div>
      <ul v-else-if="searchResult?.search?.length" class="divide-y divide-outline rounded-md border border-outline bg-surface">
        <li
          v-for="game in searchResult.search"
          :key="game.id"
          class="px-3 py-2 text-sm"
        >
          <a
            :href="`https://boardgamegeek.com/boardgame/${game.id}`"
            target="_blank"
            rel="noopener noreferrer"
            class="hover:text-primary"
          >
            {{ game.name }}
            <span v-if="game.yearPublished" class="text-on-surface-variant">({{ game.yearPublished }})</span>
          </a>
        </li>
      </ul>
    </div>
  </div>
</template>
