import { Link } from 'react-router-dom'
import { Eyebrow } from '@/components/primitives'
import { LinkButton } from '@/components/ui/link-button'

export function LoginPage() {
  return (
    <div className="mx-auto flex w-full max-w-md flex-col items-center gap-8 px-4 pt-28 pb-20">
      <div className="flex flex-col items-center gap-3 text-center">
        <Eyebrow>Welcome back</Eyebrow>
        <h1 className="text-h1 text-ink">Log in to your group</h1>
      </div>
      <form className="flex w-full flex-col gap-4" onSubmit={(e) => e.preventDefault()}>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className="text-sm font-medium text-ink">Email</label>
          <input
            id="email"
            type="email"
            placeholder="you@example.com"
            className="rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-ink placeholder:text-ink-muted focus:border-primary focus:outline-none"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="password" className="text-sm font-medium text-ink">Password</label>
          <input
            id="password"
            type="password"
            placeholder="••••••••"
            className="rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-ink placeholder:text-ink-muted focus:border-primary focus:outline-none"
          />
        </div>
        <LinkButton to="/collection" size="lg" className="mt-2 w-full justify-center">
          Log in
        </LinkButton>
      </form>
      <p className="text-sm text-ink-secondary">
        Don't have an account?{' '}
        <Link to="/signup" className="font-medium text-primary hover:underline">Sign up</Link>
      </p>
    </div>
  )
}
