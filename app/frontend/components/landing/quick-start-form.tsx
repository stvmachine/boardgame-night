import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@apollo/client'
import { Loader2, Plus, X, Zap } from 'lucide-react'
import { CREATE_ANONYMOUS_GROUP } from '@/lib/graphql/documents'
import type { CreateAnonymousGroupPayload } from '@/lib/graphql/types'

export function QuickStartForm() {
  const navigate = useNavigate()
  const [usernames, setUsernames] = useState<string[]>([''])
  const [groupName, setGroupName] = useState('')
  const [groupNameTouched, setGroupNameTouched] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [createGroup, { loading }] = useMutation<{
    createAnonymousGroup: CreateAnonymousGroupPayload
  }>(CREATE_ANONYMOUS_GROUP)

  const filledUsernames = usernames.map((u) => u.trim()).filter(Boolean)

  const autoGroupName = useMemo(() => {
    if (filledUsernames.length === 0) return ''
    if (filledUsernames.length === 1) return `${filledUsernames[0]}'s group`
    return `${filledUsernames[0]} & ${filledUsernames.slice(1).join(', ')}'s group`
  }, [filledUsernames])

  const displayName = groupNameTouched ? groupName.trim() : autoGroupName
  const canSubmit = filledUsernames.length >= 1 && !loading

  function addUsernameField() {
    if (usernames.length < 2) {
      setUsernames([...usernames, ''])
    }
  }

  function removeUsernameField(index: number) {
    setUsernames(usernames.filter((_, i) => i !== index))
  }

  function updateUsername(index: number, value: string) {
    const next = [...usernames]
    next[index] = value
    setUsernames(next)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return

    setError(null)

    try {
      const { data } = await createGroup({
        variables: {
          name: displayName || autoGroupName,
          bggUsernames: filledUsernames,
        },
      })

      const group = data?.createAnonymousGroup?.group
      if (group?.inviteCode) {
        navigate(`/g/${group.inviteCode}`)
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Something went wrong. Please try again.'
      setError(message)
    }
  }

  return (
    <div className="w-full max-w-md">
      {/* Divider */}
      <div className="relative mb-5 flex items-center gap-3">
        <div className="h-px flex-1 bg-line" />
        <span className="text-[11px] font-medium tracking-wide text-ink-muted uppercase">
          or try instantly
        </span>
        <div className="h-px flex-1 bg-line" />
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        {/* Tagline */}
        <p className="text-center text-xs text-ink-muted">
          No account needed — just bring your BGG usernames.
        </p>

        {/* Username inputs */}
        <div className="flex flex-col gap-2">
          {usernames.map((value, i) => (
            <div key={i} className="group relative flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder={i === 0 ? 'Your BGG username' : "Friend's BGG username"}
                  value={value}
                  onChange={(e) => updateUsername(i, e.target.value)}
                  aria-label={`BGG username ${i + 1}`}
                  className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
                />
              </div>
              {usernames.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeUsernameField(i)}
                  className="flex size-7 shrink-0 items-center justify-center rounded-md text-ink-muted transition-colors hover:bg-danger/10 hover:text-danger"
                  aria-label={`Remove username ${i + 1}`}
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Add username */}
        {usernames.length < 2 && (
          <button
            type="button"
            onClick={addUsernameField}
            className="flex items-center gap-1.5 self-start rounded-md px-1.5 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary/10"
          >
            <Plus className="size-3.5" />
            Add a friend
          </button>
        )}

        {/* Group name */}
        {filledUsernames.length >= 1 && (
          <div className="flex flex-col gap-1">
            <label htmlFor="quick-group-name" className="text-xs font-medium text-ink-secondary">
              Group name
            </label>
            <input
              id="quick-group-name"
              type="text"
              placeholder={autoGroupName}
              value={groupName}
              onChange={(e) => {
                setGroupName(e.target.value)
                setGroupNameTouched(true)
              }}
              onFocus={() => setGroupNameTouched(true)}
              className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
            />
            {!groupNameTouched && autoGroupName && (
              <p className="text-[11px] text-ink-muted">
                We&rsquo;ll call it <span className="font-medium text-ink-secondary">{autoGroupName}</span>
              </p>
            )}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-xs text-danger">
            {error}
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={!canSubmit}
          className="flex h-9 items-center justify-center gap-2 rounded-lg border border-transparent bg-accent-rose/15 px-4 text-sm font-medium text-accent-rose transition-all hover:bg-accent-rose/25 hover:shadow-[0_0_16px_rgba(251,113,133,0.15)] disabled:pointer-events-none disabled:opacity-40"
        >
          {loading ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Creating group…
            </>
          ) : (
            <>
              <Zap className="size-3.5" />
              Create group instantly
            </>
          )}
        </button>
      </form>
    </div>
  )
}
