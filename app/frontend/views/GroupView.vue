<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useGroupQuery } from '@/generated/operations'
import AppShell from '@/components/layout/AppShell.vue'
import GroupDetail from '@/components/group/GroupDetail.vue'
import EmptyState from '@/components/collection/EmptyState.vue'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

const route = useRoute()

const token = computed(() => String(route.params.token))
const { result, loading, error } = useGroupQuery(() => ({ token: token.value }))

const group = computed(() => result.value?.group)
</script>

<template>
  <AppShell>
    <div class="p-4 md:p-6">
      <div v-if="loading" data-testid="group-skeleton" class="space-y-6">
        <div class="space-y-2">
          <Skeleton class="w-1/2 h-8" />
          <Skeleton class="w-2/3 h-4" />
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div class="lg:col-span-8 space-y-6">
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

            <Card>
              <CardHeader>
                <Skeleton class="w-48 h-6" />
              </CardHeader>
              <CardContent class="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div v-for="n in 4" :key="n" class="space-y-2">
                  <Skeleton class="aspect-[4/3] rounded-lg" />
                  <Skeleton class="w-full h-4" />
                  <Skeleton class="w-1/2 h-4" />
                </div>
              </CardContent>
            </Card>
          </div>

          <div class="lg:col-span-4 space-y-6">
            <Card>
              <CardHeader>
                <Skeleton class="w-24 h-6" />
              </CardHeader>
              <CardContent class="space-y-3">
                <div v-for="n in 4" :key="n" class="flex items-center gap-3">
                  <Skeleton class="h-8 w-8 rounded-full" />
                  <div class="flex-1 space-y-2">
                    <Skeleton class="w-2/3 h-4" />
                    <Skeleton class="w-1/3 h-3" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Skeleton class="w-24 h-6" />
              </CardHeader>
              <CardContent class="space-y-3">
                <Skeleton class="w-full h-10" />
                <Skeleton class="w-full h-10" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

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
