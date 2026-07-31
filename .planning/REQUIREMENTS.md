# Requirements

**Project:** boardgame-night-rails-vue
**Core Value:** Let a group of friends merge their BGG collections and pick games everyone can play for boardgame night.
**Defined:** 2026-07-13
**Updated:** 2026-07-31
**Source:** PROJECT.md + research/FEATURES.md + Phase 13 React Migration Parity research

## v1.0 Requirements (Complete)

All v1.0 requirements are complete. See v1.0 milestone artifacts for traceability.

## v1.1 Requirements

Requirements for the UI Redesign + Suggestion Engine milestone. Each maps to roadmap phases.

### Design System (DS)

- [x] **DS-01**: App uses the "Tabletop Social" Material 3 design system (Inter font, indigo `#4f46e5` primary, M3 tonal palette, Material Symbols Outlined icons)
- [x] **DS-02**: App shell has a 280px fixed sidebar (Home/Collection/Hot/Groups/Account + Settings/Logout + "New Session" primary button) with mobile drawer
- [x] **DS-03**: Cards use rounded-xl corners, soft shadows, and M3 surface tonal layering (Level 0 background, Level 1 cards with 1px border)
- [x] **DS-04**: Status badges render with semantic colors (Draft=gray, Invited=indigo, Picking=amber, Completed=green) using small-caps label-sm typography
- [x] **DS-05**: Loading states use skeleton loaders (animated pulse placeholders matching game card layout)
- [x] **DS-06**: Avatars are circular with deterministic per-username color backgrounds and white centered initials

### Home Dashboard (HOME)

- [x] **HOME-01**: Home page displays a hero section with BGG username merge input and "Merge collections" button
- [x] **HOME-02**: Home page displays a personal stats card (user's collection size, group count, session count)
- [x] **HOME-03**: Home page displays a "Trending on BGG" section with game cards (thumbnail, rating badge, rank, weight, players, play time)

### Collection View Redesign (COLL)

- [x] **COLL-19**: Collection view has a structured filter sidebar (search input, owner avatar toggles, player count range slider, play-time checkbox groups, complexity segmented buttons)
- [x] **COLL-20**: Collection game cards display thumbnail, rating badge, name, owner avatar(s), description, and 3-column stats footer (players, time, complexity)
- [x] **COLL-21**: Collection view has a sort dropdown (Name A-Z, Rating High-Low, Weight Light-Heavy, Recently Played)
- [x] **COLL-22**: Collection view has a grid/list view toggle
- [x] **COLL-23**: Collection view shows skeleton loaders during data fetching

### Group Detail (GROUP)

- [x] **GROUP-07**: Group Detail page displays group header (name, member count badge, description, "Create a night" button)
- [x] **GROUP-08**: Group Detail page displays upcoming sessions list (date blocks, status badges, session titles, time, attendee counts)
- [x] **GROUP-09**: Group Detail page displays a shared collection spotlight (4-game preview grid with owner attribution + "Browse Library" link)
- [x] **GROUP-10**: Group Detail page displays a members panel with avatars, names, roles, and a per-member action menu
- [x] **GROUP-11**: Group Detail page displays an invite link with copy-to-clipboard button

### Picking a Game (PICK)

- [x] **PICK-01**: Picking screen displays session header (title, status badge, date/time, attendee avatars with count, "Edit Details" button)
- [x] **PICK-02**: Picking screen displays "Game Suggestions (Filtered for N Players)" heading with attendee-aware filtering
- [x] **PICK-03**: Picking screen displays game suggestion cards with thumbnail, title, duration, description, player count, and "Pick this game" button

### Suggestion Engine (SUGG)

- [x] **SUGG-01**: Rails parses BGG `suggested_numplayers` poll data (Best/Recommended/Not Recommended votes per player count) and persists it to the database
- [x] **SUGG-02**: Suggestion engine produces a ranked shortlist using weighted scoring (player-count fit 40%, time fit 20%, complexity fit 20%, rating 10%, ownership diversity 10%)
- [x] **SUGG-03**: Each suggestion includes explainable reason chips (player-count fit, time fit, complexity, ownership) and a confidence indicator for thin poll data
- [x] **SUGG-04**: Suggestion engine uses BGG community poll "best player count" data instead of the v1 range heuristic for grouping/filtering
- [x] **SUGG-05**: BGG poll data is backfilled for existing BggThing records via a rate-limited background job

### Tech Debt (DEBT)

- [x] **DEBT-01**: E2E test suite runs in CI (Playwright tests execute on every PR)
- [x] **DEBT-02**: Action Cable dev config uses solid_cable adapter and Vite proxies /cable for real-time subscriptions in local dev
- [x] **DEBT-03**: Legacy BGG classes removed (duplicate `app/jobs/import_collection_job.rb`, unsafe `Bgg::CollectionPersister#fetch_and_persist!`)
- [x] **DEBT-04**: REQUIREMENTS.md checkboxes updated to reflect v1.0 implementation evidence (BGG-01, BGG-04, BGG-05, COLL-01, COLL-03, COLL-05)

## v2.0 Requirements — React Migration & Parity

Requirements for the active React Migration & Parity milestone. Each requirement maps to Phase 13 and preserves the completed Vue application's behavior, Tabletop Social design, accessibility, and responsive contracts while React becomes the only deployed frontend.

- [ ] **RMP-01**: React fully replaces Vue while preserving every existing product journey and the Tabletop Social interface
- [ ] **RMP-02**: Auth, collection merge/browse, groups, invitations, sessions, RSVP, suggestions, and game picking work end to end in React
- [ ] **RMP-03**: Frontend and Rails/GraphQL defects exposed by parity verification are repaired without weakening the existing product contracts
- [ ] **RMP-04**: React tests, GraphQL code generation, and production delivery replace Vue tooling; Vue source and dependencies are absent after parity is proven
- [ ] **RMP-05**: The existing Playwright end-to-end acceptance suite passes against the React frontend

## Carried v2.0 Requirements — Dev Blog & Architecture Docs

BLOG-01 through BLOG-05 are preserved carried scope in Phase 12. They remain part of the v2.0 milestone but are independent of the Phase 13 React execution target.

- [ ] **BLOG-01**: Research and ADR — choose a pure-Ruby static site generator engine for `docs/development/` markdown posts
- [ ] **BLOG-02**: Build a pure-Ruby SSG engine that parses markdown frontmatter, builds an index, and renders static HTML
- [ ] **BLOG-03**: Produce the first agent-drafted architecture posts in `docs/development/`
- [ ] **BLOG-04**: Integrate the static blog build into the existing Kamal 2 single-container deploy and route it to a subdomain
- [ ] **BLOG-05**: Verify the generated blog and document usage for maintainers

### Restored v1.0 Implementation Evidence

The following v1.0 requirements have implementation evidence verified against [v1.0 Milestone Audit](v1.0-MILESTONE-AUDIT.md). Evidence provenance: [Phase 11 Evidence Ledger](phases/11-polish-e2e-hardening/11-EVIDENCE.md).

- [x] **BGG-01**: Fetch BGG user collection with correct base games + expansions via two-call workaround, nil-safe XML normalization, and rate-limited/throttled/retried HTTP client
- [x] **BGG-04**: Persisted collections from N users merge into a single deduplicated view via pure database query (no live BGG on read path)
- [x] **BGG-05**: Collection imports run as Solid Queue background jobs with explicit `retry_on`/`discard_on` and concurrency `key: "bgg_api"`
- [x] **COLL-01**: N-user merge with owner color-avatars in responsive layout (desktop sidebar + mobile drawer, adaptive grid)
- [x] **COLL-03**: Fuzzy search, filter by players/time/complexity, sort by name/rating/year/complexity, and group by player-count/rating/best-players/none
- [x] **COLL-05**: Hot/trending games on landing page with well-formed game cards (thumbnail, name, rating, players, time, complexity, owner avatars, click to BGG)

## Deferred Enhanced Game Night Requirements (Future Milestone)

These ideas are not part of the active v2.0 React Migration & Parity milestone.

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
- **Dynamic M3 palette generation** — `@material/material-color-utilities` for user-defined themes; defer to a later milestone
- **Server-side search (Postgres pg_trgm/FTS)** — Fuse.js client-side is fine until shared collections exceed ~300 games

## Traceability

| REQ-ID | Phase | Status |
|--------|-------|--------|
| BGG-01 | Phase 2 | Complete |
| BGG-04 | Phase 2 | Complete |
| BGG-05 | Phase 2 | Complete |
| COLL-01 | Phase 3 | Complete |
| COLL-03 | Phase 3 | Complete |
| COLL-05 | Phase 3 | Complete |
| DS-01 | Phase 5 | Complete |
| DS-02 | Phase 5 | Complete |
| DS-03 | Phase 5 | Complete |
| DS-04 | Phase 5 | Complete |
| DS-05 | Phase 5 | Complete |
| DS-06 | Phase 5 | Complete |
| HOME-01 | Phase 9 | Complete |
| HOME-02 | Phase 9 | Complete |
| HOME-03 | Phase 9 | Complete |
| COLL-19 | Phase 9 | Complete |
| COLL-20 | Phase 9 | Complete |
| COLL-21 | Phase 9 | Complete |
| COLL-22 | Phase 9 | Complete |
| COLL-23 | Phase 9 | Complete |
| GROUP-07 | Phase 8 | Complete |
| GROUP-08 | Phase 8 | Complete |
| GROUP-09 | Phase 8 | Complete |
| GROUP-10 | Phase 8 | Complete |
| GROUP-11 | Phase 8 | Complete |
| PICK-01 | Phase 10 | Complete |
| PICK-02 | Phase 10 | Complete |
| PICK-03 | Phase 10 | Complete |
| SUGG-01 | Phase 6 | Complete |
| SUGG-02 | Phase 7 | Complete |
| SUGG-03 | Phase 7 | Complete |
| SUGG-04 | Phase 7 | Complete |
| SUGG-05 | Phase 6 | Complete |
| DEBT-01 | Phase 11 | Complete |
| DEBT-02 | Phase 11 | Complete |
| DEBT-03 | Phase 11 | Complete |
| DEBT-04 | Phase 11 | Complete |
| BLOG-01 | Phase 12 | Planned |
| BLOG-02 | Phase 12 | Planned |
| BLOG-03 | Phase 12 | Planned |
| BLOG-04 | Phase 12 | Planned |
| BLOG-05 | Phase 12 | Planned |
| RMP-01 | Phase 13 | Planned |
| RMP-02 | Phase 13 | Planned |
| RMP-03 | Phase 13 | Planned |
| RMP-04 | Phase 13 | Planned |
| RMP-05 | Phase 13 | Planned |

**Coverage:**

- v1.1 requirements: 31 total
- Mapped to phases: 31 ✓
- Unmapped: 0 ✓
- Active v2.0 milestone requirements: 10 total (5 carried BLOG + 5 RMP)
- Mapped to Phase 12: 5 ✓
- Mapped to Phase 13: 5 ✓
- Active v2.0 unmapped: 0 ✓
- Active v2.0 complete: 0/10
- Deferred Enhanced Game Night requirements: 10 (excluded from active milestone coverage)

---
*Requirements defined: 2026-07-13; reconciled for v2.0 on 2026-07-31*
*Source: PROJECT.md active milestone + research/FEATURES.md + Phase 13 RESEARCH.md derived RMP requirements*
