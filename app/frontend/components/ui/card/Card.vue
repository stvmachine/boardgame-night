<script setup lang="ts">
import type { HTMLAttributes } from "vue"
import { cn } from "@/lib/utils"

const props = withDefaults(defineProps<{
  class?: HTMLAttributes["class"]
  size?: "default" | "sm"
}>(), {
  size: "default",
})
</script>

<template>
  <div
    data-slot="card"
    :data-size="size"
    :class="cn('rounded-xl border border-outline bg-surface-container shadow-card gap-4 overflow-hidden py-4 text-sm flex flex-col', props.class)"
  >
    <slot />
  </div>
</template>
