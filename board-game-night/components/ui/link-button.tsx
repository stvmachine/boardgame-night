import type { VariantProps } from 'class-variance-authority'
import Link from 'next/link'
import type * as React from 'react'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type LinkButtonProps = React.ComponentProps<typeof Link> &
  VariantProps<typeof buttonVariants>

/** A Next.js Link styled with the shadcn button variants. */
export function LinkButton({
  className,
  variant = 'default',
  size = 'default',
  ...props
}: LinkButtonProps) {
  return (
    <Link
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}
