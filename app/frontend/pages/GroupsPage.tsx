import { Link, useNavigate } from 'react-router-dom'
import { useMemo, useState } from 'react'
import { useMutation, useQuery } from '@apollo/client'
import { Eyebrow, Card } from '@/components/primitives'
import { AvatarStack } from '@/components/primitives'
import { LinkButton } from '@/components/ui/link-button'
import { Button } from '@/components/ui/button'
import { MY_GROUPS, CREATE_GROUP } from '@/lib/graphql/documents'
import { toGroup, toMember } from '@/lib/graphql/adapters'

function CreateGroupForm({ onCreated }: { onCreated?: () => void }) {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [createGroup, { loading, error: mutationError }] = useMutation(CREATE_GROUP, {
    refetchQueries: [{ query: MY_GROUPS }],
    awaitRefetchQueries: true,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || loading) return
    try {
      const { data } = await createGroup({
        variables: { name: name.trim(), description: description.trim() || null },
      })
      const inviteCode = data?.createGroup?.group?.inviteCode
      if (inviteCode) {
        onCreated?.()
        navigate(`/g/${inviteCode}`)
      }
    } catch {
      // Error surfaced below
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-md flex-col gap-4">
      {mutationError && (
        <div className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2.5 text-sm text-danger">
          {mutationError.message}
        </div>
      )}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="group-name" className="text-sm font-medium text-ink">Group name</label>
        <input
          id="group-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-ink placeholder:text-ink-muted focus:border-primary focus:outline-none"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="group-description" className="text-sm font-medium text-ink">Description</label>
        <input
          id="group-description"
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-ink placeholder:text-ink-muted focus:border-primary focus:outline-none"
        />
      </div>
      <Button type="submit" disabled={loading || !name.trim()} className="w-full justify-center">
        {loading ? 'Creating…' : 'Create group'}
      </Button>
    </form>
  )
}

export function GroupsPage() {
  const navigate = useNavigate()
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
          <h1 className="text-h1 text-ink">Create a group</h1>
        </div>
        <Card className="flex flex-col items-center gap-6 p-8 sm:p-12">
          <p className="text-center text-ink-secondary">Create your first group to start organizing game nights.</p>
          <CreateGroupForm />
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
