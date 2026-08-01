---
phase: 13-react-migration-parity
plan: 06
subsystem: ui
tags: [react, graphql, apollo, playwright, vitest, rails, theme, auth, session]

requires:
  - phase: 13-01
    provides: React project scaffold and Vite/Rails integration
  - phase: 13-02
    provides: Apollo client, generated hooks, and GraphQL contract
  - phase: 13-03
    provides: Authentication and account pages in React
  - phase: 13-04
    provides: Group detail surface and membership management in React
  - phase: 13-05
    provides: Past-session history and invite RSVP in React

provides:
  - State-driven React SessionPage covering DRAFT, INVITED, PICKING, COMPLETED, and CANCELLED states
  - Host-only schedule/start/edit/pick controls derived from authenticated user identity
  - Explainable suggestion GameCard with server-ranked reasons and isolated host pick action
  - React-only delivery guard ensuring no Vue source/runtime/codegen remains in the root build
  - Light/dark/system theme provider with Material 3 semantic surface aliases
  - Stable auth state that survives Apollo resetStore and transient query errors

affects: []

actuals:
  tokens: 5539
  tasks: 3
  commits: 9

tech-stack:
  added: []
  patterns:
    - State-driven session page branches driven by Rails state machine
    - Host authorization computed from authenticated user vs session host id
    - GameCard overlay link with pointer-events-none content and isolated nested controls
    - Theme provider persisting preference in localStorage and resolving system preference
    - E2E fixture reads after reseed to avoid static-import stale IDs

key-files:
  created:
    - app/frontend/contexts/ThemeContext.tsx
    - app/frontend/pages/HealthPage.tsx
    - tests/vitest/react-cutover.spec.ts
    - tests/vitest/session-page.spec.tsx
    - tests/vitest/game-card.spec.tsx
  modified:
    - app/frontend/pages/SessionPage.tsx
    - app/frontend/components/game-card.tsx
    - app/frontend/contexts/AuthContext.tsx
    - app/frontend/pages/GroupsPage.tsx
    - app/frontend/pages/AccountPage.tsx
    - app/frontend/components/site-nav.tsx
    - app/frontend/components/theme-toggle.tsx
    - app/frontend/styles.css
    - app/frontend/index.html
    - app/frontend/App.tsx
    - app/frontend/lib/graphql/documents.ts
    - app/frontend/generated/operations.ts
    - app/frontend/lib/graphql/adapters.ts
    - app/frontend/lib/data.ts
    - tests/e2e/session_lifecycle.spec.ts
    - tests/e2e/full_user_flow.spec.ts
    - tests/e2e/group_detail.spec.ts
    - tests/e2e/shell.spec.ts
    - tests/e2e/theme.spec.ts
    - tests/vitest/auth-context.spec.tsx
    - tests/vitest/adapters.spec.ts
    - app/graphql/types/night_session_type.rb
    - README.md

key-decisions:
  - "Moved SessionPage from placeholder to generated Apollo hooks and state-driven rendering so Rails owns the lifecycle authority"
  - "Extended GameCard with optional suggestion context instead of forking it, preserving the Phase 11 collection rendering contract"
  - "Added a filesystem-level React cutover guard to make the no-Vue production contract enforceable in CI"
  - "Switched AuthContext from onCompleted to useEffect-driven hydration so token/user state survives resetStore after signup/signin"
  - "Defaulted the app theme to light to match E2E accessibility contracts and added M3 surface aliases for theme assertions"
  - "Read E2E fixtures dynamically after reseed so static import caching cannot use stale session IDs"

patterns-established:
  - "Session pages derive host controls from authenticated user id vs host.id while still relying on server authorization"
  - "Suggestion reasons flow through the existing toSuggestion adapter; the UI only renders the {ok,label} shape"
  - "GameCard nested controls stop propagation and are pointer-events-auto islands over a pointer-events-none overlay link"
  - "Theme preference is stored under boardgame-night:theme and resolved before React hydration via index.html script"

requirements-completed:
  - RMP-01
  - RMP-02
  - RMP-03
  - RMP-04
  - RMP-05

coverage:
  - id: D1
    description: "State-driven React SessionPage covering DRAFT scheduling, INVITED start, PICKING suggestions, COMPLETED summary, and CANCELLED state with host authorization"
    requirement: RMP-01
    verification:
      - kind: unit
        ref: "tests/vitest/session-page.spec.tsx#Draft owner, Invited owner, Invited member, Picking host, Picking member, Completed, Cancelled, Loading, Missing session"
        status: pass
      - kind: e2e
        ref: "tests/e2e/session_lifecycle.spec.ts#picking lifecycle: host edits, member views, host picks, completed summary"
        status: pass
    human_judgment: false

  - id: D2
    description: "Explainable suggestion GameCard with server score, confidence, reason chips, Show more reasons disclosure, and isolated host Pick this game action"
    requirement: RMP-02
    verification:
      - kind: unit
        ref: "tests/vitest/game-card.spec.tsx#Suggestion GameCard renders score/confidence/reasons, Show more reasons toggles, Pick this game fires onPick"
        status: pass
      - kind: e2e
        ref: "tests/e2e/theme.spec.ts#Full-card BGG overlay click and safe link attributes"
        status: pass
    human_judgment: false

  - id: D3
    description: "React-only production delivery with no Vue source files, no Vue runtime/Apollo/codegen dependencies, React Vite entry, and concrete routes"
    requirement: RMP-03
    verification:
      - kind: unit
        ref: "tests/vitest/react-cutover.spec.ts#no .vue files, no Vue packages, React main entry, concrete routes"
        status: pass
      - kind: integration
        ref: "npm run build"
        status: pass
    human_judgment: false

  - id: D4
    description: "Accessible light/dark/system theme provider with persisted preference and M3 semantic surface color variables"
    requirement: RMP-04
    verification:
      - kind: e2e
        ref: "tests/e2e/theme.spec.ts#persists an accessible appearance choice before mount and keeps redesigned surfaces usable in both themes"
        status: pass
    human_judgment: false

  - id: D5
    description: "Stable authentication state across signup, signin, Apollo resetStore, and transient query errors"
    requirement: RMP-05
    verification:
      - kind: unit
        ref: "tests/vitest/auth-context.spec.tsx#hydrates user, does not clear token on transient query error, signOut clears user and token"
        status: pass
      - kind: e2e
        ref: "tests/e2e/full_user_flow.spec.ts#signup -> create group -> verify group page"
        status: pass
    human_judgment: false

duration: 151min
completed: 2026-08-02
status: complete
---

# Phase 13 Plan 06: React Session Lifecycle & Cutover Summary

**React-only session lifecycle (draft → invited → picking → completed) with explainable suggestions, host authorization, and full parity gate verification.**

## Performance

- **Duration:** 151 min (2h 31m)
- **Started:** 2026-08-01T14:46:28Z (first task commit)
- **Completed:** 2026-08-01T17:17:33Z
- **Tasks:** 3
- **Files modified:** 30

## Accomplishments

- Built a state-driven `SessionPage` that renders DRAFT, INVITED, PICKING, COMPLETED, and CANCELLED states using generated React Apollo hooks.
- Implemented host-only `Schedule & send invites`, `Start picking`, `Edit Details`, and `Pick this game` controls derived from the authenticated user id versus `nightSession.host.id`.
- Added explainable suggestion rendering to `GameCard` with server score, confidence, reason chips, a keyboard-operable `Show more reasons` disclosure, and an isolated host pick action that preserves the existing collection card overlay/link model.
- Added `tests/vitest/react-cutover.spec.ts` to enforce the React-only production contract: no `.vue` files, no Vue runtime/compiler/Apollo packages, React `main.tsx` entry, and concrete routes for all required pages.
- Updated README active-project wording from Vue to React as part of the cutover documentation.
- Implemented a `ThemeProvider` and Account page Appearance controls supporting light/dark/system persistence; added M3 semantic surface CSS aliases so theme E2E assertions pass.
- Refactored `AuthContext` to use data-driven hydration via `useEffect`, keeping the token and user stable through `apolloClient.resetStore()` and transient query errors.
- Fixed E2E test fixture staleness by reading fixture JSON dynamically after reseed.

## Task Commits

Each task was committed atomically (TDD RED/GREEN pairs followed by integration fixes):

1. **Task 1: SessionPage DRAFT/INVITED lifecycle** — `b3b99d2` (test), `ce51353` (feat)
2. **Task 2: Picking/Completed flow and GameCard suggestions** — `647506f` (test), `a0b0f31` (feat)
3. **Task 3: React cutover guard + README** — `3abdaa7` (test), `f528bb2` (docs)

**Integration / parity fixes discovered during full-gate verification:**

- `5fece9b` — fix(13-06): integration fixes for session lifecycle E2E
- `1b71ce2` — fix(13-06): React parity fixes for auth state, theme, nav, and E2E fixtures
- `b8741a4` — fix(13-06): keep auth state stable after query errors and update unit tests

## Files Created/Modified

- `app/frontend/pages/SessionPage.tsx` — State-driven session lifecycle page
- `app/frontend/components/game-card.tsx` — Optional suggestion context + isolated pick action
- `app/frontend/contexts/ThemeContext.tsx` — Light/dark/system theme provider
- `app/frontend/pages/HealthPage.tsx` — Server health round-trip page
- `app/frontend/contexts/AuthContext.tsx` — Stable token/user hydration
- `app/frontend/pages/GroupsPage.tsx` — Inline create-group form for empty state
- `app/frontend/pages/AccountPage.tsx` — Appearance section with theme toggle group
- `app/frontend/components/site-nav.tsx` — Mobile drawer with test id
- `app/frontend/components/theme-toggle.tsx` — Theme toggle using context
- `app/frontend/styles.css` — Light default theme + M3 surface aliases
- `app/frontend/index.html` — Pre-hydration theme script defaulting to light
- `app/frontend/App.tsx` — Theme provider, /health route
- `app/frontend/lib/graphql/documents.ts` — HEALTH_CHECK, session mutations
- `app/frontend/generated/operations.ts` — Generated Apollo operations
- `app/frontend/lib/graphql/adapters.ts` — Suggestion adapter updates
- `app/frontend/lib/data.ts` — Type updates
- `app/graphql/types/night_session_type.rb` — Expose host id for client authorization
- `tests/vitest/session-page.spec.tsx` — SessionPage unit tests
- `tests/vitest/game-card.spec.tsx` — GameCard suggestion tests
- `tests/vitest/react-cutover.spec.ts` — React-only delivery guard
- `tests/vitest/auth-context.spec.tsx` — Updated AuthContext tests
- `tests/vitest/adapters.spec.ts` — Adapter test updates
- `tests/e2e/session_lifecycle.spec.ts` — Full picking lifecycle E2E
- `tests/e2e/full_user_flow.spec.ts` — Signup/create group flow locators
- `tests/e2e/group_detail.spec.ts` — Dynamic fixture read after reseed
- `tests/e2e/shell.spec.ts` — Top nav / mobile drawer assertions
- `tests/e2e/theme.spec.ts` — Theme persistence and surface assertions
- `README.md` — Active frontend wording updated to React

## Decisions Made

- **Session state authority stays on Rails.** The React page branches on `nightSession.state` and derives host controls from `user.id === host.id`; mutations still pass through server authorization and lifecycle validation.
- **GameCard suggestion context is additive.** Suggestion props are optional so collection grid/list rendering remains unchanged; the host pick action is a nested pointer-events-auto island.
- **Cutover guard is a Vitest test.** A filesystem contract in the test suite gives CI an enforceable failure when Vue artifacts reappear.
- **Auth state is data-driven, not callback-driven.** Relying on `useEffect` from `currentUserData` keeps the token in place during `resetStore` after sign-in/sign-up and prevents transient GraphQL errors from logging the user out.
- **Default theme is light.** This matches the E2E accessibility baseline; users can still switch to dark or system.
- **E2E fixtures are read after reseed.** Static imports cache the JSON at module load, so dynamic reads inside `beforeAll` guarantee IDs match the freshly seeded database.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Auth state lost after sign-up / resetStore**
- **Found during:** Task 3 full-gate verification (`full_user_flow.spec.ts`)
- **Issue:** The original `AuthContext` set user in `useQuery` `onCompleted` and removed the token on query error; after `apolloClient.resetStore()` the current-user query could error briefly and wipe authentication.
- **Fix:** Refactored `AuthContext` to store token in React state, hydrate the user via `useEffect` from `currentUserData`, and only remove the token when the server explicitly returns `currentUser: null`.
- **Files modified:** `app/frontend/contexts/AuthContext.tsx`
- **Verification:** `full_user_flow.spec.ts` passed; unit tests updated and passed.
- **Committed in:** `1b71ce2`, `b8741a4`

**2. [Rule 2 - Missing Critical] Theme system default and M3 aliases**
- **Found during:** Task 3 full-gate verification (`theme.spec.ts`)
- **Issue:** No theme provider existed; default was dark; CSS variables `--md-sys-color-surface` / `--md-sys-color-on-surface` were missing, causing theme E2E failures.
- **Fix:** Created `ThemeContext`, wired `theme-toggle.tsx` and Account page Appearance controls, defaulted to light in `index.html`, `ThemeContext`, and `styles.css`, and added M3 semantic aliases.
- **Files modified:** `app/frontend/contexts/ThemeContext.tsx`, `app/frontend/components/theme-toggle.tsx`, `app/frontend/pages/AccountPage.tsx`, `app/frontend/styles.css`, `app/frontend/index.html`
- **Verification:** `theme.spec.ts` passed.
- **Committed in:** `1b71ce2`

**3. [Rule 3 - Blocking] Missing health page route**
- **Found during:** Task 3 full-gate verification (`health.spec.ts`)
- **Issue:** The E2E health spec expected a `/health` route and `HEALTH_CHECK` query that did not exist.
- **Fix:** Added `HealthPage`, `HEALTH_CHECK` document, and `/health` route in `App.tsx`.
- **Files modified:** `app/frontend/pages/HealthPage.tsx`, `app/frontend/lib/graphql/documents.ts`, `app/frontend/App.tsx`
- **Verification:** `health.spec.ts` passed.
- **Committed in:** `1b71ce2`

**4. [Rule 3 - Blocking] Full user flow could not create a group from empty state**
- **Found during:** Task 3 full-gate verification (`full_user_flow.spec.ts`)
- **Issue:** The `/groups` empty state had no create-group form, so the sign-up → create-group flow failed.
- **Fix:** Added an inline `CreateGroupForm` to the `GroupsPage` empty state.
- **Files modified:** `app/frontend/pages/GroupsPage.tsx`
- **Verification:** `full_user_flow.spec.ts` passed.
- **Committed in:** `1b71ce2`

**5. [Rule 1 - Bug] Group detail navigation timed out due to stale fixture IDs**
- **Found during:** Task 3 full-gate verification (`group_detail.spec.ts`)
- **Issue:** The test statically imported `e2e_group.json`; `bin/e2e-seed` updates the fixture on disk, so the imported object contained stale session IDs.
- **Fix:** Changed `group_detail.spec.ts` (and `theme.spec.ts`) to reseed and then read the fixture dynamically inside `beforeAll`.
- **Files modified:** `tests/e2e/group_detail.spec.ts`, `tests/e2e/theme.spec.ts`
- **Verification:** `group_detail.spec.ts` and `theme.spec.ts` passed.
- **Committed in:** `1b71ce2`

**6. [Rule 1 - Bug] Mobile shell test failed due to bottom tab bar and missing mobile menu scope**
- **Found during:** Task 3 full-gate verification (`shell.spec.ts`)
- **Issue:** The test asserted no `Collection` link on mobile, but the new bottom tab bar always shows one; the hamburger drawer also had no stable test id.
- **Fix:** Added `data-testid="mobile-menu"` to the drawer and scoped assertions to it.
- **Files modified:** `app/frontend/components/site-nav.tsx`, `tests/e2e/shell.spec.ts`
- **Verification:** `shell.spec.ts` passed.
- **Committed in:** `1b71ce2`

**7. [Rule 1 - Bug] Theme E2E game-card assertions failed missing role/link attributes**
- **Found during:** Task 3 full-gate verification (`theme.spec.ts`)
- **Issue:** `GameCard` used a native `<article>` without `role="article"` and the BGG overlay link lacked `data-testid="game-card-link"`.
- **Fix:** Added explicit `role="article"` and `data-testid="game-card-link"` to the overlay anchor.
- **Files modified:** `app/frontend/components/game-card.tsx`
- **Verification:** `theme.spec.ts` passed.
- **Committed in:** `1b71ce2`

---

**Total deviations:** 7 auto-fixed (3 Rule 1 bugs, 2 Rule 2 missing critical, 2 Rule 3 blocking)
**Impact on plan:** All fixes were necessary for the full parity gate to pass against the real Rails/GraphQL stack. No scope creep beyond the React-only delivery contract.

## Issues Encountered

- The full Playwright suite surfaced several cross-cutting parity gaps (auth, theme, nav, fixtures) rather than a single session-page defect. Each was traced to its owning file and repaired with a regression test or existing test update.
- `AuthContext` unit tests were tightly coupled to the old `onCompleted`/`onError` implementation; they were rewritten to exercise the new data-driven hydration path.
- Fixture staleness was non-obvious because static imports are cached at module evaluation; switching to dynamic reads inside `beforeAll` eliminated the class of failure.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Phase 13 (React Migration & Parity) is complete. The milestone v2.0 deliverable is a React-only frontend backed by the existing Rails GraphQL API.
- All gates pass: typecheck, Vitest, production build, RSpec, and full serialized Playwright.
- Recommended next step: run `/gsd-ship` or milestone completion to prepare the v2.0 release branch.

---
*Phase: 13-react-migration-parity*
*Completed: 2026-08-02*
