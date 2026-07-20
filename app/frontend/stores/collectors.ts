import { ref, watch } from 'vue'
import { defineStore } from 'pinia'
import { useRoute, useRouter } from 'vue-router'

function normalize(username: string): string {
  return username.trim().toLowerCase()
}

/**
 * Parse a route query "usernames" value (comma-separated string or array)
 * into a normalized string array.
 */
function parseQueryParam(raw: string | string[] | null | undefined): string[] {
  const str = Array.isArray(raw) ? raw[0] : raw
  return String(str ?? '')
    .split(',')
    .map(s => normalize(s))
    .filter(Boolean)
}

export const useCollectorsStore = defineStore('collectors', () => {
  const route = (() => {
    try { return useRoute() } catch { return null }
  })()
  const router = (() => {
    try { return useRouter() } catch { return null }
  })()

  const usernames = ref<string[]>([])
  let hydrated = false

  /** Hydrate from URL query param on cold start (shared link, initial load). */
  function hydrateFromUrl(raw: string | string[] | null | undefined) {
    if (hydrated) return
    const parsed = parseQueryParam(raw)
    if (parsed.length > 0) {
      usernames.value = parsed
    }
    hydrated = true
  }

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

  // One-shot hydration from URL on store creation (cold start / shared link).
  hydrateFromUrl(route?.query?.usernames as string | string[] | null | undefined)

  // Write-back: sync in-memory state → URL query param, but only on the
  // collection page so we don't pollute non-collection routes with ?usernames=.
  if (router && route) {
    watch(
      () => usernames.value,
      (newUsernames) => {
        // Only update URL when we are on the collection page — keeps URLs clean
        // on other pages and avoids clobbering the browser history stack.
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
  }

  return { usernames, add, remove, set, hydrateFromUrl }
})