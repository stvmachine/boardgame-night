import { Dices, Menu, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { LinkButton } from '@/components/ui/link-button'
import { ThemeToggle } from '@/components/theme-toggle'
import { cn } from '@/lib/utils'

const links = [
  { href: '/collection', label: 'Collection' },
  { href: '/groups', label: 'Groups' },
  { href: '/g/abc123', label: 'Sessions' },
]

export function Logo({ className }: { className?: string }) {
  return (
    <Link
      to="/"
      className={cn('flex items-center gap-2 font-display text-base font-bold tracking-tight text-ink', className)}
    >
      <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <Dices className="size-[18px]" />
      </span>
      BoardGameNight
    </Link>
  )
}

export function SiteNav() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const { pathname } = useLocation()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => setOpen(false), [pathname])

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-50 transition-colors duration-300',
        scrolled
          ? 'border-b border-line bg-page/80 backdrop-blur-xl backdrop-saturate-150'
          : 'border-b border-transparent',
      )}
    >
      <nav
        aria-label="Main"
        className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6"
      >
        <Logo />

        <ul className="hidden items-center gap-1 md:flex">
          {links.map((l) => {
            const active = pathname.startsWith(l.href.slice(0, 4))
            return (
              <li key={l.href}>
                <Link
                  to={l.href}
                  className={cn(
                    'rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    active ? 'text-primary' : 'text-ink-secondary hover:text-ink',
                  )}
                >
                  {l.label}
                </Link>
              </li>
            )
          })}
        </ul>

        <div className="flex items-center gap-2">
          <ThemeToggle className="hidden sm:inline-flex" />
          <LinkButton
            to="/login"
            variant="ghost"
            size="lg"
            className="hidden text-ink-secondary hover:text-ink sm:inline-flex"
          >
            Log in
          </LinkButton>
          <LinkButton to="/signup" size="lg" className="shadow-glow">
            Start free
          </LinkButton>
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            className="press inline-flex size-9 items-center justify-center rounded-lg border border-line text-ink-secondary md:hidden"
          >
            {open ? <X className="size-4" /> : <Menu className="size-4" />}
          </button>
        </div>
      </nav>

      {open && (
        <div className="border-t border-line bg-page/95 px-4 py-4 backdrop-blur-xl md:hidden">
          <ul className="flex flex-col gap-1">
            {links.map((l) => (
              <li key={l.href}>
                <Link
                  to={l.href}
                  className="block rounded-lg px-3 py-2.5 text-sm font-medium text-ink-secondary hover:bg-surface-raised hover:text-ink"
                >
                  {l.label}
                </Link>
              </li>
            ))}
            <li className="mt-2 flex items-center justify-between border-t border-line pt-3">
              <Link to="/login" className="px-3 text-sm font-medium text-ink-secondary">
                Log in
              </Link>
              <ThemeToggle />
            </li>
          </ul>
        </div>
      )}
    </header>
  )
}
