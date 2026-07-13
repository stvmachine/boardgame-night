<script setup lang="ts">
import type { HTMLAttributes } from "vue"
import { useVModel } from "@vueuse/core"
import { cn } from "@/lib/utils"

const props = defineProps<{
  defaultValue?: string | number
  modelValue?: string | number
  class?: HTMLAttributes["class"]
}>()

const emits = defineEmits<{
  (e: "update:modelValue", payload: string | number): void
}>()

const modelValue = useVModel(props, "modelValue", emits, {
  passive: true,
  defaultValue: props.defaultValue,
})
</script>

<template>
  <input
    v-model="modelValue"
    data-slot="input"
    :class="cn(
      'border border-outline bg-surface px-3 py-2 text-sm text-on-surface transition-colors placeholder:text-on-surface-variant focus:border-primary focus:ring-2 focus:ring-primary rounded-md w-full min-w-0 outline-none disabled:pointer-events-none disabled:opacity-50',
      props.class,
    )"
  >
</template>
