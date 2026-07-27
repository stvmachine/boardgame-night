import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Eyebrow } from '@/components/primitives'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/AuthContext'

export function LoginPage() {
  const { signIn, error, clearError, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const from = (location.state as { from?: string })?.from || '/collection'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (submitting) return
    setSubmitting(true)
    clearError()
    try {
      await signIn(email, password)
      navigate(from, { replace: true })
    } catch {
      // Error is set in AuthContext, we just stop the spinner
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-col items-center gap-8 px-4 pt-28 pb-20">
      <div className="flex flex-col items-center gap-3 text-center">
        <Eyebrow>Welcome back</Eyebrow>
        <h1 className="text-h1 text-ink">Log in to your group</h1>
      </div>
      <form className="flex w-full flex-col gap-4" onSubmit={handleSubmit}>
        {error && (
          <div className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2.5 text-sm text-danger">
            {error}
          </div>
        )}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className="text-sm font-medium text-ink">Email</label>
          <input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            className="rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-ink placeholder:text-ink-muted focus:border-primary focus:outline-none"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="password" className="text-sm font-medium text-ink">Password</label>
          <input
            id="password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            className="rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-ink placeholder:text-ink-muted focus:border-primary focus:outline-none"
          />
        </div>
        <Button
          type="submit"
          size="lg"
          disabled={submitting}
          className="mt-2 w-full justify-center"
        >
          {submitting ? (
            <span className="flex items-center gap-2">
              <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Signing in…
            </span>
          ) : (
            'Log in'
          )}
        </Button>
      </form>
      <p className="text-sm text-ink-secondary">
        Don't have an account?{' '}
        <Link to="/signup" className="font-medium text-primary hover:underline">Sign up</Link>
      </p>
    </div>
  )
}
