<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useGroupQuery } from '@/generated/operations'
import AppShell from '@/components/layout/AppShell.vue'
import GroupDetail from '@/components/group/GroupDetail.vue'
import EmptyState from '@/components/collection/EmptyState.vue'

const route = useRoute()

const token = computed(() => String(route.params.token))
const { result, loading, error } = useGroupQuery(() => ({ token: token.value }))

const group = computed(() => result.value?.group)
</script>

<template>
  <AppShell>
    <div class="p-4 md:p-6">
      <div v-if="loading" class="text-sm text-neutral-500">Loading group...</div>

      <EmptyState
        v-else-if="error"
        heading="Couldn’t load this page"
        body="Please check your connection and try again."
      />

      <GroupDetail
        v-else-if="group"
        :group="group"
        :loading="loading"
      />

      <EmptyState
        v-else
        heading="Group not found"
        body="This group doesn’t exist or you don’t have access to it."
      />
    </div>
  </AppShell>
</template>
