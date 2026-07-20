<script setup lang="ts">
import { watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
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
const collectorsStore = useCollectorsStore()

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
</script>

<template>
  <slot />
</template>
