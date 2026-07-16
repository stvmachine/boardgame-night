import type { VariantProps } from 'class-variance-authority'
import { cva } from 'class-variance-authority'

export { default as Toggle } from './Toggle.vue'

export const toggleVariants = cva(
  'inline-flex items-center justify-center gap-1 rounded-lg text-sm font-medium whitespace-nowrap bg-transparent text-on-surface outline-none transition-all hover:bg-surface-container-high hover:text-on-surface focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 aria-pressed:bg-primary aria-pressed:text-on-primary data-[state=on]:bg-primary data-[state=on]:text-on-primary',
  {
    variants: {
      variant: {
        default: '',
        outline: 'border border-outline bg-surface hover:bg-surface-container-high',
      },
      size: {
        default: 'h-10 min-w-10 px-3 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2',
        sm: 'h-9 min-w-9 rounded-md px-2.5 text-[0.8rem] has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5',
        lg: 'h-11 min-w-11 px-3 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

export type ToggleVariants = VariantProps<typeof toggleVariants>
