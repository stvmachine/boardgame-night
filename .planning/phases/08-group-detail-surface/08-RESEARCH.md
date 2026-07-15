# Phase 8: Group Detail Surface - Research

**Researched:** 2026-07-15
**Domain:** Rails 8 API-only + Vue 3 SPA monorepo, GraphQL, Tailwind v4 / Material 3, boardgame-night group hub
**Confidence:** HIGH (existing codebase and project docs are primary sources; official docs corroborated for Apollo, Tailwind, and GraphQL patterns)

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** On desktop, use a full-width group header above a wide main column and a narrower management side rail. Upcoming sessions and the shared-collection spotlight belong in the main column; members and invite controls belong in the side rail.
- **D-02:** On mobile, stack content in this order: group header, upcoming sessions, shared-collection spotlight, members, invite controls.
- **D-03:** The existing owner/admin-only **Create a night** action appears in the header. It is right-aligned beside the title on desktop and becomes a prominent full-width button below the description on mobile. Do not broaden creation permissions.
- **D-04:** Keep the members/invite side rail sticky on desktop while the main column scrolls. The responsive implementation must stop sticky behavior before the rail can overflow or obscure content on smaller viewports.
- **D-05:** Use a role-aware active list. All group members see `invited` and `picking` sessions; owners/admins additionally see `draft` sessions. Exclude `completed` and `cancelled` sessions. An undated draft displays **Date TBD**.
- **D-06:** Order sessions with any `picking` session first, then invited sessions by `scheduledAt` ascending, and undated drafts last. Ordering must be deterministic.
- **D-07:** Make the whole session row navigate to the existing `/s/:id` route. Include a trailing state-aware CTA, such as **Choose a game** for `picking` and **View details** for other visible states.
- **D-08:** Use a role-aware empty state. Owners/admins see **Plan your first game night** with a create action; ordinary members see a neutral **No nights planned yet** message without an unauthorized control.
- **D-09:** Select exactly four spotlight games deterministically by owner count descending, then BGG rating descending, then game name ascending. This should emphasize games shared by the most group members.
- **D-10:** If fewer than four games have multiple owners, fill the remaining slots with the highest-rated single-owner games. Show an empty state only when the group collection itself has no games.
- **D-11:** Use compact spotlight cards rather than the full Collection `GameCard`: thumbnail, title, rating badge, and an owner stack capped at three avatars plus a `+N` overflow count.
- **D-12:** **Browse Library** navigates to the single Collection surface in group-scoped mode: `/collection?group=<inviteCode>`. Do not create a duplicate full-library page inside Group Detail. Phase 9 should preserve this URL contract when redesigning CollectionView.
- **D-13:** Only group owners and admins can see or copy the reusable group invite link. This matches the existing invite authorization boundary.
- **D-14:** Show a per-member action menu only when the current user has an authorized action for that row. Owners may change non-owner roles and remove non-owners; admins may remove non-owners; ordinary members and protected owner rows show no empty or disabled menu.
- **D-15:** Preserve inline member-removal confirmation. Expanding the row must name the member, explain that their games leave the shared collection, and provide explicit **Remove** and **Cancel** controls. Do not replace this with a modal dialog.
- **D-16:** Use one combined **Invite people** card in the side rail. Put the reusable invite-link field and copy control first, then retain the existing email and role invitation form below with clear visual separation.

### Agent's Discretion

- Exact desktop column ratio, maximum content width, sticky offset, breakpoints, spacing, and skeleton composition, provided D-01 through D-04 remain intact.
- Exact date/time formatting, row density, and state-aware CTA wording for sessions.
- Spotlight-card click behavior and image fallback treatment; **Browse Library** behavior is locked by D-12.
- Copy-success presentation and duration, mutation loading/error feedback, and Apollo cache-update details.

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope.

</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| GROUP-07 | Group Detail page displays group header (name, member count badge, description, "Create a night" button) | Reuse `GroupType` with `name`, `description`, `memberships`; derive member count from `memberships.length`; reuse `createNightSession` mutation with owner/admin gate; new responsive header component. |
| GROUP-08 | Group Detail page displays upcoming sessions list (date blocks, status badges, session titles, time, attendee counts) | Add `sessions` field to `GroupType`; filter by role-aware states; sort by picking → invited → drafts; format dates with `@vueuse/core` or `Intl.DateTimeFormat`; navigate rows to `/s/:id`. |
| GROUP-09 | Group Detail page displays a shared collection spotlight (4-game preview grid with owner attribution + "Browse Library" link) | Add `collectionSpotlight(limit: Int)` field to `GroupType`; SQL order by owner-count DESC, `average` DESC, `name` ASC; use compact cards with `AvatarGroup` and `AvatarGroupCount`; link to `/collection?group=<inviteCode>`. |
| GROUP-10 | Group Detail page displays a members panel with avatars, names, roles, and a per-member action menu | Reuse `MemberList` logic; restyle with M3 primitives and `DropdownMenu`; preserve inline remove confirmation; role change and remove reuse existing mutations. |
| GROUP-11 | Group Detail page displays an invite link with copy-to-clipboard button | Reuse `InviteLink` component; restyle as combined invite card with `Input` + icon `Button` for copy; keep email/role invite form below. |

</phase_requirements>

## Summary

Phase 8 reskins the existing `GroupDetail.vue` into a responsive "Tabletop Social" group hub. The work is a vertical UI slice: it reuses the already-built group model, membership authorization, session lifecycle, and invite flow, but changes the GraphQL read shape, component decomposition, and responsive layout. The key technical decisions are: (1) replace the full `group.collection` fetch with a bounded query that adds `Group.sessions` and `Group.collectionSpotlight(limit: 4)`; (2) keep backend authorization intact while driving the UI role gates from `myRole`; (3) decompose the page into a header, a main column (sessions + spotlight), and a sticky side rail (members + invite); and (4) use the existing Phase 5 M3 primitives (`Card`, `Badge`, `Button`, `Avatar`, `Icon`, `Skeleton`, `Input`, `DropdownMenu`) instead of hard-coded Tailwind colors.

The backend change is small but performance-critical. The existing `GroupType` already loads the full merged collection, which is a known N+1 risk. The new hub must avoid that trap by fetching a curated spotlight only, and by eager-loading sessions and attendances. The sessions list must be role-aware and deterministically sorted, and the spotlight must sort by SQL-computed owner count. The frontend must then use Apollo cache-update callbacks (or a deliberate `refetchQueries` fallback) so that creating a session or removing a member updates the hub without a manual refresh.

**Primary recommendation:** Extend `GroupType` with a `sessions` field and a `collectionSpotlight(limit: Int)` field, rewrite the `group.graphql` query to a bounded hub shape, split `GroupDetail.vue` into header/sessions/spotlight/members/invite subcomponents, and wire the side rail with `lg:sticky top-6 self-start`. No new external dependencies are required.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Group hub layout & responsive order | Browser / Client | — | DOM order and CSS grid determine the mobile/desktop layout; no server rendering. |
| Role-aware session visibility & ordering | API / Backend | Browser / Client | The backend owns the authoritative role check and deterministic sort; the client only mirrors it for UI gating. |
| Shared collection spotlight selection | API / Backend | — | Owner-count/rating sorting must run against the DB; the client only renders the curated preview. |
| Member management actions | API / Backend | Browser / Client | Backend enforces owner/admin authorization (existing mutations); client hides/disables unauthorized actions. |
| Invite link copy & email invite | Browser / Client | API / Backend | Clipboard is client-side; email invite is server-side via existing mutation. |
| Apollo cache invalidation | Browser / Client | — | Client is responsible for normalizing mutation results and updating the `Group` cache. |

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Ruby on Rails | 8.1.3 [VERIFIED: Gemfile] | API-only framework | Project-mandated monorepo backend; Solid Queue/Cache built in. |
| graphql-ruby | ~> 2.6 [VERIFIED: Gemfile] | GraphQL schema + Dataloader | Existing class-based schema; `GraphQL::Dataloader` is the project's N+1 solution. |
| Vue | 3.5.39 [VERIFIED: package.json] | SPA framework | Existing Composition API `<script setup>` codebase. |
| vue-router | 5.1.0 [VERIFIED: package.json] | SPA routing | `/g/:token`, `/s/:id`, and `/collection` routes already exist. |
| @apollo/client | 3.14.1 [VERIFIED: package.json] | GraphQL client + normalized cache | Apollo 3.x is the stable path with `@vue/apollo-composable`. |
| @vue/apollo-composable | 4.2.2 [VERIFIED: package.json] | Vue Composition API Apollo bindings | Existing `useQuery` / `useMutation` pattern. |
| Tailwind CSS | 4.3.2 [VERIFIED: package.json] | CSS-first utility framework | Phase 5 M3 tokens are defined in `@theme`. |
| reka-ui | 2.10.1 [VERIFIED: package.json] | Headless accessible primitives | Phase 5 shadcn-vue primitives are built on reka-ui. |
| class-variance-authority | 0.7.1 [VERIFIED: package.json] | Variant-driven component classes | Used by all `components/ui/*` primitives. |
| Pinia | 3.0.4 [VERIFIED: package.json] | UI-only state | UI state only (sidebar, filters); server data stays in Apollo. |
| @iconify/vue | 5.0.1 [VERIFIED: package.json] | Material Symbols icon wrapper | Existing `Icon` component loads symbols on demand. |
| @vueuse/core | 14.3.0 [VERIFIED: package.json] | Composition utilities | Candidate for `useDateFormat` and debounce. |

### Supporting

No new supporting libraries are required for this phase. All behavior can be built from the existing stack above.

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `GroupType.sessions` + `GroupType.collectionSpotlight` | Separate root queries `groupSessions` and `groupSpotlight` | More network round trips and more active queries to keep in sync. Adding fields to the existing `Group` type keeps the hub as a single cache object. |
| Apollo `update` callbacks | `refetchQueries: ['Group']` for every mutation | Simpler but extra network requests and stale-data risk on inactive queries. `update` is preferred for list mutations. |
| `lg:grid-cols-12` 8/4 split | 9/3 split | 9/3 gives more main-column space but makes the side rail narrow for the invite form. 8/4 is the recommended balance. |

**Installation:** none — reuse existing dependencies.

**Version verification:** N/A for this phase; no new packages are installed. Existing versions are pinned in `Gemfile` and `package.json`.

## Package Legitimacy Audit

No new external packages are installed in this phase. All implementation reuses libraries already present in `Gemfile` and `package.json`, which were vetted in earlier phases.

| Package | Registry | Age | Downloads | Source Repo | Verdict | Disposition |
|---------|----------|-----|-----------|-------------|---------|-------------|
| (none new) | — | — | — | — | — | — |

**Packages removed due to [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none

## Architecture Patterns

### System Architecture Diagram

```mermaid
flowchart LR
    A[Browser / Vue 3] -->|Apollo POST /graphql| B[Rails 8 API]
    B --> C[GraphQL Schema]
    C --> D[GroupType resolver]
    C --> E[NightSessionType]
    D --> F[(SQLite / PostgreSQL)]
    D --> G[Loaders::OwnersLoader]
    D --> H[Loaders::PollsLoader]
    E --> I[Suggestions::Engine]
    A --> J[/g/:token route]
    J --> K[GroupView.vue]
    K --> L[GroupDetail.vue]
    L --> M[GroupHeader]
    L --> N[GroupSessionsList]
    L --> O[GroupCollectionSpotlight]
    L --> P[GroupMembersPanel]
    L --> Q[InviteCard]
    N --> R[/s/:id route]
    O --> S[/collection?group=... route]
```

Data enters through the `/g/:token` route, is fetched by a single bounded `Group` query, and is distributed across the hub subcomponents. The sessions list navigates to the existing `/s/:id` route; the spotlight links to the existing `/collection` route with a `group` query parameter. Mutations flow back through Apollo, and the cache is updated surgically.

### Recommended Project Structure

```
app/
├── frontend/
│   ├── views/
│   │   └── GroupView.vue              # route wrapper, loading/error boundary
│   ├── components/group/
│   │   ├── GroupDetail.vue            # hub layout, composes subcomponents
│   │   ├── GroupHeader.vue            # name, member count, description, create action
│   │   ├── GroupSessionsList.vue      # role-aware ordered session rows
│   │   ├── GroupCollectionSpotlight.vue # 4-game preview grid
│   │   ├── GroupMembersPanel.vue      # member list + per-member action menu
│   │   └── InviteCard.vue             # combined invite-link copy + email invite
│   ├── apollo/queries/
│   │   └── group.graphql              # bounded hub query
│   └── composables/
│       └── useGroupDetail.ts          # optional: date formatting + role helpers
├── graphql/
│   └── types/
│       └── group_type.rb              # extended with sessions, collectionSpotlight
```

### Pattern 1: Bounded GraphQL Hub Query

**What:** The `Group` query no longer fetches the full merged collection. It requests only the fields the hub needs: header metadata, sessions, a 4-game spotlight, and memberships.

**When to use:** Any route-level view that only needs a curated subset of a large object graph.

**Example:**

```graphql
# Source: app/frontend/apollo/queries/group.graphql
query Group($token: String!) {
  group(token: $token) {
    id
    name
    description
    inviteCode
    myRole
    owner { id displayName }
    members { id displayName }
    memberships {
      id
      role
      user { id username displayName }
    }
    sessions {
      id
      title
      state
      scheduledAt
      attendeeCount
    }
    collectionSpotlight(limit: 4) {
      id
      name
      thumbnail
      average
      owners { bggUsername }
    }
  }
}
```

### Pattern 2: Eager-Loaded Group Resolver

**What:** The `group(token:)` root resolver loads the full group graph in one query so the `GroupType` field methods do not hit the database repeatedly.

**When to use:** When a GraphQL object exposes several nested associations (sessions, attendances, users, memberships).

**Example:**

```ruby
# Source: app/graphql/types/query_type.rb
def group(token:)
  Group.includes(
    :owner,
    { group_memberships: :user },
    { night_sessions: [:host, { attendances: :user }] }
  ).find_by(invite_code: token) ||
    context[:current_user]&.groups&.find_by(id: token)
end
```

### Pattern 3: Role-Aware Sessions Field

**What:** `GroupType.sessions` filters states by the current user's role and sorts deterministically.

**When to use:** When the same list must show different items to different viewers.

**Example:**

```ruby
# Source: app/graphql/types/group_type.rb
field :sessions, [Types::NightSessionType], null: false

def sessions
  visible = %w[invited picking]
  visible << "draft" if %w[owner admin].include?(my_role&.downcase)

  object.night_sessions
    .select { |s| visible.include?(s.state) }
    .sort_by do |s|
      state_order = { "picking" => 0, "invited" => 1, "draft" => 2 }[s.state] || 3
      date_key = if s.state == "draft" && s.scheduled_at.nil?
                   Time.at(999_999_999)
                 else
                   s.scheduled_at || Time.at(0)
                 end
      [state_order, date_key, s.created_at]
    end
end
```

### Pattern 4: Collection Spotlight by Owner Count

**What:** A SQL query selects the top N games from the merged collection, ordered by how many members own the game, then by BGG rating, then by name.

**When to use:** When a preview must emphasize social ownership.

**Example:**

```ruby
# Source: app/graphql/types/group_type.rb
field :collection_spotlight, [Types::MergedThingType], null: false do
  argument :limit, Integer, required: false, default_value: 4
end

def collection_spotlight(limit: 4)
  member_ids = object.group_memberships.map(&:user_id)
  return [] if member_ids.empty?

  BggThing
    .select("bgg_things.*, COUNT(bgg_collections.id) AS owner_count")
    .joins(:bgg_collections)
    .where(bgg_collections: { user_id: member_ids })
    .group("bgg_things.id")
    .order("owner_count DESC, average DESC, name ASC")
    .limit(limit)
end
```

### Pattern 5: Responsive Sticky Side Rail

**What:** A two-column grid on desktop places the management rail in a sticky container; on mobile the DOM order governs the stacked layout.

**When to use:** When management controls must remain accessible while a long main column scrolls.

**Example:**

```vue
<!-- Source: app/frontend/components/group/GroupDetail.vue -->
<div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
  <div class="lg:col-span-8 space-y-6">
    <GroupSessionsList />
    <GroupCollectionSpotlight />
  </div>
  <aside class="lg:col-span-4 space-y-6 lg:sticky lg:top-6 lg:self-start">
    <GroupMembersPanel />
    <InviteCard />
  </aside>
</div>
```

### Pattern 6: Apollo Cache Update for List Mutations

**What:** After creating a session, append the new session reference to the cached `Group.sessions` array with `cache.modify`. After removing a member, filter the `Group.memberships` array.

**When to use:** When a mutation adds or removes an item from a list owned by a parent object in the cache.

**Example:**

```typescript
// Source: app/frontend/components/group/GroupDetail.vue
import { useCreateNightSessionMutation } from '@/generated/operations'

const { mutate: createSession } = useCreateNightSessionMutation({
  update(cache, { data }) {
    const session = data?.createNightSession?.session
    if (!session) return

    cache.modify({
      id: cache.identify({ __typename: 'Group', id: props.group.id }),
      fields: {
        sessions(existing = []) {
          const newRef = cache.writeFragment({
            data: session,
            fragment: gql`fragment NewSession on NightSession { id title state scheduledAt attendeeCount }`
          })
          return [...existing, newRef]
        }
      }
    })
  }
})
```

### Anti-Patterns to Avoid

- **Fetching `group.collection` for the hub:** The full merged collection can be hundreds of games. The hub only needs four spotlight games and a link to the full collection view.
- **Client-side session filtering:** Do not filter `draft` sessions in the Vue component. The backend must enforce role-aware visibility so a tampered client cannot reveal drafts.
- **Client-side-only authorization:** Hiding the member action menu from non-owners is necessary for UX, but the backend mutations already enforce the real authorization. Do not rely on UI hiding alone.
- **Hard-coded neutral/indigo colors:** All colors must come from the M3 token palette in `app/frontend/entrypoints/styles.css` (e.g., `bg-surface-container`, `text-on-surface`, `border-outline`).
- **Returning the full owner list on spotlight cards:** Cap the rendered owner stack at three avatars plus a `+N` count; do not render every owner.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| GraphQL client-side cache updates | Custom Pinia store for groups/sessions | Apollo `InMemoryCache` + `update` callbacks | Apollo normalization is the project's single source of truth for server data. Duplicating it in Pinia creates stale-data bugs. |
| Date/time formatting | Custom parser/format string | `@vueuse/core` `useDateFormat` or `Intl.DateTimeFormat` | Well-tested, locale-aware, and consistent with existing `@vueuse/core` usage. |
| Sticky responsive layout | JavaScript scroll listener | Tailwind `lg:sticky` + `self-start` | CSS-only, performant, and matches the design system. |
| Member avatar color hashing | New palette generator | `useMemberColor` composable | Already deterministic and mapped to M3 tokens. |
| Dropdown action menu | Custom `<div>` menu | shadcn-vue `DropdownMenu` primitive | Built-in keyboard navigation, focus management, and accessibility. |
| Session state badge | Inline colored span | `<Badge variant="draft|invited|picking|completed">` | M3 semantic badge variants are already defined. |

**Key insight:** The phase is a reskin and recomposition of existing data and mutations. The value is in the UX, not in reinventing GraphQL, caching, or accessible primitives.

## Common Pitfalls

### Pitfall 1: N+1 Queries on the Group Hub

**What goes wrong:** A single Group Detail request triggers one query per session host, one per attendance, one per member avatar, and one per collection item owner. On a group with 10 members and 50 games this can exceed 100 queries.

**Why it happens:** The existing `GroupType` resolves `memberships` and `collection` independently, and `NightSessionType` computes `attendee_count` with `where(...).count` per session.

**How to avoid:** Eager load the whole graph in `QueryType#group` with `includes(:owner, { group_memberships: :user }, { night_sessions: [:host, { attendances: :user }] })`. Change `NightSessionType#attendee_count` to use loaded records when available: `object.association(:attendances).loaded? ? object.attendances.count { |a| a.response == "going" } : object.attendances.where(response: "going").count`. Run `Bullet` in development and ensure zero N+1 warnings.

**Warning signs:** Rails log shows 30+ SQL queries for one Group Detail request; page load time scales linearly with member count.

### Pitfall 2: Over-Fetching the Merged Collection

**What goes wrong:** The new Group Detail page still requests the full `collection` field, causing slow first paint and large JSON payloads even though the hub only displays four games.

**Why it happens:** The existing `group.graphql` requests `collection { items { ... } }`, and the component expects `allGames` from it.

**How to avoid:** Remove the `collection` selection from the hub query. Add `collectionSpotlight(limit: Int)` to `GroupType` and request only that. The full collection remains available on `/collection` via `mergedCollection` or the existing `group.collection` if ever needed.

**Warning signs:** Group Detail shows all 200+ games in a grid; Lighthouse reports large payload; GraphQL response is >100 KB.

### Pitfall 3: Stale Data After Mutations

**What goes wrong:** After creating a session or removing a member, the hub still shows the old state until the user refreshes.

**Why it happens:** Apollo does not automatically update parent list fields when a mutation returns a new or removed child object. The `removeGroupMember` mutation currently returns only `{ success: true }`, giving Apollo no normalized object to update.

**How to avoid:** For `createNightSession`, use an `update` callback to append the returned session to `Group.sessions`. For `removeGroupMember`, either extend the payload to return the removed `membership` id and filter it from `Group.memberships` with `cache.modify`, or use `refetchQueries: ['Group']` as a fallback since the Group query is active on this page. For `updateGroupMemberRole`, the mutation already returns the full `membership`, so Apollo normalizes it automatically.

**Warning signs:** New session does not appear in the list; removed member still appears; role change does not reflect until refresh.

### Pitfall 4: Wrong Mobile Content Order

**What goes wrong:** On mobile, the members/invite rail appears before the sessions or spotlight, violating D-02.

**Why it happens:** A grid layout that reorders columns visually (e.g., `order-*`) without changing DOM order can break accessibility, screen-reader reading order, and sticky behavior.

**How to avoid:** Use the DOM order `header → sessions → spotlight → members → invite`, and rely on a desktop grid to place the rail to the right. The mobile stack will then match the DOM order automatically.

**Warning signs:** Mobile view shows members before upcoming nights; tab order differs from visual order; sticky rail covers content on smaller screens.

### Pitfall 5: Spotlight Ordering Does Not Match Spec

**What goes wrong:** Spotlight games appear in arbitrary order, or games with no owners are included, or single-owner games appear before multi-owner games.

**Why it happens:** Sorting is done in memory after loading everything, or the SQL `ORDER BY` omits owner count.

**How to avoid:** Compute owner count in SQL: `select("bgg_things.*, COUNT(bgg_collections.id) AS owner_count")` grouped by `bgg_things.id`, then `order("owner_count DESC, average DESC, name ASC")`. Use `LIMIT 4` in SQL. The frontend only renders the returned order.

**Warning signs:** Two-owner games appear below single-owner games; empty placeholders appear for games with no group owners.

### Pitfall 6: Hard-Coded Tailwind Colors

**What goes wrong:** New components use `bg-indigo-600`, `text-neutral-500`, or other non-token colors, causing dark-mode drift and breaking the M3 contract.

**Why it happens:** Developers copy old v1.0 component class strings without mapping them to the new token system.

**How to avoid:** Use Phase 5 primitives and token classes: `bg-primary`, `bg-surface-container`, `text-on-surface`, `border-outline`, `text-on-surface-variant`, etc. Run a grep for hex values outside the theme file as a verification step.

**Warning signs:** Cards have a different background from the sidebar in dark mode; status badges use non-semantic colors.

## Code Examples

### Bounded Group Query

```graphql
# Source: app/frontend/apollo/queries/group.graphql
query Group($token: String!) {
  group(token: $token) {
    id
    name
    description
    inviteCode
    myRole
    owner { id displayName }
    members { id displayName }
    memberships {
      id
      role
      user { id username displayName }
    }
    sessions {
      id
      title
      state
      scheduledAt
      attendeeCount
    }
    collectionSpotlight(limit: 4) {
      id
      name
      thumbnail
      average
      owners { bggUsername }
    }
  }
}
```

### GroupType Extensions

```ruby
# Source: app/graphql/types/group_type.rb
module Types
  class GroupType < Types::BaseObject
    field :id, ID, null: false
    field :name, String, null: false
    field :description, String, null: true
    field :invite_code, String, null: true
    field :owner, Types::UserType, null: false
    field :members, [Types::UserType], null: false
    field :memberships, [Types::GroupMembershipType], null: false
    field :my_role, Types::GroupRoleEnum, null: true
    field :sessions, [Types::NightSessionType], null: false
    field :collection_spotlight, [Types::MergedThingType], null: false do
      argument :limit, Integer, required: false, default_value: 4
    end

    def sessions
      visible = %w[invited picking]
      visible << "draft" if %w[owner admin].include?(my_role&.downcase)

      object.night_sessions
        .select { |s| visible.include?(s.state) }
        .sort_by do |s|
          state_order = { "picking" => 0, "invited" => 1, "draft" => 2 }[s.state] || 3
          date_key = if s.state == "draft" && s.scheduled_at.nil?
                       Time.at(999_999_999)
                     else
                       s.scheduled_at || Time.at(0)
                     end
          [state_order, date_key, s.created_at]
        end
    end

    def collection_spotlight(limit: 4)
      member_ids = object.group_memberships.map(&:user_id)
      return [] if member_ids.empty?

      BggThing
        .select("bgg_things.*, COUNT(bgg_collections.id) AS owner_count")
        .joins(:bgg_collections)
        .where(bgg_collections: { user_id: member_ids })
        .group("bgg_things.id")
        .order("owner_count DESC, average DESC, name ASC")
        .limit(limit)
    end

    def my_role
      @my_role ||= object.group_memberships
        .find { |m| m.user_id == context[:current_user]&.id }
        &.role&.upcase
    end

    def memberships
      object.group_memberships.includes(:user).to_a
    end
  end
end
```

### Responsive Hub Layout

```vue
<!-- Source: app/frontend/components/group/GroupDetail.vue -->
<script setup lang="ts">
import type { Group } from '@/generated/types'
import GroupHeader from './GroupHeader.vue'
import GroupSessionsList from './GroupSessionsList.vue'
import GroupCollectionSpotlight from './GroupCollectionSpotlight.vue'
import GroupMembersPanel from './GroupMembersPanel.vue'
import InviteCard from './InviteCard.vue'

interface Props {
  group: Group
  loading?: boolean
}

withDefaults(defineProps<Props>(), { loading: false })
</script>

<template>
  <div class="space-y-6">
    <GroupHeader :group="group" />

    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <div class="lg:col-span-8 space-y-6">
        <GroupSessionsList :sessions="group.sessions" :group="group" />
        <GroupCollectionSpotlight :games="group.collectionSpotlight" :group="group" />
      </div>

      <aside class="lg:col-span-4 space-y-6 lg:sticky lg:top-6 lg:self-start">
        <GroupMembersPanel :memberships="group.memberships" :group="group" />
        <InviteCard v-if="group.myRole === 'OWNER' || group.myRole === 'ADMIN'" :group="group" />
      </aside>
    </div>
  </div>
</template>
```

### Compact Spotlight Card

```vue
<!-- Source: app/frontend/components/group/GroupCollectionSpotlight.vue -->
<script setup lang="ts">
import { computed } from 'vue'
import type { Group, MergedThing } from '@/generated/types'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { AvatarGroup, AvatarGroupCount } from '@/components/ui/avatar'
import { useMemberColor } from '@/composables/useMemberColor'

interface Props {
  games: MergedThing[]
  group: Group
}

const props = defineProps<Props>()

const visibleOwners = (game: MergedThing) => game.owners.slice(0, 3)
const overflow = (game: MergedThing) => Math.max(0, game.owners.length - 3)
</script>

<template>
  <Card>
    <CardContent class="p-4">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-lg font-semibold text-on-surface">Shared collection spotlight</h2>
        <RouterLink
          :to="`/collection?group=${group.inviteCode}`"
          class="text-sm text-primary hover:underline"
        >
          Browse Library
        </RouterLink>
      </div>

      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div
          v-for="game in games"
          :key="game.id"
          class="group cursor-pointer"
        >
          <div class="aspect-[4/3] rounded-lg bg-surface-variant overflow-hidden">
            <img
              v-if="game.thumbnail"
              :src="game.thumbnail"
              :alt="game.name"
              class="w-full h-full object-cover"
            />
            <div v-else class="w-full h-full flex items-center justify-center text-on-surface-variant text-sm">
              No image
            </div>
          </div>
          <h3 class="mt-2 text-sm font-medium line-clamp-2 text-on-surface">{{ game.name }}</h3>
          <Badge v-if="game.average" variant="invited" class="mt-1">{{ game.average.toFixed(1) }}</Badge>
          <AvatarGroup class="mt-2">
            <Avatar
              v-for="owner in visibleOwners(game)"
              :key="owner.bggUsername"
              :class="useMemberColor(owner.bggUsername)"
              class="h-5 w-5 text-[10px]"
            >
              <AvatarFallback>{{ owner.bggUsername.charAt(0).toUpperCase() }}</AvatarFallback>
            </Avatar>
            <AvatarGroupCount v-if="overflow(game) > 0">+{{ overflow(game) }}</AvatarGroupCount>
          </AvatarGroup>
        </div>
      </div>
    </CardContent>
  </Card>
</template>
```

### Create-Session Cache Update

```typescript
// Source: app/frontend/components/group/GroupHeader.vue
import { gql } from '@apollo/client'
import { useCreateNightSessionMutation } from '@/generated/operations'

const props = defineProps<{ group: Group }>()

const { mutate: createSession } = useCreateNightSessionMutation({
  update(cache, { data }) {
    const session = data?.createNightSession?.session
    if (!session) return

    cache.modify({
      id: cache.identify({ __typename: 'Group', id: props.group.id }),
      fields: {
        sessions(existing = []) {
          const newRef = cache.writeFragment({
            data: session,
            fragment: gql`
              fragment NewSession on NightSession {
                id
                title
                state
                scheduledAt
                attendeeCount
              }
            `
          })
          return [...existing, newRef]
        }
      }
    })
  }
})
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Full `group.collection` on Group Detail | Bounded `collectionSpotlight(limit: 4)` + `sessions` | Phase 8 | Reduces first-paint payload and prevents N+1 for large groups. |
| Inline SVG icons / custom color classes | Phase 5 M3 primitives and tokens | Phase 5 | Consistent dark-mode-safe styling and accessibility. |
| Custom `MemberAvatar` only | shadcn-vue `Avatar` + `AvatarGroup` + `useMemberColor` | Phase 5 | Reusable, accessible avatar stacks with deterministic colors. |
| Promise-based `graphql-batch` (legacy) | `GraphQL::Dataloader` | Phase 1/3 | Fiber-based batch loading is the graphql-ruby standard. |

**Deprecated/outdated:**
- `MemberAvatar.vue` standalone color palette: replaced by tokenized `Avatar` primitive + `useMemberColor`.
- Hard-coded Tailwind neutral/indigo classes: replaced by M3 semantic tokens.
- `refetchQueries` as primary mutation update strategy: prefer `update` callbacks with `cache.modify` for list mutations.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `GroupType` can be extended with new fields `sessions` and `collectionSpotlight` without breaking existing queries because new fields are nullable or have default arguments. | Standard Stack / Architecture | If a new field is accidentally non-nullable or conflicts with an existing client query, codegen or runtime queries can break. Mitigation: keep new fields nullable and run `bin/rails graphql:schema:dump` + `npm run codegen`. |
| A2 | `useMemberColor` returns a single class string that is compatible with the new `AvatarFallback` slot. | Code Examples | If `AvatarFallback` already applies conflicting classes, the color may not apply. Mitigation: pass the color class to `Avatar` or `AvatarFallback` and verify in the browser. |
| A3 | `AvatarGroup` and `AvatarGroupCount` primitives from Phase 5 work with the desired max-three-avatars + overflow pattern. | Code Examples | The existing `AvatarGroupCount` does not auto-limit; the component must slice owners itself. The code example shows this. |
| A4 | `object.group_memberships` is loaded by the eager-loaded `group(token:)` resolver, so `my_role` and `collection_spotlight` do not perform extra member queries. | Architecture Patterns | If the eager load is omitted or the association is not loaded, `my_role` falls back to `find` which still works but is less efficient. Verify with Bullet. |
| A5 | `BggThing.average` is the correct BGG rating field for spotlight sorting per D-09. | Architecture Patterns | The spec says "BGG rating" which could mean `average` or `bayes_average`. The codebase currently displays `average` in `GameCard`. If `bayes_average` is preferred, the query must change. |

**If this table is empty:** Not applicable — assumptions are listed above.

## Open Questions

1. **Spotlight rating tie-breaker**
   - What we know: D-09 says sort by owner count descending, then BGG rating descending, then name ascending. The codebase exposes both `average` and `bayes_average` on `MergedThing`.
   - What's unclear: Whether "BGG rating" in D-09 means `average` (raw community average) or `bayes_average` (BGG's Bayesian average).
   - Recommendation: Use `average` to match the existing `GameCard` rating badge. If the product wants `bayes_average`, change the SQL order and the spotlight card badge source.

2. **Session CTA wording for invited members**
   - What we know: D-07 says "Choose a game" for `picking` and "View details" for other visible states.
   - What's unclear: Whether invited sessions should show "RSVP" or "View details" for members who have not yet responded.
   - Recommendation: Use "View details" for all non-`picking` visible states; the session detail page handles RSVP. This keeps the row CTA simple and avoids duplicating RSVP state logic.

3. **Spotlight card click behavior**
   - What we know: The agent has discretion over this per CONTEXT.md.
   - What's unclear: Whether clicking a spotlight card should open the BGG page (like `GameCard`) or navigate to the game's entry in the group collection.
   - Recommendation: Open the BGG page in a new tab to match the existing `GameCard` behavior, and let the "Browse Library" link handle collection navigation. Document this decision in the plan if the product prefers collection navigation.

4. **Cache update for `removeGroupMember`**
   - What we know: The mutation currently returns only `{ success: true }`.
   - What's unclear: Whether to extend the mutation payload to return the removed membership id (cleanest) or rely on `refetchQueries: ['Group']` (simpler).
   - Recommendation: Extend the payload to return `membership: GroupMembership` or `removedMembershipId: ID` so the frontend can use `cache.modify` to filter the list. This aligns with the project's anti-`refetchQueries` pitfall guidance.

## Environment Availability

Step 2.6: SKIPPED — this phase is purely code/config changes against the existing Rails/Vue monorepo. No new external tools, services, runtimes, or CLIs are required beyond the stack already installed in the project.

## Validation Architecture

Skipped because `workflow.nyquist_validation` is explicitly set to `false` in `.planning/config.json`.

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | No | Existing Bearer token auth is unchanged; no new auth flows. |
| V3 Session Management | No | Existing session model is unchanged. |
| V4 Access Control | Yes | Backend mutations (`removeGroupMember`, `updateGroupMemberRole`, `createNightSession`) already enforce owner/admin checks. The UI must mirror them with `myRole` gating but must never rely on UI hiding alone. |
| V5 Input Validation | Yes | `collectionSpotlight(limit:)` argument should be clamped to a reasonable range (e.g., 1–12) to prevent abuse. The invite email form uses the existing `InviteToGroupContract`. |
| V6 Cryptography | No | No new cryptography. |
| V10 Malicious Code | No | No new code-execution paths. |
| V13 API / Web Service | Yes | GraphQL query shape changes must keep new fields nullable and avoid breaking existing clients. Introspection is already disabled in production. |

### Known Threat Patterns for the Stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Member removal by non-admin | Elevation of privilege | Backend `removeGroupMember` checks `caller_membership.role` before destroying. |
| Role change by non-owner | Tampering | Backend `updateGroupMemberRole` requires the caller's role to be `owner`. |
| Draft session leakage to ordinary members | Information disclosure | Backend `GroupType.sessions` filters `draft` states based on role. |
| Large `limit` argument on `collectionSpotlight` | Denial of service | Clamp `limit` to ≤ 12 in the resolver or argument definition. |
| GraphQL schema break | Tampering | Keep new fields nullable; run schema dump + codegen diff in CI. |

## Sources

### Primary (HIGH confidence)

- **Existing codebase (inspected 2026-07-15):** `app/frontend/views/GroupView.vue`, `app/frontend/components/group/GroupDetail.vue`, `MemberList.vue`, `InviteLink.vue`, `app/frontend/components/collection/GameCard.vue`, `GameGrid.vue`, `app/frontend/apollo/queries/group.graphql`, `app/frontend/components/ui/*`, `app/frontend/entrypoints/styles.css`, `app/graphql/types/group_type.rb`, `app/graphql/types/night_session_type.rb`, `app/graphql/types/query_type.rb`, `app/models/group.rb`, `app/models/night_session.rb`, `app/services/suggestions/engine.rb`, `app/graphql/loaders/owners_loader.rb`, `app/graphql/loaders/polls_loader.rb`.
- **Phase 8 Context (user decisions):** `.planning/phases/08-group-detail-surface/08-CONTEXT.md` — D-01 through D-16.
- **Phase 4 Context (authorization and lifecycle):** `.planning/phases/04-auth-friend-groups-session-lifecycle/04-CONTEXT.md` — roles, invite flow, session state machine.
- **Phase 5 Context & UI-SPEC:** `.planning/phases/05-design-system-foundation/05-CONTEXT.md` and `05-UI-SPEC.md` — M3 tokens, primitives, layout shell, badge/avatar/card specs.
- **Milestone research:** `.planning/research/FEATURES.md`, `.planning/research/PITFALLS.md`, `.planning/research/ARCHITECTURE.md` — Group Detail surface expectations, N+1 pitfall, Apollo cache pitfall, design system patterns.

### Secondary (MEDIUM confidence)

- **Apollo Client mutations and cache updates:** `https://www.apollographql.com/docs/react/data/mutations` (fetched 2026-07-15) — `update` callback, `cache.modify`, `cache.writeFragment`. [CITED: apollographql.com]
- **GraphQL::Dataloader overview:** `https://graphql-ruby.org/dataloader/overview.html` (fetched 2026-07-15) — batch loading with `GraphQL::Dataloader::Source`. [CITED: graphql-ruby.org]
- **Tailwind v4 sticky positioning:** `https://tailwindcss.com/docs/position` (fetched 2026-07-15) — `sticky` utility and responsive variants. [CITED: tailwindcss.com]
- **GraphQL schema design:** `https://graphql.org/learn/schema-design/` (project knowledge) — add-only evolution, nullable new fields, deprecation. [CITED: graphql.org]

### Tertiary (LOW confidence)

- **Material 3 dashboard patterns:** Inferred from `05-UI-SPEC.md` and general M3 documentation; no live external doc fetch succeeded for the component pages. [ASSUMED]

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — versions are pinned in `Gemfile`/`package.json` and inspected directly.
- Architecture: HIGH — derived from existing code, ADRs, and phase context; GraphQL/Apollo patterns corroborated by official docs.
- Pitfalls: HIGH — PITFALLS.md already identified N+1 and Apollo cache risks; code inspection confirmed they are present in the current Group Detail resolver.

**Research date:** 2026-07-15
**Valid until:** 2026-08-15 (stable stack; revisit only if Apollo 4 binding, Tailwind v5, or Rails 9 changes the project's direction)
