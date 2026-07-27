import { Check, Clock, Search, Users } from 'lucide-react'
import Image from 'next/image'
import { MemberAvatar, Progress, StateBadge } from '@/components/primitives'
import { games, members } from '@/lib/data'

function Frame({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-xl border border-line bg-surface shadow-modal">
      {children}
    </div>
  )
}

/* 01 — CONNECT */
export function ConnectVisual() {
  return (
    <Frame>
      <div className="flex flex-col gap-4 p-5">
        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium text-ink-muted" htmlFor="demo-bgg">
            BoardGameGeek username
          </label>
          <div className="flex items-center gap-2 rounded-lg border border-primary/60 bg-surface-raised px-3 py-2">
            <input
              id="demo-bgg"
              readOnly
              value="alex123"
              className="w-full bg-transparent font-mono text-sm text-ink outline-none"
            />
            <span className="inline-flex items-center gap-1 rounded-full bg-success/20 px-2 py-0.5 text-[10px] font-semibold text-success">
              <Check className="size-3" /> Found
            </span>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between text-[11px] text-ink-secondary">
            <span>Importing collection…</span>
            <span className="font-mono">47 / 52</span>
          </div>
          <Progress value={90} label="Import progress" />
        </div>
        <div className="grid grid-cols-4 gap-2">
          {games.slice(0, 8).map((g, i) => (
            <div
              key={g.id}
              className="relative aspect-2/3 overflow-hidden rounded-md border border-line"
              style={{ opacity: i > 5 ? 0.35 : 1 }}
            >
              <Image src={g.cover || '/placeholder.svg'} alt="" fill sizes="70px" className="object-cover" />
            </div>
          ))}
        </div>
      </div>
    </Frame>
  )
}

/* 02 — MERGE */
export function MergeVisual() {
  return (
    <Frame>
      <div className="flex flex-col gap-4 p-5">
        <div className="flex items-center gap-3">
          {members.slice(0, 3).map((m) => (
            <div key={m.id} className="flex items-center gap-2 rounded-full bg-surface-raised px-2 py-1">
              <MemberAvatar member={{ ...m, online: false }} size="sm" />
              <span className="pr-1 text-[11px] text-ink-secondary">
                {m.name.split(' ')[0]}
              </span>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-6 gap-2">
          {games.map((g, i) => (
            <div key={g.id} className="relative aspect-2/3 overflow-hidden rounded-md border border-line">
              <Image src={g.cover || '/placeholder.svg'} alt="" fill sizes="70px" className="object-cover" />
              {(i === 2 || i === 7) && (
                <span className="absolute inset-0 flex items-center justify-center bg-page/80 text-[9px] font-semibold text-accent-rose">
                  DUPE
                </span>
              )}
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between rounded-lg bg-surface-raised px-3 py-2 text-[11px]">
          <span className="text-ink-secondary">One merged shelf</span>
          <span className="font-mono text-accent-teal">89 unique · 14 dupes removed</span>
        </div>
      </div>
    </Frame>
  )
}

/* 03 — SUGGEST */
export function SuggestVisual() {
  return (
    <Frame>
      <div className="grid gap-4 p-5 sm:grid-cols-[140px_1fr]">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 rounded-lg bg-surface-raised px-2 py-1.5 text-[11px] text-ink-muted">
            <Search className="size-3" /> Search games…
          </div>
          <div className="flex flex-col gap-1.5">
            <p className="text-[10px] font-semibold tracking-wider text-ink-muted uppercase">Players</p>
            <div className="flex flex-wrap gap-1">
              {[2, 3, 4, 5, 6].map((n) => (
                <span
                  key={n}
                  className={
                    n === 4
                      ? 'rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground'
                      : 'rounded-full bg-surface-raised px-2 py-0.5 text-[10px] text-ink-secondary'
                  }
                >
                  {n}
                </span>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <p className="text-[10px] font-semibold tracking-wider text-ink-muted uppercase">Play time</p>
            <div className="flex flex-wrap gap-1">
              {['<30m', '30–60m', '60–90m'].map((t) => (
                <span
                  key={t}
                  className={
                    t === '30–60m'
                      ? 'rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground'
                      : 'rounded-full bg-surface-raised px-2 py-0.5 text-[10px] text-ink-secondary'
                  }
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <p className="text-[10px] font-semibold tracking-wider text-ink-muted uppercase">Complexity</p>
            <div className="h-1.5 rounded-full bg-surface-raised">
              <div className="h-full w-1/2 rounded-full bg-accent-teal" />
            </div>
            <div className="flex justify-between text-[9px] text-ink-muted">
              <span>Light</span>
              <span>Heavy</span>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <p className="text-[11px] text-ink-secondary">
            Showing <span className="font-mono text-ink">6</span> of 89 games
          </p>
          <div className="grid grid-cols-3 gap-2">
            {games.slice(0, 6).map((g) => (
              <div key={g.id} className="overflow-hidden rounded-md border border-line bg-surface-raised">
                <div className="relative aspect-2/3">
                  <Image src={g.cover || '/placeholder.svg'} alt="" fill sizes="90px" className="object-cover" />
                </div>
                <p className="truncate px-1.5 py-1 text-[9px] text-ink-secondary">{g.title}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Frame>
  )
}

/* 04 — PLAY */
export function PlayVisual() {
  const rsvps = [
    { m: members[0], s: 'Going' },
    { m: members[1], s: 'Going' },
    { m: members[2], s: 'Maybe' },
    { m: members[3], s: '—' },
    { m: members[4], s: 'Going' },
  ]
  return (
    <Frame>
      <div className="flex flex-col gap-4 p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="font-display text-sm font-bold text-ink">Friday Night Battle</p>
            <p className="flex items-center gap-1.5 text-[11px] text-ink-muted">
              <Clock className="size-3" /> Jul 31 · 7:00 PM · Alex&apos;s Place
            </p>
          </div>
          <StateBadge state="INVITED" />
        </div>

        <div className="grid grid-cols-5 gap-1.5">
          {rsvps.map(({ m, s }) => (
            <div
              key={m.id}
              className="flex flex-col items-center gap-1 rounded-lg bg-surface-raised px-1 py-2"
            >
              <MemberAvatar member={{ ...m, online: false }} size="sm" />
              <span
                className={
                  s === 'Going'
                    ? 'text-[9px] font-semibold text-success'
                    : s === 'Maybe'
                      ? 'text-[9px] font-semibold text-warning'
                      : 'text-[9px] text-ink-muted'
                }
              >
                {s}
              </span>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-[11px]">
            <span className="flex items-center gap-1 text-ink-secondary">
              <Users className="size-3" /> 3 of 5 confirmed
            </span>
            <span className="font-mono text-ink-muted">60%</span>
          </div>
          <Progress value={60} barClassName="bg-success" label="RSVP progress" />
        </div>

        <div className="flex items-center gap-2 rounded-lg border border-primary/40 bg-primary/10 px-3 py-2">
          <div className="relative size-9 shrink-0 overflow-hidden rounded">
            <Image
              src={games[0].cover || '/placeholder.svg'}
              alt=""
              fill
              sizes="36px"
              className="object-cover"
            />
          </div>
          <div className="min-w-0">
            <p className="truncate text-[11px] font-semibold text-ink">
              Winning vote: {games[0].title}
            </p>
            <p className="font-mono text-[10px] text-primary">3 votes · 94% match</p>
          </div>
        </div>
      </div>
    </Frame>
  )
}
