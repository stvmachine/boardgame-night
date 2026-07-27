import { useState, useEffect } from 'react'
import { useQuery, useMutation, gql } from '@apollo/client'
import { Eyebrow, Card } from '@/components/primitives'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/AuthContext'
import { CURRENT_USER, BIND_BGG_USERNAME } from '@/lib/graphql/documents'

const SYNC_COLLECTION = gql`
  mutation SyncCollection {
    syncCollection {
      id
      syncStatus {
        username
        status
        error
        gameCount
        lastSyncedAt
      }
    }
  }
`

export function AccountPage() {
  const { user, signOut } = useAuth()
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [bggUsername, setBggUsername] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState(false)

  const { data, loading: queryLoading } = useQuery(CURRENT_USER, {
    fetchPolicy: 'cache-and-network',
  })

  const [bindBggUsername] = useMutation(BIND_BGG_USERNAME)
  const [syncCollection, { loading: syncing }] = useMutation(SYNC_COLLECTION)

  // Populate form from user data
  useEffect(() => {
    const currentUser = data?.currentUser ?? user
    if (currentUser) {
      setDisplayName(currentUser.displayName || '')
      setEmail(currentUser.email || '')
      setBggUsername(currentUser.bggUsername || currentUser.username || '')
    }
  }, [data, user])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setSaveError(null)
    setSaveSuccess(false)

    try {
      // If BGG username changed, bind it
      const currentBgg = data?.currentUser?.bggUsername ?? user?.bggUsername
      if (bggUsername !== currentBgg) {
        await bindBggUsername({ variables: { username: bggUsername } })
      }
      setSaveSuccess(true)
    } catch (err: any) {
      const message = err?.graphQLErrors?.[0]?.message || err?.message || 'Failed to save changes'
      setSaveError(message)
    } finally {
      setSaving(false)
    }
  }

  const handleSync = async () => {
    try {
      await syncCollection()
    } catch {
      // Silently handle — the sync will be retried by the job
    }
  }

  const currentUser = data?.currentUser ?? user
  const syncStatus = currentUser?.syncStatus

  return (
    <div className="mx-auto w-full max-w-2xl px-4 pt-24 pb-20 sm:px-6">
      <div className="mb-8 flex flex-col gap-3">
        <Eyebrow>Account</Eyebrow>
        <h1 className="text-h1 text-ink">Your profile</h1>
      </div>

      <form onSubmit={handleSave}>
        <Card className="flex flex-col gap-5 p-6">
          {saveError && (
            <div className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2.5 text-sm text-danger">
              {saveError}
            </div>
          )}
          {saveSuccess && (
            <div className="rounded-lg border border-success/30 bg-success/10 px-3 py-2.5 text-sm text-success">
              Changes saved successfully.
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label htmlFor="acct-name" className="text-sm font-medium text-ink">Display name</label>
            <input
              id="acct-name"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Alex Rivera"
              className="rounded-lg border border-line bg-surface-raised px-3 py-2.5 text-sm text-ink placeholder:text-ink-muted focus:border-primary focus:outline-none"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="acct-email" className="text-sm font-medium text-ink">Email</label>
            <input
              id="acct-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              disabled
              className="rounded-lg border border-line bg-surface-raised px-3 py-2.5 text-sm text-ink placeholder:text-ink-muted focus:border-primary focus:outline-none disabled:opacity-50"
            />
            <p className="text-xs text-ink-muted">Email cannot be changed at this time.</p>
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="acct-bgg" className="text-sm font-medium text-ink">BoardGameGeek username</label>
            <div className="flex items-center gap-2">
              <input
                id="acct-bgg"
                type="text"
                value={bggUsername}
                onChange={(e) => setBggUsername(e.target.value)}
                placeholder="alex123"
                required
                className="flex-1 rounded-lg border border-line bg-surface-raised px-3 py-2.5 text-sm text-ink placeholder:text-ink-muted focus:border-primary focus:outline-none"
              />
              {syncStatus?.status === 'SYNCED' && (
                <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-success/20 px-2 py-0.5 text-[10px] font-semibold text-success">
                  Synced
                </span>
              )}
              {syncStatus?.status === 'ERROR' && (
                <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-danger/20 px-2 py-0.5 text-[10px] font-semibold text-danger">
                  Error
                </span>
              )}
              {syncStatus?.status === 'PENDING' && (
                <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-warning/20 px-2 py-0.5 text-[10px] font-semibold text-warning">
                  Syncing…
                </span>
              )}
            </div>
            {syncStatus?.gameCount != null && (
              <p className="text-xs text-ink-muted">
                {syncStatus.gameCount} games imported
                {syncStatus.lastSyncedAt ? ` · last synced ${new Date(syncStatus.lastSyncedAt).toLocaleDateString()}` : ''}
              </p>
            )}
          </div>

          <div className="flex items-center gap-3">
            <Button type="submit" size="lg" disabled={saving || queryLoading} className="self-start">
              {saving ? 'Saving…' : 'Save changes'}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={handleSync}
              disabled={syncing}
            >
              {syncing ? 'Syncing…' : 'Sync collection'}
            </Button>
          </div>

          <hr className="border-line" />

          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-0.5">
              <p className="text-sm font-medium text-ink">Signed in as {user?.displayName || user?.username}</p>
              <p className="text-xs text-ink-muted">{user?.email}</p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="lg"
              onClick={() => signOut()}
              className="text-danger hover:text-danger"
            >
              Sign out
            </Button>
          </div>
        </Card>
      </form>
    </div>
  )
}
