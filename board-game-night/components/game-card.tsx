import { Check, Clock, Star, Users } from 'lucide-react'
import Image from 'next/image'
import { CategoryPill } from '@/components/primitives'
import type { Game } from '@/lib/data'
import { cn } from '@/lib/utils'

export function GameCard({
  game,
  owned = true,
  className,
  style,
}: {
  game: Game
  owned?: boolean
  className?: string
  style?: React.CSSProperties
}) {
  const extra = game.categories.length - 2

  return (
    <article
      style={style}
      className={cn(
        'group/card flex flex-col overflow-hidden rounded-xl border border-line bg-surface transition-[transform,box-shadow,background-color] duration-200 hover:-translate-y-[3px] hover:bg-surface-raised hover:shadow-card-hover active:scale-[0.97]',
        className,
      )}
    >
      <div className="relative aspect-2/3 overflow-hidden bg-surface-raised">
        <Image
          src={game.cover || '/placeholder.svg'}
          alt={`${game.title} box cover`}
          fill
          sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 220px"
          className="object-cover transition-transform duration-300 ease-[cubic-bezier(.25,.46,.45,.94)] group-hover/card:scale-105"
        />
        {owned && (
          <span className="absolute top-2 right-2 inline-flex items-center gap-1 rounded-full bg-success/90 px-2 py-0.5 text-[10px] font-semibold text-white">
            <Check className="size-3" />
            Owned
          </span>
        )}
        <span className="absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-full bg-black/65 px-2 py-0.5 text-[11px] font-medium text-white backdrop-blur-sm">
          <Star className="size-3 fill-yellow-500 text-star" />
          <span className="font-mono">{game.rating.toFixed(1)}</span>
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-3">
        <h3 className="line-clamp-2 text-sm leading-snug font-semibold text-ink">{game.title}</h3>

        <div className="flex flex-wrap items-center gap-1.5">
          <span className="inline-flex items-center gap-1 rounded-full bg-surface-raised px-2 py-0.5 text-[11px] text-ink-secondary">
            <Users className="size-3 text-accent-teal" />
            {game.minPlayers}–{game.maxPlayers}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-surface-raised px-2 py-0.5 text-[11px] text-ink-secondary">
            <Clock className="size-3 text-ink-muted" />
            {game.minutes}m
          </span>
        </div>

        <div className="mt-auto flex flex-wrap items-center gap-1">
          {game.categories.slice(0, 2).map((c) => (
            <CategoryPill key={c}>{c}</CategoryPill>
          ))}
          {extra > 0 && <span className="text-[10px] text-ink-muted">+{extra}</span>}
        </div>
      </div>
    </article>
  )
}

export function GameCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border border-line bg-surface" aria-hidden="true">
      <div className="skeleton aspect-2/3" />
      <div className="flex flex-col gap-2 p-3">
        <div className="skeleton h-3.5 w-4/5 rounded-full" />
        <div className="skeleton h-3.5 w-1/2 rounded-full" />
        <div className="flex gap-1.5">
          <div className="skeleton h-4 w-14 rounded-full" />
          <div className="skeleton h-4 w-10 rounded-full" />
        </div>
      </div>
    </div>
  )
}

export function SkeletonGrid({ count = 12 }: { count?: number }) {
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(min(160px,100%),1fr))] gap-5 sm:grid-cols-[repeat(auto-fill,minmax(min(200px,100%),1fr))]">
      {Array.from({ length: count }).map((_, i) => (
        <GameCardSkeleton key={i} />
      ))}
    </div>
  )
}
