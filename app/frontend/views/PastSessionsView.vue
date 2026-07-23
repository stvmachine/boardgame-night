<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useGroupQuery } from '@/generated/operations'
import AppShell from '@/components/layout/AppShell.vue'
import EmptyState from '@/components/collection/EmptyState.vue'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarGroup } from '@/components/ui/avatar'
import { useMemberColor } from '@/composables/useMemberColor'
import Icon from '@/components/ui/icon/Icon.vue'

const route = useRoute()
const router = useRouter()
const token = computed(() => String(route.params.token))
const { result, loading, error } = useGroupQuery(() => ({ token: token.value }))

const group = computed(() => result.value?.group)
const pastSessions = computed(() => group.value?.pastSessions ?? [])

function navigateSession(sessionId: string) {
  router.push(`/s/${sessionId}`)
}

function handleSessionKeydown(event: KeyboardEvent, sessionId: string) {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    navigateSession(sessionId)
  }
}

function badgeVariant(state: string): 'completed' | 'cancelled' {
  return state === 'COMPLETED' ? 'completed' : 'cancelled'
}

function formatDate(dateValue: unknown): { month: string; day: string } | null {
  if (dateValue == null) return null
  const date = new Date(dateValue as string)
  if (Number.isNaN(date.getTime())) return null
  return {
    month: new Intl.DateTimeFormat('en-US', { month: 'short' }).format(date).toUpperCase(),
    day: new Intl.DateTimeFormat('en-US', { day: 'numeric' }).format(date)
  }
}

function formatTime(dateValue: unknown): string | null {
  if (dateValue == null) return null
  const date = new Date(dateValue as string)
  if (Number.isNaN(date.getTime())) return null
  return new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: 'numeric' }).format(date)
}

function confirmedAttendees(session: any) {
  return (session.attendances ?? [])
    .filter((a: any) => a.response === 'going')
    .map((a: any) => a.user)
    .slice(0, 3)
}

function goBack() {
  router.push(`/g/${token.value}`)
}
</script>

<template>
  <AppShell>
    <div class="p-4 md:p-6">
      <div v-if="loading" class="space-y-6">
        <div class="flex items-center gap-3">
          <Skeleton class="h-8 w-8" />
          <Skeleton class="w-1/3 h-8" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton class="w-48 h-6" />
          </CardHeader>
          <CardContent class="space-y-3">
            <div
              v-for="n in 3"
              :key="n"
              class="flex items-center gap-4 p-4 rounded-xl border border-outline bg-surface-container"
            >
              <Skeleton class="h-14 w-14 rounded-lg" />
              <div class="flex-1 space-y-2">
                <Skeleton class="w-1/3 h-4" />
                <Skeleton class="w-20 h-4" />
              </div>
              <Skeleton class="w-24 h-8" />
            </div>
          </CardContent>
        </Card>
      </div>

      <EmptyState
        v-else-if="error"
        heading="Couldn't load this page"
        body="Please check your connection and try again."
      />

      <template v-else-if="group">
        <div class="mb-6">
          <button
            class="flex items-center gap-2 text-sm font-medium text-primary hover:underline mb-4"
            @click="goBack"
          >
            <Icon name="arrow_back" class="size-4" />
            Back to {{ group.name }}
          </button>
          <h1 class="text-[28px] font-semibold leading-snug text-on-surface">
            Past Sessions
          </h1>
          <p class="text-sm text-on-surface-variant mt-1">
            {{ group.name }} — completed and cancelled sessions
          </p>
        </div>

        <Card v-if="pastSessions.length > 0">
          <CardContent>
            <ul class="space-y-3" role="list">
              <li
                v-for="session in pastSessions"
                :key="session.id"
                data-testid="past-session-row"
              >
                <div
                  class="flex items-center gap-4 p-4 rounded-xl border border-outline bg-surface-container hover:bg-surface-container-high transition-colors"
                  role="button"
                  tabindex="0"
                  :aria-label="`Open session ${session.title}`"
                  @click="navigateSession(session.id)"
                  @keydown="(e: KeyboardEvent) => handleSessionKeydown(e, session.id)"
                >
                  <div
                    v-if="formatDate(session.scheduledAt)"
                    class="h-14 w-14 rounded-lg bg-surface flex flex-col items-center justify-center shrink-0"
                  >
                    <span class="text-sm font-semibold uppercase tracking-wider text-on-surface-variant">
                      {{ formatDate(session.scheduledAt)?.month }}
                    </span>
                    <span class="text-xl font-semibold text-on-surface">
                      {{ formatDate(session.scheduledAt)?.day }}
                    </span>
                  </div>
                  <div
                    v-else
                    class="h-14 w-14 rounded-lg bg-surface flex flex-col items-center justify-center shrink-0"
                  >
                    <span class="text-sm font-semibold uppercase tracking-wider text-on-surface-variant">Date</span>
                    <span class="text-sm font-semibold uppercase tracking-wider text-on-surface">TBD</span>
                  </div>

                  <div class="flex-1 min-w-0">
                    <h3 class="text-base font-semibold text-on-surface truncate">
                      {{ session.title }}
                    </h3>
                    <div class="flex flex-wrap items-center gap-2 mt-1">
                      <Badge :variant="badgeVariant(session.state)">
                        {{ session.state }}
                      </Badge>
                      <span v-if="session.pickedGame" class="text-sm text-on-surface-variant">
                        {{ session.pickedGame.name }}
                      </span>
                      <span v-if="formatTime(session.scheduledAt)" class="text-sm text-on-surface-variant">
                        {{ formatTime(session.scheduledAt) }}
                      </span>
                    </div>
                  </div>

                  <div class="flex items-center gap-3 shrink-0">
                    <AvatarGroup class="hidden sm:flex">
                      <Avatar
                        v-for="user in confirmedAttendees(session)"
                        :key="user.id"
                        :class="useMemberColor(user.username)"
                        size="sm"
                        :title="user.displayName"
                      >
                        <AvatarFallback>
                          {{ user.username.charAt(0).toUpperCase() }}
                        </AvatarFallback>
                      </Avatar>
                    </AvatarGroup>
                    <span class="text-sm font-semibold text-on-surface-variant">
                      {{ session.attendeeCount }} going
                    </span>
                  </div>
                </div>
              </li>
            </ul>
          </CardContent>
        </Card>

        <EmptyState
          v-else
          icon="inbox"
          heading="No past sessions yet"
          body="Completed and cancelled sessions will appear here."
        />
      </template>

      <EmptyState
        v-else
        heading="Group not found"
        body="This group doesn't exist or you don't have access to it."
      />
    </div>
  </AppShell>
</template>
