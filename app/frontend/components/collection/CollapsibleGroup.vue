<script setup lang="ts">
import Icon from '@/components/ui/icon/Icon.vue'

interface Props {
  groupName: string
  count: number
  initiallyOpen?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  initiallyOpen: true
})

const emit = defineEmits<{
  toggle: []
}>()

import { ref, watch } from 'vue'

const isOpen = ref(props.initiallyOpen)

watch(() => props.initiallyOpen, (newValue) => {
  isOpen.value = newValue
})

function onToggle() {
  isOpen.value = !isOpen.value
  emit('toggle')
}
</script>

<template>
  <div class="space-y-2">
    <button
      type="button"
      class="flex items-center gap-2 w-full text-left focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
      :aria-expanded="isOpen"
      @click="onToggle"
    >
      <Icon
        name="chevron-right"
        class="w-5 h-5 text-on-surface-variant transition-transform duration-200"
        :class="isOpen ? 'rotate-90' : ''"
      />
      <h3 class="text-lg font-semibold text-on-surface">
        {{ groupName }}
      </h3>
      <span class="text-sm font-normal text-on-surface-variant">({{ count }})</span>
    </button>
    <div v-show="isOpen">
      <slot />
    </div>
  </div>
</template>
