import { ref, onUnmounted, getCurrentInstance, type Ref } from 'vue'
import { useImportCollectionMutation } from '@/generated/operations'
import type { UserSyncStatus } from '@/generated/operations'

export interface RefreshCollectionState {
  refresh: (username: string) => Promise<void>
  isRefreshing: Ref<boolean>
  error: Ref<string | null>
  cooldownFor: (username: string) => number
  initFromSyncStatuses: (syncStatuses: UserSyncStatus[] | Ref<UserSyncStatus[]>) => void
}

export function useRefreshCollection(): RefreshCollectionState {
  const cooldownMap = ref<Record<string, number>>({})
  const error = ref<string | null>(null)

  const { mutate, loading: isRefreshing } = useImportCollectionMutation()

  let intervalId: ReturnType<typeof setInterval> | null = null

  function stopInterval() {
    if (intervalId) {
      clearInterval(intervalId)
      intervalId = null
    }
  }

  function startInterval() {
    if (intervalId) return

    intervalId = setInterval(() => {
      let hasPositive = false

      for (const username of Object.keys(cooldownMap.value)) {
        if (cooldownMap.value[username] > 0) {
          cooldownMap.value[username]--
          hasPositive = true
        }
      }

      if (!hasPositive) {
        stopInterval()
      }
    }, 1000)
  }

  if (getCurrentInstance()) {
    onUnmounted(() => {
      stopInterval()
    })
  }

  function cooldownFor(username: string): number {
    return cooldownMap.value[username] ?? 0
  }

  async function refresh(username: string) {
    error.value = null

    try {
      await mutate({ username })
      cooldownMap.value[username] = 0
      stopInterval()
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      error.value = message

      if (/cooldown/i.test(message)) {
        const match = message.match(/(\d+)\s*seconds/)
        if (match) {
          cooldownMap.value[username] = parseInt(match[1], 10)
          startInterval()
        }
      }
    }
  }

  function initFromSyncStatuses(syncStatuses: UserSyncStatus[] | Ref<UserSyncStatus[]>) {
    const statuses = Array.isArray(syncStatuses) ? syncStatuses : syncStatuses.value
    const now = Date.now()

    statuses.forEach((status) => {
      if (status.lastSyncedAt && typeof status.lastSyncedAt === 'string') {
        const elapsed = Math.floor((now - Date.parse(status.lastSyncedAt)) / 1000)
        const remaining = Math.max(0, 15 * 60 - elapsed)

        if (remaining > 0) {
          cooldownMap.value[status.username] = remaining
          startInterval()
        }
      }
    })
  }

  return {
    refresh,
    isRefreshing,
    error,
    cooldownFor,
    initFromSyncStatuses
  }
}
