import { ChevronDown, Search, Star } from 'lucide-react'
import { useState } from 'react'
import { MemberAvatar } from '@/components/primitives'
import {
  facetCount,
  timeLabels,
  type Filters,
  type TimeBucket,
} from '@/lib/collection'
import { allCategories, games, members } from '@/lib/data'
import { cn } from '@/lib/utils'

const playerOptions = [1, 2, 3, 4, 5, 6]
const timeOptions: TimeBucket[] = ['<30', '30-60', '60-90', '90+']
const ratingTiers = [8, 7, 6]
const weightPresets: { label: string; range: [number, number] }[] = [
  { label: 'Light', range: [1, 2] },
  { label: 'Medium', range: [2, 3.5] },
  { label: 'Heavy', range: [3.5, 5] },
  { label: 'Any', range: [1, 5] },
]

function Facet({
  title,
  count,
  children,
  defaultOpen = true,
}: {
  title: string
  count: number
  children: React.ReactNode
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border-b border-line py-4 last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-2 text-left"
      >
        <span className="flex items-center gap-2 text-sm font-semibold text-ink">
          {title}
          {count > 0 && (
            <span className="rounded-full bg-primary/15 px-1.5 text-[10px] font-bold text-primary">
              {count}
            </span>
          )}
        </span>
        <ChevronDown
          className={cn(
            'size-4 shrink-0 text-ink-muted transition-transform duration-200',
            open && 'rotate-180',
          )}
        />
      </button>
      {open && <div className="mt-3 flex flex-col gap-2">{children}</div>}
    </div>
  )
}

function Chip({
  active,
  disabled,
  onClick,
  children,
}: {
  active: boolean
  disabled?: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={active}
      className={cn(
        'press rounded-full border px-2.5 py-1 text-xs font-medium transition-colors',
        active
          ? 'border-primary bg-primary text-primary-foreground'
          : 'border-line bg-surface-raised text-ink-secondary hover:text-ink',
        disabled && 'cursor-not-allowed opacity-40',
      )}
    >
      {children}
    </button>
  )
}

export function FilterPanel({
  filters,
  setFilters,
}: {
  filters: Filters
  setFilters: (next: Partial<Filters>) => void
}) {
  const [catQuery, setCatQuery] = useState('')
  const [showAllCats, setShowAllCats] = useState(false)

  const toggle = <T,>(list: T[], value: T) =>
    list.includes(value) ? list.filter((v) => v !== value) : [...list, value]

  const visibleCats = allCategories
    .filter((c) => c.name.toLowerCase().includes(catQuery.toLowerCase()))
    .slice(0, showAllCats ? undefined : 6)
  const hiddenCatCount = allCategories.length - 6

  return (
    <div className="flex flex-col">
      <Facet title="Players" count={filters.players.length}>
        <div className="flex flex-wrap gap-1.5">
          {playerOptions.map((p) => {
            const count = facetCount(
              games,
              filters,
              'players',
              (g) => p >= g.minPlayers && p <= g.maxPlayers,
            )
            return (
              <Chip
                key={p}
                active={filters.players.includes(p)}
                disabled={count === 0 && !filters.players.includes(p)}
                onClick={() => setFilters({ players: toggle(filters.players, p) })}
              >
                {p === 6 ? '6+' : p} <span className="opacity-60">({count})</span>
              </Chip>
            )
          })}
        </div>
      </Facet>

      <Facet title="Play time" count={filters.times.length}>
        <div className="flex flex-wrap gap-1.5">
          {timeOptions.map((t) => {
            const count = facetCount(games, filters, 'times', (g) => {
              if (t === '<30') return g.minutes < 30
              if (t === '30-60') return g.minutes >= 30 && g.minutes <= 60
              if (t === '60-90') return g.minutes > 60 && g.minutes <= 90
              return g.minutes > 90
            })
            return (
              <Chip
                key={t}
                active={filters.times.includes(t)}
                disabled={count === 0 && !filters.times.includes(t)}
                onClick={() => setFilters({ times: toggle(filters.times, t) })}
              >
                {timeLabels[t]} <span className="opacity-60">({count})</span>
              </Chip>
            )
          })}
        </div>
      </Facet>

      <Facet
        title="Complexity"
        count={filters.weight[0] !== 1 || filters.weight[1] !== 5 ? 1 : 0}
      >
        <label className="sr-only" htmlFor="weight-max">
          Maximum complexity
        </label>
        <input
          id="weight-max"
          type="range"
          min={1}
          max={5}
          step={0.5}
          value={filters.weight[1]}
          onChange={(e) => setFilters({ weight: [filters.weight[0], Number(e.target.value)] })}
          className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-surface-raised accent-teal-400"
        />
        <div className="flex justify-between text-[11px] text-ink-muted">
          <span>Light</span>
          <span className="font-mono text-ink-secondary">
            {filters.weight[0].toFixed(1)}–{filters.weight[1].toFixed(1)}
          </span>
          <span>Heavy</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {weightPresets.map((p) => (
            <Chip
              key={p.label}
              active={filters.weight[0] === p.range[0] && filters.weight[1] === p.range[1]}
              onClick={() => setFilters({ weight: p.range })}
            >
              {p.label}
            </Chip>
          ))}
        </div>
      </Facet>

      <Facet title="Rating" count={filters.rating > 0 ? 1 : 0}>
        <div className="flex flex-col gap-1">
          {ratingTiers.map((r) => {
            const count = facetCount(games, filters, 'rating', (g) => g.rating >= r)
            const active = filters.rating === r
            return (
              <button
                key={r}
                type="button"
                aria-pressed={active}
                onClick={() => setFilters({ rating: active ? 0 : r })}
                className={cn(
                  'press flex items-center justify-between rounded-lg px-2 py-1.5 text-xs transition-colors',
                  active ? 'bg-primary/15 text-ink' : 'text-ink-secondary hover:bg-surface-raised',
                )}
              >
                <span className="flex items-center gap-1">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <Star
                      key={i}
                      className={cn(
                        'size-3',
                        i < Math.round(r / 2)
                          ? 'fill-yellow-500 text-star'
                          : 'text-ink-muted',
                      )}
                    />
                  ))}
                  <span className="ml-1 font-mono">{r}.0+</span>
                </span>
                <span className="text-ink-muted">({count})</span>
              </button>
            )
          })}
        </div>
      </Facet>

      <Facet title="Category" count={filters.categories.length}>
        <div className="flex items-center gap-2 rounded-lg border border-line bg-surface-raised px-2 py-1.5">
          <Search className="size-3.5 shrink-0 text-ink-muted" />
          <input
            value={catQuery}
            onChange={(e) => setCatQuery(e.target.value)}
            placeholder="Search categories&hellip;"
            aria-label="Search categories"
            className="w-full bg-transparent text-xs text-ink placeholder:text-ink-muted focus:outline-none"
          />
        </div>
        <ul className="flex flex-col gap-0.5">
          {visibleCats.map((c) => {
            const count = facetCount(games, filters, 'categories', (g) =>
              g.categories.includes(c.name),
            )
            const active = filters.categories.includes(c.name)
            return (
              <li key={c.name}>
                <label
                  className={cn(
                    'flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-xs transition-colors hover:bg-surface-raised',
                    active ? 'text-ink' : 'text-ink-secondary',
                  )}
                >
                  <input
                    type="checkbox"
                    checked={active}
                    onChange={() => setFilters({ categories: toggle(filters.categories, c.name) })}
                    className="size-3.5 accent-indigo-500"
                  />
                  <span className="flex-1 truncate">{c.name}</span>
                  <span className="text-ink-muted">({count})</span>
                </label>
              </li>
            )
          })}
        </ul>
        {!showAllCats && hiddenCatCount > 0 && !catQuery && (
          <button
            type="button"
            onClick={() => setShowAllCats(true)}
            className="self-start text-xs font-medium text-primary hover:underline"
          >
            + Show {hiddenCatCount} more
          </button>
        )}
      </Facet>

      <Facet title="Owned by" count={filters.owners.length}>
        <ul className="flex flex-col gap-0.5">
          {members.map((m) => {
            const count = facetCount(games, filters, 'owners', (g) => g.owners.includes(m.id))
            const active = filters.owners.includes(m.id)
            return (
              <li key={m.id}>
                <label
                  className={cn(
                    'flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-xs transition-colors hover:bg-surface-raised',
                    active ? 'text-ink' : 'text-ink-secondary',
                  )}
                >
                  <input
                    type="checkbox"
                    checked={active}
                    onChange={() => setFilters({ owners: toggle(filters.owners, m.id) })}
                    className="size-3.5 accent-indigo-500"
                  />
                  <MemberAvatar member={{ ...m, online: false }} size="sm" />
                  <span className="flex-1 truncate">{m.name.split(' ')[0]}</span>
                  <span className="text-ink-muted">({count})</span>
                </label>
              </li>
            )
          })}
        </ul>
      </Facet>
    </div>
  )
}
