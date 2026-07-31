import { Check, Clock, Search, Users } from 'lucide-react'
import { MemberAvatar, Progress, StateBadge } from '@/components/primitives'

const displayMembers = [
  { id: 'alex', name: 'Alex Rivera', bgg: 'alex123', color: '#6366f1' },
  { id: 'sam', name: 'Sam Okafor', bgg: 'samplays', color: '#2dd4bf' },
  { id: 'jordan', name: 'Jordan Lee', bgg: 'jordbg', color: '#fb7185' },
  { id: 'riley', name: 'Riley Chen', bgg: 'rileyb', color: '#f59e0b' },
  { id: 'casey', name: 'Casey Moss', bgg: 'casey_m', color: '#22c55e' },
]

const displayGames = [
  { id: 'feathered-realms', title: 'Feathered Realms', cover: '/covers/feathered-realms.png' },
  { id: 'rail-and-ruin', title: 'Rail & Ruin', cover: '/covers/rail-and-ruin.png' },
  { id: 'azulejo', title: 'Azulejo', cover: '/covers/azulejo.png' },
  { id: 'harbor-guild', title: 'Harbor Guild', cover: '/covers/harbor-guild.png' },
  { id: 'moonlit-heist', title: 'Moonlit Heist', cover: '/covers/moonlit-heist.png' },
  { id: 'terra-bloom', title: 'Terra Bloom', cover: '/covers/terra-bloom.png' },
  { id: 'cat-cafe', title: 'Cat Cafe Co.', cover: '/covers/cat-cafe.png' },
  { id: 'dungeon-delve', title: 'Dungeon Delve', cover: '/covers/dungeon-delve.png' },
  { id: 'word-forge', title: 'Word Forge', cover: '/covers/word-forge.png' },
  { id: 'spice-route', title: 'Spice Route', cover: '/covers/spice-route.png' },
  { id: 'deep-signal', title: 'Deep Signal', cover: '/covers/deep-signal.png' },
  { id: 'castle-keep', title: 'Castle Keep', cover: '/covers/castle-keep.png' },
]

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
            <span>Importing collection&hellip;</span>
            <span className="font-mono">47 / 52</span>
          </div>
          <Progress value={90} label="Import progress" />
        </div>
        <div className="grid grid-cols-4 gap-2">
          {displayGames.slice(0, 8).map((g, i) => (
            <div
              key={g.id}
              className="relative aspect-2/3 overflow-hidden rounded-md border border-line"
              style={{ opacity: i > 5 ? 0.35 : 1 }}
            >
              <img src={g.cover || '/placeholder.svg'} alt="" className="absolute inset-0 h-full w-full object-cover" />
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
          {displayMembers.slice(0, 3).map((m) => (
            <div key={m.id} className="flex items-center gap-2 rounded-full bg-surface-raised px-2 py-1">
              <MemberAvatar member={{ ...m, online: false }} size="sm" />
              <span className="pr-1 text-[11px] text-ink-secondary">
                {m.name.split(' ')[0]}
              </span>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-6 gap-2">
          {displayGames.map((g, i) => (
            <div key={g.id} className="relative aspect-2/3 overflow-hidden rounded-md border border-line">
              <img src={g.cover || '/placeholder.svg'} alt="" className="absolute inset-0 h-full w-full object-cover" />
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
          <span className="font-mono text-accent-teal">89 unique &middot; 14 dupes removed</span>
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
            <Search className="size-3" /> Search games&hellip;
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
            {displayGames.slice(0, 6).map((g) => (
              <div key={g.id} className="overflow-hidden rounded-md border border-line bg-surface-raised">
                <div className="relative aspect-2/3">
                  <img src={g.cover || '/placeholder.svg'} alt="" className="absolute inset-0 h-full w-full object-cover" />
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
    { m: displayMembers[0], s: 'Going' },
    { m: displayMembers[1], s: 'Going' },
    { m: displayMembers[2], s: 'Maybe' },
    { m: displayMembers[3], s: '—' },
    { m: displayMembers[4], s: 'Going' },
  ]
  return (
    <Frame>
      <div className="flex flex-col gap-4 p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="font-display text-sm font-bold text-ink">Friday Night Battle</p>
            <p className="flex items-center gap-1.5 text-[11px] text-ink-muted">
              <Clock className="size-3" /> Jul 31 &middot; 7:00 PM &middot; Alex's Place
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
            <img
              src={displayGames[0].cover || '/placeholder.svg'}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
            />
          </div>
          <div className="min-w-0">
            <p className="truncate text-[11px] font-semibold text-ink">
              Winning vote: {displayGames[0].title}
            </p>
            <p className="font-mono text-[10px] text-primary">3 votes &middot; 94% match</p>
          </div>
        </div>
      </div>
    </Frame>
  )
}
