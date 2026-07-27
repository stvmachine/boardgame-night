'use client'

import { Check, Dices, PartyPopper, Users } from 'lucide-react'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import { games, members } from '@/lib/data'
import { cn } from '@/lib/utils'

const steps = [
  { label: 'Gather the crew', icon: Users },
  { label: 'Merge the shelves', icon: Dices },
  { label: 'Get a pick everyone can play', icon: Check },
  { label: 'Game night!', icon: PartyPopper },
]

export function HeroFlow() {
  const [step, setStep] = useState(0)

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) return
    const id = setInterval(() => setStep((s) => (s + 1) % 4), 2600)
    return () => clearInterval(id)
  }, [])

  const covers = games.slice(0, 6)

  return (
    <div className="relative w-full">
      <div className="relative overflow-hidden rounded-2xl border border-line bg-surface shadow-modal">
        {/* fake app chrome */}
        <div className="flex items-center gap-2 border-b border-line bg-surface-raised/60 px-4 py-3">
          <span className="flex size-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Dices className="size-3.5" />
          </span>
          <span className="font-display text-xs font-bold text-ink">Strategy Crew</span>
          <span className="ml-auto rounded-full bg-success/20 px-2 py-0.5 text-[10px] font-semibold text-success">
            Friday 7:00 PM
          </span>
        </div>

        <div className="relative flex min-h-[320px] flex-col gap-4 p-4 sm:min-h-[360px]">
          {/* Step 1 — avatars around the table */}
          <div className="flex items-center gap-2">
            {members.map((m, i) => (
              <span
                key={m.id}
                className={cn(
                  'flex size-9 items-center justify-center rounded-full bg-surface-raised text-[11px] font-semibold transition-all duration-500',
                  step >= 0 ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0',
                )}
                style={{
                  color: m.color,
                  boxShadow: `0 0 0 2px ${m.color}`,
                  transitionDelay: `${i * 80}ms`,
                }}
              >
                {m.name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')}
              </span>
            ))}
            <span className="ml-1 text-xs text-ink-muted">5 friends</span>
          </div>

          {/* Step 2 — covers merging into a grid */}
          <div className="grid grid-cols-6 gap-2">
            {covers.map((g, i) => (
              <div
                key={g.id}
                className={cn(
                  'relative aspect-2/3 overflow-hidden rounded-md border border-line bg-surface-raised transition-all duration-700',
                  step >= 1
                    ? 'translate-y-0 scale-100 opacity-100'
                    : 'translate-y-4 scale-90 opacity-0',
                )}
                style={{ transitionDelay: `${i * 70}ms` }}
              >
                <Image
                  src={g.cover || '/placeholder.svg'}
                  alt=""
                  fill
                  sizes="80px"
                  className="object-cover"
                />
              </div>
            ))}
          </div>

          <p
            className={cn(
              'text-[11px] text-ink-muted transition-opacity duration-500',
              step >= 1 ? 'opacity-100' : 'opacity-0',
            )}
          >
            89 games merged · 14 duplicates removed
          </p>

          {/* Step 3 — suggestion card */}
          <div
            className={cn(
              'flex items-center gap-3 rounded-xl border border-line bg-surface-raised p-3 transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]',
              step >= 2 ? 'translate-y-0 scale-100 opacity-100' : 'translate-y-3 scale-95 opacity-0',
            )}
          >
            <div className="relative size-12 shrink-0 overflow-hidden rounded-md">
              <Image
                src={games[0].cover || '/placeholder.svg'}
                alt=""
                fill
                sizes="48px"
                className="object-cover"
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-ink">{games[0].title}</p>
              <p className="font-mono text-[11px] text-accent-teal">94% match · 4 players · 60m</p>
            </div>
            <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-success text-white">
              <Check className="size-4" />
            </span>
          </div>

          {/* Step 4 — celebration */}
          <div
            className={cn(
              'flex items-center justify-center gap-2 rounded-xl bg-primary/10 py-3 transition-all duration-500',
              step >= 3 ? 'scale-100 opacity-100' : 'scale-95 opacity-0',
            )}
          >
            <PartyPopper className="size-4 text-accent-rose" />
            <span className="font-display text-sm font-bold text-ink">Game night locked in</span>
          </div>
        </div>
      </div>

      {/* step legend */}
      <ol className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
        {steps.map((s, i) => (
          <li
            key={s.label}
            className={cn(
              'flex items-center gap-1.5 text-[11px] transition-colors duration-300',
              i === step ? 'text-ink' : 'text-ink-muted',
            )}
          >
            <s.icon className={cn('size-3.5', i === step && 'text-primary')} />
            {s.label}
          </li>
        ))}
      </ol>
    </div>
  )
}
