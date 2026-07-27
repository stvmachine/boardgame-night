import { useParams } from 'react-router-dom'
import { Eyebrow, Card, StateBadge, MemberAvatar } from '@/components/primitives'
import { AvatarStack } from '@/components/primitives'
import { LinkButton } from '@/components/ui/link-button'
import { groupByToken, members, sessions } from '@/lib/data'

export function GroupPage() {
  const { token } = useParams<{ token: string }>()
  const group = groupByToken(token ?? '')
  const groupMembers = group.memberIds
    .map((id) => members.find((m) => m.id === id))
    .filter(Boolean) as typeof members

  const upcomingSessions = sessions.filter(
    (s) => group.memberIds.includes(s.rsvps[0]?.memberId ?? '') && s.state !== 'COMPLETED',
  )

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
            {groupMembers.map((m) => (
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
              {upcomingSessions.map((s) => (
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
