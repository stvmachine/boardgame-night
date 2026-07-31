# Phase 13: React Migration Parity — Pattern Map

**Mapped:** 2026-07-30
**Files analyzed:** 17
**Analogs found:** 15 / 17

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `codegen.ts` | config | batch-generation | `codegen.ts` (self) | self — fix output plugin |
| `app/frontend/generated/types.ts` | config/generated | n/a | none | no analog |
| `app/frontend/generated/operations.ts` | config/generated | n/a | none | no analog |
| `app/frontend/lib/collection.ts` | utility | transform | `app/frontend/lib/collection.ts` (self) | self — narrow sort contract |
| `app/frontend/components/collection/filter-panel.tsx` | component | request-response | `app/frontend/components/collection/filter-panel.tsx` (self) | self — replace controls |
| `app/frontend/pages/LandingPage.tsx` | page | request-response | `app/frontend/pages/GroupPage.tsx` | role-match |
| `app/frontend/pages/HotGamesPage.tsx` | page | request-response | `app/frontend/components/collection/collection-browser.tsx` | role-match |
| `app/frontend/pages/GroupSessionsPage.tsx` | page | request-response | `app/frontend/pages/GroupPage.tsx` | role-match |
| `app/frontend/pages/InvitePage.tsx` | page | request-response | `app/frontend/pages/SessionPage.tsx` | role-match |
| `app/frontend/pages/GroupPage.tsx` | page | request-response | `app/frontend/pages/GroupPage.tsx` (self) | self — extend hub |
| `app/frontend/pages/SessionPage.tsx` | page | request-response | `app/frontend/pages/SessionPage.tsx` (self) | self — add picking UI |
| `app/frontend/components/game-card.tsx` | component | request-response | `app/frontend/components/game-card.tsx` (self) | self — extend for suggestions |
| `app/frontend/components/mobile-tab-bar.tsx` | component | request-response | `app/frontend/components/mobile-tab-bar.tsx` (self) | self — fix routes |
| `app/frontend/App.tsx` | route config | request-response | `app/frontend/App.tsx` (self) | self — wire new routes |
| `app/frontend/lib/data.ts` | utility/static | static | `app/frontend/lib/data.ts` (self) | self — delete sample data |
| `app/frontend/components/landing/hero-flow.tsx` | component | static | `app/frontend/components/landing/hero-flow.tsx` (self) | self — keep as animation only |
| `app/frontend/pages/GroupsPage.tsx` | page | request-response | `app/frontend/pages/GroupsPage.tsx` (self) | self — reference for role-aware CTAs |

## Pattern Assignments

### `codegen.ts` (config, batch-generation)

**Analog:** `codegen.ts` (self) — rewrite output to React Apollo.

**Current broken pattern** (lines 1-25):
```typescript
import type { CodegenConfig } from '@graphql-codegen/cli'

const config: CodegenConfig = {
  schema: 'schema.graphql',
  documents: ['app/frontend/**/*.graphql'],
  generates: {
    'app/frontend/generated/types.ts': {
      plugins: ['typescript']
    },
    'app/frontend/generated/operations.ts': {
      plugins: [
        { add: { content: "export * from './types';" } },
        'typescript-operations',
        'typescript-vue-apollo'
      ],
      config: {
        importSchemaTypesFrom: './app/frontend/generated/types',
        namespacedImportName: 'Types',
        vueCompositionApiImportFrom: 'vue'
      }
    }
  }
}

export default config
```

**Replacement pattern** (copy from 13-RESEARCH.md Pattern 3):
```typescript
import type { CodegenConfig } from '@graphql-codegen/cli'

const config: CodegenConfig = {
  schema: 'schema.graphql',
  documents: ['app/frontend/**/*.{ts,tsx}'],
  generates: {
    'app/frontend/generated/types.ts': { plugins: ['typescript'] },
    'app/frontend/generated/operations.ts': {
      plugins: ['typescript-operations', 'typescript-react-apollo'],
      config: { withHooks: true },
    },
  },
}
export default config
```

**Command pattern** (from `package.json` lines 6):
```bash
npm run codegen
```

---

### `app/frontend/lib/collection.ts` (utility, transform)

**Analog:** `app/frontend/lib/collection.ts` (self) — narrow sort contract to v1.1 four-option set.

**Current SortKey/labels** (lines 4, 68-74):
```typescript
export type SortKey = 'name' | 'rating' | 'players' | 'time' | 'recent'

const sortLabels: Record<SortKey, string> = {
  name: 'Name (A–Z)',
  rating: 'Rating (high to low)',
  players: 'Player count',
  time: 'Play time',
  recent: 'Recently added',
}
```

**v1.1 replacement pattern** (from 13-RESEARCH.md Pattern 4 / 09-UI-SPEC lines 151):
```typescript
export type SortKey = 'name' | 'rating' | 'weight' | 'recent'

export const sortLabels: Record<SortKey, string> = {
  name: 'Name A–Z',
  rating: 'Rating High–Low',
  weight: 'Weight Light–Heavy',
  recent: 'Recently Played',
}
```

**URL round-trip pattern** (lines 119-149):
- Keep `toParams`/`fromParams` shape; ensure `sort` defaults to `'name'` and legacy values like `year_desc` map to `'name'` or `'rating'` during `fromParams`.

---

### `app/frontend/components/collection/filter-panel.tsx` (component, request-response)

**Analog:** `app/frontend/components/collection/filter-panel.tsx` (self) — replace complexity slider and add group-by, time-bucket, player-range controls per 09-UI-SPEC.

**Current Facet collapse pattern** (lines 23-61):
```tsx
function Facet({ title, count, children, defaultOpen = true }: ...) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border-b border-line py-4 last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-2 text-left"
      >
        <span className="flex items-center gap-2 text-sm font-semibold text-ink">{title}</span>
        <ChevronDown className={cn('size-4 shrink-0 text-ink-muted transition-transform', open && 'rotate-180')} />
      </button>
      {open && <div className="mt-3 flex flex-col gap-2">{children}</div>}
    </div>
  )
}
```

**Chip toggle pattern** (lines 63-91):
```tsx
function Chip({ active, disabled, onClick, children }: ...) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={active}
      className={cn(
        'press rounded-full border px-2.5 py-1 text-xs font-medium',
        active ? 'border-primary bg-primary text-primary-foreground' : 'border-line bg-surface-raised text-ink-secondary hover:text-ink',
        disabled && 'cursor-not-allowed opacity-40',
      )}
    >
      {children}
    </button>
  )
}
```

**Complexity segmented control replacement** (from 09-UI-SPEC lines 327-329):
- Replace the range input + presets with a single-select `ToggleGroup` (or controlled buttons) with options: Any / Light / Medium / Heavy.
- Values map to `null` (Any), `1`, `2`, `3` (Heavy covers old 3/4).

**Player range slider pattern** (from 09-UI-SPEC lines 314-319):
- Use two `<input type="range">` thumbs (or source-owned Slider if available) labelled `Minimum players` and `Maximum players` with `aria-valuemin=1`, `aria-valuemax=10`.
- Render label `{min}–{max} players` (use `10+` when max === 10).
- A game matches when `game.minPlayers <= min && game.maxPlayers >= max`.

**Group-by control pattern** (from E2E `collection.spec.ts` lines 23-26):
```typescript
async function selectGroupByOption(page: Page, label: string) {
  await page.getByRole('combobox', { name: 'Group by' }).click()
  await page.getByRole('option', { name: label }).click()
}
```
- Add `groupBy` to Filters and URL params; options: `none`, `players`, `rating`, `bestPlayers`, `owner` with labels from 09-UI-SPEC.

---

### `app/frontend/pages/LandingPage.tsx` (page, request-response)

**Analog:** `app/frontend/pages/GroupPage.tsx` for hub-like query + `useMemo` adapter pattern; and current `LandingPage.tsx` for hero layout.

**Current hero + stats pattern** (lines 49-61, 111-121):
```tsx
export function LandingPage() {
  const { data: statsData } = useQuery(DASHBOARD_STATS)
  const displayStats = useMemo(() => {
    if (statsData?.dashboardStats) {
      return {
        gamesMerged: (statsData.dashboardStats.collectionCount ?? 0).toLocaleString(),
        sessionsHosted: (statsData.dashboardStats.sessionCount ?? 0).toLocaleString(),
        activeGroups: (statsData.dashboardStats.groupCount ?? 0).toLocaleString(),
      }
    }
    return stats
  }, [statsData])
```

**Replace `lib/data.ts` static stats fallback** (lines 60-61):
- Remove `stats` import; render skeletons/placeholder dashes when `dashboardStats` is missing.

**Add trending section pattern** (from 13-RESEARCH.md Pattern 3 / 09-UI-SPEC lines 272-284):
```tsx
const { data: hotData } = useQuery(HOT_ITEMS)
const trending = hotData?.hotItems?.slice(0, 6) ?? []

<section aria-label="Trending on BGG">
  <div className="flex items-center justify-between">
    <h2 className="text-h2 text-ink">Trending on BGG</h2>
    <Link to="/hot" className="text-sm font-medium text-primary hover:underline">View all</Link>
  </div>
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
    {trending.map((item) => <TrendingCard key={item.id} item={item} />)}
  </div>
</section>
```

**BGG merge hero pattern** (from E2E `home.spec.ts` lines 6-12 and 09-UI-SPEC lines 121-128):
- Replace quick-start form with username-tag input + "Merge collections" button.
- Placeholder: `Add a BGG username`.
- On submit navigate to `/collection?usernames=...`.

---

### `app/frontend/pages/HotGamesPage.tsx` (page, request-response)

**Analog:** `app/frontend/components/collection/collection-browser.tsx` for grid loading skeletons and `app/frontend/components/game-card.tsx` for card anatomy.

**GraphQL query pattern** (from `app/frontend/lib/graphql/documents.ts` lines 257-273):
```typescript
export const HOT_ITEMS = gql`
  query HotItems {
    hotItems {
      id
      rank
      name
      yearPublished
      thumbnail
      average
      averageWeight
      minPlayers
      maxPlayers
      minPlaytime
      maxPlaytime
    }
  }
`
```

**UseQuery + adapter pattern** (from `app/frontend/pages/GroupPage.tsx` lines 16-24):
```tsx
const { data, loading, error } = useQuery(HOT_ITEMS)
const items = useMemo(() => data?.hotItems ?? [], [data])
```

**Grid + skeleton pattern** (from `app/frontend/components/game-card.tsx` lines 86-94):
```tsx
<div className="grid grid-cols-[repeat(auto-fill,minmax(min(160px,100%),1fr))] gap-5 sm:grid-cols-[repeat(auto-fill,minmax(min(200px,100%),1fr))]">
  {loading ? <SkeletonGrid count={12} /> : items.map((item) => <TrendingCard key={item.id} item={item} />)}
</div>
```

**Trending card anatomy** (from 13-RESEARCH.md Pattern 3 and 09-UI-SPEC lines 272-284):
- `aspect-[4/3]` thumbnail, rank badge `#{rank}`, title, rating/weight/players/time meta.
- Click opens `https://boardgamegeek.com/boardgame/${objectid}` with `rel="noopener noreferrer" target="_blank"`.

---

### `app/frontend/pages/GroupSessionsPage.tsx` (page, request-response)

**Analog:** `app/frontend/pages/GroupPage.tsx` for `GET_GROUP` query + `toSession` adapter.

**Route param pattern** (from `app/frontend/pages/GroupPage.tsx` lines 14-19):
```tsx
const { token } = useParams<{ token: string }>()
const { data, loading, error } = useQuery(GET_GROUP, {
  variables: { token: token ?? '' },
  skip: !token,
})
```

**Past sessions adapter** (from `app/frontend/lib/graphql/types.ts` lines 96-101 and `adapters.ts` lines 41-58):
```typescript
pastSessions {
  id
  title
  state
  scheduledAt
  location
  pickedGame { name thumbnail }
}
```
- Map to `Session[]` via `toSession` (adapter lines 41-58).
- Render a card list similar to `GroupPage.tsx` upcoming sessions (lines 107-129).

**Error/empty pattern** (from `app/frontend/components/primitives.tsx` lines 192-215):
```tsx
<EmptyState
  icon={<SearchX className="size-5" />}
  title="No past sessions"
  description="Past game nights will show up here."
/>
```

---

### `app/frontend/pages/InvitePage.tsx` (page, request-response)

**Analog:** `app/frontend/pages/SessionPage.tsx` for query + mutation + loading/error states; `app/frontend/contexts/AuthContext.tsx` for auth-gated actions.

**Query pattern** (from `app/frontend/lib/graphql/documents.ts` lines 285-311):
```typescript
export const GET_SESSION_INVITE = gql`
  query GetSessionInvite($token: String!) {
    sessionInvite(token: $token) {
      id
      status
      token
      group { id name }
      session { id title state scheduledAt location host { displayName } }
    }
  }
`
```

**Mutation + cache update pattern** (from `app/frontend/contexts/AuthContext.tsx` lines 59-76 and 13-RESEARCH.md Pattern 1):
```tsx
const [rsvp] = useMutation(RSVP, {
  update(cache, { data }) {
    if (!data?.rsvp?.session) return
    cache.modify({
      id: cache.identify({ __typename: 'NightSession', id: data.rsvp.session.id }),
      fields: {
        state(existing) { return data.rsvp.session.state ?? existing },
        attendances(existing = [], { readField }) {
          const attendance = data.rsvp.attendance
          if (!attendance) return existing
          const exists = existing.some((ref: any) => readField('id', ref) === attendance.id)
          if (exists) return existing
          const newRef = cache.writeFragment({
            data: attendance,
            fragment: gql`
              fragment AttendanceStub on Attendance { id response user { id displayName } }
            `,
          })
          return [...existing, newRef]
        },
      },
    })
  },
})
```

**Auth-gated RSVP UI pattern** (from E2E `session_lifecycle.spec.ts` lines 45-48):
```tsx
{user ? (
  <Button onClick={() => rsvp({ variables: { token, response: 'going' } })}>Going</Button>
) : (
  <p>Sign in to RSVP.</p>
)}
```

---

### `app/frontend/pages/GroupPage.tsx` (page, request-response)

**Analog:** `app/frontend/pages/GroupPage.tsx` (self) — extend incomplete hub per 08-UI-SPEC.

**Role-aware sessions card pattern** (from 08-UI-SPEC lines 217-236 and E2E `group_detail.spec.ts` lines 35-44):
- Render `data.group.sessions` as `session-row` test-id rows.
- CTA mapping: `picking` → "Choose a game"; `invited`/`draft` → "View details".
- Hide `draft` rows for non-owner/admin (backend already filters, but UI should not add its own filter).

**Shared collection spotlight pattern** (from 08-UI-SPEC lines 238-249):
```tsx
<Card>
  <div className="flex items-center justify-between">
    <h2>Shared collection spotlight</h2>
    <Link to={`/collection?group=${group.token}`} className="text-sm font-medium text-primary hover:underline">Browse Library</Link>
  </div>
  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
    {spotlight.map((item) => (
      <a key={item.id} href={`https://boardgamegeek.com/boardgame/${item.objectid}`} target="_blank" rel="noopener noreferrer">
        <CompactSpotlightCard item={item} />
      </a>
    ))}
  </div>
</Card>
```

**Members panel + action menu pattern** (from 08-UI-SPEC lines 251-269):
- List `data.group.memberships` with avatar, display name, role label.
- Owner sees role-change + remove options for non-owners; admin sees remove for members only.
- Inline remove confirmation panel below the row.

**Invite card pattern** (from 08-UI-SPEC lines 271-286):
- Visible only when `myRole === 'OWNER' || myRole === 'ADMIN'`.
- Read-only invite link input + copy button with "Copied!" `aria-live="polite"` feedback.
- Email + role select + "Send invite" form using `INVITE_TO_GROUP` mutation.

---

### `app/frontend/pages/SessionPage.tsx` (page, request-response)

**Analog:** `app/frontend/pages/SessionPage.tsx` (self) — add picking flow per 10-UI-SPEC.

**Session header pattern** (from current lines 97-109 and 10-UI-SPEC lines 151-168):
```tsx
<div className="mb-8 flex flex-col gap-3">
  <Eyebrow>Session</Eyebrow>
  <div className="flex items-center justify-between">
    <h1 className="text-h1 text-ink">{sessionMeta.title}</h1>
    <StateBadge state={sessionMeta.state} />
  </div>
  <p className="flex items-center gap-2 text-sm text-ink-secondary">
    <Clock className="size-4" />
    {sessionMeta.date} &middot; {sessionMeta.time} &middot; {sessionMeta.location}
  </p>
</div>
```
- Add going-attendee avatar group + count; host-only "Edit Details" outline button.

**Edit Details dialog pattern** (from 10-UI-SPEC lines 171-189):
- Source-owned `Dialog` with title "Edit session details", description "Update the session information. Game preferences stay locked while picking."
- Fields: Title, Description, Date/time, Location, Capacity.
- Use `UPDATE_SESSION_DETAILS` mutation; do not include time budget or complexity.

**Suggestion section pattern** (from 10-UI-SPEC lines 191-223):
```tsx
<h2 className="text-h2 text-ink">Game Suggestions (Filtered for {attendeeCount} Players)</h2>
<div className="flex gap-2">
  <Badge>Up to {timeBudgetMinutes} min</Badge>
  <Badge>{complexityPreference} complexity</Badge>
</div>
```

**GameCard suggestion extension pattern** (from 10-UI-SPEC lines 209-220):
- Pass `suggestion` prop to `GameCard`; render `Score {score}` pill + confidence badge.
- Render first 3 reasons as chips; if more, add "Show more reasons" disclosure.
- Host-only "Pick this game" full-width primary button; non-host sees "The host will choose the game."
- Pick mutation uses `PICK_GAME`; on success Apollo normalized cache transitions to completed summary.

---

### `app/frontend/components/game-card.tsx` (component, request-response)

**Analog:** `app/frontend/components/game-card.tsx` (self) — add optional suggestion context.

**Current card boundary pattern** (lines 19-67):
```tsx
<article className={cn('group/card flex flex-col ...', className)}>
  <div className="relative aspect-2/3 overflow-hidden bg-surface-raised">
    <img ... />
    ...
  </div>
  <div className="flex flex-1 flex-col gap-2 p-3">
    <h3 className="line-clamp-2 text-sm leading-snug font-semibold text-ink">{game.title}</h3>
    ...
  </div>
</article>
```

**Suggestion extension pattern** (from 10-UI-SPEC lines 209-220):
```tsx
interface GameCardProps {
  game: Game
  suggestion?: Suggestion
  onPick?: () => void
  picking?: boolean
  isHost?: boolean
}

{suggestion && (
  <>
    <div className="flex items-center gap-2">
      <span className="rounded-full bg-surface-raised px-2 py-0.5 text-xs font-semibold text-ink">Score {suggestion.match}</span>
      <Badge>{suggestion.confidence} confidence</Badge>
    </div>
    <div className="flex flex-wrap gap-1">
      {suggestion.reasons.slice(0, 3).map((r) => <ReasonChip key={r.label} reason={r} />)}
      {suggestion.reasons.length > 3 && <Disclosure> ... </Disclosure>}
    </div>
    {isHost ? (
      <Button onClick={onPick} disabled={picking} className="mt-auto w-full">{picking ? 'Picking…' : 'Pick this game'}</Button>
    ) : (
      <p className="mt-auto text-xs text-ink-muted">The host will choose the game.</p>
    )}
  </>
)}
```

**Important:** Whole-card click navigates to BGG; nested pick button must call `e.stopPropagation()` / use a native `<button>` inside the article (current article is not itself a button, so nested buttons are valid; ensure `onClick` on the card wrapper does not fire for inner buttons by checking `event.target`).

---

### `app/frontend/components/mobile-tab-bar.tsx` (component, request-response)

**Analog:** `app/frontend/components/mobile-tab-bar.tsx` (self) — replace hardcoded quick-action routes.

**Current hardcoded actions** (lines 33-59):
```tsx
<LinkButton to="/g/abc123" ...>Schedule a game night</LinkButton>
<LinkButton to="/s/fri-battle" ...>Open tonight's session</LinkButton>
<LinkButton to="/groups" ...>Create a group</LinkButton>
```

**Dynamic replacement pattern** (from 13-RESEARCH.md Open Question 4):
```tsx
const { token } = useActiveGroup()

<LinkButton to={token ? `/g/${token}` : '/groups'} ...>
  {token ? 'Schedule a game night' : 'Create a group'}
</LinkButton>
<LinkButton to={token ? `/collection?group=${token}` : '/collection'} variant="outline" ...>
  Browse library
</LinkButton>
```

**Active tab pattern** (lines 93-119):
```tsx
const active = href === '/' ? pathname === '/' : pathname.startsWith(href)
```
- Keep existing active logic; ensure `/collection` and `/groups` tabs highlight correctly.

---

### `app/frontend/App.tsx` (route config, request-response)

**Analog:** `app/frontend/App.tsx` (self) — wire placeholder routes to real pages.

**Current placeholder routes** (lines 33, 35, 37):
```tsx
<Route path="/g/:token/sessions" element={<PlaceholderPage title="Past Sessions" />} />
<Route path="/invite/:token" element={<PlaceholderPage title="Invite" />} />
<Route path="/hot" element={<PlaceholderPage title="Hot Games" />} />
```

**Replacement pattern**:
```tsx
import { HotGamesPage } from '@/pages/HotGamesPage'
import { GroupSessionsPage } from '@/pages/GroupSessionsPage'
import { InvitePage } from '@/pages/InvitePage'

<Route path="/hot" element={<HotGamesPage />} />
<Route path="/g/:token/sessions" element={<GroupSessionsPage />} />
<Route path="/invite/:token" element={<InvitePage />} />
```

---

### `app/frontend/lib/data.ts` (utility/static, static)

**Analog:** `app/frontend/lib/data.ts` (self) — remove static sample data used in production surfaces.

**Static data to remove**:
- `members`, `games`, `groups`, `sessions`, `suggestions`, `scoreboard`, `stats`, `testimonials` arrays (lines 48-440).

**Keep type definitions** (lines 1-47):
```typescript
export type Member = { ... }
export type Game = { ... }
export type SessionState = ...
export type Session = { ... }
```

**Migrate `hero-flow.tsx` fallback**:
- If the animation still uses sample game covers, move a minimal static fixture into `hero-flow.tsx` itself or render CSS placeholders. Do not import production sample data from a shared file.

---

## Shared Patterns

### Apollo Client Query + Loading/Error States
**Source:** `app/frontend/pages/GroupPage.tsx` (lines 16-75)
**Apply to:** All new page components (`HotGamesPage`, `GroupSessionsPage`, `InvitePage`, extensions to `GroupPage`/`SessionPage`).
```tsx
const { data, loading, error } = useQuery(QUERY, { variables: { ... }, skip: !param })
if (loading) return <SkeletonLayout />
if (error || !data?.field) return (
  <div className="mx-auto w-full max-w-4xl px-4 pt-24 pb-20">
    <Card className="flex flex-col items-center gap-3 p-12 text-center">
      <p className="text-ink-secondary">{error ? 'Couldn’t load this page.' : 'Not found.'}</p>
      <LinkButton to="/" variant="outline" size="lg">Back home</LinkButton>
    </Card>
  </div>
)
```

### Apollo Cache Mutation Update
**Source:** `app/frontend/contexts/AuthContext.tsx` (lines 59-76) and 13-RESEARCH.md Pattern 1
**Apply to:** `createNightSession` in `GroupPage`, `rsvp` in `InvitePage`, `pickGame` in `SessionPage`, `removeGroupMember`/`updateGroupMemberRole` in `GroupPage`.
```tsx
update(cache, { data }) {
  if (!data?.mutationName?.session) return
  cache.modify({
    id: cache.identify({ __typename: 'Group', id: groupId }),
    fields: {
      sessions(existing = [], { readField }) {
        const newRef = cache.writeFragment({ data: data.mutationName.session, fragment: SESSION_STUB_FRAGMENT })
        const exists = existing.some((ref: any) => readField('id', ref) === data.mutationName.session.id)
        return exists ? existing : [...existing, newRef]
      },
    },
  })
}
```

### GraphQL Documents
**Source:** `app/frontend/lib/graphql/documents.ts` (lines 1-844)
**Apply to:** All new/modified surfaces.
- Use existing `gql` documents (`HOT_ITEMS`, `GET_GROUP`, `GET_NIGHT_SESSION`, `GET_SESSION_INVITE`, `RSVP`, `PICK_GAME`, `INVITE_TO_GROUP`, etc.).
- New surfaces do not need new documents unless schema fields are missing; existing documents already expose all required fields.

### Tailwind v4 Token Usage
**Source:** `app/frontend/styles.css` (lines 6-108)
**Apply to:** All new components.
- Cards: `rounded-xl border border-line bg-surface`.
- Text: `text-ink`, `text-ink-secondary`, `text-ink-muted`, `text-primary`.
- Hover on interactive cards: `hover:shadow-md hover:-translate-y-1 transition-all duration-300`.
- Focus: `focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2`.

### Button/LinkButton Primitives
**Source:** `app/frontend/components/ui/button.tsx` (lines 4-54) and `app/frontend/components/ui/link-button.tsx` (lines 1-23)
**Apply to:** All new CTAs.
- Use `Button` for actions; `LinkButton` for navigation.
- Variants: `default`, `outline`, `ghost`, `destructive`; sizes: `sm`, `lg`, `icon`.

### Accessibility / E2E Test-ID Contracts
**Source:** E2E specs in `tests/e2e/`
**Apply to:** All modified surfaces.
- Game cards: `data-testid="game-card"`.
- Session rows: `data-testid="session-row"`.
- Suggestion grid: `data-testid="suggestion-grid"`.
- Sort combobox: accessible name `Sort`; group-by combobox: accessible name `Group by`.
- Player range sliders: accessible names `Minimum players` and `Maximum players`.
- Buttons: exact labels from UI-SPECs ("Merge collections", "Create a night", "Choose a game", "Pick this game", "Edit Details", "Show more reasons", etc.).

---

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `app/frontend/generated/types.ts` | generated types | n/a | Codegen output does not exist until `npm run codegen` is run. |
| `app/frontend/generated/operations.ts` | generated hooks | n/a | Codegen output does not exist until `npm run codegen` is run. |

---

## Metadata

**Analog search scope:** `app/frontend/`, `tests/e2e/`, `.planning/phases/08-group-detail-surface/`, `.planning/phases/09-home-collection-redesign/`, `.planning/phases/10-picking-a-game-redesign/`
**Files scanned:** 38
**Pattern extraction date:** 2026-07-30
