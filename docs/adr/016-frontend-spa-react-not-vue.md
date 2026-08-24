# ADR-016: Frontend SPA Implemented in React 19, Not Vue 3

## Status

accepted

Amends the frontend-framework aspects of [ADR-001](./001-monorepo-rails-api-vue-spa.md)
and [ADR-006](./006-vue-apollo-normalized-cache.md).

## Context

[ADR-001](./001-monorepo-rails-api-vue-spa.md) and [ADR-006](./006-vue-apollo-normalized-cache.md)
recorded a **Vue 3** SPA with `@vue/apollo-composable` and Pinia for UI state. That is
not what was built. The frontend under `app/frontend/` is a **React** application, and
has been for some time — [ADR-014](./014-dev-blog-engine.md) (2026-07-21) already refers
to the "React 19" frontend stack. The Vue decision was simply never carried through, and
the earlier ADRs were never corrected, leaving the record contradicting the code. This
ADR records the actual framework so the documentation matches reality.

Concrete evidence (`package.json`, `app/frontend/`):

- `react` / `react-dom` `^19`, `react-router-dom` `^7`, `@vitejs/plugin-react`.
- No `vue`, `vue-router`, `@vue/apollo-composable`, or `pinia` dependencies.
- GraphQL client is `@apollo/client` `^3.14` used through its **React** hooks
  (`ApolloProvider`, `useQuery`, `useMutation`), configured in
  `app/frontend/lib/graphql/apollo.ts`.
- App shell / routing in `app/frontend/App.tsx` (React Router); shared state via React
  Context (`AuthContext`, `ActiveGroupContext`, `ThemeContext`) — there is no Pinia.

## Decision

The SPA is **React 19 + Vite**, integrated via `vite_rails`, using `@apollo/client`'s
React bindings and React Router. Client-side state is held in **React state / Context**,
never duplicating server data that Apollo's normalized cache already owns. The auth
bearer token is stored in **`localStorage`** (key `bgg-night-token`) and attached via an
Apollo `setContext` link; see [ADR-015](./015-authentication-zero-rest-migration.md).

Everything else in ADR-001 and ADR-006 stands unchanged:

- ADR-001's monorepo, Rails 8 API-only, single-`/graphql`-surface, `vite_rails`, and
  single-Kamal-container decisions are unaffected — only "Vue" becomes "React".
- ADR-006's substantive decision — **Apollo Client 3.x with a normalized cache as the
  single source of truth for server data, never duplicated into client state** — stands.
  Only the Vue-specific binding (`@vue/apollo-composable`) and Pinia are replaced by
  Apollo's React hooks and React Context.

## Consequences

- The ADR record now matches the code; ADR-001 and ADR-006 carry correction banners
  pointing here.
- No code change — this ADR is documentation catching up to the implementation.
- The "never duplicate server data into client state" principle from ADR-006 continues
  to govern; it is framework-independent.
- Incidental "Vue frontend" phrasing remains in older ADRs (e.g. ADR-002, ADR-010) as
  historical prose; those decisions (Rails owns BGG; invitation tokens) do not depend on
  the framework name, and this ADR is the authoritative correction.

## Alternatives Considered

- **Retroactively rewrite ADR-001/006 to say "React"** — rejected: ADRs are immutable
  historical records; the convention here is to supersede/amend with a new ADR and add a
  correction banner, not to rewrite history.
- **Leave the drift** — rejected: the docs actively contradicted the code, which was the
  motivation for this ADR.

## References

- `package.json`, `app/frontend/App.tsx`, `app/frontend/lib/graphql/apollo.ts`
- `app/frontend/contexts/{AuthContext,ActiveGroupContext,ThemeContext}.tsx`
- Amends: [ADR-001](./001-monorepo-rails-api-vue-spa.md), [ADR-006](./006-vue-apollo-normalized-cache.md)
- Related: [ADR-014](./014-dev-blog-engine.md) (already references React 19), [ADR-015](./015-authentication-zero-rest-migration.md) (token in localStorage)
