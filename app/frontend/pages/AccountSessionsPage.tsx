import { useCallback, useEffect, useState } from 'react'
import { Button, Card, CardContent, Eyebrow } from '@/components/atoms'
import { EmptyState } from '@/components/molecules'
import { authApi } from '@/lib/authApi'

interface SessionRow {
  id: string
  ipAddress: string | null
  userAgent: string | null
  createdAt: string
  current: boolean
}

function formatWhen(iso: string) {
  const date = new Date(iso)
  return Number.isNaN(date.getTime()) ? iso : date.toLocaleString()
}

export function AccountSessionsPage() {
  const [sessions, setSessions] = useState<SessionRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [revoking, setRevoking] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setSessions(await authApi('GET', '/sessions', { auth: true }))
    } catch (err: any) {
      setError(err?.message || 'Could not load your sessions')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const revoke = async (id: string) => {
    setRevoking(id)
    try {
      await authApi('DELETE', `/sessions/${id}`, { auth: true })
      setSessions((current) => current.filter((session) => session.id !== id))
    } catch (err: any) {
      setError(err?.message || 'Could not revoke that session')
    } finally {
      setRevoking(null)
    }
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex flex-col gap-1.5">
        <Eyebrow>Security</Eyebrow>
        <h1 className="text-h1 text-ink">Active sessions</h1>
        <p className="text-sm text-muted">
          These are the devices signed in to your account. Revoke any you don&rsquo;t recognize.
        </p>
      </div>

      {error && (
        <p className="mb-4 text-sm text-bad" role="alert">
          {error}
        </p>
      )}

      {loading ? (
        <p className="numeric text-xs text-faint" aria-live="polite">
          Loading sessions…
        </p>
      ) : sessions.length === 0 ? (
        <EmptyState layout="center" title="No active sessions" description="Nothing to show here." />
      ) : (
        <ul className="flex flex-col gap-3">
          {sessions.map((session) => (
            <li key={session.id}>
              <Card>
                <CardContent className="flex items-center justify-between gap-4 p-4">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-ink">
                      {session.userAgent || 'Unknown device'}
                      {session.current && (
                        <span className="ml-2 rounded-pill bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                          This device
                        </span>
                      )}
                    </p>
                    <p className="numeric text-xs text-muted">
                      {session.ipAddress || 'unknown IP'} · {formatWhen(session.createdAt)}
                    </p>
                  </div>
                  {!session.current && (
                    <Button
                      variant="outline"
                      onClick={() => revoke(session.id)}
                      disabled={revoking === session.id}
                    >
                      {revoking === session.id ? 'Revoking…' : 'Revoke'}
                    </Button>
                  )}
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
