import { Link } from 'react-router-dom'
import { Eyebrow, Card } from '@/components/primitives'
import { AvatarStack } from '@/components/primitives'
import { LinkButton } from '@/components/ui/link-button'
import { groups, members } from '@/lib/data'

export function GroupsPage() {
  return (
    <div className="mx-auto w-full max-w-4xl px-4 pt-24 pb-20 sm:px-6">
      <div className="mb-8 flex flex-col gap-3">
        <Eyebrow>Your groups</Eyebrow>
        <div className="flex items-center justify-between">
          <h1 className="text-h1 text-ink">Groups</h1>
          <LinkButton to="/groups" size="lg">New group</LinkButton>
        </div>
      </div>
      <ul className="flex flex-col gap-4">
        {groups.map((g) => {
          const groupMembers = g.memberIds
            .map((id) => members.find((m) => m.id === id))
            .filter(Boolean) as typeof members
          return (
            <li key={g.id}>
              <Link to={`/g/${g.token}`}>
                <Card className="flex items-center gap-5 p-5 transition-colors hover:bg-surface-raised">
                  <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-2xl">
                    {g.emoji}
                  </span>
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <h2 className="truncate text-base font-semibold text-ink">{g.name}</h2>
                    <p className="truncate text-sm text-ink-secondary">{g.description}</p>
                  </div>
                  <div className="hidden shrink-0 flex-col items-end gap-2 sm:flex">
                    <AvatarStack memberList={groupMembers} max={4} />
                    <span className="text-xs text-ink-muted">{g.mergedCount} games</span>
                  </div>
                </Card>
              </Link>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
