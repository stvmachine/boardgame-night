import type * as React from 'react'
import { cn } from '@/lib/utils'
import type { Member, SessionState } from '@/lib/data'

/* ---------------------------------- Badge --------------------------------- */

export function Badge({
  className,
  children,
  ...props
}: React.ComponentProps<'span'>) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full bg-surface-raised px-2 py-0.5 text-xs font-medium text-ink-secondary',
        className,
      )}
      {...props}
    >
      {children}
    </span>
  )
}

const stateStyles: Record<SessionState, string> = {
  DRAFT: 'bg-ink-muted/20 text-ink-secondary',
  INVITED: 'bg-info/20 text-info',
  PICKING: 'bg-warning/20 text-warning',
  IN_PROGRESS: 'bg-success/20 text-success',
  COMPLETED: 'bg-star/20 text-star',
  CANCELLED: 'bg-danger/20 text-danger',
}

export function StateBadge({
  state,
  className,
}: {
  state: SessionState
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-wide uppercase',
        stateStyles[state],
        className,
      )}
    >
      <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />
      {state.replace('_', ' ')}
    </span>
  )
}

/* ---------------------------------- Pill ---------------------------------- */

export function CategoryPill({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
      {children}
    </span>
  )
}

/* --------------------------------- Avatar --------------------------------- */

const avatarSizes = {
  sm: 'size-8 text-[11px]',
  md: 'size-10 text-xs',
  lg: 'size-14 text-sm',
}

export function MemberAvatar({
  member,
  size = 'md',
  showRing = true,
  className,
}: {
  member: Member
  size?: keyof typeof avatarSizes
  showRing?: boolean
  className?: string
}) {
  const initials = member.name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')

  return (
    <span className={cn('relative inline-flex shrink-0', className)}>
      <span
        aria-hidden="true"
        className={cn(
          'inline-flex items-center justify-center rounded-full bg-surface-raised font-semibold text-ink',
          avatarSizes[size],
          showRing && 'ring-2 ring-offset-2 ring-offset-page',
        )}
        style={
          showRing
            ? { color: member.color, borderColor: member.color, ['--tw-ring-color' as string]: member.color }
            : undefined
        }
      >
        {initials}
      </span>
      {member.online && (
        <span
          className="absolute right-0 bottom-0 size-2.5 rounded-full bg-success ring-2 ring-page"
          aria-hidden="true"
        />
      )}
      <span className="sr-only">{member.name}</span>
    </span>
  )
}

export function AvatarStack({
  memberList,
  max = 5,
}: {
  memberList: Member[]
  max?: number
}) {
  const shown = memberList.slice(0, max)
  const rest = memberList.length - shown.length
  return (
    <div className="flex items-center">
      {shown.map((m) => (
        <span key={m.id} className="-ml-2 first:ml-0">
          <MemberAvatar member={m} size="sm" />
        </span>
      ))}
      {rest > 0 && (
        <span className="-ml-2 inline-flex size-8 items-center justify-center rounded-full bg-surface-raised text-[11px] font-semibold text-ink-secondary ring-2 ring-page">
          +{rest}
        </span>
      )}
    </div>
  )
}

/* --------------------------------- Surface -------------------------------- */

export function Card({
  className,
  children,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn('rounded-xl border border-line bg-surface', className)}
      {...props}
    >
      {children}
    </div>
  )
}

/* ------------------------------- Progress bar ----------------------------- */

export function Progress({
  value,
  className,
  barClassName,
  label,
}: {
  value: number
  className?: string
  barClassName?: string
  label?: string
}) {
  return (
    <div
      className={cn('h-2 w-full overflow-hidden rounded-full bg-surface-raised', className)}
      role="progressbar"
      aria-valuenow={Math.round(value)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label ?? 'Progress'}
    >
      <div
        className={cn('h-full rounded-full bg-primary transition-[width] duration-500', barClassName)}
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  )
}

/* ------------------------------- Empty state ------------------------------ */

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: React.ReactNode
  title: string
  description: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-line bg-surface/50 px-6 py-16 text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-surface-raised text-ink-secondary">
        {icon}
      </span>
      <div className="flex max-w-sm flex-col gap-1">
        <h3 className="text-h3 text-ink">{title}</h3>
        <p className="text-sm leading-relaxed text-ink-secondary">{description}</p>
      </div>
      {action}
    </div>
  )
}

/* ------------------------------ Section label ----------------------------- */

export function Eyebrow({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p
      className={cn(
        'text-xs font-semibold tracking-[0.16em] text-primary uppercase',
        className,
      )}
    >
      {children}
    </p>
  )
}
