<script setup lang="ts">
import { ref, watch } from 'vue'

interface Props {
  title: string
  defaultOpen?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  defaultOpen: true
})

const open = ref(props.defaultOpen)
const bodyId = `collapsible-section-${Math.random().toString(36).slice(2, 9)}`

watch(
  () => props.defaultOpen,
  (value) => {
    open.value = value
  }
)

const emit = defineEmits<{
  (e: 'toggle', value: boolean): void
}>()

function toggle() {
  open.value = !open.value
  emit('toggle', open.value)
}
</script>

<template>
  <div class="border border-neutral-200 rounded-md bg-white overflow-hidden">
    <button
      type="button"
      :aria-expanded="open"
      :aria-controls="bodyId"
      class="w-full flex items-center justify-between px-4 py-3 text-left focus:outline-none focus:ring-2 focus:ring-indigo-500"
      @click="toggle"
    >
      <span class="text-sm font-semibold text-neutral-800 flex items-center gap-2">
        {{ title }}
        <slot name="badge" />
      </span>
      <svg
        class="h-4 w-4 text-neutral-500 transition-transform duration-150 ease-in-out"
        :class="open ? 'rotate-90' : 'rotate-0'"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M9 5l7 7-7 7"
        />
      </svg>
    </button>
    <div
      :id="bodyId"
      v-show="open"
      class="collapsible-body px-4 py-3 border-t border-neutral-100"
    >
      <slot />
    </div>
  </div>
</template>
