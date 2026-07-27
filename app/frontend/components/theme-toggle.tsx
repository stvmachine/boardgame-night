import { Moon, Sun } from 'lucide-react'
import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

export function ThemeToggle({ className }: { className?: string }) {
  const [light, setLight] = useState(false)

  useEffect(() => {
    setLight(document.documentElement.classList.contains('light'))
  }, [])

  function toggle() {
    const next = !light
    document.documentElement.classList.toggle('light', next)
    setLight(next)
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={light ? 'Switch to dark theme' : 'Switch to light theme'}
      className={cn(
        'press inline-flex size-9 items-center justify-center rounded-lg border border-line text-ink-secondary hover:bg-surface-raised hover:text-ink',
        className,
      )}
    >
      {light ? <Moon className="size-4" /> : <Sun className="size-4" />}
    </button>
  )
}
