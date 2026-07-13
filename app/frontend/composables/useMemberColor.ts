export const PALETTE = [
  'bg-primary text-on-primary',
  'bg-secondary text-on-secondary',
  'bg-tertiary text-on-tertiary',
  'bg-error text-on-error',
  'bg-primary-container text-on-primary-container',
  'bg-secondary-container text-on-secondary-container',
  'bg-tertiary-container text-on-tertiary-container',
  'bg-error-container text-on-error-container',
  'bg-surface-variant text-on-surface-variant',
  'bg-inverse-surface text-inverse-on-surface',
  'bg-warning text-on-surface',
  'bg-success text-on-surface',
  'bg-primary-fixed text-on-primary-fixed',
  'bg-secondary-fixed text-on-secondary-fixed',
  'bg-tertiary-fixed text-on-tertiary-fixed'
]

export function hashUsername(username: string): number {
  let hash = 0
  for (const char of username) {
    hash = (hash << 5) - hash + char.charCodeAt(0)
    hash = hash & hash
  }
  return Math.abs(hash)
}

export function useMemberColor(username: string) {
  const index = hashUsername(username) % PALETTE.length
  return PALETTE[index]
}
