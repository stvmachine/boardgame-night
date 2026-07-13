<script setup lang="ts">
import type { HTMLAttributes } from "vue"
import { cn } from "@/lib/utils"

const props = defineProps<{
  class?: HTMLAttributes["class"]
}>()
</script>

<template>
  <div
    data-slot="card-header"
    :class="cn('p-6 rounded-t-xl', props.class)"
  >
    <slot />
  </div>
</template>
