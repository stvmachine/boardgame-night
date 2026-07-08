<script setup lang="ts">
import { computed, ref, watch, onUnmounted } from 'vue'

interface Props {
  username: string
  disabled: boolean
  cooldownSeconds?: number
}

const props = withDefaults(defineProps<Props>(), {
  cooldownSeconds: 0
})

const emit = defineEmits<{
  (e: 'refresh', username: string): void
}>()

const displaySeconds = ref(props.cooldownSeconds)
let intervalId: ReturnType<typeof setInterval> | null = null

function stopCountdown() {
  if (intervalId) {
    clearInterval(intervalId)
    intervalId = null
  }
}

function startCountdown() {
  stopCountdown()
  intervalId = setInterval(() => {
    if (displaySeconds.value > 0) {
      displaySeconds.value--
    } else {
      stopCountdown()
    }
  }, 1000)
}

watch(
  () => props.cooldownSeconds,
  (value) => {
    displaySeconds.value = value
    if (value > 0) {
      startCountdown()
    } else {
      stopCountdown()
    }
  },
  { immediate: true }
)

onUnmounted(() => {
  stopCountdown()
})

const buttonText = computed(() => {
  if (props.disabled && displaySeconds.value > 0) {
    const minutes = Math.floor(displaySeconds.value / 60)
    const seconds = displaySeconds.value % 60
    return `Refresh (${minutes}m ${seconds}s)`
  }
  return 'Refresh'
})

function handleClick() {
  emit('refresh', props.username)
}
</script>

<template>
  <button
    type="button"
    :disabled="disabled"
    :aria-label="`Refresh ${username}'s collection`"
    class="min-h-[44px] min-w-[44px] rounded-md px-3 py-1.5 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:cursor-not-allowed"
    :class="{
      'bg-indigo-600 text-white hover:bg-indigo-700': !disabled,
      'bg-neutral-200 text-neutral-500': disabled
    }"
    @click="handleClick"
  >
    {{ buttonText }}
  </button>
</template>
