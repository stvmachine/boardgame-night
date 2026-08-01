import { Clock, Dumbbell, Star, Users } from 'lucide-react'
import type { Game } from '@/lib/data'
import { cn } from '@/lib/utils'

export type GameCardVariant = 'grid' | 'list'

function OwnerStack({ owners }: { owners: string[] }) {
  const visible = owners.slice(0, 3)
  const overflow = owners.length - visible.length

  return (
    <div
      aria-label={`Owned by ${owners.join(', ')}`}
      className="flex -space-x-1"
    >
      {visible.map((owner) => (
        <span
          key={owner}
          aria-hidden="true"
          title={owner}
          className="inline-flex size-6 items-center justify-center rounded-full border-2 border-surface bg-primary-container text-[10px] font-semibold text-on-primary-container"
        >
          {owner.charAt(0).toUpperCase()}
        </span>
      ))}
      {overflow > 0 && (
        <span className="inline-flex size-6 items-center justify-center rounded-full border-2 border-surface bg-surface-raised text-[10px] font-semibold text-ink-secondary">
          +{overflow}
        </span>
      )}
    </div>
  )
}

function GameStats({ game }: { game: Game }) {
  return (
    <div
      data-testid="game-card-footer"
      className="grid grid-cols-3 gap-1 border-t border-line pt-2 text-xs text-ink-secondary"
    >
      <span className="inline-flex items-center gap-1">
        <Users className="size-3.5 text-primary" aria-hidden="true" />
        {game.minPlayers}–{game.maxPlayers}
      </span>
      <span className="inline-flex items-center gap-1">
        <Clock className="size-3.5 text-primary" aria-hidden="true" />
        {game.minutes}m
      </span>
      <span className="inline-flex items-center gap-1">
        <Dumbbell className="size-3.5 text-primary" aria-hidden="true" />
        {game.weight.toFixed(1)}
      </span>
    </div>
  )
}

export function GameCard({
  game,
  variant = 'grid',
  actions,
  className,
  style,
}: {
  game: Game
  variant?: GameCardVariant
  actions?: React.ReactNode
  className?: string
  style?: React.CSSProperties
}) {
  const list = variant === 'list'

  return (
    <article
      data-testid="game-card"
      data-slot="card"
      data-variant={variant}
      style={style}
      className={cn(
        'group/card relative overflow-hidden rounded-xl border border-line bg-surface shadow-card transition-[transform,box-shadow,background-color] duration-200 hover:-translate-y-[3px] hover:bg-surface-raised hover:shadow-card-hover',
        list ? 'flex min-h-32 flex-row' : 'flex flex-col',
        className,
      )}
    >
      <a
        href={`https://boardgamegeek.com/boardgame/${encodeURIComponent(game.id)}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`View ${game.title} on BoardGameGeek`}
        className="absolute inset-0 z-10 rounded-xl focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      />

      <div
        className={cn(
          'pointer-events-none relative overflow-hidden bg-surface-raised',
          list ? 'm-3 h-[72px] w-24 shrink-0 rounded-lg' : 'aspect-[4/3] w-full',
        )}
      >
        <img
          src={game.cover || '/placeholder.svg'}
          alt={`${game.title} box cover`}
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 ease-[cubic-bezier(.25,.46,.45,.94)] group-hover/card:scale-105"
        />
        <span className="absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-full bg-black/70 px-2 py-0.5 text-[11px] font-medium text-white backdrop-blur-sm">
          <Star className="size-3 fill-yellow-500 text-star" aria-hidden="true" />
          <span className="font-mono">{game.rating.toFixed(1)}</span>
        </span>
      </div>

      <div className={cn('pointer-events-none relative flex min-w-0 flex-1 flex-col gap-2 p-3', list && 'pl-0')}>
        <div className="flex min-w-0 items-start justify-between gap-3">
          <h3 className={cn('text-sm leading-snug font-semibold text-ink', list ? 'line-clamp-1' : 'line-clamp-2')}>
            {game.title}
          </h3>
          <span className="shrink-0 rounded-full bg-primary-container px-2 py-0.5 font-mono text-[11px] text-on-primary-container">
            {game.rating.toFixed(1)}
          </span>
        </div>

        {game.description && (
          <p
            data-testid="game-description"
            className={cn('text-sm leading-relaxed text-ink-secondary', list ? 'line-clamp-3' : 'line-clamp-2')}
          >
            {game.description}
          </p>
        )}

        <div className={cn('mt-auto flex items-end gap-3', list ? 'justify-between' : 'flex-col items-stretch')}>
          <GameStats game={game} />
          {game.owners.length > 0 && <OwnerStack owners={game.owners} />}
        </div>

        {actions && (
          <div className="pointer-events-auto relative z-20 flex items-center gap-2">
            {actions}
          </div>
        )}
      </div>
    </article>
  )
}

export function GameCardSkeleton({ variant = 'grid' }: { variant?: GameCardVariant }) {
  const list = variant === 'list'
  return (
    <div
      className={cn(
        'overflow-hidden rounded-xl border border-line bg-surface',
        list && 'flex min-h-32 flex-row',
      )}
      aria-hidden="true"
    >
      <div className={cn('skeleton', list ? 'm-3 h-[72px] w-24 shrink-0 rounded-lg' : 'aspect-[4/3]')} />
      <div className={cn('flex flex-1 flex-col gap-2 p-3', list && 'pl-0')}>
        <div className="skeleton h-3.5 w-4/5 rounded-full" />
        <div className="skeleton h-3.5 w-full rounded-full" />
        <div className="skeleton h-3.5 w-2/3 rounded-full" />
        <div className="mt-auto flex gap-1.5">
          <div className="skeleton h-4 w-14 rounded-full" />
          <div className="skeleton h-4 w-10 rounded-full" />
        </div>
      </div>
    </div>
  )
}

export function SkeletonGrid({
  count = 12,
  variant = 'grid',
}: {
  count?: number
  variant?: GameCardVariant
}) {
  return (
    <div
      className={cn(
        variant === 'grid'
          ? 'grid grid-cols-[repeat(auto-fill,minmax(min(160px,100%),1fr))] gap-5 sm:grid-cols-[repeat(auto-fill,minmax(min(200px,100%),1fr))]'
          : 'grid grid-cols-1 gap-4',
      )}
    >
      {Array.from({ length: count }).map((_, index) => (
        <GameCardSkeleton key={index} variant={variant} />
      ))}
    </div>
  )
}
