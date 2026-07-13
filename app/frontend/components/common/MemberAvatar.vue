<script setup lang="ts">
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
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

const colorClass = useMemberColor(props.username)

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
    <Avatar :class="sizeClasses[size]" :title="username" :aria-label="`Avatar for ${username}`">
      <AvatarFallback :class="colorClass">
        {{ initial }}
      </AvatarFallback>
    </Avatar>
    <span v-if="showUsername" class="text-sm text-on-surface-variant">{{ username }}</span>
  </span>
</template>
