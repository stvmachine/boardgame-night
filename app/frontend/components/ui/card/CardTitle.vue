<script setup lang="ts">
import type { HTMLAttributes } from "vue"
import { cn } from "@/lib/utils"

interface Props {
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'div' | 'span'
  class?: HTMLAttributes["class"]
}

const props = withDefaults(defineProps<Props>(), {
  as: 'h2'
})
</script>

<template>
  <component
    :is="props.as"
    data-slot="card-title"
    :class="cn('text-heading font-semibold text-on-surface leading-snug', props.class)"
  >
    <slot />
  </component>
</template>
