import type { VariantProps } from "class-variance-authority"
import { cva } from "class-variance-authority"

export { default as Button } from "./Button.vue"

export const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary: 'bg-primary text-on-primary hover:bg-primary/90',
        secondary: 'bg-secondary text-on-secondary hover:bg-secondary/80',
        outline: 'border border-outline bg-surface text-on-surface hover:bg-surface-container-high',
        ghost: 'hover:bg-surface-container-high text-on-surface',
        destructive: 'bg-error text-on-error hover:bg-error/90',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 px-3',
        lg: 'h-11 px-8',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  },
)
export type ButtonVariants = VariantProps<typeof buttonVariants>
