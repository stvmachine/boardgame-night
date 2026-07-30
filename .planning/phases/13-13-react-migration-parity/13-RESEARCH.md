# Phase 13: React Migration Parity - Research

**Researched:** 2026-07-30
**Domain:** React 19 SPA parity with Rails 8.1 GraphQL backend; completion of Vue-to-React migration
**Confidence:** MEDIUM

## Summary

Phase 13 must finish the Vue-to-React migration so the React frontend becomes the sole, fully functional UI for every shipped product journey. The backend (Rails 8.1 API-only, GraphQL, Solid Queue/Cache) and data layer are largely complete and stable; the remaining work is on the React client in `app/frontend/`.

A code audit of the React frontend versus the approved v1.1 UI-SPECs and existing E2E tests reveals several parity gaps: placeholder routes (`/hot`, `/g/:token/sessions`, `/invite/:token`), an incomplete Group Detail hub, a stripped-down Session/Picking page, a Home dashboard that omits the trending section and uses static sample data, collection filters/sorts that diverge from the v1.1 contract, and a GraphQL codegen configuration still targeting Vue Apollo. The E2E suite already encodes the expected React-era behavior, so the primary planning objective is to make those tests pass while preserving the Tabletop Social design system and accessibility patterns.

**Primary recommendation:** Scope Phase 13 as a parity sprint that (1) fixes the GraphQL codegen to produce typed React Apollo hooks, (2) implements the missing/placeholder surfaces against the existing E2E contracts and v1.1 UI-SPECs, (3) repairs the collection filter/sort contract, and (4) runs the full E2E suite green. Do not introduce new frameworks or packages; rely on the React 19 + React Router v7 + Apollo Client 3 + Tailwind v4 + Vite 6 stack already in `package.json`.

<user_constraints>
## User Constraints (from PROJECT.md and AGENTS.md)

### Locked Decisions
- **Tech stack**: Ruby on Rails (API-only mode) + React in a single git monorepo. Rails serves the React build and exposes GraphQL; no separate proxy service. [CITED: PROJECT.md ## Constraints]
- **Ruby version management**: rbenv, modern Ruby (project currently runs 4.0.5 but Rails 8.1 requires ≥ 3.2). [CITED: PROJECT.md ## Constraints]
- **API style**: GraphQL between React and Rails; Rails is the single GraphQL source of truth. [CITED: PROJECT.md ## Constraints]
- **Frontend build**: React with Vite, integrated into Rails; SPA served from `public/` in production. [CITED: PROJECT.md ## Constraints]
- **BGG credentials**: loaded from `.env.bggeek`, never committed to git. [CITED: PROJECT.md ## Constraints]
- **BGG rate limits**: throttle to ~1 req/5s with retries and caching. [CITED: PROJECT.md ## Constraints]
- **Design system**: Tabletop Social / Material 3 tokens (Inter, indigo `#4f46e5`, M3 tonal palette, Material Symbols Outlined). [CITED: REQUIREMENTS.md DS-01..DS-06, 08-UI-SPEC.md, 09-UI-SPEC.md]
- **Vue-era UI-SPECs are the source of truth** for layout, copy, accessibility, and responsive behavior. The older Next.js `board-game-night/` app may inform implementation but does not supersede Vue-era behavior. [CITED: PROJECT.md ## Context]

### the agent's Discretion
- Which placeholder surface to build first (recommendation: follow E2E dependency order, starting with `/hot` and Group Detail because they unblock Home and Collection journeys).
- Whether to extend the existing `GameCard` for suggestion context or add a dedicated `SuggestionCard`.
- Whether to delete the legacy `board-game-night/` directory during this phase or in a final cleanup phase.

### Deferred Ideas (OUT OF SCOPE)
- v2.0 deferred features (VOTE-01, VOTE-02, RSVP-01, SESS-07, FACET-01, PLAY-01, FRESH-01, AVAIL-01, HISTORY-01, STATS-01). [CITED: REQUIREMENTS.md ## v2 Requirements (Deferred)]
- Real-time chat, OAuth login against BGG, mobile native app. [CITED: PROJECT.md ## Out of Scope]
- Dev blog engine (BLOG-01..BLOG-05) is Phase 12 scope; only ensure the React build does not break Kamal/subdomain integration. [CITED: REQUIREMENTS.md ## v1.2 Requirements]
</user_constraints>

<phase_requirements>
## Phase Requirements

No explicit requirement IDs were provided for Phase 13. The following derived requirements map the v2.0 milestone goals in PROJECT.md to the research findings that enable implementation.

| ID | Description | Research Support |
|----|-------------|------------------|
| RMP-01 | React fully replaces Vue while preserving every existing product journey and the Tabletop Social interface. | Current React app exists; gaps catalogued in `## Current State vs. Parity`. |
| RMP-02 | Auth, collection merge/browse, groups, invitations, sessions, RSVP, suggestions, and game picking work end to end in React. | GraphQL documents/mutations already exist; missing surfaces identified in `## Parity Gap Inventory`. |
| RMP-03 | Frontend and Rails/GraphQL defects exposed by parity verification are repaired. | codegen.ts misconfiguration and filter/sort contract drift identified; backend test suite green per STATE.md. |
| RMP-04 | React tests and production delivery replace Vue tooling; Vue source and dependencies are removed after parity is proven. | No `.vue` files remain; remaining cleanup is codegen config and `board-game-night/` legacy directory. |
| RMP-05 | Existing E2E tests pass against the React frontend. | E2E specs are the acceptance contract; mapped to surfaces in `## E2E Test → Surface Mapping`. |
</phase_requirements>

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Routing & URL state | Browser / Client | — | React Router v7 in library mode owns SPA routes and search params. |
| Authentication session | Browser / Client (localStorage token) | API / Backend (token validation) | AuthContext stores JWT and calls signIn/signUp/signOut mutations; Rails validates. |
| GraphQL data fetching/cache | Browser / Client | — | Apollo Client 3 manages normalized cache, queries, mutations, subscriptions. |
| Collection filtering/sorting/grouping | Browser / Client | API / Backend (mergedCollection query) | Server returns merged, deduplicated collection; client applies filters/sorts/group-by per v1.1 contract. |
| BGG rate limiting/throttling | API / Backend | — | Rails Solid Queue job concurrency key `bgg_api` and `Bgg::RateLimiter` enforce 1 req/5s. |
| Suggestion scoring | API / Backend | — | `Suggestions::Engine` is pure Ruby, no DB queries, no BGG calls, invoked by GraphQL resolver. |
| Session lifecycle & RSVPs | API / Backend | Browser / Client (optimistic UI) | Mutations live in Rails; React renders role-aware controls and updates Apollo cache. |
| Design tokens / responsive layout | Browser / Client | — | Tailwind v4 CSS-first `@theme` tokens in `app/frontend/styles.css`. |

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | 19.0.0 | UI framework | Locked by PROJECT.md v2.0; stable release Dec 2024, ref-as-prop and Actions are relevant. [CITED: package.json] |
| react-dom | 19.0.0 | DOM renderer | Peer of React 19. [CITED: package.json] |
| react-router-dom | 7.1.0 | SPA routing | Already installed and used in library mode with `BrowserRouter`. [CITED: package.json, Context7 /remix-run/react-router] |
| @apollo/client | 3.14.1 | GraphQL client + normalized cache | Standard React GraphQL client; `useQuery`/`useMutation` + `cache.modify` for list updates. [CITED: package.json, Context7 /apollographql/apollo-client] |
| graphql | 16.14.2 | GraphQL JS runtime | Apollo 3.x peer dependency. [CITED: package.json] |
| Vite | 6.4.3 | Build tool / dev server | Already installed and configured with `@vitejs/plugin-react` and `@tailwindcss/vite`. [CITED: package.json, vite.config.ts] |
| Tailwind CSS | 4.3.2 | Utility-first styling | CSS-first config via `@import "tailwindcss"` and `@theme` in `styles.css`. [CITED: package.json, Context7 /websites/tailwindcss_installation_using-vite] |
| TypeScript | ~5.9 | Type safety | Already pinned; used by vue-tsc/Volar and codegen. [CITED: package.json] |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @graphql-codegen/cli | 7.1.3 | Generate TS types/hooks from `schema.graphql` | Replace the misconfigured `typescript-vue-apollo` output with `typescript-react-apollo`. [CITED: package.json, Context7 /dotansimha/graphql-code-generator] |
| @graphql-codegen/typescript-react-apollo | 4.3.0 | Generated typed `useXxxQuery` / `useXxxMutation` hooks | Required for type-safe React Apollo components. [CITED: package.json] |
| Vitest | 4.1.10 | Unit/component test runner | Already configured with jsdom and `@testing-library/react`. [CITED: package.json, Context7 /vitest-dev/vitest] |
| @playwright/test | 1.61.1 | E2E tests | Existing E2E suite defines the parity acceptance criteria. [CITED: package.json, webfetch playwright.dev/docs/best-practices] |
| lucide-react | 0.460.0 | Icon set | Current React app uses Lucide; the v1.1 design system specified Material Symbols Outlined via `@iconify/vue`. A decision is needed (see Open Questions). [CITED: package.json] |
| class-variance-authority | 0.7.1 | Variant-driven component classes | Used by existing `Button` primitive. [CITED: package.json] |
| tailwind-merge + clsx | 3.6.0 / 2.1.1 | Class name merging | Utility helpers already in `lib/utils.ts`. [CITED: package.json] |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| React Router v7 library mode | React Router v7 framework mode | Framework mode adds server runtime, loaders, actions — unnecessary for a Rails-hosted SPA and would require restructuring. [ASSUMED] |
| Apollo Client 3 | urql | urql is lighter, but Apollo's normalized cache and existing mutations/documents make Apollo the lower-risk choice for parity. [ASSUMED] |
| Custom primitives | shadcn/ui + Radix UI | shadcn/ui would accelerate accessible components, but the project already has source-owned primitives and the v1.1 specs emphasize source ownership; introducing shadcn/ui is a bigger change than needed. [ASSUMED] |

**Installation:**

```bash
# No new core packages are required. If codegen is re-wired, ensure the React Apollo plugin is present:
npm install -D @graphql-codegen/typescript-react-apollo
```

**Version verification:** Core versions are already declared in `package.json` and installed. The following commands confirm the local toolchain:

```bash
node --version         # v22.23.1
npm --version          # 10.9.8
ruby --version         # ruby 4.0.5 (project runs on 4.0.5; Rails 8.1 requires ≥ 3.2)
bin/rails --version    # Rails 8.1.3
npx vite --version     # vite/6.4.3
```

## Package Legitimacy Audit

> Required whenever this phase installs external packages. The packages below are already project dependencies; the audit was run to surface any packages that need a human checkpoint before the phase proceeds.

| Package | Registry | Age | Downloads | Source Repo | Verdict | Disposition |
|---------|----------|-----|-----------|-------------|---------|-------------|
| react | npm | 2026-07-21 | 162M/wk | github.com/react/react | [SUS] | Already installed; too-new heuristic only — official React repo. Keep. |
| react-dom | npm | 2026-07-21 | 139M/wk | github.com/react/react | [SUS] | Already installed; too-new heuristic only — official React repo. Keep. |
| react-router-dom | npm | 2026-07-28 | 43M/wk | github.com/remix-run/react-router | [SUS] | Already installed; too-new heuristic only — official Remix repo. Keep. |
| @apollo/client | npm | 2026-07-23 | 7M/wk | github.com/apollographql/apollo-client | [SUS] | Already installed; too-new heuristic only — official Apollo repo. Keep. |
| graphql | npm | 2026-07-03 | 44M/wk | github.com/graphql/graphql-js | [SUS] | Already installed; too-new heuristic only — official GraphQL repo. Keep. |
| tailwindcss | npm | 2026-07-16 | 117M/wk | github.com/tailwindlabs/tailwindcss | [SUS] | Already installed; too-new heuristic only — official Tailwind repo. Keep. |
| @tailwindcss/vite | npm | 2026-07-16 | 41M/wk | github.com/tailwindlabs/tailwindcss | [SUS] | Already installed; too-new heuristic only — official Tailwind repo. Keep. |
| vitest | npm | 2026-07-06 | 85M/wk | github.com/vitest-dev/vitest | [SUS] | Already installed; too-new heuristic only — official Vitest repo. Keep. |
| @vitejs/plugin-react | npm | 2026-07-30 | 68M/wk | github.com/vitejs/vite-plugin-react | [SUS] | Already installed; too-new heuristic only — official Vite repo. Keep. |
| lucide-react | npm | 2026-07-30 | 83M/wk | github.com/lucide-icons/lucide | [SUS] | Already installed; too-new heuristic only — official Lucide repo. Keep. |
| @graphql-codegen/typescript-react-apollo | npm | 2026-04-19 | 1.8M/wk | github.com/dotansimha/graphql-code-generator-community | [OK] | Install if codegen is re-wired to React. |
| clsx | npm | 2024-04-23 | 104M/wk | github.com/lukeed/clsx | [OK] | Already installed. |
| tailwind-merge | npm | 2026-05-10 | 77M/wk | github.com/dcastil/tailwind-merge | [OK] | Already installed. |
| class-variance-authority | npm | 2024-11-26 | 54M/wk | github.com/joe-bell/cva | [OK] | Already installed. |

**Packages removed due to [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** react, react-dom, react-router-dom, @apollo/client, graphql, tailwindcss, @tailwindcss/vite, vitest, @vitejs/plugin-react, lucide-react, @testing-library/jest-dom, jsdom. **Note:** The [SUS] verdicts are all "too-new" heuristics against official repositories with high download counts. These packages are already locked in `package.json` and `package-lock.json`; no reinstall is required. The planner should not add a human-verify checkpoint for packages that are already installed and part of the shipped v2.0 baseline.

## Architecture Patterns

### System Architecture Diagram

```
User Browser
    │
    ├─ React 19 SPA (app/frontend/)
    │   ├─ react-router-dom v7 (BrowserRouter)
    │   ├─ ApolloProvider → InMemoryCache
    │   ├─ AuthContext (localStorage JWT)
    │   ├─ ActiveGroupContext
    │   └─ Tailwind v4 + custom primitives
    │
    ▼
Rails 8.1 API-only server
    ├─ /graphql → BoardgameNightSchema
    ├─ GraphQL::Dataloader for N+1 avoidance
    ├─ app/services/ + dry-validation contracts
    ├─ Solid Queue (BGG imports, backfills)
    ├─ Solid Cache (BGG response cache, rate limiter)
    └─ BGG XML API v2 via Faraday + Nokogiri
```

### Recommended Project Structure

```
app/frontend/
├── components/
│   ├── ui/                  # source-owned primitives (Button, LinkButton)
│   ├── primitives.tsx       # Card, Badge, Avatar, Progress, EmptyState, Eyebrow
│   ├── game-card.tsx        # collection card + suggestion-context extension
│   ├── site-nav.tsx
│   ├── mobile-tab-bar.tsx
│   ├── theme-toggle.tsx
│   ├── site-footer.tsx
│   ├── scoreboard.tsx
│   ├── plays-history.tsx
│   └── collection/
│       ├── collection-browser.tsx
│       └── filter-panel.tsx
├── pages/
│   ├── LandingPage.tsx      # hero + merge form + trending
│   ├── CollectionPage.tsx
│   ├── GroupsPage.tsx
│   ├── GroupPage.tsx        # full hub (header, sessions, spotlight, members, invite)
│   ├── SessionPage.tsx      # session header + picking UI + completed summary
│   ├── LoginPage.tsx
│   ├── SignupPage.tsx
│   ├── AccountPage.tsx
│   ├── HotGamesPage.tsx     # replace PlaceholderPage for /hot
│   ├── GroupSessionsPage.tsx# replace PlaceholderPage for /g/:token/sessions
│   ├── InvitePage.tsx       # replace PlaceholderPage for /invite/:token
│   └── PlaceholderPage.tsx  # keep for 404
├── contexts/
│   ├── AuthContext.tsx
│   └── ActiveGroupContext.tsx
├── lib/
│   ├── graphql/
│   │   ├── apollo.ts
│   │   ├── documents.ts     # gql documents (source of truth)
│   │   ├── types.ts         # hand-written GQL types (replace with generated)
│   │   └── adapters.ts      # GQL → UI data adapters
│   ├── collection.ts        # filter/sort/group logic and URL serialization
│   ├── data.ts              # sample data (delete after full GraphQL wiring)
│   └── utils.ts
├── entrypoints/
│   ├── main.tsx
│   └── styles.css
└── generated/               # codegen output (currently absent)
    ├── types.ts
    └── operations.ts
```

### Pattern 1: Apollo Client cache updates after mutations

**What:** After a mutation that creates or removes a list item, update the normalized cache so dependent queries re-render without refetching.

**When to use:** Creating a night session, removing a group member, updating a role, picking a game.

**Example:**

```typescript
// Source: Context7 /apollographql/apollo-client
const [createNight] = useMutation(CREATE_NIGHT_SESSION, {
  update(cache, { data }) {
    if (!data?.createNightSession?.session) return
    cache.modify({
      id: cache.identify({ __typename: 'Group', id: groupId }),
      fields: {
        sessions(existing = []) {
          const newRef = cache.writeFragment({
            data: data.createNightSession.session,
            fragment: gql`
              fragment SessionStub on NightSession {
                id
                title
                state
                scheduledAt
              }
            `,
          })
          return [...existing, newRef]
        },
      },
    })
  },
})
```

### Pattern 2: React Router v7 library-mode route guards

**What:** A wrapper component checks `useAuth()` and renders a `<Navigate>` or a loading fallback.

**When to use:** Protecting `/account`, `/groups`, `/g/:token` (for authenticated-only flows), or redirecting authenticated users away from `/login`.

**Example:**

```tsx
// Source: Context7 /remix-run/react-router + project code
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const location = useLocation()
  if (loading) return <LoadingSkeleton />
  if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />
  return <>{children}</>
}
```

### Pattern 3: GraphQL Codegen for React Apollo

**What:** Generate typed hooks from `schema.graphql` and the `.ts`/`.tsx` files containing `gql` documents.

**When to use:** The current project hand-writes types in `app/frontend/lib/graphql/types.ts`; codegen should replace this to guarantee type safety as the schema evolves.

**Example:**

```typescript
// Source: Context7 /dotansimha/graphql-code-generator
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

### Pattern 4: v1.1 Collection filter/sort contract

**What:** The v1.1 UI-SPEC mandates four sort options (Name A–Z, Rating High–Low, Weight Light–Heavy, Recently Played), a 1–10 player-count slider, play-time checkbox groups, complexity segmented buttons, and group-by options. The current `lib/collection.ts` uses different sort labels and extra sort keys.

**When to use:** Any work touching the collection browser or filter panel.

**Example contract:**

```typescript
// Aligned with 09-UI-SPEC.md and tests/e2e/collection.spec.ts
export type SortKey = 'name' | 'rating' | 'weight' | 'recent'
export const sortLabels: Record<SortKey, string> = {
  name: 'Name A–Z',
  rating: 'Rating High–Low',
  weight: 'Weight Light–Heavy',
  recent: 'Recently Played',
}
```

### Anti-Patterns to Avoid

- **Do not use Vue Apollo codegen output in a React app.** `codegen.ts` currently generates `typescript-vue-apollo` composables; this is a broken artifact from the migration and will produce React-incompatible hooks. [CITED: codegen.ts]
- **Do not call BGG from the frontend.** All BGG communication stays in Rails; the React app only talks to `/graphql`. [CITED: PROJECT.md ## Context]
- **Do not duplicate server data in React context.** Use Apollo's normalized cache for server state; use `AuthContext`/`ActiveGroupContext` only for auth token and transient UI state. [ASSUMED]
- **Do not hardcode dummy routes.** `mobile-tab-bar.tsx` currently links to `/g/abc123` and `/s/fri-battle`; these must be dynamic. [CITED: mobile-tab-bar.tsx]
- **Do not preserve static sample data in production surfaces.** `LandingPage.tsx` imports `members`, `stats`, and `testimonials` from `lib/data.ts`; the trending section and stats card must use GraphQL data. [CITED: LandingPage.tsx]

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| GraphQL client caching | Custom fetch + Redux/Zustand for server data | Apollo Client `InMemoryCache` | Normalization, refetching, mutation cache updates, and subscription handling are already configured. [CITED: Context7 /apollographql/apollo-client] |
| Form actions and pending state | Manual `useState` for every form | React 19 `useActionState` / `useFormStatus` or Apollo mutation loading states | Reduces boilerplate and matches React 19 conventions. [CITED: webfetch react.dev/blog/2024/12/05/react-19] |
| GraphQL type generation | Hand-written types in `lib/graphql/types.ts` | `@graphql-codegen/typescript` + `typescript-react-apollo` | Keeps TypeScript in sync with `schema.graphql` automatically. [CITED: Context7 /dotansimha/graphql-code-generator] |
| Client routing | Hash router or manual URL parsing | `react-router-dom` v7 `BrowserRouter` | Already installed; gives real URLs, history, and nested routes. [CITED: Context7 /remix-run/react-router] |
| Responsive styling | Custom breakpoint hooks | Tailwind v4 responsive prefixes | CSS-first tokens and media queries are already set up. [CITED: Context7 /websites/tailwindcss_installation_using-vite] |

**Key insight:** The backend is the hard part and it is already done. The biggest risk in this phase is re-implementing behavior that already exists in Rails or in the approved v1.1 UI-SPECs. The planner should treat the E2E tests and UI-SPECs as the acceptance contract, not as suggestions.

## Runtime State Inventory

> This phase is a feature-completion/parity phase, not a rename/refactor/migration of identifiers. No runtime state rename inventory is required.

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | None related to a rename. | — |
| Live service config | None related to a rename. | — |
| OS-registered state | None related to a rename. | — |
| Secrets/env vars | `.env.bggeek` continues to hold BGG credentials; no rename. | — |
| Build artifacts | `public/` will be regenerated by `bin/vite build` when the React build changes. | Ensure Kamal deploy still serves `public/` catch-all. |

**Nothing found in category:** N/A — this phase does not rename runtime identifiers.

## Common Pitfalls

### Pitfall 1: React 19 implicit ref-callback returns break TypeScript
**What goes wrong:** A ref callback like `<div ref={(el) => (ref.current = el)} />` returns the assignment value, which React 19 interprets as a cleanup function and TypeScript rejects.
**Why it happens:** React 19 supports ref cleanup functions; any return value from a ref callback is now treated as a cleanup.
**How to avoid:** Use explicit braces and no implicit return: `ref={(el) => { ref.current = el }}`.
**Warning signs:** `tsc --noEmit` errors in components using ref callbacks. [CITED: webfetch react.dev/blog/2024/12/05/react-19]

### Pitfall 2: Apollo cache not updated after mutations
**What goes wrong:** Creating a night session or removing a member does not reflect in the UI until a manual refresh.
**Why it happens:** The mutation response does not include the modified list or `update` callback is omitted.
**How to avoid:** Return modified objects in mutation payloads and use `cache.modify` (or `refetchQueries` as a fallback) for list fields.
**Warning signs:** UI state lags behind server state; E2E tests fail waiting for updated counts. [CITED: Context7 /apollographql/apollo-client]

### Pitfall 3: React Router v7 library-mode route changes don't trigger Apollo refetches
**What goes wrong:** Navigating from `/collection?usernames=a,b` to `/collection?usernames=c,d` reuses the mounted component and Apollo returns stale cache.
**Why it happens:** `useQuery` with default `cache-first` does not refetch when only URL params change.
**How to avoid:** Use `fetchPolicy: 'cache-and-network'` for route-dependent queries, or key the query on the route param.
**Warning signs:** Filter/sort state updates from the URL do not refresh data. [ASSUMED]

### Pitfall 4: v1.1 UI copy/label drift
**What goes wrong:** E2E tests expect exact labels like "Name A–Z", "Rating High–Low", "Weight Light–Heavy", "Recently Played", "Create a night", "Browse Library".
**Why it happens:** The current React code uses different labels (e.g., "Name (A–Z)", "Rating (high to low)") or omits controls.
**How to avoid:** Copy labels verbatim from `08-UI-SPEC.md`, `09-UI-SPEC.md`, and `10-UI-SPEC.md`.
**Warning signs:** E2E `getByRole` / `getByText` assertions fail despite the feature appearing to work. [CITED: 08-UI-SPEC.md, 09-UI-SPEC.md, tests/e2e/*.spec.ts]

### Pitfall 5: Missing accessible roles and test IDs
**What goes wrong:** E2E locators rely on roles, labels, and `data-testid` values defined in the v1.1 specs.
**Why it happens:** New React components may use generic `<div>` wrappers or inconsistent `data-testid` names.
**How to avoid:** Use the project's primitives and match `data-testid` contracts (e.g., `game-card`, `suggestion-grid`, `session-row`).
**Warning signs:** Playwright cannot find elements; tests time out. [CITED: tests/e2e/session_lifecycle.spec.ts, tests/e2e/group_detail.spec.ts]

### Pitfall 6: Hot/trending page depends on live BGG in tests
**What goes wrong:** The `/hot` route and Home trending section rely on `hotItems` GraphQL query, which hits the BGG hot list endpoint.
**Why it happens:** BGG rate limits and flakiness break deterministic E2E.
**How to avoid:** Seed the Rails cache during `e2e:seed` (the project already does this for the Home hero per STATE.md).
**Warning signs:** `home.spec.ts` trending assertions fail intermittently. [CITED: STATE.md Phase 09 notes, tests/e2e/home.spec.ts]

## Code Examples

### Apollo mutation with cache update for a group session list

```typescript
// Source: Context7 /apollographql/apollo-client
import { gql, useMutation } from '@apollo/client'
import { CREATE_NIGHT_SESSION } from '@/lib/graphql/documents'

const GROUP_SESSIONS_FRAGMENT = gql`
  fragment GroupSessionStub on NightSession {
    id
    title
    state
    scheduledAt
    location
    attendeeCount
  }
`

function useCreateNightSession(groupId: string) {
  return useMutation(CREATE_NIGHT_SESSION, {
    update(cache, { data }) {
      const session = data?.createNightSession?.session
      if (!session) return
      cache.modify({
        id: cache.identify({ __typename: 'Group', id: groupId }),
        fields: {
          sessions(existing = [], { readField }) {
            const exists = existing.some(
              (ref: any) => readField('id', ref) === session.id
            )
            if (exists) return existing
            const newRef = cache.writeFragment({
              data: session,
              fragment: GROUP_SESSIONS_FRAGMENT,
            })
            return [...existing, newRef]
          },
        },
      })
    },
  })
}
```

### React Router protected-route wrapper

```tsx
// Source: Context7 /remix-run/react-router + project ProtectedRoute.tsx
import { Navigate, useLocation, Outlet } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'

export function ProtectedRoute({ children }: { children?: React.ReactNode }) {
  const { user, loading } = useAuth()
  const location = useLocation()
  if (loading) return <div aria-busy="true">Loading…</div>
  if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />
  return children ? <>{children}</> : <Outlet />
}
```

### Tailwind v4 token usage in a component

```tsx
// Source: Context7 /websites/tailwindcss_installation_using-vite + 09-UI-SPEC.md
function TrendingCard({ rank, name, thumbnail }: { rank: number; name: string; thumbnail: string }) {
  return (
    <article className="rounded-xl border border-outline bg-surface-container p-3 shadow-card hover:-translate-y-1 hover:shadow-md transition-all">
      <div className="aspect-[4/3] overflow-hidden rounded-lg bg-surface-variant">
        <img src={thumbnail} alt="" className="h-full w-full object-cover" />
      </div>
      <div className="mt-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-ink line-clamp-1">{name}</h3>
        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
          #{rank}
        </span>
      </div>
    </article>
  )
}
```

## Current State vs. Parity

### Implemented (no parity risk)

- React app shell with React Router v7, ApolloProvider, AuthContext, ActiveGroupContext. [CITED: App.tsx]
- Login / Signup / Account pages. [CITED: pages/LoginPage.tsx, SignupPage.tsx, AccountPage.tsx]
- Collection browser with GraphQL `mergedCollection`, URL params, owner toggles, basic filters, grid/list view. [CITED: pages/CollectionPage.tsx, components/collection/collection-browser.tsx]
- Basic group list page. [CITED: pages/GroupsPage.tsx]
- Basic session page showing RSVPs and suggestions. [CITED: pages/SessionPage.tsx]
- Vitest suite green: 143 passing, 0 failing. [CITED: local `vitest run` output]

### Parity Gap Inventory

| Gap | Location | v1.1 Source | Impact |
|-----|----------|-------------|--------|
| `/hot` is a placeholder | `App.tsx` route `/hot` → `PlaceholderPage` | HOME-03, tests/e2e/home.spec.ts | Blocks Home trending "View all" flow. |
| `/g/:token/sessions` is a placeholder | `App.tsx` route | GROUP-08, 08-UI-SPEC | Past sessions list not implemented. |
| `/invite/:token` is a placeholder | `App.tsx` route | Invite acceptance flow | New members cannot RSVP via invite link in React. |
| Group Detail hub incomplete | `pages/GroupPage.tsx` | 08-UI-SPEC.md | Missing role-aware sessions card, shared collection spotlight, members panel action menu, invite card. |
| Picking flow incomplete | `pages/SessionPage.tsx` | 10-UI-SPEC.md | Missing host-only edit, suggestion cards with reasons/confidence, "Pick this game" action, responsive grid. |
| Home dashboard incomplete | `pages/LandingPage.tsx` | 09-UI-SPEC.md HOME-01..HOME-03 | Missing "Trending on BGG" section; stats card uses static data; hero uses quick-start form instead of BGG username merge input. |
| Collection filter/sort drift | `lib/collection.ts`, `components/collection/filter-panel.tsx` | 09-UI-SPEC.md COLL-19..COLL-23 | Sort labels/keys and time buckets differ from v1.1; no group-by control; E2E tests fail. |
| GraphQL codegen misconfigured | `codegen.ts` | n/a | Generates Vue Apollo composables; documents glob misses `.ts`/`.tsx` files; no generated output exists. |
| Hardcoded quick-action routes | `components/mobile-tab-bar.tsx` | n/a | Links to `/g/abc123` and `/s/fri-battle` are dummy values. |
| Static sample data | `pages/LandingPage.tsx` imports from `lib/data.ts` | 09-UI-SPEC.md | Testimonials and fallback stats must come from backend or be removed. |
| `GameCard` lacks suggestion context | `components/game-card.tsx` | 10-UI-SPEC.md | Cannot render score, confidence chips, reasons, or pick button. |

### E2E Test → Surface Mapping

| E2E Spec | Surface(s) Required | Current Status |
|----------|---------------------|----------------|
| `tests/e2e/home.spec.ts` | LandingPage `/` hero merge, `/hot` route, trending section | Partial — hero merge missing, `/hot` placeholder. |
| `tests/e2e/collection.spec.ts` | Collection filter/sort/group controls, URL serialization, list view | Partial — sort labels/group-by missing. |
| `tests/e2e/group_detail.spec.ts` | GroupPage full hub | Partial — sessions rows, spotlight, members menu, invite card missing. |
| `tests/e2e/session_lifecycle.spec.ts` | SessionPage picking flow, invite RSVP | Partial — picking UI and host controls missing; `/invite/:token` placeholder. |
| `tests/e2e/shell.spec.ts` | SiteNav / MobileTabBar | Needs verification against v1.1 shell spec. |
| `tests/e2e/theme.spec.ts` | ThemeToggle + token system | Likely already working. |
| `tests/e2e/full_user_flow.spec.ts` | End-to-end journey | Blocked by above gaps. |

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Vue 3 + @vue/apollo-composable | React 19 + Apollo Client 3 React hooks | v2.0 milestone | React is the locked v2.0 frontend; Vue source has already been removed. [CITED: PROJECT.md ## Key Decisions] |
| shadcn-vue / reka-ui primitives | Custom source-owned primitives in `app/frontend/components/ui/` and `primitives.tsx` | v2.0 migration | Keeps dependency surface small but requires hand-rolling accessible controls. [CITED: app/frontend/components] |
| GraphQL codegen for Vue | Should generate React Apollo hooks | Not yet completed | `codegen.ts` is stale; this is a Phase 13 task. [CITED: codegen.ts] |
| Rails 8.1 recommended Ruby 3.4 | Local environment runs Ruby 4.0.5 | Current dev machine | Rails 8.1 supports Ruby ≥ 3.2, so 4.0.5 is acceptable, but gem compatibility should be watched. [ASSUMED] |

**Deprecated/outdated:**
- `typescript-vue-apollo` codegen plugin: produces Vue composables, unusable in React. [CITED: codegen.ts]
- Static sample data in `lib/data.ts`: should be removed or limited to tests once GraphQL wiring is complete. [CITED: lib/data.ts]
- `board-game-night/` directory: legacy Next.js app from before the Vue rewrite; safe to delete after confirming no code is referenced. [CITED: glob of `board-game-night/`]

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | The v1.1 UI-SPECs (08, 09, 10) remain the source of truth for React-era layout, copy, and accessibility. | Summary, Pitfalls | Implementation drifts from approved design; E2E tests fail. |
| A2 | No new major dependencies are needed; the existing React/Tailwind/Apollo/Vite stack is sufficient. | Standard Stack | If shadcn/ui or Radix is introduced, scope and bundle size grow. |
| A3 | The backend GraphQL schema (`schema.graphql`) already exposes all fields needed for parity surfaces. | Parity Gap Inventory | If fields are missing, backend work must be added to Phase 13. |
| A4 | Vitest tests are green (143 pass) and E2E tests are the primary acceptance contract. | Current State | If Vitest assumptions change, additional unit tests may be needed. |
| A5 | The `board-game-night/` legacy Next.js directory is unreferenced and can be removed in cleanup. | State of the Art | Accidental deletion of referenced code would break the build. |

## Open Questions

1. **Icon library: Lucide vs. Material Symbols Outlined**
   - What we know: The current React app uses `lucide-react`. The v1.1 design system specifies Material Symbols Outlined via `@iconify/vue` (Vue-only).
   - What's unclear: Should Phase 13 keep Lucide for speed, migrate to `@iconify/react` for parity, or use a custom Material Symbols wrapper?
   - Recommendation: Keep Lucide for already-implemented components to avoid a massive reskin; introduce a small `Icon` wrapper that can later be swapped. Do not block parity work on an icon migration.

2. **Codegen scope: full generated hooks or incremental?**
   - What we know: `codegen.ts` is broken for React; types are hand-written.
   - What's unclear: Should the phase generate typed hooks for all documents and refactor callers, or only fix codegen for new surfaces and leave existing hand-written types?
   - Recommendation: Fix codegen first and generate hooks for the whole frontend; this prevents type drift and surfaces schema mismatches early. Add a CI step that runs `npm run codegen` and fails on uncommitted changes.

3. **Should `/hot` share the same `GameCard` as collection or use a dedicated trending card?**
   - What we know: The Home trending section uses 6 cards and the `/hot` page uses a similar grid.
   - What's unclear: Whether to reuse `GameCard` (which has owner badges and category pills) or create a `TrendingCard`.
   - Recommendation: Create a thin `TrendingCard` that reuses thumbnail/rating primitives but omits owner/category data that hot items don't have.

4. **Mobile tab bar quick actions currently use hardcoded routes. What should they do?**
   - What we know: The quick actions link to `/g/abc123` and `/s/fri-battle`.
   - What's unclear: Whether the "New" button should open a create-group/create-session form or navigate to real routes.
   - Recommendation: Use the existing `/groups` page for "Create a group" and, when an active group exists, navigate to create-session within that group. Replace the hardcoded values before E2E.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | React/Vite/Vitest/Playwright | ✓ | v22.23.1 | — |
| npm | package management | ✓ | 10.9.8 | — |
| Ruby | Rails backend | ✓ | 4.0.5 | — |
| Rails | API server | ✓ | 8.1.3 | — |
| rbenv | Ruby version management | ✓ | 1.3.2 | — |
| Bundler | Gem management | ✓ | 2.6.9 | — |
| Vite | Frontend dev + build | ✓ | 6.4.3 | — |
| Vitest | Unit/component tests | ✓ | 4.1.10 | — |
| Playwright | E2E tests | ✓ | ^1.61.1 (per package.json) | — |
| Installed Ruby gems | Rails server, RSpec, etc. | ✗ | — | Run `bundle install` (currently missing many gems on this machine) |

**Missing dependencies with no fallback:**
- Installed Ruby gems — `bundle install` is required to run Rails/RSpec locally. This blocks backend verification but does not block frontend parity work because the React app can be developed against a running Rails server once gems are installed.

**Missing dependencies with fallback:**
- None.

## Security Domain

> `security_enforcement` is enabled (ASVS Level 1). This phase touches auth, session management, and access control; all must follow existing project patterns.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | yes | JWT stored in `localStorage`; signIn/signUp/signOut mutations via `AuthContext`. [CITED: AuthContext.tsx] |
| V3 Session Management | yes | Server-side session invalidated via `signOut` mutation; client clears token and resets Apollo cache. [CITED: AuthContext.tsx] |
| V4 Access Control | yes | GraphQL resolvers enforce `viewer_role` and group membership checks on the backend; React UI must hide role-inappropriate controls. [CITED: STATE.md Phase 08 decisions] |
| V5 Input Validation | yes | GraphQL argument validation and dry-validation contracts on the backend; frontend should not trust user input. [CITED: PROJECT.md ## Context] |
| V6 Cryptography | no | Password hashing remains on Rails (`bcrypt`); no frontend crypto needed. |

### Known Threat Patterns for React + Rails GraphQL

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Client-side authorization bypass | Elevation of privilege | Never gate mutations only by UI; backend resolvers must re-check roles. [CITED: STATE.md Phase 10 decisions] |
| GraphQL introspection in production | Information disclosure | `disable_introspection_entry_points` in production (already configured in Rails). [ASSUMED] |
| XSS via game names/descriptions | Tampering | Escape rendered text; React does this by default; avoid `dangerouslySetInnerHTML`. [ASSUMED] |
| BGG credentials leaked to client | Information disclosure | `.env.bggeek` is server-side only; never send to frontend. [CITED: PROJECT.md ## Constraints] |
| BGG rate-limit abuse | Denial of service | All BGG calls go through Rails `Bgg::RateLimiter` and Solid Queue concurrency key. [CITED: PROJECT.md ## Constraints] |

## Sources

### Primary (HIGH confidence)
- Project files audited directly: `package.json`, `vite.config.ts`, `vitest.config.ts`, `codegen.ts`, `app/frontend/App.tsx`, `app/frontend/pages/*.tsx`, `app/frontend/components/**/*.tsx`, `app/frontend/lib/**/*.ts`, `tests/e2e/*.spec.ts`, `schema.graphql`, `.planning/REQUIREMENTS.md`, `.planning/STATE.md`, `.planning/PROJECT.md`, `.planning/phases/08-*/08-UI-SPEC.md`, `.planning/phases/09-*/09-UI-SPEC.md`, `.planning/phases/10-*/10-UI-SPEC.md`.

### Secondary (MEDIUM confidence)
- Context7 `/apollographql/apollo-client` — React Apollo `useQuery`/`useMutation`, cache.modify, normalized cache patterns.
- Context7 `/remix-run/react-router` — React Router v7 library mode, useParams, nested routes.
- Context7 `/dotansimha/graphql-code-generator` — TypeScript React Apollo codegen configuration.
- Context7 `/websites/tailwindcss_installation_using-vite` — Tailwind v4 Vite CSS-first setup.
- Context7 `/vitest-dev/vitest` — Vitest 4 React jsdom configuration.

### Tertiary (LOW confidence)
- webfetch `https://react.dev/blog/2024/12/05/react-19` — React 19 stable features and upgrade notes.
- webfetch `https://playwright.dev/docs/best-practices` — Playwright E2E testing best practices.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — versions are pinned in `package.json` and the project already builds/tests successfully.
- Architecture: MEDIUM — based on approved UI-SPECs and current code audit; some gaps are inferred from E2E test expectations.
- Pitfalls: MEDIUM — sourced from Context7 docs, React 19 release notes, and direct code inspection.

**Research date:** 2026-07-30
**Valid until:** 2026-08-30 (stable stack; refresh if React 19.1/20 or Apollo 4 stable ship)
