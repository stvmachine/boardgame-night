import { Link } from 'react-router-dom'
import { useMemo } from 'react'
import { useQuery } from '@apollo/client'
import { Eyebrow, Card } from '@/components/primitives'
import { AvatarStack } from '@/components/primitives'
import { LinkButton } from '@/components/ui/link-button'
import { MY_GROUPS } from '@/lib/graphql/documents'
import { toGroup, toMember } from '@/lib/graphql/adapters'

export function GroupsPage() {
  const { data, loading } = useQuery(MY_GROUPS)

  const groups = useMemo(
    () => (data?.myGroups ?? []).map(toGroup),
    [data],
  )

  // Build member lookup from all group members
  const memberList = useMemo(() => {
    const seen = new Set<string>()
    const result: import('@/lib/data').Member[] = []
    for (const g of data?.myGroups ?? []) {
      for (const m of g.members) {
        if (!seen.has(m.id)) {
          seen.add(m.id)
          result.push(toMember(m as import('@/lib/graphql/types').GqlUser))
        }
      }
    }
    return result
  }, [data])

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-4xl px-4 pt-24 pb-20 sm:px-6">
        <div className="mb-8 flex flex-col gap-3">
          <div className="skeleton h-4 w-24 rounded-full" />
          <div className="flex items-center justify-between">
            <div className="skeleton h-8 w-32 rounded-lg" />
            <div className="skeleton h-10 w-28 rounded-lg" />
          </div>
        </div>
        <div className="flex flex-col gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton h-20 rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  if (!data?.myGroups || data.myGroups.length === 0) {
    return (
      <div className="mx-auto w-full max-w-4xl px-4 pt-24 pb-20 sm:px-6">
        <div className="mb-8 flex flex-col gap-3">
          <Eyebrow>Your groups</Eyebrow>
          <div className="flex items-center justify-between">
            <h1 className="text-h1 text-ink">Groups</h1>
            <LinkButton to="/groups" size="lg">New group</LinkButton>
          </div>
        </div>
        <Card className="flex flex-col items-center gap-3 p-12 text-center">
          <p className="text-ink-secondary">You haven&rsquo;t joined any groups yet.</p>
          <LinkButton to="/groups" size="lg">Create your first group</LinkButton>
        </Card>
      </div>
    )
  }

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
        {groups.map((g: import('@/lib/data').Group) => {
          const groupMembers = g.memberIds
            .map((id: string) => memberList.find((m) => m.id === id))
            .filter(Boolean) as import('@/lib/data').Member[]
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
