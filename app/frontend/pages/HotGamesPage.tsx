import { RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { TrendingCard, TrendingCardSkeleton } from '@/components/trending-card'
import { useHotItemsQuery } from '@/generated/operations'

export function HotGamesPage() {
  const { data, loading, error, refetch } = useHotItemsQuery()
  const items = data?.hotItems ?? []

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pt-28 pb-20 sm:px-6 sm:pt-32">
      <header className="mb-8 flex flex-col gap-3">
        <p className="text-xs font-semibold tracking-[0.16em] text-primary uppercase">
          BoardGameGeek hotness
        </p>
        <h1 className="text-h1 text-ink">Trending Games</h1>
        <p className="max-w-2xl text-ink-secondary">
          The complete current hot list, enriched with ratings, weight, player counts, and play time.
        </p>
      </header>

      {loading ? (
        <div
          className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          aria-label="Loading trending games"
          aria-busy="true"
        >
          {Array.from({ length: 12 }, (_, index) => (
            <TrendingCardSkeleton key={index} />
          ))}
        </div>
      ) : error ? (
        <div
          role="alert"
          className="flex flex-col items-start gap-4 rounded-xl border border-line bg-surface p-6"
        >
          <div className="flex flex-col gap-1">
            <h2 className="text-h3 text-ink">Couldn&rsquo;t load trending games</h2>
            <p className="text-sm text-ink-secondary">Please check your connection and try again.</p>
          </div>
          <Button type="button" variant="outline" onClick={() => void refetch()}>
            <RefreshCw className="size-4" aria-hidden="true" />
            Try again
          </Button>
        </div>
      ) : items.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((item) => (
            <TrendingCard key={item.id} item={item} />
          ))}
        </div>
      ) : (
        <p role="status" className="rounded-xl border border-line bg-surface p-6 text-sm text-ink-secondary">
          No trending games are available yet.
        </p>
      )}
    </div>
  )
}
