# Feature Research

**Domain:** Boardgame collection sharing + boardgame-night organizing (BGG-backed, group-focused)
**Researched:** 2026-07-13
**Confidence:** HIGH (existing codebase + BGG schema + Material Symbols docs); MEDIUM (Material 3 component specifics — some pages blocked, corroborated via Google dev docs + design system references); MEDIUM (competitor UX patterns — corroborated across 6+ organizers)

## Feature Landscape

This research focuses on the **v1.1 milestone**: a full UI reskin to the "Tabletop Social" Stitch design system and a new **poll-based game suggestion engine**. Everything built in v1.0 (collection merge, search/filter/sort/group, auth, friend groups, session lifecycle) is now table stakes — the reskin must not break it, and the suggestion engine builds on top of it.

The two new surfaces to reason about are:

1. **Design system migration** — replacing the current Tailwind-neutral shell with a Material 3 tonal system (Inter, indigo, Material Symbols, 280px sidebar, rounded-xl cards, badges, skeletons). This is a cross-cutting reskin, not a feature in itself, but it dictates component choices for every new screen.
2. **Poll-based suggestion engine** — the headline differentiator. The current `GamePicker` only filters by `minPlayers ≤ attendee_count ≤ maxPlayers`. v1.1 replaces that crude range check with BGG community poll data (Best/Recommended/Not Recommended per player count) to compute a weighted, explainable suitability score for each candidate game.

### Table Stakes (Preserved from v1.0)

These already exist; the redesign must preserve them without regression. They are not re-researched here, only listed as dependencies for the new work.

| Feature | Why Preserved | Complexity | Notes |
|---------|---------------|------------|-------|
| N-user BGG collection merge | Core value prop | M | Already in `BggThing.merged_for_users`; redesign must keep the same data shape. |
| Search/filter/sort/group | Users expect parity with v1 | M | Fuse.js search, player/time/complexity filters, sort, collapsible grouping. |
| Hot/trending games | Landing hook | S | `hotItems` GraphQL query. |
| Permalinks | Shareability | S | URL state sync + copy-to-clipboard. |
| Auth + friend groups + magic-link sessions | Foundation for suggestions | L | Models `User`, `Group`, `GroupMembership`, `InviteToken`, `NightSession`, `Attendance` already exist. |
| Binary RSVP | Required for attendee count | S | 4-state RSVP is v1.2; v1.1 stays binary. |
| Manual game picking | Fallback for suggestions | S | Current `pickGame` mutation + `GamePicker`. |
| Responsive layout | Must work on phones | M | Current `AppShell` with `Sidebar`/`MobileDrawer`; redesign keeps 280px sidebar. |

### Differentiators (New in v1.1)

Features that set the v1.1 release apart. These are the priority investments.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Material 3 "Tabletop Social" design system** | Cohesive, modern UI that makes the app feel like a finished social product rather than a dev tool. | M | Inter font, indigo tonal palette, Material Symbols, 280px sidebar, rounded-xl cards, status badges, skeleton loaders. |
| **App shell redesign** | Persistent sidebar nav with clear primary action (New Session), status-aware icons, Settings/Logout. | M | Replace top header + sidebar with a unified M3 navigation rail/drawer pattern. |
| **Home dashboard redesign** | First-run value is clearer: hero merge input + personal stats card + trending games. | M | Replace centered landing page with a dashboard layout. |
| **Collection view redesign** | Rich filter sidebar with range slider, segmented buttons, checkbox groups, rich cards, sort + grid/list toggle. | M | Current `CollectionFilters` is primitive; needs M3 slider, segmented buttons, and structured sections. |
| **Group Detail surface** | Persistent group hub: sessions list, members panel, shared collection spotlight, invite copy. | M | Current `GroupDetail.vue` is just members + grid; needs session timeline and collection preview. |
| **Picking a Game redesign** | Session header with status badge, attendee-aware suggestions, "Pick this game" cards. | M | Current `GamePicker` filters by player count only; redesign is the gateway to the suggestion engine. |
| **Poll-based suggestion engine** | Uses BGG community polls (Best/Recommended/Not Recommended) to score games for the exact attendee count. | L | Replaces `minPlayers/maxPlayers` range check with real community data. Biggest quality lever. |
| **Explainable shortlist** | Each suggestion tells the user *why* it fits: player-count fit, time fit, complexity, rating, ownership. | M | Builds trust and differentiates from black-box AI recommenders. |
| **BGG-poll "best player count" grouping** | Replace v1's heuristic grouping with real community "Best at N" data. | M | Depends on polls being parsed and stored. |

### Anti-Features (Do Not Build in v1.1)

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| **AI/LLM re-ranking** | Trendy; competitors market it. | Opaque, adds latency/cost, no training data in a small group. | Deterministic poll-based scoring with explainable reasons. |
| **4-state RSVP in v1.1** | More nuanced than binary. | Expands session state machine and UI before suggestion engine is validated. | Ship binary for v1.1; add Maybe/Interested in v1.2. |
| **Ranked voting in v1.1** | Helps decide as a group. | Depends on suggestion shortlist being stable and used. | Defer to v1.2 after suggestion engine is validated. |
| **Play logging in v1.1** | Feeds "freshness" signal. | Requires new models and post-session UI; not needed for first suggestions. | Local play logging in v1.2. |
| **Server-side search in v1.1** | Fuse.js breaks at huge collections. | v1 friend groups are <300 games; Fuse.js is fine. | Move to Postgres `pg_trgm` only when collections grow. |
| **Native mobile app** | Some competitors are mobile-first. | Two-platform maintenance for a web-first MVP. | Responsive PWA. |

## Feature Dependencies

```
[Material 3 design system tokens]
    └──enables──> [App shell redesign]
    └──enables──> [Home dashboard redesign]
    └──enables──> [Collection view redesign]
    └──enables──> [Group Detail surface]
    └──enables──> [Picking a Game redesign]

[Existing v1.0 session lifecycle]
    └──requires──> [Auth + friend groups + binary RSVP]
    └──enables──> [Poll-based suggestion engine]
        └──requires──> [BGG poll data stored in bgg_things]
            └──requires──> [BGG XML thing normalizer parses <poll name="suggested_numplayers">]
        └──requires──> [Attendee count from NightSession.attendee_count]
        └──enables──> [Explainable shortlist]
            └──requires──> [Suggestion score breakdown returned by GraphQL]
        └──enables──> [BGG-poll best-player-count grouping]
            └──requires──> [Poll data available in collection queries]

[Group Detail surface]
    └──requires──> [Group sessions list query]
    └──requires──> [Shared collection spotlight query]
    └──requires──> [Member management mutations]
    └──requires──> [Invite link copy component]
```

### Dependency Notes

- **The suggestion engine is gated by BGG poll parsing.** The current `Bgg::Normalizer` does not parse `<poll>` elements; v1.1 must add a `suggested_numplayers` poll parser and persist it (likely as JSON on `bgg_things.polls` or a related table). This is the first engineering task of the suggestion engine phase.
- **Redesign depends on existing v1.0 data contracts.** The M3 reskin can run in parallel with backend suggestion work, but the redesigned `CollectionView` and `GroupDetail` must consume the same GraphQL types (`MergedThing`, `Group`, `NightSession`) already in production.
- **Explainability depends on the scoring function returning structured data.** The frontend should not reverse-engineer scores from a single number; the backend must return score components (player fit, time fit, complexity, rating, ownership) as a first-class GraphQL field.
- **Group Detail sessions list requires a new or existing query.** `NightSessionType` exists, but a grouped-by-group query (`groupSessions(groupId: ID!)`) may be needed.

## Poll-Based Suggestion Engine

This is the highest-leverage v1.1 differentiator. The approach is **deterministic weighted scoring** over the group's merged collection, constrained by session context, using real BGG poll data.

### Inputs (session context)

- `attendee_count` = number of RSVP'd "Going" members (already in `NightSessionType.attendee_count`)
- `time_budget_minutes` = max play time the group has tonight (host sets during session creation, or a default)
- `complexity_preference` = Light / Medium / Medium-Heavy / Heavy / Any (from a new session preference field or default)
- `attendee_user_ids` = set of users who RSVP'd (only games owned by an attendee are candidates)
- `freshness` = not used in v1.1 (play logging not yet built); leave a hook in the schema

### Per-game score (0–100)

For each candidate game `g` in the merged collection owned by ≥1 attendee:

```
score(g) = w_players   * player_count_suitability(g, attendee_count)
         + w_time      * time_fit(g, time_budget_minutes)
         + w_complex   * complexity_fit(g, complexity_preference)
         + w_rating    * community_rating(g)
         + w_ownership * ownership_bonus(g)        # optional, see below
```

Recommended default weights (tuneable per group or session): `w_players=40, w_time=20, w_complex=20, w_rating=10, w_ownership=10`.

#### 1. `player_count_suitability` (0–100) — the key component

Use the BGG "User Suggested Number of Players" poll (`<poll name="suggested_numplayers">`). For the target `attendee_count`, BGG reports votes for **Best**, **Recommended**, and **Not Recommended**.

BGG XML shape (from `/xmlapi2/thing?id=NNN&stats=1`):

```xml
<poll name="suggested_numplayers" title="User Suggested Number of Players" totalvotes="1234">
  <results numplayers="1">
    <result value="Best" numvotes="12"/>
    <result value="Recommended" numvotes="45"/>
    <result value="Not Recommended" numvotes="977"/>
  </results>
  <results numplayers="2">
    <result value="Best" numvotes="89"/>
    <result value="Recommended" numvotes="400"/>
    <result value="Not Recommended" numvotes="745"/>
  </results>
  <!-- ... continues up to maxPlayers+1 -->
</poll>
```

Apply the **Schmaus adjusted-rating formula** to compute a suitability score at the target player count:

```
best_pct, rec_pct, nrec_pct = percentages of votes at attendee_count
                              (with +1 smoothing added to rec and nrec for small samples)
suitability = 100 * (best_pct * 1.0 + rec_pct * 0.6 + nrec_pct * 0.0)
```

- If `attendee_count` is outside `[minPlayers, maxPlayers]` → suitability = 0 (hard filter, also enforced as a filter).
- If no poll data exists at that count (vote count < threshold, e.g. < 20 votes) → fall back to range-midpoint heuristic scaled to 0–60, and flag "low-confidence" in the explanation.
- **Explainability**: surface "Best at 4 (78% of voters)" as the reason.

This replaces the current `GamePicker.isInRange` check with a graded, data-driven fit.

#### 2. `time_fit` (0–100)

```
if maxPlayTime <= time_budget: 100
if minPlayTime <= time_budget < maxPlayTime: 60 (plays but might run long)
if minPlayTime > time_budget: 0 (hard filter candidate)
```

#### 3. `complexity_fit` (0–100)

BGG `average_weight` (1–5). Map preference to a target band and score by distance:

```
target = {Light: 1.8, Medium: 2.7, Medium-Heavy: 3.6, Heavy: 4.4}[pref]
distance = |g.averageWeight - target|
complexity_fit = max(0, 100 - distance * 30)
```

"Any" → complexity_fit = 50 (neutral) for all.

#### 4. `community_rating` (0–100)

Normalize BGG `average` (0–10) → `100 * (average / 10)`. Use `bayes_average` if available. Cap contribution at w_rating=10 so popularity doesn't dominate fit.

#### 5. `ownership_bonus` (0–100, optional)

Small boost for games owned by more attending members. Helps surface "the one game three of us own."

```
ownership_bonus = min(100, 100 * (number_of_attending_owners / attendee_count))
```

### Output

- Top-N shortlist (e.g., top 8) sorted by score descending.
- Each entry includes a **score breakdown** as human-readable reasons:
  - "Best at 5 players (72% Best votes)"
  - "75 min fits your 2h budget"
  - "Medium complexity (2.8)"
  - "Owned by Alex & Sam"
- Shortlist feeds the redesigned Pick a Game screen.

### Why this over ML/AI

- **Transparent**: every component is explainable.
- **Instant**: pure function over cached data; no API cost.
- **Cold-start-safe**: works on BGG metadata alone.
- **Tuneable**: weights can be adjusted per group or exposed as user preferences.

## Material 3 Design System Patterns

The "Tabletop Social" Stitch design system uses Material 3 components and tokens. Below is the mapping from the PROJECT.md description to concrete M3 components and expected behavior.

### Tokens

| Token | Value / Behavior |
|-------|------------------|
| **Font** | Inter (Google Fonts) for UI text; keep the current body/heading scale. |
| **Primary color** | Indigo (M3 tonal palette: primary container, on-primary container, primary fixed). |
| **Surface** | Neutral-99-ish white with subtle elevation (surface-dim, surface-container-low). |
| **Elevation** | Use `shadow-sm` → `shadow-md` on hover; M3 elevation is expressed via shadow or tonal surface color. |
| **Shape** | `rounded-xl` (1.5rem) for cards; `rounded-full` for avatars, badges, chips. |
| **Iconography** | Material Symbols Outlined (subset via `&icon_names=...`). |

### Components Needed

| Component | M3 Equivalent | Expected Behavior |
|-----------|---------------|-------------------|
| **Sidebar navigation** | Navigation Drawer / Navigation Rail | 280px fixed drawer on desktop (current `AppShell` width); rail + bottom sheet on mobile. Items: Home, Collection, Hot, Groups, Account. Bottom section: Settings, Log out. Primary "New Session" button at the bottom or top of the drawer. |
| **Status badges** | Badges / Assist chips | Session state badges (`draft`, `scheduled`, `rsvp_open`, `picking`, `completed`) use M3 `AssistChip` or a small `Badge`. Each state has a distinct color (e.g., blue=scheduled, green=rsvp_open, purple=picking). |
| **Skeleton loaders** | M3 Skeleton / Shimmer | Use placeholders with the same shape as the final content (card, list item, text block). Current `ResultsSkeleton` is a good base; restyle with M3 surface tones and rounded corners. |
| **Game cards** | Elevated Card / Outlined Card | Thumbnail top (4:3), title (2-line ellipsis), meta row (players, time), rating/weight chips, owner avatar stack. Hover state: `translateY(-6px)` + elevated shadow. |
| **Date blocks** | Static calendar widget (not a full M3 component) | Display session date as a compact block: month abbreviation, day number, weekday. Used in session list items. |
| **Segmented buttons** | Segmented Button | Used for sort direction (asc/desc) and grid/list toggle. Exactly one segment selected at a time. |
| **Range slider** | Slider (range) | Used for player count and playing time filters in the redesigned Collection view. Continuous or discrete steps. |
| **Checkbox groups** | Checkbox / List with checkbox | Filter sections: player-count presets, time buckets, complexity bands, member selection. |
| **Filter chips** | Filter Chip | Active filters displayed as removable chips. |
| **FAB / CTA** | Extended FAB | "New Session" button in the sidebar or on the Groups page. |
| **List items** | List Item | Sessions list, members list, invite links. |
| **Dividers** | Divider | Separate sections in the sidebar and group detail. |
| **Tooltips** | Rich Tooltip | Explain score reasons on hover/focus of suggestion cards. |

### Material Symbols to Use

| UI Element | Icon Name |
|------------|-----------|
| Home | `home` |
| Collection | `shelves` or `grid_view` |
| Hot | `trending_up` |
| Groups | `groups` |
| Account | `person` |
| Settings | `settings` |
| Log out | `logout` |
| New session | `add` or `calendar_add_on` |
| Search | `search` |
| Filter | `filter_list` |
| Players | `groups` |
| Time | `schedule` |
| Rating | `star` |
| Weight/complexity | `fitness_center` or `speed` |
| Sort | `sort` |
| Grid view | `grid_view` |
| List view | `view_list` |
| Check/Close | `check`, `close` |
| Copy link | `content_copy` |
| More actions | `more_vert` |
| Chevvrons | `expand_more`, `expand_less` |

## Group Detail Surface

The current `GroupDetail.vue` shows a header, invite link, member list, and the full collection grid. v1.1 redesigns this into a true group hub with three zones.

### Recommended Layout

```
[Group Header]
  Name + description
  My role chip
  Invite link (copy) — owner/admin only

[Upcoming Sessions] (primary column, 2/3 width on desktop)
  List of NightSessions for this group, ordered by scheduled_at DESC
  Each item: date block + title + status badge + attendee count + "View session" action
  Empty state: "No upcoming sessions. Start one!"

[Members Panel] (side column, 1/3 width on desktop)
  Member list with avatars, names, roles (owner/admin/member)
  Actions: change role, remove (owner/admin only)
  Empty state: "Just you so far — invite friends."

[Shared Collection Spotlight] (below sessions on desktop, or its own tab)
  Compact grid of 6–12 recently added or highest-rated games from the merged collection
  "View full collection" link to the Collection view scoped to this group
```

### Behavior Notes

- **Sessions list**: should be a new GraphQL query or an existing `group` field expansion. Prefer `group { sessions { ... } }` if the backend can add it efficiently.
- **Invite link copy**: reuse the existing `InviteLink` component but styled as an M3 text field with trailing `content_copy` icon button.
- **Member management**: current `MemberList` has role change + remove; restyle with M3 menus (`more_vert`) and confirmation dialogs.
- **Shared collection spotlight**: limit to 12 items, sorted by BGG rating or recently added. Do not paginate; it is a teaser, not the full collection.
- **Empty states**: every zone needs one, consistent with the M3 empty-state pattern (illustration optional, headline + body + action).

## Explainable Recommendation UI

The suggestion engine is only useful if users trust it. The UI must expose *why* each game was suggested.

### Score Breakdown Format

Each suggestion card should display 3–4 short reason chips in order of importance:

1. **Player count fit** — e.g., "Best at 4 (72% Best votes)" or "Recommended at 5"
2. **Time fit** — e.g., "75 min fits your 2h budget" or "Might run long"
3. **Complexity** — e.g., "Medium (2.8)"
4. **Ownership** — e.g., "Owned by Alex & Sam"
5. **Rating** — e.g., "BGG 8.2"

### Confidence Indicators

- **High confidence**: poll has ≥100 votes at the target player count. Show a solid green check or "Best at N" badge.
- **Medium confidence**: poll has 20–99 votes. Show a neutral badge and omit strong claims.
- **Low confidence**: <20 votes or fallback heuristic. Show a dashed outline badge with a tooltip: "Few BGG voters at this player count; score is based on the published range."

### UI Patterns

| Pattern | Use When |
|---------|----------|
| **Inline chips** | Always visible on the suggestion card; no interaction required. |
| **Tooltip / Rich Tooltip** | Hovering a chip reveals the underlying vote counts (e.g., "Best 45 · Recommended 30 · Not Recommended 5"). |
| **Score ring / progress bar** | Optional: a small circular score indicator on the card (e.g., 87/100). Use sparingly to avoid "gamification" feel. |
| **"Why this game" bottom sheet** | On mobile, tapping a suggestion reveals a full breakdown; on desktop, use a hover panel or expanded card. |
| **Empty explanation** | When no suggestions match, explain which constraint eliminated everything: "No games fit 7 players in your 90-minute budget." |

### Anti-Patterns to Avoid

- **A single opaque score with no breakdown.** Users will disagree with it and abandon the feature.
- **Over-explaining every game.** Limit to 3–4 most relevant reasons.
- **Claims of certainty when the poll is thin.** Always flag low-confidence results.

## MVP Recommendation (v1.1)

### Launch With (v1.1)

1. **Material 3 design system migration** — tokens, typography, icons, shape. Apply to the entire app shell.
2. **App shell redesign** — sidebar nav with Home/Collection/Hot/Groups/Account + Settings/Logout + New Session button.
3. **Home dashboard redesign** — hero + personal stats + trending games.
4. **Collection view redesign** — structured filter sidebar with range slider, segmented buttons, rich cards, sort + grid/list toggle, skeleton loaders.
5. **Group Detail surface** — group header, upcoming sessions list, members panel, shared collection spotlight, invite copy.
6. **Picking a Game redesign** — session header with status badge, attendee-aware filtered suggestions, "Pick this game" cards.
7. **Poll-based suggestion engine** — backend scoring using BGG `suggested_numplayers` poll, GraphQL field returning shortlist with score breakdowns.
8. **Explainable shortlist UI** — reason chips on each suggestion card, confidence indicators, empty-state explanations.

### Defer to v1.2

- 4-state RSVP (RSVP-01)
- Ranked voting (VOTE-01)
- "Who brings it" assignment (VOTE-02)
- Play logging (PLAY-01)
- Freshness signal in suggestions (FRESH-01)
- Availability polling (AVAIL-01)
- Session history timeline (HISTORY-01)
- Group stats dashboard (STATS-01)

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Material 3 token system | HIGH | MEDIUM | P1 |
| App shell redesign | HIGH | MEDIUM | P1 |
| Home dashboard redesign | MEDIUM | MEDIUM | P1 |
| Collection view redesign | HIGH | MEDIUM | P1 |
| Group Detail surface | HIGH | MEDIUM | P1 |
| Picking a Game redesign | HIGH | MEDIUM | P1 |
| Poll-based suggestion engine | HIGH | HIGH | P1 |
| Explainable shortlist UI | HIGH | MEDIUM | P1 |
| BGG-poll best-player-count grouping | MEDIUM | MEDIUM | P2 |
| Server-side search | LOW | MEDIUM | P3 |
| 4-state RSVP | MEDIUM | LOW | P2 (defer) |
| Ranked voting | MEDIUM | MEDIUM | P2 (defer) |

**Priority key:**
- P1: Must ship in v1.1.
- P2: v1.2 follow-up.
- P3: Future optimization.

## Competitor Feature Analysis (Suggestion + Design Focus)

| Feature | What2Play | Boardy | MeepleUp | GameNight | Our Approach (v1.1) |
|---------|-----------|--------|----------|-----------|---------------------|
| Auto suggestions | AI re-rank | Player/time/prefs | — | — | Deterministic poll-based scoring (transparent) |
| BGG poll player-count fit | No | No | No | No | Yes — key differentiator |
| Explain "why suggested" | Partial | Partial | No | No | Yes — reason chips + confidence |
| Session lifecycle | Yes | Yes | Yes | Yes | Yes — binary RSVP + manual/suggested pick |
| Group detail hub | Yes | Yes | Yes | Yes | Yes — sessions + members + collection spotlight |
| Material 3 design | Varies | Varies | Varies | Varies | Yes — cohesive M3 system |
| Ranked voting | No | Yes | Proposals | Polls | No — defer to v1.2 |
| AI suggestions | Yes | No | No | No | No — anti-feature |

## Sources

- **Existing codebase (HIGH):** `boardgame-night-rails-vue/app/` — `Bgg::Normalizer`, `NightSessionType`, `GroupType`, `MergedThingType`, `GamePicker.vue`, `GroupDetail.vue`, `Sidebar.vue`, `AppShell.vue`, `GameCard.vue`, `db/schema.rb`.
- **BGG XML API v2 (HIGH):** `boardgamegeek.com/wiki/page/BGG_XML_API2` — rate limits, `/thing?id=NNN&stats=1` endpoint, `<poll name="suggested_numplayers">` structure.
- **Reference GraphQL schema (HIGH):** `bgg-graphql-proxy/src/schema/schema.graphql` — `Poll { name, title, totalVotes, results: [PollResult!]! }`, `PollResult { value, numVotes, level, players }`.
- **Material Symbols (HIGH):** `developers.google.com/fonts/docs/material_symbols` — variable font axes (FILL, wght, GRAD, opsz), Google Fonts CSS API, icon subsetting (`&icon_names=...`).
- **Material 3 components (MEDIUM):** M3 guidelines for Navigation Drawer, Card, Slider, Segmented Button, Badge, Chip, List, FAB — cross-referenced via Google design docs and the PROJECT.md "Tabletop Social" spec.
- **Prior research (HIGH):** `.planning/research/FEATURES.md` (v1.0) — suggestion algorithm, Schmaus formula, competitor matrix, session lifecycle, anti-features.
- **Competitor products (MEDIUM):** What2Play, Boardy, MeepleUp, GameNight, Game Night Picks — corroborated for group hub layout and suggestion UX patterns.

---
*Feature research for: boardgame collection sharing + night-organizing app, v1.1 redesign + suggestion engine*
*Researched: 2026-07-13*
