import { House, Library, Plus, User, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { LinkButton } from '@/components/ui/link-button'
import { cn } from '@/lib/utils'

const tabs = [
  { href: '/', label: 'Home', icon: House },
  { href: '/collection', label: 'Collection', icon: Library },
  { href: '/groups', label: 'Groups', icon: Users },
  { href: '/account', label: 'Profile', icon: User },
]

export function MobileTabBar() {
  const { pathname } = useLocation()
  const [quickOpen, setQuickOpen] = useState(false)

  return (
    <>
      {quickOpen && (
        <div className="fixed inset-0 z-50 flex items-end bg-black/50 backdrop-blur-[4px] md:hidden">
          <button
            type="button"
            aria-label="Close quick actions"
            className="absolute inset-0"
            onClick={() => setQuickOpen(false)}
          />
          <div className="relative w-full rounded-t-2xl border-t border-line bg-surface-overlay p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] shadow-modal">
            <h2 className="text-h3 mb-1 text-ink">Quick actions</h2>
            <p className="mb-4 text-sm text-ink-secondary">Start something for tonight.</p>
            <div className="flex flex-col gap-2">
              <LinkButton
                to="/g/abc123"
                size="lg"
                className="w-full justify-start"
                onClick={() => setQuickOpen(false)}
              >
                Schedule a game night
              </LinkButton>
              <LinkButton
                to="/s/fri-battle"
                variant="outline"
                size="lg"
                className="w-full justify-start"
                onClick={() => setQuickOpen(false)}
              >
                Open tonight's session
              </LinkButton>
              <LinkButton
                to="/groups"
                variant="ghost"
                size="lg"
                className="w-full justify-start text-ink-secondary"
                onClick={() => setQuickOpen(false)}
              >
                Create a group
              </LinkButton>
            </div>
          </div>
        </div>
      )}

      <nav
        aria-label="Primary"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-page/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden"
      >
        <ul className="grid grid-cols-5 items-end">
          {tabs.slice(0, 2).map((t) => (
            <TabItem key={t.href} {...t} pathname={pathname} />
          ))}
          <li className="flex justify-center">
            <button
              type="button"
              onClick={() => setQuickOpen(true)}
              className="press flex min-h-12 min-w-12 flex-col items-center justify-center gap-1 py-2 text-ink-secondary"
            >
              <span className="flex size-9 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-glow">
                <Plus className="size-5" />
              </span>
              <span className="text-[10px] font-medium">New</span>
            </button>
          </li>
          {tabs.slice(2).map((t) => (
            <TabItem key={t.href} {...t} pathname={pathname} />
          ))}
        </ul>
      </nav>
    </>
  )
}

function TabItem({
  href,
  label,
  icon: Icon,
  pathname,
}: {
  href: string
  label: string
  icon: typeof House
  pathname: string
}) {
  const active = href === '/' ? pathname === '/' : pathname.startsWith(href)
  return (
    <li className="flex justify-center">
      <Link
        to={href}
        aria-current={active ? 'page' : undefined}
        className={cn(
          'flex min-h-12 min-w-12 flex-col items-center justify-center gap-1 px-2 py-2 text-[10px] font-medium transition-colors',
          active ? 'text-primary' : 'text-ink-muted',
        )}
      >
        <Icon className={cn('size-5', active && 'stroke-[2.25]')} />
        {label}
      </Link>
    </li>
  )
}
