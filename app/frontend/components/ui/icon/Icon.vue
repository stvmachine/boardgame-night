<script setup lang="ts">
import { Icon as IconifyIcon } from '@iconify/vue'

interface Props {
  name: string
  class?: string
}

defineProps<Props>()
</script>

<template>
  <IconifyIcon
    :icon="`material-symbols:${name}`"
    :class="$props.class"
    aria-hidden="true"
  />
</template>
