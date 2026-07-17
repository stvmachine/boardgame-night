# Requirements

**Project:** boardgame-night-rails-vue
**Core Value:** Let a group of friends merge their BGG collections and pick games everyone can play for boardgame night.
**Defined:** 2026-07-13
**Source:** PROJECT.md + research/FEATURES.md (v1.1 UI Redesign + Suggestion Engine)

## v1.0 Requirements (Complete)

All v1.0 requirements are complete. See v1.0 milestone artifacts for traceability.

## v1.1 Requirements

Requirements for the UI Redesign + Suggestion Engine milestone. Each maps to roadmap phases.

### Design System (DS)

- [x] **DS-01**: App uses the "Tabletop Social" Material 3 design system (Inter font, indigo `#4f46e5` primary, M3 tonal palette, Material Symbols Outlined icons)
- [ ] **DS-02**: App shell has a 280px fixed sidebar (Home/Collection/Hot/Groups/Account + Settings/Logout + "New Session" primary button) with mobile drawer
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

- [ ] **PICK-01**: Picking screen displays session header (title, status badge, date/time, attendee avatars with count, "Edit Details" button)
- [ ] **PICK-02**: Picking screen displays "Game Suggestions (Filtered for N Players)" heading with attendee-aware filtering
- [ ] **PICK-03**: Picking screen displays game suggestion cards with thumbnail, title, duration, description, player count, and "Pick this game" button

### Suggestion Engine (SUGG)

- [x] **SUGG-01**: Rails parses BGG `suggested_numplayers` poll data (Best/Recommended/Not Recommended votes per player count) and persists it to the database
- [x] **SUGG-02**: Suggestion engine produces a ranked shortlist using weighted scoring (player-count fit 40%, time fit 20%, complexity fit 20%, rating 10%, ownership diversity 10%)
- [x] **SUGG-03**: Each suggestion includes explainable reason chips (player-count fit, time fit, complexity, ownership) and a confidence indicator for thin poll data
- [x] **SUGG-04**: Suggestion engine uses BGG community poll "best player count" data instead of the v1 range heuristic for grouping/filtering
- [x] **SUGG-05**: BGG poll data is backfilled for existing BggThing records via a rate-limited background job

### Tech Debt (DEBT)

- [ ] **DEBT-01**: E2E test suite runs in CI (Playwright tests execute on every PR)
- [ ] **DEBT-02**: Action Cable dev config uses solid_cable adapter and Vite proxies /cable for real-time subscriptions in local dev
- [ ] **DEBT-03**: Legacy BGG classes removed (duplicate `app/jobs/import_collection_job.rb`, unsafe `Bgg::CollectionPersister#fetch_and_persist!`)
- [ ] **DEBT-04**: REQUIREMENTS.md checkboxes updated to reflect v1.0 implementation evidence (BGG-01, BGG-04, BGG-05, COLL-01, COLL-03, COLL-05)

## v2 Requirements (Deferred — Add After Validation)

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
| DS-01 | Phase 5 | Complete |
| DS-02 | Phase 5 | Pending |
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
| PICK-01 | Phase 10 | Pending |
| PICK-02 | Phase 10 | Pending |
| PICK-03 | Phase 10 | Pending |
| SUGG-01 | Phase 6 | Complete |
| SUGG-02 | Phase 7 | Complete |
| SUGG-03 | Phase 7 | Complete |
| SUGG-04 | Phase 7 | Complete |
| SUGG-05 | Phase 6 | Complete |
| DEBT-01 | Phase 11 | Pending |
| DEBT-02 | Phase 11 | Pending |
| DEBT-03 | Phase 11 | Pending |
| DEBT-04 | Phase 11 | Pending |

**Coverage:**

- v1.1 requirements: 31 total
- Mapped to phases: 31 ✓
- Unmapped: 0 ✓

---
*Requirements defined: 2026-07-13*
*Source: PROJECT.md v1.1 Active requirements + research/FEATURES.md v1.1 feature landscape*
