import { Moon, Sun } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTheme } from '@/contexts/ThemeContext'

export function ThemeToggle({ className }: { className?: string }) {
  const { resolved, setTheme } = useTheme()

  function toggle() {
    setTheme(resolved === 'light' ? 'dark' : 'light')
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={resolved === 'light' ? 'Switch to dark theme' : 'Switch to light theme'}
      className={cn(
        'press inline-flex size-9 items-center justify-center rounded-lg border border-line text-ink-secondary hover:bg-surface-raised hover:text-ink',
        className,
      )}
    >
      {resolved === 'light' ? <Moon className="size-4" /> : <Sun className="size-4" />}
    </button>
  )
}
