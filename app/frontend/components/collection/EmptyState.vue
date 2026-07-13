<script setup lang="ts">
import Button from '@/components/ui/button/Button.vue'
import Icon from '@/components/ui/icon/Icon.vue'

interface Props {
  heading: string
  body: string
  showClear?: boolean
}

withDefaults(defineProps<Props>(), {
  showClear: false
})

const emit = defineEmits<{
  (e: 'clear'): void
}>()
</script>

<template>
  <div class="text-center py-16 px-4">
    <div class="mx-auto h-16 w-16 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant mb-4">
      <Icon name="inbox" class="h-8 w-8" />
    </div>
    <h2 class="text-xl font-semibold text-on-surface">{{ heading }}</h2>
    <p class="text-on-surface-variant mt-2 max-w-md mx-auto">{{ body }}</p>
    <Button
      v-if="showClear"
      variant="primary"
      class="mt-4"
      @click="emit('clear')"
    >
      Clear filters
    </Button>
  </div>
</template>
