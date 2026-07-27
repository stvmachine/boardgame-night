import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eyebrow } from '@/components/primitives'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/AuthContext'

export function SignupPage() {
  const { signUp, error, clearError } = useAuth()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [bggUsername, setBggUsername] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (submitting) return
    setSubmitting(true)
    clearError()
    try {
      // signUp mutation takes (email, password, username) where username is the BGG username
      await signUp(email, password, bggUsername)
      navigate('/collection', { replace: true })
    } catch {
      // Error is set in AuthContext, we just stop the spinner
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-col items-center gap-8 px-4 pt-28 pb-20">
      <div className="flex flex-col items-center gap-3 text-center">
        <Eyebrow>Get started</Eyebrow>
        <h1 className="text-h1 text-ink">Create your account</h1>
        <p className="text-sm text-ink-secondary">Bring your BGG username. Takes about a minute.</p>
      </div>
      <form className="flex w-full flex-col gap-4" onSubmit={handleSubmit}>
        {error && (
          <div className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2.5 text-sm text-danger">
            {error}
          </div>
        )}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="name" className="text-sm font-medium text-ink">Name</label>
          <input
            id="name"
            type="text"
            placeholder="Alex Rivera"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
            className="rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-ink placeholder:text-ink-muted focus:border-primary focus:outline-none"
          />
        </div>
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
            autoComplete="new-password"
            minLength={8}
            className="rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-ink placeholder:text-ink-muted focus:border-primary focus:outline-none"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="bgg" className="text-sm font-medium text-ink">BoardGameGeek username</label>
          <input
            id="bgg"
            type="text"
            placeholder="alex123"
            value={bggUsername}
            onChange={(e) => setBggUsername(e.target.value)}
            required
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
              Creating account…
            </span>
          ) : (
            'Create account'
          )}
        </Button>
      </form>
      <p className="text-sm text-ink-secondary">
        Already have an account?{' '}
        <Link to="/login" className="font-medium text-primary hover:underline">Log in</Link>
      </p>
    </div>
  )
}
