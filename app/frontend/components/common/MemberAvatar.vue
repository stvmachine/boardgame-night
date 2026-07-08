<script setup lang="ts">
import { useMemberColor } from '@/composables/useMemberColor'

interface Props {
  username: string
  showUsername?: boolean
  size?: 'xs' | 'sm' | 'md' | 'lg'
}

const props = withDefaults(defineProps<Props>(), {
  showUsername: false,
  size: 'md'
})

const { bg, text } = useMemberColor(props.username)

const sizeClasses = {
  xs: 'h-4.5 w-4.5 text-[9px]',
  sm: 'h-5 w-5 text-[10px]',
  md: 'h-6 w-6 text-xs',
  lg: 'h-8 w-8 text-sm'
}

const initial = props.username.charAt(0).toUpperCase()
</script>

<template>
  <span class="inline-flex items-center gap-1.5">
    <span
      :class="[
        'inline-flex items-center justify-center rounded-full font-medium',
        bg,
        text,
        sizeClasses[size]
      ]"
      :title="username"
      :aria-label="`Avatar for ${username}`"
    >
      {{ initial }}
    </span>
    <span v-if="showUsername" class="text-sm text-neutral-700">{{ username }}</span>
  </span>
</template>
