<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { gql } from '@apollo/client/core'
import type { Group } from '@/generated/types'
import { useCreateNightSessionMutation } from '@/generated/operations'
import GroupHeader from './GroupHeader.vue'
import GroupSessionsList from './GroupSessionsList.vue'
import GroupCollectionSpotlight from './GroupCollectionSpotlight.vue'
import GroupMembersPanel from './GroupMembersPanel.vue'
import InviteCard from './InviteCard.vue'

interface Props {
  group: Group
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false
})

const router = useRouter()
const createError = ref<Error | null>(null)

const { mutate: createSession } = useCreateNightSessionMutation({
  update(cache, { data }) {
    const session = data?.createNightSession?.session
    if (!session) return

    const groupId = cache.identify({ __typename: 'Group', id: props.group.id })
    if (!groupId) return

    cache.modify({
      id: groupId,
      fields: {
        sessions(existing = []) {
          const existingIds = new Set(existing.map((ref: any) => ref.__ref))
          const newRef = cache.writeFragment({
            data: {
              ...session,
              __typename: 'NightSession'
            },
            fragment: gql`
              fragment NewSession on NightSession {
                id
                title
                state
                scheduledAt
                attendeeCount
                attendances {
                  id
                  response
                  user {
                    id
                    username
                    displayName
                  }
                }
              }
            `
          })
          if (existingIds.has(newRef?.__ref)) return existing
          return [...existing, newRef]
        }
      }
    })
  }
})

async function handleCreate() {
  createError.value = null
  try {
    const result = await createSession({
      groupId: props.group.id,
      title: `${props.group.name} game night`,
      description: '',
      scheduledAt: undefined,
      location: '',
      capacity: null
    })
    const session = result?.data?.createNightSession?.session
    if (session) {
      await router.push(`/s/${session.id}`)
    }
  } catch (err) {
    createError.value = err instanceof Error ? err : new Error(String(err))
  }
}
</script>

<template>
  <div class="space-y-6">
    <GroupHeader :group="group" @create="handleCreate" />

    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <div class="lg:col-span-8 space-y-6">
        <GroupSessionsList :sessions="group.sessions" :group="group" @create="handleCreate" />
        <GroupCollectionSpotlight :games="group.collectionSpotlight" :group="group" />
      </div>

      <aside class="lg:col-span-4 space-y-6 lg:sticky lg:top-6 lg:self-start">
        <GroupMembersPanel :memberships="group.memberships ?? []" :group="group" />
        <InviteCard v-if="group.myRole === 'OWNER' || group.myRole === 'ADMIN'" :group="group" />
      </aside>
    </div>

    <p v-if="createError" class="text-sm text-error" role="alert">
      {{ createError.message }}
    </p>
  </div>
</template>
