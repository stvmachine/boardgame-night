import { ref, watch } from 'vue'
import { defineStore } from 'pinia'
import { useRoute, useRouter } from 'vue-router'

function normalize(username: string): string {
  return username.trim().toLowerCase()
}

export const useCollectorsStore = defineStore('collectors', () => {
  const route = (() => {
    try { return useRoute() } catch { return null }
  })()
  const router = (() => {
    try { return useRouter() } catch { return null }
  })()

  const usernames = ref<string[]>([])

  function add(username: string) {
    const normalized = normalize(username)
    if (normalized && !usernames.value.includes(normalized)) {
      usernames.value.push(normalized)
    }
  }

  function remove(username: string) {
    const normalized = normalize(username)
    usernames.value = usernames.value.filter(u => u !== normalized)
  }

  function set(rawUsernames: string[]) {
    usernames.value = rawUsernames.map(normalize).filter(Boolean)
  }

  function syncWithRoute(rawUsernames: string | string[] | null | undefined) {
    const str = Array.isArray(rawUsernames) ? rawUsernames[0] : rawUsernames
    usernames.value = String(str ?? '')
      .split(',')
      .map(s => normalize(s))
      .filter(Boolean)
  }

  if (route) {
    watch(
      () => route.query.usernames,
      (raw) => {
        syncWithRoute(raw as string | string[] | null | undefined)
      },
      { immediate: true }
    )
  }

  if (router && route) {
    watch(
      () => usernames.value,
      (newUsernames) => {
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
  }

  return { usernames, add, remove, set, syncWithRoute }
})