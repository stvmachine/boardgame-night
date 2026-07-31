import { Clock, Star, Users, Weight } from 'lucide-react'
import type { HotItemsQuery } from '@/generated/operations'

export type TrendingItem = HotItemsQuery['hotItems'][number]

function formatNumber(value: number | null) {
  return value == null ? '—' : value.toFixed(1)
}

function formatPlayers(item: TrendingItem) {
  if (item.minPlayers == null || item.maxPlayers == null) return '—'
  if (item.minPlayers === item.maxPlayers) return String(item.minPlayers)
  return `${item.minPlayers}–${item.maxPlayers}`
}

function formatPlaytime(item: TrendingItem) {
  if (item.minPlaytime == null || item.maxPlaytime == null) return '—'
  if (item.minPlaytime === item.maxPlaytime) return `${item.minPlaytime}m`
  return `${item.minPlaytime}–${item.maxPlaytime}m`
}

export function TrendingCard({ item }: { item: TrendingItem }) {
  return (
    <a
      data-testid="trending-card"
      href={`https://boardgamegeek.com/boardgame/${encodeURIComponent(item.id)}`}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex min-w-0 flex-col overflow-hidden rounded-xl border border-line bg-surface transition-[transform,box-shadow,background-color] duration-200 hover:-translate-y-1 hover:bg-surface-raised hover:shadow-card-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      aria-label={`${item.name} on BoardGameGeek (opens in a new tab)`}
    >
      <div className="relative aspect-4/3 overflow-hidden bg-surface-raised">
        {item.thumbnail ? (
          <img
            src={item.thumbnail}
            alt={`${item.name} box cover`}
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.03]"
          />
        ) : (
          <span className="absolute inset-0 flex items-center justify-center text-sm text-ink-muted">
            No image
          </span>
        )}
        <span className="absolute top-2 left-2 rounded-full bg-page/90 px-2 py-1 font-mono text-xs font-semibold text-ink shadow-sm">
          #{item.rank}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-3">
        <div className="min-w-0">
          <h3 className="line-clamp-2 text-sm leading-snug font-semibold text-ink">{item.name}</h3>
          <p className="mt-1 text-xs text-ink-muted">{item.yearPublished ?? '—'}</p>
        </div>

        <dl className="mt-auto grid grid-cols-2 gap-x-3 gap-y-2 text-xs text-ink-secondary">
          <div className="flex items-center gap-1.5">
            <Star className="size-3.5 text-star" aria-hidden="true" />
            <dt className="sr-only">Rating</dt>
            <dd>{formatNumber(item.average)}</dd>
          </div>
          <div className="flex items-center gap-1.5">
            <Weight className="size-3.5 text-ink-muted" aria-hidden="true" />
            <dt className="sr-only">Weight</dt>
            <dd>{formatNumber(item.averageWeight)}</dd>
          </div>
          <div className="flex items-center gap-1.5">
            <Users className="size-3.5 text-accent-teal" aria-hidden="true" />
            <dt className="sr-only">Players</dt>
            <dd>{formatPlayers(item)}</dd>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="size-3.5 text-ink-muted" aria-hidden="true" />
            <dt className="sr-only">Play time</dt>
            <dd>{formatPlaytime(item)}</dd>
          </div>
        </dl>
      </div>
    </a>
  )
}

export function TrendingCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border border-line bg-surface" aria-hidden="true">
      <div className="skeleton aspect-4/3" />
      <div className="flex flex-col gap-3 p-3">
        <div className="skeleton h-4 w-4/5 rounded-full" />
        <div className="skeleton h-3 w-1/3 rounded-full" />
        <div className="grid grid-cols-2 gap-2">
          <div className="skeleton h-3 rounded-full" />
          <div className="skeleton h-3 rounded-full" />
          <div className="skeleton h-3 rounded-full" />
          <div className="skeleton h-3 rounded-full" />
        </div>
      </div>
    </div>
  )
}
