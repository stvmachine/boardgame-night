<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import { useMyGroupsQuery, useCreateGroupMutation } from '@/generated/operations'
import { useGroupDraftStore } from '@/stores/groupDraft'
import AppShell from '@/components/layout/AppShell.vue'
import GroupList from '@/components/group/GroupList.vue'
import EmptyState from '@/components/collection/EmptyState.vue'

const router = useRouter()
const draftStore = useGroupDraftStore()
const { name, description } = storeToRefs(draftStore)

const { result, loading } = useMyGroupsQuery(() => ({}))
const { mutate: createGroup, loading: creating, error } = useCreateGroupMutation()

const groups = computed(() => result.value?.myGroups ?? [])

async function submit() {
  const result = await createGroup({ name: name.value, description: description.value })
  const group = result?.data?.createGroup?.group
  if (group?.inviteCode) {
    draftStore.reset()
    router.push(`/g/${group.inviteCode}`)
  }
}
</script>

<template>
  <AppShell>
    <div class="p-4 md:p-6 space-y-6">
      <div class="bg-white rounded-lg border border-neutral-200 p-4 md:p-6">
        <h2 class="text-lg font-semibold text-neutral-800 mb-4">Create a group</h2>
        <form class="space-y-4" @submit.prevent="submit">
          <div>
            <label for="group-name" class="block text-sm font-medium text-neutral-700">Group name</label>
            <input
              id="group-name"
              v-model="name"
              type="text"
              required
              maxlength="100"
              class="mt-1 w-full rounded border border-neutral-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
              placeholder="e.g., Friday Night Board Gamers"
            />
          </div>
          <div>
            <label for="group-description" class="block text-sm font-medium text-neutral-700">Description</label>
            <textarea
              id="group-description"
              v-model="description"
              maxlength="500"
              rows="3"
              class="mt-1 w-full rounded border border-neutral-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
              placeholder="What games do you like to play?"
            ></textarea>
          </div>
          <div v-if="error" class="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {{ error.message }}
          </div>
          <button
            type="submit"
            :disabled="creating || !name.trim()"
            class="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded hover:bg-indigo-700 disabled:bg-neutral-300 disabled:text-neutral-500"
          >
            Create group
          </button>
        </form>
      </div>

      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold text-neutral-800">Your groups</h2>
          <span v-if="!loading" class="text-sm text-neutral-500">{{ groups.length }} total</span>
        </div>

        <EmptyState
          v-if="groups.length === 0 && !loading"
          heading="No groups yet"
          body="Create a group to invite friends and start merging your collections."
        />

        <GroupList
          v-else
          :groups="groups"
          @select="(group) => router.push(`/g/${group.inviteCode}`)"
        />
      </div>
    </div>
  </AppShell>
</template>
