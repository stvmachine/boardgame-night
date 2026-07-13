<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import Icon from '@/components/ui/icon/Icon.vue'

interface Props {
  to: string
  icon: string
  label: string
}

const props = defineProps<Props>()
const emit = defineEmits<{ (e: 'click'): void }>()
const route = useRoute()

const isActive = computed(() => route.path === props.to)

function handleClick() {
  emit('click')
}
</script>

<template>
  <RouterLink
    :to="to"
    :class="[
      'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
      isActive ? 'bg-primary-container text-primary' : 'text-on-surface-variant hover:bg-surface-container-high'
    ]"
    @click="handleClick"
  >
    <Icon :name="icon" class="h-5 w-5" />
    <span>{{ label }}</span>
  </RouterLink>
</template>
