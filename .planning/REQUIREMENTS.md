# Requirements

**Project:** boardgame-night-rails-vue
**Core Value:** Let a group of friends merge their BGG collections and pick games everyone can play for boardgame night.
**Defined:** 2026-07-01
**Source:** PROJECT.md + research/FEATURES.md (Prioritization Matrix + MVP Definition)

## v1 Requirements

Requirements grouped by category with REQ-IDs. v1 = rewrite parity + minimal night-organizing surface (per PROJECT.md scope decision).

### Foundation & Infrastructure

- [x] **FOUND-01**: Rails 8 API-only application initialized with GraphQL endpoint, dry-validation contracts, and Solid Queue/Cache configured
- [x] **FOUND-02**: Vue 3 SPA served by Rails in production via Vite Ruby, with dev proxy configured (no CORS errors in development)
- [x] **FOUND-03**: Monorepo deploys as a single container via Kamal 2 (Vue build output served from Rails public/)
- [x] **FOUND-04**: GraphQL schema with max_depth and max_complexity limits set, introspection disabled in production
- [x] **FOUND-05**: BGG credentials loaded from .env.bggeek and used for all BGG API communication (server-side only, never exposed to frontend)

### BGG Integration

- [ ] **BGG-01**: Rails BGG client fetches a user's collection using the two-call expansion workaround (base games + expansions merged, correct subtype labels)
- [x] **BGG-02**: BGG client enforces 1 request / 5 seconds rate limiting across all workers (token bucket or fixed window, cross-thread safe)
- [x] **BGG-03**: BGG client handles HTTP 202 "queued" responses with retry logic (up to 5 retries with delay) before parsing XML
- [ ] **BGG-04**: BGG XML parser uses Nokogiri with nil-safe field normalization (handles missing fields, single-vs-array items, name variations) — normalizer exists; two-call expansion workaround deferred to 02-03
- [x] **BGG-06**: BGG client sends a descriptive User-Agent header on all requests
- [x] **BGG-07**: BGG thing details can be batch-fetched via comma-separated IDs (GET /thing?id=1,2,3&stats=1)

### Collection Surface (v1 Parity)

- [ ] **COLL-01**: User can validate a BGG username exists before fetching its collection (inline valid/invalid state)
- [x] **COLL-02**: User can merge N BGG users' collections into a single deduplicated view (dedup by BGG objectId, owner list per game) — fixes v1's hardcoded 2-user limit
- [ ] **COLL-03**: User can fuzzy-search the merged collection by game name (Fuse.js, multi-key, debounced)
- [ ] **COLL-04**: User can filter the merged collection by number of players (range check: min ≤ n ≤ max)
- [ ] **COLL-05**: User can filter the merged collection by playing time (bucketed: ≤30, 30–60, 60–120, 120–180, 180–240, 240+ min)
- [ ] **COLL-06**: User can filter the merged collection by complexity/weight (Light ≤2, Medium 2–3, Medium-Heavy 3–4, Heavy ≥4) — new vs v1
- [ ] **COLL-07**: User can sort the merged collection by name (asc/desc), rating (asc/desc), year (asc/desc), and complexity (asc/desc)
- [ ] **COLL-08**: User can group the merged collection by player count, by rating, by best-player-count, or by none (collapsible groups with expand/collapse all)
- [x] **COLL-09**: User sees member color avatars (deterministic per-username color) as owner badges on game cards
- [ ] **COLL-10**: User can share a permalink URL for a set of usernames (URL state sync, copy-to-clipboard)
- [ ] **COLL-11**: User sees hot/trending BGG games on the landing page (top 30 thumbnails via hotItems)
- [ ] **COLL-12**: User sees a game card with thumbnail, name (2-line ellipsis), rating badge, players icon, time icon, complexity badge, and owner avatars (click → BGG boardgame page)
- [ ] **COLL-13**: User sees loading, empty, and error states (skeleton loaders, "No collectors selected", "No games found", invalid-user banner, per-user error isolation)
- [ ] **COLL-14**: User can collapse/expand filter, search, and collector sections in the sidebar (with active filter badge and Clear Filters)
- [ ] **COLL-15**: User can select-all / deselect-all members to control which owners' games show
- [ ] **COLL-16**: Layout is responsive (desktop fixed sidebar + mobile full-screen drawer, grid 1→5 cols by breakpoint)
- [x] **COLL-17**: GraphQL collection queries use Dataloader to batch expansion/base-game lookups (no N+1 BGG API calls)
- [ ] **COLL-18**: BGG collection data is cached (Solid Cache) with stale-while-revalidate pattern; user can trigger a manual refresh (15-min cooldown)

### Authentication & User Accounts

- [ ] **AUTH-01**: User can create an account with email and password
- [ ] **AUTH-02**: User can log in and stay logged in across sessions
- [ ] **AUTH-03**: User can log out from any page
- [ ] **AUTH-04**: User can bind one BGG username to their account (validated against BGG user() query before accepting)

### Friend Groups

- [ ] **GROUP-01**: User can create a friend group (title, description)
- [ ] **GROUP-02**: Group owner can generate an invite code + magic link for others to join
- [ ] **GROUP-03**: User can join a group via invite link (becomes member role)
- [ ] **GROUP-04**: Group owner/admin can manage members (remove, change roles)
- [ ] **GROUP-05**: Group has three roles: owner (full control), admin (manage members, create sessions), member (RSVP, suggest, vote)
- [ ] **GROUP-06**: Group has a persistent merged collection view (union of all members' bound BGG collections, deduped by objectId)

### Session Lifecycle (Minimal v1)

- [ ] **SESS-01**: Group owner/admin can create a boardgame night session (title, date/time, location, capacity)
- [ ] **SESS-02**: Session owner can send magic-link invitations to group members
- [ ] **SESS-03**: Invitee can RSVP via magic link without creating an account (Going / Not Going — binary for v1)
- [ ] **SESS-04**: Session owner sees RSVP attendee count and status
- [ ] **SESS-05**: Session owner can manually pick a game from the group's merged collection (host selects, no suggestion engine or voting yet)
- [ ] **SESS-06**: Session transitions through states: draft → scheduled → rsvp_open → picking → completed

### GraphQL API

- [x] **GQL-01**: Rails exposes a GraphQL endpoint consumed by the Vue frontend (single source of truth for frontend data)
- [x] **GQL-02**: GraphQL schema exposes queries for things, search, users, collections, hot items (matching the reference proxy's contract)
- [ ] **GQL-03**: GraphQL mutations use dry-validation contracts for input validation (not strong_params)
- [x] **GQL-04**: GraphQL handles Apollo batched queries (Schema.multiplex for params[:_json] arrays)
- [ ] **GQL-05**: GraphQL type definitions are generated from Rails schema and committed (codegen contract between frontend and backend)

## v2 Requirements (Deferred — Add After Validation)

- [ ] **SUGG-01**: Game suggestion engine (session-scoped, BGG-poll-based weighted scoring with explainable shortlists)
- [ ] **SUGG-02**: BGG-poll-based "best player count" grouping/filter (replaces v1's range heuristic with real community poll data)
- [ ] **VOTE-01**: Ranked voting on suggestion shortlist (Borda count or STV)
- [ ] **VOTE-02**: Pick + "who brings it" assignment (assign picked game to the owner who will bring it)
- [ ] **RSVP-01**: 4-state RSVP (Going / Maybe / Interested / Not Going — upgrade from binary)
- [ ] **SESS-07**: Recurring sessions (clone-session first, RRULE later)
- [ ] **FACET-01**: Mechanic/category faceted filters (multi-select tags)
- [ ] **PLAY-01**: Play logging (local-only, post-session capture: date, players, scores, winner, comments)
- [ ] **FRESH-01**: Freshness signal in suggestions ("haven't played much" using play history)
- [ ] **AVAIL-01**: Availability polling (pre-schedule date poll to find best overlap)
- [ ] **HISTORY-01**: Session history / "what we played" timeline per group
- [ ] **STATS-01**: Group stats dashboard (most-played, hours played, win rates, favorite player count)

## Out of Scope

- **Real-time chat** — not core to collection sharing or night organizing
- **OAuth login against BGG** — BGG token read from .env.bggeek is sufficient for v1
- **Mobile native app** — web-first, responsive PWA is enough
- **AI/LLM-based game suggestions** — deterministic poll-based scoring is transparent, instant, and sufficient; AI adds cost/latency/opacity without clear value for a friend-group tool
- **Public event discovery / marketplace** — pivots from "your friend group's shelf" to "meet strangers"; different trust model, moderation burden; private/invite-only groups only
- **Real-time multiplayer / online play** — enormous engineering scope orthogonal to collection + organizing; link out to BGA / Tabletop Simulator instead
- **Shelf photo parsing / barcode scanning** — ML/OCR pipeline is a separate product; BGG sync covers 95% of serious hobbyists
- **Full BGG XML API2 write-back (plays, ratings, collection)** — fragile cookie auth, undocumented, rate-limited; local play logging first, write-back is a later risk-flagged phase
- **Price tracking / deal alerts** — requires retailer scraping/affiliates; unrelated to night organizing
- **Multi-table seating optimizer** — niche for large events (10+ people); friend groups are typically 3–6
- **Social feed / forums / curated lists / reviews** — scope explosion into social-network territory
- **Tournament system** — niche competitive use case; informal win tracking via play logs is enough

## Traceability

| REQ-ID | Phase | Status |
|--------|-------|--------|
| FOUND-01 | Phase 1 | Complete |
| FOUND-02 | Phase 1 | Complete |
| FOUND-03 | Phase 1 | ✅ Complete (01-03) |
| FOUND-04 | Phase 1 | Complete |
| FOUND-05 | Phase 1 | Complete |
| BGG-01 | Phase 2 | Pending |
| BGG-02 | Phase 2 | ✅ Complete (02-01) |
| BGG-03 | Phase 2 | ✅ Complete (02-01) |
| BGG-04 | Phase 2 | In progress — normalizer exists, expansion workaround pending 02-03 |
| BGG-05 | Phase 2 | Pending |
| BGG-06 | Phase 2 | ✅ Complete (02-01) |
| BGG-07 | Phase 2 | ✅ Complete (02-01) |
| COLL-01 | Phase 3 | Pending |
| COLL-02 | Phase 3 | Complete |
| COLL-03 | Phase 3 | Pending |
| COLL-04 | Phase 3 | Pending |
| COLL-05 | Phase 3 | Pending |
| COLL-06 | Phase 3 | Pending |
| COLL-07 | Phase 3 | Pending |
| COLL-08 | Phase 3 | Pending |
| COLL-09 | Phase 3 | Complete |
| COLL-10 | Phase 3 | Pending |
| COLL-11 | Phase 3 | Pending |
| COLL-12 | Phase 3 | Pending |
| COLL-13 | Phase 3 | Pending |
| COLL-14 | Phase 3 | Pending |
| COLL-15 | Phase 3 | Pending |
| COLL-16 | Phase 3 | Pending |
| COLL-17 | Phase 3 | Complete |
| COLL-18 | Phase 3 | Pending |
| AUTH-01 | Phase 4 | Pending |
| AUTH-02 | Phase 4 | Pending |
| AUTH-03 | Phase 4 | Pending |
| AUTH-04 | Phase 4 | Pending |
| GROUP-01 | Phase 4 | Pending |
| GROUP-02 | Phase 4 | Pending |
| GROUP-03 | Phase 4 | Pending |
| GROUP-04 | Phase 4 | Pending |
| GROUP-05 | Phase 4 | Pending |
| GROUP-06 | Phase 4 | Pending |
| SESS-01 | Phase 4 | Pending |
| SESS-02 | Phase 4 | Pending |
| SESS-03 | Phase 4 | Pending |
| SESS-04 | Phase 4 | Pending |
| SESS-05 | Phase 4 | Pending |
| SESS-06 | Phase 4 | Pending |
| GQL-01 | Phase 1 | Complete |
| GQL-02 | Phase 3 | Complete |
| GQL-03 | Phase 4 | Pending |
| GQL-04 | Phase 1 | Complete |
| GQL-05 | Phase 3 | Pending |

---
*Requirements defined: 2026-07-01*
*Source: PROJECT.md Active requirements + FEATURES.md MVP Definition & Prioritization Matrix*
