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

  function syncWithRoute(rawUsernames: string | string[] | null | undefined) {
    const str = Array.isArray(rawUsernames) ? rawUsernames[0] : rawUsernames
    usernames.value = String(str ?? '')
      .split(',')
      .map(s => normalize(s))
      .filter(Boolean)
  }

  return { usernames, add, remove, syncWithRoute }
})