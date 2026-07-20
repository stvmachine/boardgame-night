import { ref } from 'vue'
import { defineStore } from 'pinia'

function normalize(username: string): string {
  return username.trim().toLowerCase()
}

export const useCollectorsStore = defineStore('collectors', () => {
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
    const seen = new Set<string>()
    usernames.value = rawUsernames
      .map(normalize)
      .filter(Boolean)
      .filter(u => {
        if (seen.has(u)) return false
        seen.add(u)
        return true
      })
  }

  return { usernames, add, remove, set }
})
