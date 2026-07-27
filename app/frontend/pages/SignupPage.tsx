import { Link } from 'react-router-dom'
import { Eyebrow } from '@/components/primitives'
import { LinkButton } from '@/components/ui/link-button'

export function SignupPage() {
  return (
    <div className="mx-auto flex w-full max-w-md flex-col items-center gap-8 px-4 pt-28 pb-20">
      <div className="flex flex-col items-center gap-3 text-center">
        <Eyebrow>Get started</Eyebrow>
        <h1 className="text-h1 text-ink">Create your account</h1>
        <p className="text-sm text-ink-secondary">Bring your BGG username. Takes about a minute.</p>
      </div>
      <form className="flex w-full flex-col gap-4" onSubmit={(e) => e.preventDefault()}>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="name" className="text-sm font-medium text-ink">Name</label>
          <input
            id="name"
            type="text"
            placeholder="Alex Rivera"
            className="rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-ink placeholder:text-ink-muted focus:border-primary focus:outline-none"
          />
        </div>
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
        <div className="flex flex-col gap-1.5">
          <label htmlFor="bgg" className="text-sm font-medium text-ink">BoardGameGeek username</label>
          <input
            id="bgg"
            type="text"
            placeholder="alex123"
            className="rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-ink placeholder:text-ink-muted focus:border-primary focus:outline-none"
          />
        </div>
        <LinkButton to="/collection" size="lg" className="mt-2 w-full justify-center">
          Create account
        </LinkButton>
      </form>
      <p className="text-sm text-ink-secondary">
        Already have an account?{' '}
        <Link to="/login" className="font-medium text-primary hover:underline">Log in</Link>
      </p>
    </div>
  )
}
