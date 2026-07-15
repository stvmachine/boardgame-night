<script setup lang="ts">
import { computed } from 'vue'
import type { Group } from '@/generated/types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Icon from '@/components/ui/icon/Icon.vue'

interface Props {
  group: Group
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'create'): void
}>()

const canCreateNight = computed(() =>
  props.group.myRole === 'OWNER' || props.group.myRole === 'ADMIN'
)
</script>

<template>
  <header class="space-y-2">
    <div class="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
      <div>
        <h1 class="text-[28px] font-semibold leading-snug text-on-surface">
          {{ group.name }}
        </h1>
        <div class="flex flex-wrap items-center gap-2 mt-2">
          <Badge variant="draft">
            {{ group.members.length }} members
          </Badge>
          <p v-if="group.description" class="text-base text-on-surface-variant">
            {{ group.description }}
          </p>
        </div>
      </div>
      <Button
        v-if="canCreateNight"
        variant="primary"
        class="hidden lg:inline-flex"
        @click="emit('create')"
      >
        <Icon name="add" class="size-4" />
        Create a night
      </Button>
    </div>
    <Button
      v-if="canCreateNight"
      variant="primary"
      class="w-full lg:hidden"
      @click="emit('create')"
    >
      <Icon name="add" class="size-4" />
      Create a night
    </Button>
  </header>
</template>
