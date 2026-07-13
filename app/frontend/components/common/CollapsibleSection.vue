<script setup lang="ts">
import { ref, watch } from 'vue'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import Icon from '@/components/ui/icon/Icon.vue'

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

function onOpenChange(value: boolean) {
  open.value = value
  emit('toggle', value)
}
</script>

<template>
  <Collapsible
    v-model:open="open"
    :default-open="defaultOpen"
    class="border border-outline rounded-xl bg-surface-container overflow-hidden"
    @update:open="onOpenChange"
  >
    <CollapsibleTrigger
      :aria-expanded="open"
      :aria-controls="bodyId"
      class="w-full flex items-center justify-between px-4 py-3 text-left focus:outline-none focus:ring-2 focus:ring-primary"
    >
      <span class="text-sm font-semibold text-on-surface flex items-center gap-2">
        {{ title }}
        <slot name="badge" />
      </span>
      <Icon
        name="chevron-right"
        :class="open ? 'rotate-90' : ''"
        class="h-4 w-4 text-on-surface-variant transition-transform duration-150"
      />
    </CollapsibleTrigger>
    <CollapsibleContent :id="bodyId" class="collapsible-body px-4 py-3 border-t border-outline">
      <slot />
    </CollapsibleContent>
  </Collapsible>
</template>
