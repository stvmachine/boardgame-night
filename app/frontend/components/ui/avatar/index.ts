import type { VariantProps } from "class-variance-authority"
import { cva } from "class-variance-authority"

export { default as Avatar } from "./Avatar.vue"
export { default as AvatarBadge } from "./AvatarBadge.vue"
export { default as AvatarFallback } from "./AvatarFallback.vue"
export { default as AvatarGroup } from "./AvatarGroup.vue"
export { default as AvatarGroupCount } from "./AvatarGroupCount.vue"
export { default as AvatarImage } from "./AvatarImage.vue"

export const avatarVariants = cva(
  'inline-flex items-center justify-center rounded-full font-medium overflow-hidden',
  {
    variants: {
      size: {
        xs: 'h-4.5 w-4.5 text-[9px]',
        sm: 'h-5 w-5 text-[10px]',
        md: 'h-6 w-6 text-xs',
        lg: 'h-8 w-8 text-sm',
      },
    },
    defaultVariants: {
      size: "md",
    },
  },
)

export type AvatarVariants = VariantProps<typeof avatarVariants>
