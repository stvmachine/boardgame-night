<script setup lang="ts">
import { watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useCurrentUserQuery } from '@/generated/operations'
import { useAuthStore } from '@/stores/auth'
import { useCollectorsStore } from '@/stores/collectors'

function normalize(username: string): string {
  return username.trim().toLowerCase()
}

function parseUsernames(raw: string | string[] | null | undefined): string[] {
  const str = Array.isArray(raw) ? raw[0] : raw
  return String(str ?? '')
    .split(',')
    .map(normalize)
    .filter(Boolean)
}

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const collectorsStore = useCollectorsStore()
const { result: currentUserResult, refetch: refetchCurrentUser } = useCurrentUserQuery(
  () => ({}),
  () => ({ fetchPolicy: 'cache-and-network' })
)

watch(
  () => authStore.token,
  (token, previousToken) => {
    if (token && token !== previousToken) {
      refetchCurrentUser()
    }
  }
)

// URL -> store: keep store in sync with URL query param across all route changes.
watch(
  () => route.query.usernames,
  (raw) => {
    collectorsStore.set(parseUsernames(raw))
  },
  { immediate: true }
)

// Store -> URL: write back only when on the collection route.
watch(
  () => collectorsStore.usernames,
  (newUsernames) => {
    if (route.name !== 'collection') return
    const query = { ...route.query }
    if (newUsernames.length) {
      query.usernames = newUsernames.join(',')
    } else {
      delete query.usernames
    }
    router.replace({ query })
  },
  { deep: true }
)

// The signed-in user's bound BGG account is a protected collector: it is added
// initially and restored if route hydration or another action attempts to remove it.
watch(
  [
    () => currentUserResult.value?.currentUser?.bggUsername,
    () => collectorsStore.usernames
  ],
  ([bggUsername]) => {
    const username = normalize(bggUsername ?? '')
    if (username && !collectorsStore.usernames.includes(username)) {
      collectorsStore.add(username)
    }
  },
  { immediate: true }
)
</script>

<template>
  <slot />
</template>
