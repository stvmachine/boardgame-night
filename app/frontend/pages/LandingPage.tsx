import { Dices } from 'lucide-react'
import { Link } from 'react-router-dom'
import { HeroFlow } from '@/components/landing/hero-flow'
import { QuickStartForm } from '@/components/landing/quick-start-form'
import { CollectionMergeForm } from '@/components/landing/collection-merge-form'
import {
  ConnectVisual,
  MergeVisual,
  PlayVisual,
  SuggestVisual,
} from '@/components/landing/chapter-visuals'
import { Eyebrow } from '@/components/primitives'
import { TrendingCard, TrendingCardSkeleton } from '@/components/trending-card'
import { LinkButton } from '@/components/ui/link-button'
import { useDashboardStatsQuery, useHotItemsQuery } from '@/generated/operations'

const chapters = [
  {
    n: '01',
    kicker: 'Connect',
    heading: 'Link your BGG username',
    body: 'Your collection appears instantly. One username, your entire library — expansions, ratings and play counts included.',
    visual: <ConnectVisual />,
  },
  {
    n: '02',
    kicker: 'Merge',
    heading: "Everyone's games, one shelf",
    body: 'Duplicates disappear. You see your group\'s combined library — deduplicated, searchable, filterable, and tagged with who owns which copy.',
    visual: <MergeVisual />,
  },
  {
    n: '03',
    kicker: 'Suggest',
    heading: "Who's coming? What's available?",
    body: 'Filter by player count, time and complexity. See only the games everyone at the table can actually play tonight.',
    visual: <SuggestVisual />,
  },
  {
    n: '04',
    kicker: 'Play',
    heading: 'Spin up a session. Invite your crew.',
    body: 'Create a night, send invites, vote on games. From planning to playing in about sixty seconds — then track scores while you play.',
    visual: <PlayVisual />,
  },
]

export function LandingPage() {
  const statsQuery = useDashboardStatsQuery()
  const hotQuery = useHotItemsQuery()
  const stats = statsQuery.data?.dashboardStats
  const trending = hotQuery.data?.hotItems.slice(0, 6) ?? []

  return (
    <>
      {/* ------------------------------- Hero ------------------------------- */}
      <section className="aurora relative overflow-hidden border-b border-line pt-28 pb-16 sm:pt-32 sm:pb-20">
        <div className="mx-auto grid w-full max-w-6xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-[1.05fr_1fr]">
          <div className="flex flex-col items-start gap-6">
            <Eyebrow>Bring every shelf together</Eyebrow>
            <h1 className="text-display max-w-xl text-balance text-ink">
              Merge board game collections
            </h1>
            <p className="max-w-lg text-lg leading-relaxed text-pretty text-ink-secondary">
              Enter one or more BoardGameGeek usernames to combine collections.
            </p>
            <CollectionMergeForm />
            <QuickStartForm />
          </div>

          <div className="lg:pl-4">
            <HeroFlow />
          </div>
        </div>
      </section>

      {/* --------------------------- Dashboard stats ------------------------- */}
      <section aria-label="Dashboard statistics" className="border-b border-line">
        <div
          className="no-scrollbar mx-auto flex w-full max-w-6xl items-center gap-8 overflow-x-auto px-4 py-6 sm:justify-center sm:gap-12 sm:px-6"
          aria-busy={statsQuery.loading}
        >
          <span className="flex shrink-0 items-center gap-2 text-sm font-semibold text-ink">
            <Dices className="size-4 text-primary" />
            Your game nights
          </span>
          <Stat value={formatStat(stats?.collectionCount)} label="Games" />
          <Stat value={formatStat(stats?.groupCount)} label="Groups" />
          <Stat value={formatStat(stats?.sessionCount)} label="Nights" />
          {statsQuery.error && <span className="sr-only">Dashboard statistics are unavailable.</span>}
        </div>
      </section>

      {/* ------------------------------ Trending ----------------------------- */}
      <section className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 sm:py-20" aria-busy={hotQuery.loading}>
        <div className="mb-6 flex items-center justify-between gap-4">
          <h2 className="text-h1 text-ink">Trending on BGG</h2>
          {trending.length > 0 && (
            <Link to="/hot" className="text-sm font-medium text-primary hover:underline">
              View all
            </Link>
          )}
        </div>

        {hotQuery.loading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }, (_, index) => (
              <TrendingCardSkeleton key={index} />
            ))}
          </div>
        ) : hotQuery.error ? (
          <p role="status" className="rounded-xl border border-line bg-surface p-6 text-sm text-ink-secondary">
            Trending games are unavailable right now.
          </p>
        ) : trending.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {trending.map((item) => (
              <TrendingCard key={item.id} item={item} />
            ))}
          </div>
        ) : (
          <p role="status" className="rounded-xl border border-line bg-surface p-6 text-sm text-ink-secondary">
            No trending games are available yet.
          </p>
        )}
      </section>

      {/* ----------------------------- Feature tour ------------------------- */}
      <section id="tour" className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6 sm:py-24">
        <div className="mb-16 flex max-w-2xl flex-col gap-4">
          <Eyebrow>The tour</Eyebrow>
          <h2 className="text-h1 text-balance text-ink">
            Four steps from &ldquo;what should we play?&rdquo; to dice on the table.
          </h2>
        </div>

        <div className="flex flex-col gap-20 sm:gap-28">
          {chapters.map((c, i) => (
            <div
              key={c.n}
              className="reveal relative grid items-center gap-8 lg:grid-cols-2 lg:gap-14"
            >
              <span
                aria-hidden="true"
                className="pointer-events-none absolute -top-10 -left-2 font-display text-8xl font-bold text-primary/10 select-none sm:text-9xl"
              >
                {c.n}
              </span>
              <div
                className={`relative flex flex-col gap-4 ${i % 2 === 1 ? 'lg:order-2' : ''}`}
              >
                <Eyebrow>{c.kicker}</Eyebrow>
                <h3 className="text-h2 text-balance text-ink">{c.heading}</h3>
                <p className="max-w-md leading-relaxed text-pretty text-ink-secondary">{c.body}</p>
              </div>
              <div className={i % 2 === 1 ? 'lg:order-1' : ''}>{c.visual}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ------------------------------ Final CTA ---------------------------- */}
      <section className="aurora relative overflow-hidden py-20 sm:py-28">
        <div className="mx-auto flex w-full max-w-2xl flex-col items-center gap-6 px-4 text-center sm:px-6">
          <h2 className="text-h1 text-balance text-ink">Ready for your next game night?</h2>
          <p className="text-lg leading-relaxed text-pretty text-ink-secondary">
            No credit card. No commitment. Just games.
          </p>
          <LinkButton
            to="/signup"
            size="lg"
            className="h-11 px-6 text-base shadow-glow hover:scale-[1.02]"
          >
            Create your group — free
          </LinkButton>
          <p className="text-xs text-ink-muted">
            Takes about a minute. Bring your BGG username.
          </p>
        </div>
      </section>
    </>
  )
}

function formatStat(value: number | undefined) {
  return value == null ? '—' : value.toLocaleString()
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <span className="flex shrink-0 items-baseline gap-1.5">
      <span className="font-mono text-lg text-ink">{value}</span>
      <span className="text-sm text-ink-muted">{label}</span>
    </span>
  )
}
