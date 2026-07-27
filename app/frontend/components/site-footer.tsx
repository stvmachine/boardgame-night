import { Link } from 'react-router-dom'
import { Logo } from '@/components/site-nav'

const columns = [
  {
    title: 'Product',
    links: [
      { label: 'Features', href: '/#tour' },
      { label: 'How it works', href: '/#tour' },
      { label: 'Collection browser', href: '/collection' },
      { label: 'Changelog', href: '/#' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { label: 'BGG integration', href: '/account' },
      { label: 'Help center', href: '/#' },
      { label: 'API docs', href: '/#' },
      { label: 'Status', href: '/#' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About', href: '/#' },
      { label: 'Blog', href: '/#' },
      { label: 'Twitter', href: '/#' },
      { label: 'GitHub', href: '/#' },
    ],
  },
]

export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-page">
      <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div className="flex flex-col gap-3">
          <Logo />
          <p className="max-w-xs text-sm leading-relaxed text-ink-secondary">
            One shelf for your whole group. Plan the night, pick the game, play it.
          </p>
        </div>
        {columns.map((col) => (
          <div key={col.title} className="flex flex-col gap-3">
            <h2 className="text-xs font-semibold tracking-[0.14em] text-ink-muted uppercase">
              {col.title}
            </h2>
            <ul className="flex flex-col gap-2">
              {col.links.map((l) => (
                <li key={l.label}>
                  <Link
                    to={l.href}
                    className="text-sm text-ink-secondary transition-colors hover:text-ink"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-line">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-4 py-6 text-xs text-ink-muted sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>Made for game nights.</p>
          <p>&copy; {new Date().getFullYear()} BoardGameNight. Not affiliated with BoardGameGeek.</p>
        </div>
      </div>
    </footer>
  )
}
