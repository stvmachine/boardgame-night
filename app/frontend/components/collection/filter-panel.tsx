import { Search } from 'lucide-react'
import { MemberAvatar } from '@/components/primitives'
import {
  complexityLabels,
  inTimeBucket,
  timeLabels,
  type Complexity,
  type Filters,
  type PlayerRange,
  type TimeBucket,
} from '@/lib/collection'
import type { Game, Member } from '@/lib/data'
import { cn } from '@/lib/utils'

const timeOptions: TimeBucket[] = [1, 2, 3, 4]
const complexityOptions: Array<{ value: Complexity | null; label: string }> = [
  { value: null, label: 'Any' },
  ...([1, 2, 3] as Complexity[]).map((value) => ({
    value,
    label: complexityLabels[value],
  })),
]

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="border-t border-line py-5 first:border-t-0 first:pt-4">
      <legend className="text-sm font-semibold text-ink">{title}</legend>
      <div className="mt-3">{children}</div>
    </fieldset>
  )
}

function normalizedRange(range: PlayerRange | null) {
  return range ?? { min: 1, max: 10 }
}

function nextRange(min: number, max: number): PlayerRange | null {
  return min === 1 && max === 10 ? null : { min, max }
}

export function FilterPanel({
  filters,
  setFilters,
  games,
  members,
}: {
  filters: Filters
  setFilters: (next: Partial<Filters>) => void
  games: Game[]
  members: Member[]
}) {
  const range = normalizedRange(filters.players)
  const allOwnerIds = members.map((member) => member.id)
  const selectedOwners = filters.owners.length === 0 ? allOwnerIds : filters.owners

  function toggleOwner(ownerId: string) {
    const next = selectedOwners.includes(ownerId)
      ? selectedOwners.filter((id) => id !== ownerId)
      : [...selectedOwners, ownerId]
    setFilters({ owners: next.length === allOwnerIds.length ? [] : next })
  }

  function toggleTime(bucket: TimeBucket) {
    const times = filters.times.includes(bucket)
      ? filters.times.filter((value) => value !== bucket)
      : [...filters.times, bucket]
    setFilters({ times })
  }

  return (
    <div className="flex flex-col">
      <Section title="Search">
        <label className="flex items-center gap-2 rounded-lg border border-line bg-surface px-3 py-2 focus-within:border-primary">
          <span className="sr-only">Search</span>
          <Search className="size-4 shrink-0 text-ink-muted" aria-hidden="true" />
          <input
            type="search"
            value={filters.q}
            onChange={(event) => setFilters({ q: event.target.value })}
            placeholder="Search"
            aria-label="Search"
            className="min-w-0 flex-1 bg-transparent text-sm text-ink placeholder:text-ink-muted focus:outline-none"
          />
        </label>
      </Section>

      <Section title="Owners">
        <ul className="flex flex-col gap-1">
          {members.map((member) => {
            const selected = selectedOwners.includes(member.id)
            const count = games.filter((game) => game.owners.includes(member.id)).length
            return (
              <li key={member.id}>
                <label className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-ink-secondary hover:bg-surface-raised">
                  <input
                    type="checkbox"
                    checked={selected}
                    onChange={() => toggleOwner(member.id)}
                    aria-label={member.bgg}
                    className="size-4 accent-primary"
                  />
                  <MemberAvatar member={{ ...member, online: false }} size="sm" />
                  <span className="min-w-0 flex-1 truncate">{member.bgg}</span>
                  <span className="text-ink-muted">({count})</span>
                </label>
              </li>
            )
          })}
        </ul>
      </Section>

      <Section title="Players">
        <p className="mb-3 text-xs text-ink-secondary">
          {range.min}–{range.max === 10 ? '10+' : range.max} players
        </p>
        <div className="grid gap-3">
          <input
            type="range"
            min={1}
            max={10}
            step={1}
            value={range.min}
            aria-label="Minimum players"
            aria-valuemin={1}
            aria-valuemax={10}
            aria-valuenow={range.min}
            onChange={(event) => {
              const min = Math.min(Number(event.target.value), range.max)
              setFilters({ players: nextRange(min, range.max) })
            }}
            className="w-full accent-primary"
          />
          <input
            type="range"
            min={1}
            max={10}
            step={1}
            value={range.max}
            aria-label="Maximum players"
            aria-valuemin={1}
            aria-valuemax={10}
            aria-valuenow={range.max}
            onChange={(event) => {
              const max = Math.max(Number(event.target.value), range.min)
              setFilters({ players: nextRange(range.min, max) })
            }}
            className="w-full accent-primary"
          />
        </div>
      </Section>

      <Section title="Play time">
        <ul className="grid gap-2">
          {timeOptions.map((bucket) => {
            const count = games.filter((game) => inTimeBucket(game.minutes, bucket)).length
            return (
              <li key={bucket}>
                <label className="flex cursor-pointer items-center gap-2 text-xs text-ink-secondary">
                  <input
                    type="checkbox"
                    checked={filters.times.includes(bucket)}
                    onChange={() => toggleTime(bucket)}
                    aria-label={timeLabels[bucket]}
                    className="size-4 accent-primary"
                  />
                  <span className="flex-1">{timeLabels[bucket]}</span>
                  <span className="text-ink-muted">({count})</span>
                </label>
              </li>
            )
          })}
        </ul>
      </Section>

      <Section title="Complexity">
        <div className="grid grid-cols-2 gap-1 rounded-lg border border-line bg-surface p-1">
          {complexityOptions.map((option) => {
            const selected = filters.complexity === option.value
            return (
              <button
                key={option.label}
                type="button"
                aria-pressed={selected}
                onClick={() => setFilters({ complexity: option.value })}
                className={cn(
                  'rounded-md px-2 py-2 text-xs font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
                  selected
                    ? 'bg-primary text-primary-foreground'
                    : 'text-ink-secondary hover:bg-surface-raised hover:text-ink',
                )}
              >
                {option.label}
              </button>
            )
          })}
        </div>
      </Section>
    </div>
  )
}
