<script setup lang="ts">
import Icon from '@/components/ui/icon/Icon.vue'

import type { CheckboxRootEmits, CheckboxRootProps } from "reka-ui"
import type { HTMLAttributes } from "vue"
import { reactiveOmit } from "@vueuse/core"
import { CheckboxIndicator, CheckboxRoot, useForwardPropsEmits } from "reka-ui"
import { cn } from "@/lib/utils"

const props = defineProps<CheckboxRootProps & { class?: HTMLAttributes["class"] }>()
const emits = defineEmits<CheckboxRootEmits>()

const delegatedProps = reactiveOmit(props, "class")

const forwarded = useForwardPropsEmits(delegatedProps, emits)
</script>

<template>
  <CheckboxRoot
    v-slot="slotProps"
    data-slot="checkbox"
    v-bind="forwarded"
    :class="cn('border-outline data-checked:bg-primary data-checked:text-on-primary data-checked:border-primary aria-invalid:border-error focus-visible:border-primary focus-visible:ring-primary/50 flex size-4 items-center justify-center rounded-[4px] border transition-colors group-has-disabled/field:opacity-50 focus-visible:ring-2 peer relative shrink-0 outline-none after:absolute after:-inset-x-3 after:-inset-y-2 disabled:cursor-not-allowed disabled:opacity-50', props.class)"
  >
    <CheckboxIndicator
      data-slot="checkbox-indicator"
      class="[&>svg]:size-3.5 grid place-content-center text-current transition-none"
    >
      <slot v-bind="slotProps">
        <Icon name="check" />
      </slot>
    </CheckboxIndicator>
  </CheckboxRoot>
</template>
