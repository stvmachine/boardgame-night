import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useSearchParams } from 'react-router-dom'
import { Card, CardContent, Eyebrow, LinkButton } from '@/components/atoms'
import { authApi } from '@/lib/authApi'

type Status = 'verifying' | 'success' | 'error'

export function VerifyEmailPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') ?? ''
  const [status, setStatus] = useState<Status>('verifying')
  const [message, setMessage] = useState('')
  const ran = useRef(false)

  useEffect(() => {
    if (ran.current) return
    ran.current = true

    if (!token) {
      setStatus('error')
      setMessage('This verification link is missing its token.')
      return
    }

    authApi('GET', `/identity/email_verification?sid=${encodeURIComponent(token)}`)
      .then(() => setStatus('success'))
      .catch((err: any) => {
        setStatus('error')
        setMessage(err?.message || 'That verification link is invalid or has expired.')
      })
  }, [token])

  return (
    <div className="w-full max-w-sm">
      <div className="mb-6 flex flex-col items-center gap-2 text-center">
        <Eyebrow>Email verification</Eyebrow>
        <h1 className="text-h2 text-ink">
          {status === 'verifying' && 'Verifying your email…'}
          {status === 'success' && 'Email verified'}
          {status === 'error' && "Couldn't verify"}
        </h1>
      </div>
      <Card>
        <CardContent className="flex flex-col gap-5 p-6 text-center">
          {status === 'verifying' && (
            <span
              className="mx-auto size-6 animate-spin rounded-full border-2 border-line border-t-primary"
              aria-label="Verifying"
            />
          )}
          {status === 'success' && (
            <>
              <p className="text-sm text-ink" role="status">
                Your email address is confirmed. You&rsquo;re all set.
              </p>
              <LinkButton to="/collection">Go to your shelf</LinkButton>
            </>
          )}
          {status === 'error' && (
            <p className="text-sm text-bad" role="alert">
              {message}
            </p>
          )}
        </CardContent>
      </Card>
      <p className="mt-6 text-center font-mono text-sm text-muted">
        <Link to="/account" className="text-primary underline-offset-4 hover:underline">
          Back to your account
        </Link>
      </p>
    </div>
  )
}
