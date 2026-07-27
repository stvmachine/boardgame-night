import { useParams } from 'react-router-dom'
import { useMemo } from 'react'
import { useQuery } from '@apollo/client'
import { Eyebrow, Card, StateBadge, MemberAvatar } from '@/components/primitives'
import { AvatarStack } from '@/components/primitives'
import { LinkButton } from '@/components/ui/link-button'
import { GET_GROUP } from '@/lib/graphql/documents'
import { toGroup, toMember, toSession } from '@/lib/graphql/adapters'

export function GroupPage() {
  const { token } = useParams<{ token: string }>()
  const { data, loading, error } = useQuery(GET_GROUP, {
    variables: { token: token ?? '' },
    skip: !token,
  })

  const group = useMemo(
    () => (data?.group ? toGroup(data.group) : null),
    [data],
  )

  const groupMembers = useMemo(
    () => (data?.group?.members ?? []).map(toMember),
    [data],
  )

  const upcomingSessions = useMemo(
    () =>
      ((data?.group?.sessions ?? []) as import('@/lib/graphql/types').GqlNightSession[])
      .filter((s: import('@/lib/graphql/types').GqlNightSession) => s.state !== 'COMPLETED' && s.state !== 'CANCELLED')
      .map(toSession),
    [data],
  )

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-4xl px-4 pt-24 pb-20 sm:px-6">
        <div className="skeleton mb-8 h-48 rounded-xl" />
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="skeleton h-64 rounded-xl" />
          <div className="skeleton h-64 rounded-xl" />
        </div>
      </div>
    )
  }

  if (error || !group) {
    return (
      <div className="mx-auto w-full max-w-4xl px-4 pt-24 pb-20 sm:px-6">
        <Card className="flex flex-col items-center gap-3 p-12 text-center">
          <p className="text-ink-secondary">Group not found.</p>
          <LinkButton to="/groups" variant="outline" size="lg">Back to groups</LinkButton>
        </Card>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-4 pt-24 pb-20 sm:px-6">
      <div className="mb-8 flex flex-col gap-3">
        <Eyebrow>Group</Eyebrow>
        <div className="flex items-center gap-4">
          <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-3xl">
            {group.emoji}
          </span>
          <div>
            <h1 className="text-h1 text-ink">{group.name}</h1>
            <p className="text-sm text-ink-secondary">{group.description}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <Card className="flex flex-col gap-4 p-5">
          <h2 className="text-sm font-semibold text-ink">Members</h2>
          <ul className="flex flex-col gap-2">
            {groupMembers.map((m: import('@/lib/data').Member) => (
              <li key={m.id} className="flex items-center gap-3">
                <MemberAvatar member={m} size="sm" />
                <span className="text-sm text-ink">{m.name}</span>
                <span className="ml-auto text-xs text-ink-muted">@{m.bgg}</span>
              </li>
            ))}
          </ul>
          <AvatarStack memberList={groupMembers} />
        </Card>

        <Card className="flex flex-col gap-4 p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-ink">Sessions</h2>
            <LinkButton to={`/g/${group.token}/sessions`} variant="ghost" size="sm">
              View all
            </LinkButton>
          </div>
          {upcomingSessions.length === 0 ? (
            <p className="text-sm text-ink-muted">No upcoming sessions</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {upcomingSessions.map((s: import('@/lib/data').Session) => (
                <li key={s.id} className="flex items-center justify-between rounded-lg bg-surface-raised px-3 py-2">
                  <div>
                    <p className="text-sm font-medium text-ink">{s.title}</p>
                    <p className="text-xs text-ink-muted">{s.date} &middot; {s.time}</p>
                  </div>
                  <StateBadge state={s.state} />
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  )
}
