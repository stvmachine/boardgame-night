# Feature Research

**Domain:** Boardgame collection sharing + boardgame-night organizing (BGG-backed, group-focused)
**Researched:** 2026-06-30
**Confidence:** HIGH (v1 baseline — code-verified from `bggeek-shared-list` source); MEDIUM (competitor landscape — corroborated across 6+ independent organizers); MEDIUM (suggestion heuristics — corroborated by BGG schema + Schmaus formula + multiple open-source recommenders)

## Feature Landscape

This app has two distinct feature surfaces that must be reasoned about separately:

1. **Collection sharing surface** — the v1 baseline, rewritten from `bggeek-shared-list` (Next.js → Rails 8 + Vue 3). Every v1 feature is table stakes for the rewrite; users will regress if any disappear.
2. **Night-organizing surface** — the greenfield addition: friend groups, sessions, invitations, RSVP, game suggestions, (optionally) play logging. This is where the product differentiates.

The single most important research finding: **the BGG GraphQL proxy already exposes the data needed for high-quality game suggestions** (`polls` with per-player-count Best/Recommended/NotRecommended voting, `averageWeight` complexity, `userPlays` history). The v1 app ignored `polls` and guessed "best player count" from the min/max range. The rewrite should use the real poll data — this alone is a step-change in suggestion quality and a clear differentiator.

### Table Stakes (Users Expect These)

Features users assume exist. Missing = product feels incomplete or regresses from v1.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **BGG username validation** | v1 does this (GET_USER query + toast). Adding a nonexistent user breaks the merge flow. | S | Validate against `user(username)` before accepting. Show valid/invalid state inline. |
| **Multi-user collection merge** | Core v1 value prop: "display all collections together." README line 5. | M | v1 hardcodes 2 users (`useMultiUserCollections`: "For now, let's handle up to 2 usernames individually"). Rewrite must support N users — this is a v1 *limitation* to fix, not a new feature. |
| **Collection dedup + owner tracking** | v1 merges by `objectId` and accumulates `owners: [{username, collid}]`. "Who owns Wingspan?" is the canonical question (MeepleUp markets this exact line). | M | Dedup key = BGG `objectId`. Owner list per game. v1 already does this; preserve and generalize to N users. |
| **Fuzzy/keyword search** | v1 uses Fuse.js (keys: `name`, `name.text`, `originalname`, threshold 0.3, 300ms debounce, minSearchLength 0). | S | Vue 3 rewrite: use Fuse.js again or `vueuse` `useFuse`. Preserve debounce + multi-key behavior. |
| **Filter: number of players** | v1: `filterByNumPlayers` (range check `min ≤ n ≤ max`). Constants 1–10. | S | Keep range check. **Upgrade**: use BGG poll "Recommended" band (not just min/max) — see suggestion algorithm. |
| **Filter: playing time** | v1: 6 buckets (≤30, 30–60, 60–120, 120–180, 180–240, 240+ min) via `filterByPlayingTime`. | S | Buckets are fine; consider also a "max minutes" numeric input for precision. |
| **Sort** | v1: name asc/desc, rating asc/desc, year asc/desc (`sortGames` + `orderByFn`). | S | Preserve all six. Consider adding `averageWeight` (complexity) sort as a low-cost win. |
| **Group results** | v1: by players (range string), by rating (5 buckets + Unrated), by bestPlayers (heuristic upper-2/3 of range), by none. Collapsible groups + expand/collapse all. | M | Preserve grouping UI. **Replace** the `bestPlayers` heuristic with real BGG poll data (group by "Best at N" from poll results). |
| **Member color avatars** | v1: 15-color palette, deterministic hash per username (`memberColors.ts`). Owner badges on cards. | S | Preserve deterministic coloring. Vue 3: Pinia store or composable. |
| **Permalink / shareable URL** | v1: `/collection?usernames=u1,u2`, copy-to-clipboard with fallback, URL state sync on change. | S | Rails routing: `GET /collections?usernames=...`. Keep clipboard copy + deep-link parse. **Extend** to permalink group/session URLs. |
| **Responsive layout** | v1: desktop fixed sidebar + mobile full-screen drawer; grid 1→5 cols by breakpoint. | M | Vue 3 + Tailwind/UnoCSS. Preserve the mobile drawer pattern — it's a strong v1 UX. |
| **Hot games (landing)** | v1: `hotItems(BOARDGAME)`, top 30 thumbnails on landing page. | S | Keep as landing hook. `hotItems` is already in the GraphQL schema. |
| **Game card** | v1: thumbnail, name (2-line ellipsis), rating badge, players icon, time icon, owner avatars; click → BGG boardgame page. | S | Preserve. Add complexity (weight) badge — data is already in schema (`averageWeight`). |
| **Loading/empty/error states** | v1: `ResultsSkeleton`, "No collectors selected", "No games found", invalid-user banner, validation-error banner. | S | Preserve all states; they're what makes the app feel finished. |
| **Collapsible filter/search/collector sections** | v1: `ImprovedSearchSidebar` with three collapsible cards + "Active" filter badge + Clear Filters. | S | Preserve the sectioned sidebar pattern. |
| **Select-all / deselect-all members** | v1: per-member checkboxes controlling which owners' games show. | S | Keep. This is the "whose shelf am I looking at" control. |

### Differentiators (Competitive Advantage)

Features that set the product apart. The collection-sharing surface is now table stakes (6+ competitors do BGG sync + merge). The differentiation lives in the **night-organizing surface** and in **suggestion quality**.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **BGG-poll-based player-count suitability** | v1 and most competitors guess "best player count" from min/max range. Using the actual BGG community poll (Best/Recommended/Not Recommended per count) produces dramatically better "fits our group tonight" results. The Dice Tower calls this "BGG's most underutilized feature." | M | Schema exposes `polls` → `PollResult{value, numVotes, level}`. Use Schmaus's adjusted formula (see Suggestion Algorithm). Single biggest quality lever. |
| **Game suggestion engine (session-scoped)** | "We have 5 people, 2 hours, want medium complexity — what from our merged shelf should we play?" Auto-shortlist from the group's combined collection constrained by attendees, time, and complexity. | L | Weighted scoring over the merged collection (see Suggestion Algorithm). Inputs: RSVP'd count, time budget, complexity preference, owned-by-attendee filter. |
| **Friend groups (persistent)** | v1 has no accounts/groups — URLs are ad-hoc. Persistent groups ("Tuesday Brewery Night", "Home Games") with membership, shared merged collection, and session history turn one-off URL sharing into a recurring hub. MeepleUp and Boardy both lead with this. | L | Model: `Group → memberships → users`; `Group → saved_username_refs → BGG collections`. Permissions: owner/admin/member. Join via invite code/link. |
| **Session lifecycle (create → invite → RSVP → suggest → pick)** | The core new flow. Replaces juggling group chat + spreadsheets. Every competitor (What2Play, DicyNight, Boardy, MeepleUp, GameNight, Game Night Picks) implements some version of this — it is the category-defining feature. | L | See Session Lifecycle section. State machine: draft → scheduled → inviting → rsvp_open → suggesting → picking → in_progress → completed. |
| **RSVP with magic-link invites (no-account join)** | GameNight's standout: "friends RSVP without creating an account." Lowest-friction path for casual groups. Boardy does SMS-based. | M | Magic link → RSVP state (Going/Maybe/Interested/Not Going — 4-state beats binary). Provisional profile until they register. |
| **Ranked voting on game picks** | Game Night Picks + What2Play: drag-and-drop rank → collective ordering. Resolves "what do we play" without endless chat. Host can override/lock. | M | Per-session ranked-choice poll over the suggestion shortlist (or any group game). Borda count or STV. |
| **Session-scoped "who's bringing it" assignment** | Once a game is picked, assign it to the owner who'll bring it. Solves the "we picked Wingspan but nobody brought it" problem. | S | Simple assignment: pick → owner (must be an RSVP'd owner of that game). |
| **Recurring sessions** | DicyNight + MeepleUp: weekly/monthly recurrence, one setup → many occurrences. Essential for regular groups. | M | iCal-style RRULE subset (weekly/biweekly/monthly) or simple "clone session" — start with clone, add RRULE later. |
| **Availability polling (pre-schedule)** | What2Play + Boardy: "when can everyone?" poll before locking a date. Avoids the back-and-forth. | M | Date-option poll → highlight best overlap. Can be skipped if host picks a date directly. |
| **Play logging (post-session, BGG-synced)** | BGG's own play-log feature: date, quantity, length, location, players (username/score/color/win), comments. The schema exposes `userPlays`. Logging back to BGG closes the loop and feeds future suggestions ("games we haven't played much"). | L | See Play Logging section. Start with local-only logging; BGG write-back is a separate (harder) phase — BGG's XML API2 play logging requires auth. |
| **"Haven't played much" freshness signal** | DiceDecider's "Play Count Preference" filter. Uses `numPlays` from collection + `userPlays` history to surface under-played owned games. | M | Requires play history (local or BGG). Great for "shelf of shame" motivation. |
| **Complexity (weight) as a first-class filter** | v1 ignores `averageWeight`. BoardMatch, DiceDecider, gamescout all weight complexity heavily. BGG `averageWeight` 1–5 is in the schema. | S | Add a complexity slider/bands (Light ≤2, Medium 2–3, Medium-Heavy 3–4, Heavy ≥4) to the filter sidebar. Trivial cost, real value. |
| **Mechanic/category facets** | Schema exposes `mechanics` and `categories` per game. "Show me only deck-builders from our shelf" is a power-user favorite. | M | Faceted filter (multi-select tags). Indexed from game data. |
| **Session history / "what we played" timeline** | MeepleUp + Boardy: per-group timeline of past sessions with games, attendees, winners. Builds group identity and feeds stats. | M | Derived from completed sessions + play logs. |
| **Group stats dashboard** | Boardy (leaderboards), gamescout (charts): most-played, H-index, hours played, win rates, favorite player count. | M | Aggregate over play logs. Start with top-5 most-played + hours; expand later. |

### Anti-Features (Commonly Requested, Often Problematic)

Features to deliberately NOT build (at least initially). Documenting these prevents scope creep.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| **AI/LLM-based game suggestions** | What2Play markets "AI re-ranking"; GameRecommendationApp uses RAG. Trendy. | Heavy infra (LLM calls, cost, latency), opaque reasoning, brittle for a small-group tool. The deterministic poll-based + weighted-score approach is transparent, instant, and good enough. AI is a moat for venture-funded tools, not a friend-group app. | Deterministic weighted scoring with "why this fits" explanations (see Suggestion Algorithm). Expose the score components as readable reasons. |
| **Public event discovery / marketplace** | DicyNight + GameNight have "find events near you." Seems like growth. | Pivots the product from "your friend group's shelf" to "meet strangers" — different trust model, moderation burden, geography features. Dilutes the core value prop. | Private/invite-only groups only. A group *can* be large, but membership is by invitation. |
| **Real-time multiplayer / online play** | BGA does this. "Why can't we just play here?" | Enormous engineering scope (game engines, state sync, per-game implementations). BGA has a team per game. Totally orthogonal to collection + night organizing. | Link out to BGA / Tabletop Simulator / Board Game Arena for actual play. We organize; they host. |
| **Shelf photo parsing / barcode scanning** | MeepleUp (AI photo), What2Play (Gemini+OCR), Boardy (barcode). | ML/OCR pipeline is a separate product. BGG sync already covers 95% of serious hobbyists (they have BGG accounts). Photo parsing serves the non-BGG casual market — not our user. | BGG username import only. Manual add-by-search as fallback for the rare non-BGG friend. |
| **Full BGG XML API2 write-back (plays, ratings, collection)** | "Sync plays back to BGG." | BGG's XML API2 write endpoints require cookie auth (not OAuth), are undocumented/fragile, rate-limited, and break on BGG UI changes. High maintenance, low reward for a rewrite's early phases. | Local play logging first. BGG *read* only via the existing GraphQL proxy. Defer write-back to a later, explicitly-risk-flagged phase. |
| **Price tracking / deal alerts** | gamescout has it. | Requires retailer scraping/affiliates, price-history storage, alert infra. Unrelated to night organizing. | Out of scope. Link to BGG marketplace / Board Game Oracle externally if asked. |
| **Multi-table seating optimizer** | What2Play auto-seats large events across tables. | Niche for large events (10+ people, multiple tables). Adds combinatorial optimization complexity. Our user is a friend group, typically 3–6. | Manual: if a session has >N attendees, the host can create sub-tables manually later. Defer auto-seating indefinitely. |
| **Native mobile apps** | MeepleUp, Games Night Planner, Board Game Stats are mobile-first. | Two-platform maintenance, app-store review, no offline need (game night has wifi). | Responsive PWA. Vue 3 + Vite PWA plugin. Installable, works offline-cached, no app store. |
| **Social feed / forums / curated lists / reviews** | Boardy has forums, reviews, tier lists, curated lists. | Scope explosion into social-network territory. Our job is "decide what to play tonight," not "build a boardgame social network." | Session comments + post-game notes only. No global feed. |
| **Tournament system** | BGA has round-robin/swiss tournaments. | Niche competitive use case. Friend groups rarely run formal tournaments. | Track wins/leaderboards informally via play logs. Formal tournaments = explicit non-goal. |

## Game Suggestion Algorithm

This is the highest-leverage differentiator and the feature the quality gate demands be concrete. The approach is **deterministic weighted scoring** over the merged group collection, constrained by session context, using real BGG poll data.

### Inputs (session context)
- `attendee_count` = number of RSVP'd "Going" members
- `time_budget_minutes` = max play time the group has tonight
- `complexity_preference` = Light / Medium / Medium-Heavy / Heavy (or "any")
- `attendee_owners` = set of usernames who RSVP'd (only games owned by an attendee are candidates)
- `freshness` = "haven't played much" / "balanced" / "play often" (optional, requires play history)

### Per-game score (0–100)

For each candidate game `g` in the merged collection owned by ≥1 attendee:

```
score(g) = w_players   * player_count_suitability(g, attendee_count)
         + w_time      * time_fit(g, time_budget_minutes)
         + w_complex   * complexity_fit(g, complexity_preference)
         + w_rating    * community_rating(g)
         + w_fresh     * freshness(g)        # only if freshness requested
```

Recommended weights (tuneable): `w_players=40, w_time=20, w_complex=20, w_rating=10, w_fresh=10`.

#### 1. `player_count_suitability` (0–100) — THE key component
Use the BGG "suggested number of players" poll (`thing.polls` where name = "suggested_player_count"). Each player count has votes for **Best / Recommended / Not Recommended**. Apply the **Schmaus adjusted-rating formula** (unreasonableeffectiveness.com), extended to a 0–100 suitability score for the target `attendee_count`:

```
best_pct, rec_pct, nrec_pct = poll percentages at attendee_count
                       (with +1 vote smoothing added to rec and nrec for small samples)
suitability = 100 * (best_pct * 1.0 + rec_pct * 0.6 + nrec_pct * 0.0)
```

- If `attendee_count` is outside `[minPlayers, maxPlayers]` → suitability = 0 (hard filter, also enforced as a filter).
- If no poll data exists (vote count < threshold, e.g. < 20 votes) → fall back to range-midpoint heuristic (v1's upper-2/3 approach) scaled to 0–60, and flag "low-confidence" in the explanation.
- **Explainability**: surface "Best at 4 (78% of voters)" as the reason.

This replaces v1's `groupGamesByBestPlayers` heuristic (which guessed `min + ceil(range * 0.67)`) with actual community voting — a step-change in quality.

#### 2. `time_fit` (0–100)
```
if maxPlayTime <= time_budget: 100
if minPlayTime <= time_budget < maxPlayTime: 60 (plays but might run long)
if minPlayTime > time_budget: 0 (hard filter candidate)
```
Softer than a hard filter: games that *might* fit get partial credit. Host can still pick them.

#### 3. `complexity_fit` (0–100)
BGG `averageWeight` (1–5). Map preference to a target band and score by distance:
```
target = {Light: 1.8, Medium: 2.7, Medium-Heavy: 3.6, Heavy: 4.4}[pref]
distance = |g.averageWeight - target|
complexity_fit = max(0, 100 - distance * 30)   # ±1 weight ≈ 70, ±2 ≈ 40, ±3+ ≈ 0
```
"any" → complexity_fit = 50 (neutral) for all.

#### 4. `community_rating` (0–100)
Normalize BGG `average` (0–10) → `100 * (average / 10)`. Use `bayesAverage` if available (more stable for low-vote games). Cap contribution at w_rating=10 so popularity doesn't dominate fit.

#### 5. `freshness` (0–100, optional)
Requires play history (local logs or BGG `userPlays`). "Haven't played much" → `100 - min(100, play_count * 10)` (fewer plays = higher). "Play often" → inverse. "Balanced" → 50.

### Output
- Top-N shortlist (e.g. top 8) sorted by score.
- Each entry includes the **score breakdown as human-readable reasons**: "Best at 5 players (72% Best votes) · 75min fits your 2h budget · Medium complexity (2.8) · Owned by Alex & Sam · You haven't played this yet."
- Shortlist feeds the ranked-voting feature.

### Why this over ML/AI
- **Transparent**: every score component is explainable ("why this fits"). ML recommenders (Meeple-Matchmaker's SVD, GameRecommendationApp's ALS+RAG) are black boxes and need training data the app won't have at launch.
- **Instant**: pure function over in-memory collection. No latency, no API cost.
- **Cold-start-safe**: works on game metadata alone; improves when play history arrives. Collaborative filtering needs a ratings matrix that a small friend group will never produce.
- **Tuneable**: weights are constants a host or admin can adjust per group.

## Session Lifecycle

The core new flow. State machine + feature mapping:

```
[create session] → draft
   │  host sets: title, date/time, location, group, capacity
   ▼
scheduled → [send invites]
   │  magic link / invite code → friends RSVP (no-account OK)
   ▼
rsvp_open → [RSVPs arrive: Going / Maybe / Interested / Not Going]
   │  host sees attendee count; can close RSVP
   ▼
suggesting → [run suggestion engine over group collection, constrained by attendees]
   │  shortlist generated; host/attendees can add/remove games
   ▼
picking → [ranked voting on shortlist] → host locks pick(s) + assigns "who brings it"
   │
   ▼
in_progress → (optional) live tools: score tracker, turn timer
   │
   ▼
completed → (optional) log plays: date, players, scores, winner, comments
              → feeds session history, stats, future "freshness" signal
```

**MVP subset** (first session phase): create → invite (magic link) → RSVP (Going/Not Going) → suggest (engine) → pick (host selects, no voting yet) → completed. Voting + play logging + live tools are v1.x.

## Collection Merging (dedup, owners, conflicts)

- **Dedup key**: BGG `objectId` (stable game ID). Same as v1.
- **Owner tracking**: each merged game carries `owners: [{username, collid, status}]`. v1 stores `{username, collid}`; **extend with `status`** (own/want/wantToPlay/wishlist from the BGG `Status` type) so the merge can answer "who owns it" vs "who wants it" vs "who wants to play it."
- **Conflict resolution**: BGG game metadata (name, players, time, weight, polls) is *per-game*, not per-collection — there's no real conflict because all owners reference the same `objectId`. The only per-owner differences are `status`, `numPlays` (per-user), and `comment`/`condition` (per-user). Merge strategy: keep per-owner fields in an `owners[]` array; keep shared game fields once (prefer the `thing(id)` lookup for canonical metadata over the collection-item snapshot, since collection snapshots can be stale). **Use the GraphQL `things(ids:)` batch query to refresh/enrich canonical metadata** for the merged set rather than trusting collection snapshots.
- **Status-aware merging** (new): "want to play" across the group is a powerful suggestion input — if 3 of 5 attendees have a game flagged `wantToPlay`, boost its suggestion score. This is a differentiator most competitors miss.

## Friend Groups (membership, invites, permissions)

- **Model**: `Group` has many `Memberships` (user_id, role, joined_at); `Group` references a set of BGG usernames (each tied to a member or just a tracked collection); `Group` has many `Sessions`.
- **Roles**: `owner` (creator, full control), `admin` (manage members, create sessions), `member` (RSVP, suggest, vote). Keep it to three — more roles = complexity without value for friend groups.
- **Invite flow**: owner/admin generates an invite **code + magic link**; invitee joins → becomes `member`. Optionally bind their BGG username at join time (validates via `user(username)`).
- **Permissions matrix**:
  | Action | owner | admin | member |
  |--------|-------|-------|--------|
  | Edit group | ✓ | ✓ | — |
  | Manage members | ✓ | ✓ | — |
  | Create session | ✓ | ✓ | — |
  | RSVP / vote / suggest | ✓ | ✓ | ✓ |
  | View merged collection | ✓ | ✓ | ✓ |
- **N users, not 2**: The group model is what lets the rewrite escape v1's 2-user ceiling. A group's merged collection = union of all members' BGG collections, deduped by `objectId`.

## Feature Dependencies

```
[BGG username validation]
    └──requires──> [GraphQL proxy: user() query]
    └──enables───> [Multi-user collection merge]
                       └──enables──> [Filter / search / sort / group] (table stakes)
                       └──enables──> [Game suggestion engine]
                                          └──requires──> [BGG poll data (thing.polls)]
                                          └──requires──> [Session: attendee_count]

[Friend groups]
    └──requires──> [Auth: user accounts]
    └──requires──> [BGG username binding]
    └──enables───> [Persistent merged collection per group]
    └──enables───> [Session lifecycle]
                       └──requires──> [RSVP / magic-link invites]
                       └──enables───> [Game suggestion engine (session-scoped)]
                                          └──enables──> [Ranked voting on picks]
                                                             └──enables──> [Pick + "who brings it" assignment]
                       └──enables───> [Play logging (post-session)]
                                          └──enables──> [Session history / timeline]
                                          └──enables──> [Group stats dashboard]
                                          └──enables──> [Freshness signal] ──enhances──> [Game suggestion engine]

[Recurring sessions] ──requires──> [Session lifecycle]
[Availability polling] ──precedes──> [Session: scheduling] (optional branch)

[Complexity filter] ──requires──> [averageWeight in game data] (already in schema — cheap)
[Mechanic/category facets] ──requires──> [mechanics/categories indexing] (schema has them)
```

### Dependency Notes

- **Auth is the gate for all night-organizing features.** v1 is anonymous (URL-only). The rewrite must add user accounts to enable groups/sessions. This is the single biggest architectural delta from v1 and should be the first phase of the new surface.
- **BGG username binding** (validating + storing a user's BGG username on their account) is the bridge between the auth world and the BGG-collection world. Without it, a user can't contribute their shelf to a group.
- **Game suggestion engine depends on both** the collection surface (merged collection) and the session surface (attendee count). It's the convergence point — build it after both foundations exist.
- **Play logging creates a feedback loop**: it feeds `freshness` which improves suggestions. Build suggestions first with metadata-only scoring; add the freshness component once play logging exists.
- **Ranked voting depends on suggestions** (it votes on the shortlist) but could also work on a free-form game list. Build suggestion shortlist first; voting on top of it is a natural next step.

## MVP Definition

### Launch With (v1 — rewrite parity + minimal new surface)

Minimum to validate the rewrite preserves v1 value and adds the organizing hook.

- [ ] **Collection surface parity** — all v1 table-stakes features (validation, N-user merge, dedup+owners, fuzzy search, player/time filters, sort, group, member colors, permalink, responsive, hot games, game card, states). This is non-negotiable regression prevention.
- [ ] **N-user merge (fix v1's 2-user ceiling)** — generalize `useMultiUserCollections` to N. The v1 code literally comments "For now, let's handle up to 2 usernames individually."
- [ ] **Complexity (averageWeight) filter + sort + card badge** — cheap, high-value, data already in schema.
- [ ] **Auth + user accounts** — minimal (email/password or magic-link login). Enables the new surface.
- [ ] **BGG username binding** — store + validate one BGG username per user account.
- [ ] **Friend groups (create, invite, join, membership)** — the persistent home for a friend group's merged collection.
- [ ] **Sessions: create + magic-link invite + RSVP (Going/Not Going) + host picks a game** — the thinnest end-to-end night-organizing flow. No suggestions, no voting yet — host manually picks from the group's merged collection.
- [ ] **Group-scoped merged collection view** — the v1 collection UI, but scoped to a group's members and persistent.

### Add After Validation (v1.x)

- [ ] **Game suggestion engine (session-scoped, poll-based)** — add once sessions + RSVP exist. The differentiator.
- [ ] **Ranked voting on suggestion shortlist** — once suggestions produce a shortlist.
- [ ] **BGG-poll-based "best player count" grouping/filter** — replace v1's range heuristic.
- [ ] **4-state RSVP (Maybe / Interested)** — upgrade from binary once session usage is real.
- [ ] **Recurring sessions** — clone-session first, RRULE later.
- [ ] **"Who brings it" assignment** — once picks are locked.
- [ ] **Mechanic/category facets** — power-user filters.
- [ ] **Play logging (local-only)** — post-session capture; no BGG write-back yet.
- [ ] **Freshness signal in suggestions** — once play logs exist.
- [ ] **Availability polling** — pre-schedule date poll.

### Future Consideration (v2+)

- [ ] **BGG play write-back** — explicitly risk-flagged; BGG XML API2 auth is fragile.
- [ ] **Session history timeline + group stats dashboard** — once enough play logs accumulate.
- [ ] **"Want to play" cross-group boost** — `wantToPlay` status as a suggestion multiplier.
- [ ] **Live session tools (score tracker, turn timer)** — nice but not core; PWA can host.
- [ ] **PWA install / offline cache** — once the app is stable.

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Collection surface parity (all v1 table stakes) | HIGH | HIGH | P1 |
| N-user merge (fix 2-user ceiling) | HIGH | LOW | P1 |
| Complexity filter/sort/badge | MEDIUM | LOW | P1 |
| Auth + accounts | HIGH (enabler) | MEDIUM | P1 |
| BGG username binding | HIGH (enabler) | LOW | P1 |
| Friend groups (CRUD + invite + membership) | HIGH | HIGH | P1 |
| Session create + magic-link invite + binary RSVP | HIGH | HIGH | P1 |
| Host manual pick from group collection | MEDIUM | LOW | P1 |
| Group-scoped persistent merged collection | HIGH | MEDIUM | P1 |
| Game suggestion engine (poll-based, session-scoped) | HIGH | HIGH | P2 |
| Ranked voting on shortlist | MEDIUM | MEDIUM | P2 |
| BGG-poll-based best-player-count grouping | MEDIUM | LOW | P2 |
| 4-state RSVP | LOW | LOW | P2 |
| Recurring sessions (clone) | MEDIUM | LOW | P2 |
| "Who brings it" assignment | LOW | LOW | P2 |
| Mechanic/category facets | MEDIUM | MEDIUM | P2 |
| Play logging (local) | MEDIUM | MEDIUM | P2 |
| Freshness signal in suggestions | MEDIUM | LOW | P3 |
| Availability polling | MEDIUM | MEDIUM | P3 |
| Session history timeline | MEDIUM | MEDIUM | P3 |
| Group stats dashboard | LOW | MEDIUM | P3 |
| BGG play write-back | LOW | HIGH | P3 (risk-flagged) |
| Live session tools | LOW | MEDIUM | P3 |

**Priority key:**
- P1: Must have for launch — rewrite parity + thinnest organizing loop
- P2: Should have, add once P1 loop is validated — the differentiating intelligence
- P3: Nice to have, future consideration — feedback loops, stats, risk-flagged extras

## Competitor Feature Analysis

| Feature | What2Play | DicyNight | Boardy | MeepleUp | GameNight | Game Night Picks | v1 (bggeek-shared-list) | Our Approach (rewrite) |
|---------|-----------|-----------|--------|----------|-----------|------------------|-------------------------|------------------------|
| BGG collection sync | ✓ (sync + shelf photo) | ✓ | ✓ | ✓ (+AI photo, barcode) | ✓ | — | ✓ (multi-user merge, 2-user limit) | ✓ N-user merge via GraphQL proxy (fix v1 ceiling) |
| Merged "who owns what" | ✓ | — | ✓ | ✓ ("stop asking who owns Wingspan") | — | — | ✓ (owners[] dedup) | ✓ preserve + generalize |
| Fuzzy search | — | — | ✓ (advanced) | ✓ | — | — | ✓ (Fuse.js) | ✓ Fuse.js in Vue 3 |
| Filter by players/time | ✓ | — | ✓ | ✓ | — | ✓ | ✓ (players 1–10, 6 time buckets) | ✓ + complexity bands (new) |
| Group by | — | — | — | — | — | — | ✓ (players/rating/bestPlayers/none) | ✓ + poll-based best-players (new) |
| Permalink/shareable URL | — | — | — | — | ✓ (magic link) | ✓ (friend/invite codes) | ✓ (/collection?usernames=) | ✓ + group/session permalinks |
| Persistent friend groups | ✓ (private/open) | — | ✓ (up to 20) | ✓ (multiple, join codes) | ✓ (communities) | ✓ (friend codes) | — (URL-only) | ✓ (P1 — the new foundation) |
| Session create/schedule | ✓ | ✓ (recurring) | ✓ | ✓ (recurring) | ✓ | ✓ (recurring) | — | ✓ (P1) |
| Magic-link invites | ✓ | — | — (SMS) | — (join codes) | ✓ | — (invite codes) | — | ✓ (P1) |
| RSVP | ✓ | ✓ (+waitlist) | ✓ (+nudges) | ✓ (+waitlist) | ✓ (4-state) | — | — | ✓ (P1 binary → P2 4-state) |
| Availability poll | ✓ | — | ✓ | — | — | — | — | P3 |
| Game suggestions (auto) | ✓ (AI re-rank) | — | ✓ (player/time/prefs) | — | — | — | — | ✓ (P2, deterministic poll-based — transparent, no AI) |
| BGG-poll player-count fit | — (uses constraints) | — | — | — | — | — | — (range heuristic) | ✓ (P2 — our key differentiator) |
| Ranked voting on games | ✓ | — | ✓ | ✓ (proposals) | ✓ (polls) | ✓ (drag-rank) | — | ✓ (P2) |
| Pick + bring-assignment | ✓ (host locks) | — | — | — | — | ✓ (take a seat) | — | ✓ (P2) |
| Play logging | — | — | ✓ (wins/stats) | — | — | ✓ (recent gameplay) | — | ✓ (P2 local → P3 BGG write-back) |
| Stats/leaderboards | ✓ (feedback) | — | ✓ | — | — | ✓ (recent stats) | — | P3 |
| Multi-table seating | ✓ | — | — | — | — | — | — | Anti-feature (defer) |
| Public event discovery | ✓ (open events) | ✓ (find near you) | — | — | ✓ (find near you) | ✓ (find players) | — | Anti-feature (private only) |
| AI/LLM suggestions | ✓ (re-rank) | — | — | — | — | — | — | Anti-feature (deterministic instead) |
| Online play | — | — | — | — | — | — | — | Anti-feature (link to BGA) |

## Sources

- **v1 baseline (HIGH confidence — source code):** `bggeek-shared-list/src/` — `useMultiUserCollections.ts` (2-user merge, dedup by objectId, owners[]), `useFuzzySearch.ts` (Fuse.js config), `grouping.ts` (bestPlayers heuristic), `sorting.ts`, `search.ts` (filter buckets), `permalink.ts`, `memberColors.ts`, `ImprovedSearchSidebar.tsx`, `Results.tsx`, `GameCard.tsx`, `HotGames.tsx`, `collection.tsx`, `constants.ts`, `types/index.ts`.
- **BGG data model (HIGH confidence — schema):** `bgg-graphql-proxy/src/schema/schema.graphql` — `Thing.polls` (Best/Recommended/NotRecommended per player count), `averageWeight` (complexity), `userPlays` (play history with players/scores/win), `Status` (own/want/wantToPlay/wishlist), `hotItems`.
- **Competitor landscape (MEDIUM — corroborated across 6+ sources):** What2Play (what2play.games), DicyNight (dicynight.com), Boardy (boardyboard.com), MeepleUp (Google Play), GameNight (getgamenight.app), Game Night Picks (gamenightpicks.com), Games Night Planner (Google Play).
- **Suggestion algorithms (MEDIUM — corroborated):** Schmaus, "Best board games for a given player count" (unreasonableeffectiveness.com) — adjusted-rating formula using BGG poll data; gamescout (github.com/TabletopFoundry/gamescout) — content-based weighted scoring; Meeple-Matchmaker (github.com/mcumiskey/Meeple-Matchmaker) — hybrid CF+content; DiceDecider (dicedecider.com) — player/time/complexity/play-count filters; BoardMatch (boardmatch.app) — weighs player count, time, complexity, themes; BoardGame-O-Matic — partial-credit matching.
- **BGG player-count polls (MEDIUM-HIGH):** BoardGameGeek thread "BGG poll about player counts (Best/Recommended/Not Recommended)" (2026-03); BGG geekpoll results (pollid 360377, 388492) showing the Best/Recommended/Not Recommended structure; The Dice Tower, "Board Game Geek's Most Underutilized Feature" (2024, YouTube) — confirms Preferred Player Count Voting is underused.
- **BGG play logging (MEDIUM):** BoardGameGeek wiki "plays" page; Ventura County Boardgamers "Logging Your Game Plays"; Board Game Stats FAQ (bgstatsapp.com); BGG blog "Sunderfolk and defining what it means to log a play" (2025-05) — edge cases for what counts as a play/winner.
- **BGA session model (MEDIUM):** Board Game Arena FAQ (en.boardgamearena.com/faq) — table/lobby creation, friends (mutual requests), invite links for non-registered users, hotseat, matchmaking preferences, round-robin/invitation-only tournaments.

---
*Feature research for: boardgame collection sharing + night-organizing app*
*Researched: 2026-06-30*
