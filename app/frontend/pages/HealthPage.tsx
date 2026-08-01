import { useEffect, useState } from 'react'
import { useQuery } from '@apollo/client'
import { HEALTH_CHECK } from '@/lib/graphql/documents'

export function HealthPage() {
  const { data, loading, error } = useQuery(HEALTH_CHECK)
  const [corsErrors, setCorsErrors] = useState<string[]>([])

  useEffect(() => {
    const handler = (event: ErrorEvent) => {
      if (/Access-Control|CORS/i.test(event.message)) {
        setCorsErrors((prev) => [...prev, event.message])
      }
    }
    window.addEventListener('error', handler)
    return () => window.removeEventListener('error', handler)
  }, [])

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6 px-4 pt-24 pb-20">
      <h1 className="text-h1 text-ink">Server Health</h1>
      {loading && <p className="text-ink-secondary">Checking…</p>}
      {error && (
        <div className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
          {error.message}
        </div>
      )}
      {!loading && !error && (
        <div className="flex items-center gap-2 text-ink">
          <span className="inline-flex size-3 rounded-full bg-success" />
          <span className="font-medium">{data?.health ?? 'unknown'}</span>
        </div>
      )}
      {corsErrors.length > 0 && (
        <div className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
          {corsErrors.join('\n')}
        </div>
      )}
    </div>
  )
}
