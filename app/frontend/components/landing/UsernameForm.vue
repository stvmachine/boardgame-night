<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useDebounceFn } from '@vueuse/core'
import {
  useValidateBggUsernameMutation,
  useSearchLazyQuery
} from '../../generated/operations'
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

function showCollection() {
  if (usernames.value.length === 0) return
  store.set(usernames.value)
  router.push({ path: '/collection', query: { usernames: usernames.value.join(',') } })
}

function handleSearchInput() {
  debouncedSearch()
}

const canShowCollection = computed(() => usernames.value.length > 0)
</script>

<template>
  <div class="space-y-6">
    <div class="space-y-2">
      <label for="username-input" class="text-sm font-medium text-neutral-700">
        Enter BoardGameGeek usernames
      </label>
      <input
        id="username-input"
        v-model="usernameInput"
        type="text"
        placeholder="Type a username and press Enter"
        class="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        @keydown="handleUsernameKeydown"
      />

      <div v-if="usernames.length > 0" class="flex flex-wrap gap-2 pt-2">
        <span
          v-for="username in usernames"
          :key="username"
          class="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-2.5 py-1 text-sm"
        >
          <span
            v-if="validationStatus[username]?.loading"
            class="h-3.5 w-3.5 animate-spin rounded-full border-2 border-neutral-300 border-t-indigo-600"
          />
          <span
            v-else-if="validationStatus[username]?.valid && validationStatus[username]?.exists"
            class="text-green-600"
            title="Valid BGG user"
          >✓</span>
          <span
            v-else-if="validationStatus[username]?.valid && !validationStatus[username]?.exists"
            class="text-amber-600"
            title="Format valid, but user not found on BGG"
          >?</span>
          <span
            v-else
            class="text-red-600"
            title="Invalid username"
          >✕</span>
          <span class="text-neutral-700">{{ username }}</span>
          <button
            type="button"
            class="text-neutral-400 hover:text-red-600"
            aria-label="Remove username"
            @click="removeUsername(username)"
          >
            ×
          </button>
        </span>
      </div>
    </div>

    <button
      type="button"
      class="w-full rounded-md bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:bg-neutral-300"
      :disabled="!canShowCollection"
      @click="showCollection"
    >
      Show collection
    </button>

    <div class="space-y-2">
      <label for="search-input" class="text-sm font-medium text-neutral-700">
        Search BGG games
      </label>
      <input
        id="search-input"
        v-model="searchInput"
        type="text"
        placeholder="Search games…"
        class="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        @input="handleSearchInput"
      />

      <div v-if="searching" class="text-sm text-neutral-500">Searching…</div>
      <ul v-else-if="searchResult?.search?.length" class="divide-y divide-neutral-100 rounded-md border border-neutral-200 bg-white">
        <li
          v-for="game in searchResult.search"
          :key="game.id"
          class="px-3 py-2 text-sm"
        >
          <a
            :href="`https://boardgamegeek.com/boardgame/${game.id}`"
            target="_blank"
            class="hover:text-indigo-600"
          >
            {{ game.name }}
            <span v-if="game.yearPublished" class="text-neutral-500">({{ game.yearPublished }})</span>
          </a>
        </li>
      </ul>
    </div>
  </div>
</template>
