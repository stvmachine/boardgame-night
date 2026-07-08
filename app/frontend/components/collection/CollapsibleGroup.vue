<script setup lang="ts">
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
      class="flex items-center gap-2 w-full text-left focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 rounded"
      :aria-expanded="isOpen"
      @click="onToggle"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        class="w-5 h-5 text-neutral-500 transition-transform duration-200"
        :class="{ 'rotate-90': isOpen }"
        aria-hidden="true"
      >
        <polyline points="9 18 15 12 9 6" />
      </svg>
      <h3 class="text-lg font-semibold text-neutral-800">
        {{ groupName }}
      </h3>
      <span class="text-sm font-normal text-neutral-500">({{ count }})</span>
    </button>
    <div v-show="isOpen">
      <slot />
    </div>
  </div>
</template>
