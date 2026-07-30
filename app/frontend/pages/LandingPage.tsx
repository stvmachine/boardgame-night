import { ArrowRight, Dices, Sparkles } from 'lucide-react'
import { useMemo } from 'react'
import { useQuery } from '@apollo/client'
import { HeroFlow } from '@/components/landing/hero-flow'
import { QuickStartForm } from '@/components/landing/quick-start-form'
import {
  ConnectVisual,
  MergeVisual,
  PlayVisual,
  SuggestVisual,
} from '@/components/landing/chapter-visuals'
import { AvatarStack, Card, Eyebrow, MemberAvatar } from '@/components/primitives'
import { LinkButton } from '@/components/ui/link-button'
import { DASHBOARD_STATS } from '@/lib/graphql/documents'
// TODO: Replace with real group members when group context is available
import { members, stats, testimonials } from '@/lib/data'

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
  const { data: statsData } = useQuery(DASHBOARD_STATS)

  const displayStats = useMemo(() => {
    if (statsData?.dashboardStats) {
      return {
        gamesMerged: (statsData.dashboardStats.collectionCount ?? 0).toLocaleString(),
        sessionsHosted: (statsData.dashboardStats.sessionCount ?? 0).toLocaleString(),
        activeGroups: (statsData.dashboardStats.groupCount ?? 0).toLocaleString(),
      }
    }
    return stats
  }, [statsData])

  return (
    <>
      {/* ------------------------------- Hero ------------------------------- */}
      <section className="aurora relative overflow-hidden border-b border-line pt-28 pb-16 sm:pt-32 sm:pb-20">
        <div className="mx-auto grid w-full max-w-6xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-[1.05fr_1fr]">
          <div className="flex flex-col items-start gap-6">
            <Eyebrow>For groups of 3–10 board game friends</Eyebrow>
            <h1 className="text-display max-w-xl text-balance text-ink">
              Board game night, sorted.
            </h1>
            <p className="max-w-lg text-lg leading-relaxed text-pretty text-ink-secondary">
              Merge your group's collections, discover games everyone can play, and spin up a
              session in seconds.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <LinkButton
                to="/signup"
                size="lg"
                className="h-11 px-5 text-base shadow-glow hover:scale-[1.02]"
              >
                Start your game night
              </LinkButton>
              <LinkButton
                to="/#tour"
                variant="ghost"
                size="lg"
                className="h-11 px-4 text-base text-ink-secondary hover:text-ink"
              >
                See how it works
                <ArrowRight className="size-4" />
              </LinkButton>
            </div>
            <QuickStartForm />
            <div className="flex items-center gap-3">
              <AvatarStack memberList={members} />
              <p className="text-sm text-ink-muted">
                Join {displayStats.activeGroups} groups already playing
              </p>
            </div>
          </div>

          <div className="lg:pl-4">
            <HeroFlow />
          </div>
        </div>
      </section>

      {/* -------------------------- Social proof strip ----------------------- */}
      <section aria-label="Product stats" className="border-b border-line">
        <div className="no-scrollbar mx-auto flex w-full max-w-6xl items-center gap-8 overflow-x-auto px-4 py-6 sm:justify-center sm:gap-12 sm:px-6">
          <span className="flex shrink-0 items-center gap-2 text-sm font-medium text-ink">
            <Dices className="size-4 text-primary" />
            Integrates with BoardGameGeek
          </span>
          <Stat value={displayStats.gamesMerged} label="games merged" />
          <Stat value={displayStats.sessionsHosted} label="sessions hosted" />
          <Stat value={displayStats.activeGroups} label="active groups" />
        </div>
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

      {/* ----------------------------- Testimonials -------------------------- */}
      <section className="border-y border-line bg-surface/40 py-20 sm:py-24">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
          <div className="mb-12 flex flex-col gap-3">
            <Eyebrow>Loved by real tables</Eyebrow>
            <h2 className="text-h1 max-w-xl text-balance text-ink">
              Groups stopped negotiating and started playing.
            </h2>
          </div>
          <ul className="grid gap-5 md:grid-cols-3">
            {testimonials.map((t, i) => (
              <li key={t.name} className="reveal">
                <Card className="flex h-full flex-col gap-5 p-6">
                  <Sparkles className="size-4 text-accent-rose" aria-hidden="true" />
                  <blockquote className="flex-1 text-[15px] leading-relaxed text-pretty text-ink italic">
                    &ldquo;{t.quote}&rdquo;
                  </blockquote>
                  <div className="flex items-center gap-3 border-t border-line pt-4">
                    <MemberAvatar member={{ ...members[i], name: t.name, online: false }} size="md" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-ink">{t.name}</p>
                      <p className="truncate text-xs text-ink-muted">{t.group}</p>
                    </div>
                  </div>
                  <p className="font-mono text-[11px] text-accent-teal">{t.stat}</p>
                </Card>
              </li>
            ))}
          </ul>
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

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <span className="flex shrink-0 items-baseline gap-1.5">
      <span className="font-mono text-lg text-ink">{value}</span>
      <span className="text-sm text-ink-muted">{label}</span>
    </span>
  )
}
