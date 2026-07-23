<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import type { Group, NightSession } from '@/generated/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarGroup } from '@/components/ui/avatar'
import { useMemberColor } from '@/composables/useMemberColor'
import EmptyState from '@/components/collection/EmptyState.vue'
import { RouterLink } from 'vue-router'

interface Props {
  sessions: NightSession[]
  group: Group
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'create'): void
}>()

const router = useRouter()

const isManager = computed(() =>
  props.group.myRole === 'OWNER' || props.group.myRole === 'ADMIN'
)

function navigate(session: NightSession) {
  router.push(`/s/${session.id}`)
}

function handleRowKeydown(event: KeyboardEvent, session: NightSession) {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    navigate(session)
  }
}

function ctaLabel(session: NightSession): string {
  return session.state === 'PICKING' ? 'Choose a game' : 'View details'
}

function ctaVariant(session: NightSession): 'primary' | 'outline' {
  return session.state === 'PICKING' ? 'primary' : 'outline'
}

function badgeVariant(session: NightSession): 'draft' | 'invited' | 'picking' {
  switch (session.state) {
    case 'DRAFT': return 'draft'
    case 'INVITED': return 'invited'
    case 'PICKING': return 'picking'
    default: return 'draft'
  }
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

function confirmedAttendees(session: NightSession) {
  return session.attendances
    .filter(a => a.response === 'going')
    .map(a => a.user)
    .slice(0, 3)
}

const emptyHeading = computed(() =>
  isManager.value ? 'Plan your first game night' : 'No nights planned yet'
)

const emptyBody = computed(() =>
  isManager.value
    ? 'Create a night to get everyone on the schedule.'
    : 'Check back later for upcoming game nights.'
)
</script>

<template>
  <Card>
    <CardHeader>
      <div class="flex items-center justify-between">
        <CardTitle>Upcoming sessions</CardTitle>
        <RouterLink
          :to="{ name: 'group-sessions', params: { token: group.inviteCode } }"
          class="text-sm font-medium text-primary hover:underline"
        >
          View All
        </RouterLink>
      </div>
    </CardHeader>
    <CardContent>
      <div v-if="sessions.length === 0" class="text-center">
        <EmptyState
          icon="inbox"
          :heading="emptyHeading"
          :body="emptyBody"
        />
        <Button
          v-if="isManager"
          variant="primary"
          class="mt-4"
          @click="emit('create')"
        >
          Create a night
        </Button>
      </div>

      <ul v-else class="space-y-3" role="list">
        <li
          v-for="session in sessions"
          :key="session.id"
          data-testid="session-row"
        >
          <div
            class="flex items-center gap-4 p-4 rounded-xl border border-outline bg-surface-container hover:bg-surface-container-high transition-colors"
          >
            <div
              class="flex-1 flex items-center gap-4 min-w-0"
              role="button"
              tabindex="0"
              :aria-label="`Open session ${session.title}`"
              @click="navigate(session)"
              @keydown="(e) => handleRowKeydown(e, session)"
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
                  <Badge :variant="badgeVariant(session)">
                    {{ session.state }}
                  </Badge>
                  <span v-if="formatTime(session.scheduledAt)" class="text-sm text-on-surface-variant">
                    {{ formatTime(session.scheduledAt) }}
                  </span>
                </div>
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
              <Button
                :variant="ctaVariant(session)"
                size="sm"
                @click="navigate(session)"
              >
                {{ ctaLabel(session) }}
              </Button>
            </div>
          </div>
        </li>
      </ul>
    </CardContent>
  </Card>
</template>
