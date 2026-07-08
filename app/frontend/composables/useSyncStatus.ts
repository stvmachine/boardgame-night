import { watch, type Ref } from 'vue'
import { useCollectionSyncedSubscription } from '../generated/operations'

export interface SyncStatus {
  username: string
  status: string
  lastSyncedAt: string | null
  error: string | null
  gameCount: number | null
}

export function useSyncStatus(usernames: Ref<string[]>) {
  const statuses = new Map<string, ReturnType<typeof useCollectionSyncedSubscription>>()

  watch(
    usernames,
    (names) => {
      names.forEach((username) => {
        if (!statuses.has(username)) {
          statuses.set(username, useCollectionSyncedSubscription(() => ({ username })))
        }
      })
    },
    { immediate: true }
  )

  return { statuses }
}
