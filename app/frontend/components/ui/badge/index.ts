import type { VariantProps } from "class-variance-authority"
import { cva } from "class-variance-authority"

export { default as Badge } from "./Badge.vue"

export const badgeVariants = cva(
  'inline-flex items-center justify-center rounded-full px-2.5 py-0.5 text-sm font-semibold uppercase tracking-wider transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-primary text-on-primary',
        draft: 'bg-badge-draft text-badge-draft-foreground',
        invited: 'bg-badge-invited text-badge-invited-foreground',
        picking: 'bg-badge-picking text-badge-picking-foreground',
        completed: 'bg-badge-completed text-badge-completed-foreground',
        cancelled: 'bg-error-container text-on-error-container',
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
)
export type BadgeVariants = VariantProps<typeof badgeVariants>
