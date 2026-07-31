import { useState, type FormEvent, type KeyboardEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

function normalizeUsername(value: string) {
  return value.trim()
}

function appendUnique(usernames: string[], value: string) {
  const username = normalizeUsername(value)
  if (!username) return usernames

  const normalized = username.toLocaleLowerCase()
  if (usernames.some((current) => current.toLocaleLowerCase() === normalized)) {
    return usernames
  }

  return [...usernames, username]
}

export function CollectionMergeForm() {
  const navigate = useNavigate()
  const [input, setInput] = useState('')
  const [usernames, setUsernames] = useState<string[]>([])

  function commitInput() {
    const next = appendUnique(usernames, input)
    setUsernames(next)
    setInput('')
    return next
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== 'Enter' && event.key !== ',') return

    event.preventDefault()
    commitInput()
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const next = appendUnique(usernames, input)
    if (next.length === 0) return

    const params = new URLSearchParams()
    params.set('usernames', next.join(','))
    navigate(`/collection?${params.toString()}`)
  }

  function removeUsername(username: string) {
    setUsernames((current) => current.filter((item) => item !== username))
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-xl flex-col gap-3">
      <div className="flex flex-col gap-2 sm:flex-row">
        <label className="sr-only" htmlFor="collection-username">
          BoardGameGeek username
        </label>
        <input
          id="collection-username"
          type="text"
          value={input}
          maxLength={64}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Add a BGG username"
          className="h-11 min-w-0 flex-1 rounded-lg border border-line bg-surface px-3 text-sm text-ink placeholder:text-ink-muted focus:border-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
        />
        <Button
          type="submit"
          size="lg"
          disabled={usernames.length === 0 && !normalizeUsername(input)}
          className="h-11 px-5 text-base shadow-glow"
        >
          Merge collections
          <ArrowRight className="size-4" aria-hidden="true" />
        </Button>
      </div>

      {usernames.length > 0 && (
        <ul className="flex flex-wrap gap-2" aria-label="BGG usernames to merge">
          {usernames.map((username) => (
            <li
              key={username.toLocaleLowerCase()}
              className="inline-flex items-center gap-1 rounded-full bg-primary/10 py-1 pr-1 pl-2.5 text-sm font-medium text-primary"
            >
              {username}
              <button
                type="button"
                onClick={() => removeUsername(username)}
                aria-label={`Remove ${username}`}
                className="flex size-7 items-center justify-center rounded-full text-primary transition-colors hover:bg-primary/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <X className="size-3.5" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </form>
  )
}
