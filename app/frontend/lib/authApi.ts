import { humanizeAuthError } from '@/contexts/AuthContext'

const TOKEN_KEY = 'bgg-night-token'

/** Turn a REST auth error body into a readable message (shared with AuthContext). */
function restErrorMessage(data: unknown): string {
  if (data && typeof data === 'object') {
    const record = data as Record<string, unknown>
    if (typeof record.error === 'string') return humanizeAuthError(record.error)
    return humanizeAuthError(JSON.stringify(record))
  }
  return 'Something went wrong'
}

/**
 * Call a REST auth endpoint. Attaches the stored bearer token when `auth` is
 * true. Throws an Error with a humanized message on any non-2xx response.
 */
export async function authApi(
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
  path: string,
  { body, auth = false }: { body?: Record<string, unknown>; auth?: boolean } = {},
): Promise<any> {
  const token = auth ? localStorage.getItem(TOKEN_KEY) : null
  const response = await fetch(path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  const text = await response.text()
  const data = text ? JSON.parse(text) : {}
  if (!response.ok) {
    const error = new Error(restErrorMessage(data)) as Error & { status?: number }
    error.status = response.status
    throw error
  }
  return data
}
