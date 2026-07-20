# Phase 11 — UI Review

**Audited:** 2026-07-19
**Baseline:** Phase 5 `05-UI-SPEC.md`, Phase 9 `09-UI-SPEC.md`, Phase 10 `10-UI-SPEC.md`, Phase 11 `11-CONTEXT.md`, Phase 11-04 `PLAN.md`/`SUMMARY.md`
**Screenshots:** not captured (no Rails/Vite dev server running on 3000/5173; port 8080 is qBittorrent, not the app)
**Test evidence reviewed:** `spec/frontend/GameCard.spec.ts` (28 tests), `tests/e2e/theme.spec.ts` (responsive/dark matrix), `tests/e2e/playwright.config.ts`, `test-results/.last-run.json` (`status: "passed"`), `.github/workflows/ci.yml`
**Verdict:** **FLAG** — the redesigned core surfaces pass their contract and the protected Playwright matrix is green, but legacy auth/group/invite/session surfaces still carry hardcoded Tailwind colors and div-with-`role="button"` patterns that violate the approved M3 design system and accessibility contract.

---

## Pillar Scores

| Pillar | Score | Key Finding |
|--------|-------|-------------|
| 1. Copywriting | 3/4 | Core redesigned surfaces match the copy contract; minor inconsistencies in auth/session legacy surfaces and empty-state casing. |
| 2. Visuals | 2/4 | Home, Collection, Group Detail, and Picking have clear hierarchy; legacy surfaces (Login, Signup, Invite, Groups, HotList, RSVP dashboard) look visually disconnected. |
| 3. Color | 2/4 | M3 semantic tokens hold on redesigned surfaces, but hardcoded `indigo-600`, `red-600`, `neutral-*` colors in legacy surfaces break the 60/30/10 contract and dark mode. |
| 4. Typography | 3/4 | Mostly locked to the 4-size/2-weight scale; `AccountView` h1 uses `text-2xl` (24px) not declared in the contract, and some arbitrary `text-[28px]` values exist. |
| 5. Spacing | 3/4 | 4px scale is respected; phase-specific widths (`264px`, `280px`, `300px`, `360px`) and `min-h-[44px]` touch targets are applied correctly. |
| 6. Experience Design | 3/4 | Loading/error/empty/disabled states and theme persistence are covered; GameCard link/control isolation is correct; remaining `role="button"` cards and reduced-motion gaps are regressions. |

**Overall: 16/24**

---

## Top 3 Priority Fixes

1. **Migrate legacy auth/group/invite/session surfaces to semantic M3 tokens** — `LoginForm`, `SignupForm`, `GroupsView`, `InviteView`, `SessionEditor`, `SessionSummary`, `RsvpDashboard`, `HotList`, and `GroupList` use hardcoded `indigo-600`, `red-600`, `neutral-*`, and `bg-white`. These break the approved 60/30/10 palette, fail dark-mode adaptation, and create visual inconsistency across the app. Replace with `bg-primary`, `text-error`, `bg-surface`, `text-on-surface`, etc.
2. **Replace div-with-`role="button"` external/internal links with semantic anchors or `RouterLink`** — `TrendingGameCard.vue`, `GroupCollectionSpotlight.vue`, and `GroupSessionsList.vue` implement clickable cards/rows as `<div role="button" tabindex="0">` with custom `window.open` or `router.push` handlers. This forces manual keyboard/event handling, breaks right-click/new-tab expectations, and is less robust than the `GameCard` anchor-overlay pattern. Convert to semantic `<a>`/`<RouterLink>` where appropriate.
3. **Add `prefers-reduced-motion` transition-duration suppression to card hover transitions** — `GameCard.vue` removes the `translate-y` under reduced motion but keeps `transition-all duration-300`; `TrendingGameCard.vue` and `GroupCollectionSpotlight.vue` have no reduced-motion guard at all. Wrap the duration or add `motion-reduce:transition-none`/`motion-reduce:duration-150` so the hover transform/shadow transition collapses to ≤150ms as the spec requires.

---

## Detailed Findings

### Pillar 1: Copywriting (3/4)

**Evidence audited:** `HomeHero.vue`, `StatsCard.vue`, `TrendingGames.vue`, `CollectionView.vue`, `GamePicker.vue`, `PickingSessionHeader.vue`, `EmptyState.vue`, `AccountView.vue`, `LoginView.vue`, `SignupView.vue`, `InviteView.vue`, `GroupsView.vue`, `RsvpDashboard.vue`, `SessionSummary.vue`.

**What passes:**
- Home hero headline matches `09-UI-SPEC.md`: **“Merge board game collections”** (`HomeHero.vue:11`).
- Primary sidebar CTA remains **“New Session”** (`NavSidebarContent.vue:92`).
- Empty states match the contract: **“No games found”** / **“Try clearing filters or selecting more collectors.”** (`CollectionView.vue:200-203`), **“No confirmed players yet”** / **“Once guests RSVP Going, suggestions will appear here.”** (`GamePicker.vue:132-134`).
- Picking copy matches `10-UI-SPEC.md`: **“Game Suggestions (Filtered for N Players)”**, **“Up to N min”**, **“Pick this game”**, **“Picking…”**, **“The host will choose the game.”** (`GamePicker.vue:44-46`, `180-189`).

**What flags:**
- Inconsistent sign-in verb: the contract wants **“Sign in”** on the stats prompt (`09-UI-SPEC.md`), but the auth route uses **“Log in”** (`LoginView.vue:17`, `LoginForm.vue:82`) and the nav item is **“Log in”** (`NavSidebarContent.vue:193`). Pick one term and align it across the spec.
- Empty-state casing drifts: `CollectorsSection.vue` and `NavSidebarContent.vue` render **“No collectors selected.”** (with a trailing period), while `RsvpDashboard.vue` uses **“No responses yet.”** Trailing periods on standalone empty-state labels are not used in the spec-approved empty copy.
- `AccountView.vue` BGG bind error is **“BGG user not found”**; this is fine but was not in the original copy contract. If it becomes user-facing, it should match the contract phrase **“We couldn't find a BGG user named `{username}`."** from `09-UI-SPEC.md`.

### Pillar 2: Visuals (2/4)

**Evidence audited:** `HomeView.vue`, `CollectionView.vue`, `GroupView.vue`, `NightSessionView.vue`, `GamePicker.vue`, `PickingSessionHeader.vue`, `GameCard.vue`, `TrendingGameCard.vue`, `GroupCollectionSpotlight.vue`, `GroupSessionsList.vue`, `RsvpDashboard.vue`, `AppShell.vue`, `NavSidebar.vue`, `NavDrawer.vue`, `AppNav.vue`, `HotList.vue`.

**What passes:**
- Redesigned surfaces have a clear three-level hierarchy: page `h1` → section `h2` → card `h3`. Examples: `HomeHero.vue:10` (h1), `TrendingGames.vue:29` (h2), `GameCard.vue:157/256` (h3); `PickingSessionHeader.vue:66` (h1), `GamePicker.vue:75` (h2).
- `AppShell`/`NavSidebar`/`NavDrawer` implement the Phase 5 shell contract: 280px fixed desktop sidebar, hidden on mobile, hamburger opens a sheet (`AppShell.vue:10`, `NavSidebar.vue:8`, `NavDrawer.vue:12-27`).
- `CollectionView.vue` matches the workspace hierarchy: 264px sticky `aside` at `xl:`, filter sheet below `xl:`, toolbar → chips → results (`CollectionView.vue:167-188`).
- `GameCard.vue` has a clean focal point (thumbnail + title + footer) and no nested interactive container issues: the container is `role="article"`, the BGG anchor is a single absolute overlay, and the action slot/disclosure are sibling controls above it (`GameCard.vue:128-145`).
- Icon-only buttons carry `aria-label` (e.g., `NavDrawer.vue:18` **“Open navigation”**, `CollectionView.vue:178` **“Open filters”**, `ViewModeToggle.vue` **“Grid view” / “List view”**).

**What flags:**
- `TrendingGameCard.vue`, `GroupCollectionSpotlight.vue`, and `GroupSessionsList.vue` continue the old div-as-button anti-pattern. They implement whole-card or row activation with `role="button"`, `tabindex="0"`, and custom `@keydown`/`@click` handlers. This is exactly the pattern Phase 11 corrected in `GameCard`; these cards should be refactored to the anchor-overlay pattern or use `RouterLink`.
- `RsvpDashboard.vue` uses `bg-white` cards with `text-neutral-*` labels, making it visually disconnected from the `bg-surface-container` card language of the redesigned surfaces.
- `HotList.vue` and `GroupList.vue` are still using the pre-Phase 9 visual language (`rounded-lg border border-neutral-200 bg-white`, `text-neutral-800`, etc.) and do not participate in the M3 surface/elevation system.
- `AccountView.vue` page title is `text-2xl` (24px) and visually smaller than the 28px Display headings used elsewhere; it should be `text-[28px]` or a `Display` token to preserve hierarchy.

### Pillar 3: Color (2/4)

**Evidence audited:** `entrypoints/styles.css`, `GameCard.vue`, `HomeHero.vue`, `StatsCard.vue`, `TrendingGames.vue`, `CollectionView.vue`, `GamePicker.vue`, `PickingSessionHeader.vue`, `LoginForm.vue`, `SignupForm.vue`, `InviteView.vue`, `GroupsView.vue`, `SessionEditor.vue`, `SessionSummary.vue`, `RsvpDashboard.vue`, `HotList.vue`, `GroupList.vue`, `RefreshButton.vue`, `NightSessionView.vue`.

**What passes:**
- `styles.css` contains the full M3 light/dark token palette generated from the indigo `#4f46e5` seed, with a 60/30/10 split: surface `#fcf8ff` / `#131318`, surface-container `#f0ecf4` / `#201f25`, primary `#5a5892` / `#c3c0ff` (`styles.css:101-236`).
- Redesigned components use semantic tokens only: `bg-surface-container`, `text-on-surface`, `border-outline`, `text-primary`, `text-on-surface-variant`, etc.
- Accent (`primary`) is reserved correctly on redesigned surfaces: active nav (`AppNav.vue:28`), primary buttons (`Button.vue`), links, focus rings, and the Invited badge (`Badge.vue`).
- Dark-mode resolution is verified by `tests/e2e/theme.spec.ts`: it asserts `html.dark` class, `html.style.colorScheme`, and non-empty `--md-sys-color-surface` / `--md-sys-color-on-surface` across all four redesigned routes at both 375px and 1280px.

**What flags (significant):**
- Hardcoded Tailwind palette classes appear in many legacy surfaces (search: `rg "bg-(indigo|red|neutral|blue|green|yellow|gray|slate|zinc|stone|orange|amber|emerald|teal|cyan|sky|violet|purple|fuchsia|pink|rose)-[0-9]{3,4}" app/frontend -g "*.vue"`):
  - `LoginForm.vue:64,68` — `text-red-600`, `bg-indigo-600`.
  - `SignupForm.vue:76,80` — `text-red-600`, `bg-indigo-600`.
  - `HotList.vue:9,13,25,31,33,37,38` — `text-neutral-800`, `bg-neutral-200`, `border-neutral-200`, `bg-white`, `group-hover:text-indigo-600`, etc.
  - `GroupList.vue:26,29,30,32,33` — `bg-white`, `border-neutral-200`, `text-neutral-800`, `text-neutral-500`, `text-indigo-700`, `bg-indigo-50`.
  - `RsvpDashboard.vue:26,27,28,31,32,36,37,44` — `bg-white`, `text-neutral-600/900/700/500`, `shadow-sm`.
  - `SessionEditor.vue:38,43,49,55,60,65,70,82,90` — `border-red-200`, `bg-red-50`, `text-neutral-700`, `border-neutral-300`, `bg-indigo-600`.
  - `SessionSummary.vue:45,46,47,50,56,73,79,85,90,97,107,112,119,130,140` — `text-neutral-900/500/700/600`, `bg-neutral-100`, `border-neutral-200`.
  - `GroupsView.vue:33,34,37,44,49,55,59,65,74,75` — `bg-white`, `border-neutral-200`, `text-neutral-800/700/500`, `bg-indigo-600`.
  - `InviteView.vue:75,83,85,86,89,92,115,116,123,124,162,163,180,181` — `text-neutral-500`, `border-neutral-200`, `text-neutral-800`, `bg-indigo-600`, `border-neutral-300`, `text-neutral-700`.
  - `NightSessionView.vue:166,167,176,177,185,186,231,232,329,330` — `bg-indigo-600`, `bg-neutral-100`, `text-neutral-700`, `bg-red-600`.
  - `RefreshButton.vue:77,78` — `bg-indigo-600`, `bg-neutral-200`, `text-neutral-500`.
- These hardcoded colors break dark-mode adaptation and the 60/30/10 distribution on the very first screens a new user sees (Login/Signup) and several authenticated flows (Groups, Invite, Session editor/summary). They are a direct violation of the Phase 5 and Phase 9 contracts.

### Pillar 4: Typography (3/4)

**Evidence audited:** all view and component files; grep for `text-*` and `font-*` classes.

**What passes:**
- The dominant sizes are the four declared in the contract: `text-sm` (14px), `text-base` (16px), `text-xl` (20px), and `text-[28px]` (Display 28px). Counts show `text-sm` and `text-base` dominate; headings use `text-xl` or `text-[28px]`.
- Weights are limited to `font-normal` (400) and `font-semibold` (600) / `font-bold` (700) with `font-semibold` as the dominant heading/label weight. The contract’s two-weight target is largely met.
- No italic headings were found; emphasis is carried by weight and color, satisfying the Hallmark typography rule.
- Badge copy uses the expected 14px/600 uppercase small-caps treatment (`Badge.vue`/`badge/index.ts`).

**What flags:**
- `AccountView.vue:59` uses `text-2xl` (24px) for the page `h1`, which is not one of the four declared sizes (Body 16, Label 14, Heading 20, Display 28). It should be `text-[28px]` or a `Display` token to match the spec and the other page `h1`s (`HomeHero.vue`, `GroupHeader.vue`, `PickingSessionHeader.vue`).
- Arbitrary `text-[28px]` is used in several places (`HomeHero.vue:10`, `StatsCard.vue:53`, `PickingSessionHeader.vue:66`, `GroupHeader.vue:26`). This is acceptable as a one-off for the Display role, but it is not a named token class. Consider adding a `text-display` utility to the theme to eliminate the magic number.
- `text-xs` appears in several places (e.g., `TrendingGameCard.vue:84`, `GameCard.vue:186/280` reason chips). The contract only allows a 10px micro-token for avatars ≤20px; using `text-xs` (12px) for body-adjacent meta text is a minor deviation from the 4-size contract.
- `font-mono` appears in `GroupList.vue:33` for the invite-code token; the contract specifies Inter only. A monospace token is acceptable for an invite code, but it is not declared in the contract.

### Pillar 5: Spacing (3/4)

**Evidence audited:** all view and component files; grep for `p-`, `m-`, `gap-`, `space-`, and arbitrary spacing values.

**What passes:**
- The 4px scale is followed consistently. Common values: `p-4` (16px), `p-6` (24px), `gap-6` (24px), `space-y-4` (16px), `mt-6` (24px), `mt-12` (48px = 2xl), `space-y-6` (24px). These map to the declared `xs/sm/md/lg/xl/2xl/3xl` scale.
- Phase-specific widths from the specs are respected: desktop sidebar `w-[280px]` (`NavSidebar.vue:8`), filter panel `w-[264px]` (`CollectionView.vue:169`), mobile filter Sheet `w-[300px] sm:w-[360px]` (`CollectionView.vue:218`).
- Minimum 44px touch targets are applied: `min-h-[44px] min-w-[44px]` on the Appearance toggle items (`AccountView.vue:93,97,101`), `min-h-[44px]` on the suggestion retry button (`GamePicker.vue:122`), `min-h-[44px]` on the pick button (`GamePicker.vue:179`).
- `AppShell.vue` uses `md:ml-[280px]` to reserve the desktop sidebar; no arbitrary negative margins were found.
- Responsive breakpoints match the spec: `sm:`, `md:`, `lg:`, `xl:` are used for the approved verification widths; the Playwright matrix explicitly tests 375px and 1280px.

**What flags:**
- Several legacy form views use hand-rolled input spacing instead of the `Input` primitive (`LoginForm.vue`, `SignupForm.vue`, `InviteView.vue`, `GroupsView.vue`). This is not a spacing-scale violation per se, but it produces inconsistent input padding/heights across the app.
- `GameGrid.vue:50` uses `grid-cols-[repeat(auto-fill,minmax(180px,1fr))]`. The spec specifies grid density by breakpoint for Collection: 1 below `sm`, 2 at `sm–md`, 3 at `md–lg`, 4 at `lg–xl`, 5 at `xl+`. The auto-fill pattern does not enforce that exact breakpoint behavior and may produce 5+ columns at intermediate widths.

### Pillar 6: Experience Design (3/4)

**Evidence audited:** `GameCard.vue`, `GameCard.spec.ts`, `theme.spec.ts`, `GamePicker.vue`, `GameGrid.vue`, `EmptyState.vue`, `ResultsSkeleton.vue`, `PickingSessionHeader.vue`, `SessionDetailsEditor.vue`, `NavDrawer.vue`, `ui.ts`, `entrypoints/application.ts`, `styles.css`.

**What passes:**
- **Loading states:** `GameGrid.vue` renders `ResultsSkeleton` in grid/list variants (`GameGrid.vue:46-52`). `GamePicker.vue` renders 8 suggestion skeletons matching card anatomy (`GamePicker.vue:86-111`). `TrendingGames.vue` and `StatsCard.vue` use `Skeleton` (`StatsCard.vue:25-30`, `TrendingGames.vue:40-51`).
- **Error states:** `GamePicker.vue` shows **“Couldn't load suggestions”** with a retry button (`GamePicker.vue:113-128`). `SessionDetailsEditor.vue` focuses the error summary and disables controls while loading (`SessionDetailsEditor.vue:181-184`, `277-286`). `EmptyState.vue` is used for no-results/no-data states.
- **Empty states:** handled for collection, picking, group sessions, group members, and collectors.
- **Disabled states:** `GamePicker.vue` disables all pick buttons while one mutation is in flight and adds `aria-busy` to the active button (`GamePicker.vue:180-181`). `LoginForm.vue`/`SignupForm.vue` disable submit while loading.
- **Theme control:** `AccountView.vue` exposes Light/Dark/System via a `ToggleGroup` (`AccountView.vue:82-106`). `ui.ts` stores the preference in `localStorage`, resolves `system` via `prefers-color-scheme`, and applies the `.dark` class before mount (`application.ts:18-20`). `theme.spec.ts` verifies persistence across route changes and reload.
- **Responsive/dark QA:** `theme.spec.ts` covers Home, Collection, Group Detail (`/g/E2ENIGHTOWLS`), and Picking (`/s/{sessionIds.picking}`) in both Light and Dark at 375×812 and 1280×800, asserting `scrollWidth <= innerWidth`, route content, and semantic surface variables. The matrix is the bounded evidence requested by D-13/D-14.
- **GameCard full-card link with independent controls:** The implementation is correct and tested:
  - Container is `role="article"` with no button/tabindex (`GameCard.vue:128-131`).
  - One labelled external anchor overlays the full card with `target="_blank"` `rel="noopener noreferrer"` and a fixed `boardgamegeek.com` host (`GameCard.vue:137-145`).
  - Non-control content is wrapped in `pointer-events-none` so clicks pass through (`GameCard.vue:148`).
  - Disclosure and action slot use `pointer-events-auto relative z-20` so they remain independently operable (`GameCard.vue:196`, `236`, `290`, `332`).
  - `GameCard.spec.ts` has 28 tests covering ARIA structure, external-link security, keyboard, disclosure, action slot, and collection/picking regression. `theme.spec.ts` additionally intercepts the BGG popup and verifies the disclosure click does not create a popup.

**What flags:**
- **Reduced motion is incomplete.** `GameCard.vue` uses `motion-reduce:hover:translate-y-0` but keeps `transition-all duration-300`. The Phase 9 contract requires that under `prefers-reduced-motion` transitions collapse to ≤150ms. `TrendingGameCard.vue:53` and `GroupCollectionSpotlight.vue:73` have `transition-all duration-300` with no `motion-reduce` guard at all.
- **Legacy `role="button"` cards/rows** (see Visuals findings) degrade keyboard/screen-reader experience compared with the corrected `GameCard` model.
- **Focus-restoration on the session details dialog** is implemented in `PickingSessionHeader.vue` (`focusEditButton`) but depends on the parent calling it; verify end-to-end that focus returns to the Edit Details button after cancel/save.
- **No `aria-live` region** is visible in `GamePicker.vue` for the success announcement **“{game} selected for this night.”** required by `10-UI-SPEC.md`. The `emit('picked')` is raised, but the audit did not find an `aria-live="polite"` region in the calling `NightSessionView.vue` or `GamePicker.vue` that announces it.

---

## Registry Safety

`components.json` is present and initialized with the `reka-nova` style. The `registries` field is empty (`components.json:25`).

All three UI-SPEC contracts (Phase 5, Phase 9, Phase 10) explicitly state that no third-party registries are used. Phase 5 and Phase 9 list only the official `shadcn-vue` CLI / `reka-ui` primitives. No third-party shadcn blocks were installed from external registries, so no source code diff or network-exfiltration audit was required.

**Registry audit: 0 third-party blocks checked, no flags.**

---

## Files Audited

### Phase artifacts
- `.planning/phases/11-polish-e2e-hardening/11-CONTEXT.md`
- `.planning/phases/11-polish-e2e-hardening/11-04-PLAN.md`
- `.planning/phases/11-polish-e2e-hardening/11-04-SUMMARY.md`
- `.planning/phases/05-design-system-foundation/05-UI-SPEC.md`
- `.planning/phases/09-home-collection-redesign/09-UI-SPEC.md`
- `.planning/phases/10-picking-a-game-redesign/10-UI-SPEC.md`
- `.github/workflows/ci.yml`
- `components.json`
- `test-results/.last-run.json`
- `tests/e2e/playwright.config.ts`

### Implementation files
- `app/frontend/entrypoints/styles.css`
- `app/frontend/entrypoints/application.ts`
- `app/frontend/stores/ui.ts`
- `app/frontend/components/collection/GameCard.vue`
- `app/frontend/components/collection/GameGrid.vue`
- `app/frontend/components/collection/EmptyState.vue`
- `app/frontend/components/collection/ResultsSkeleton.vue`
- `app/frontend/components/collection/ViewModeToggle.vue`
- `app/frontend/components/collection/CollectionFilterPanel.vue`
- `app/frontend/components/collection/ActiveFilterChips.vue`
- `app/frontend/views/AccountView.vue`
- `app/frontend/views/HomeView.vue`
- `app/frontend/views/CollectionView.vue`
- `app/frontend/views/GroupView.vue`
- `app/frontend/views/NightSessionView.vue`
- `app/frontend/components/landing/HomeHero.vue`
- `app/frontend/components/landing/StatsCard.vue`
- `app/frontend/components/landing/TrendingGames.vue`
- `app/frontend/components/landing/TrendingGameCard.vue`
- `app/frontend/components/landing/HotList.vue`
- `app/frontend/components/landing/UsernameForm.vue`
- `app/frontend/components/group/GroupHeader.vue`
- `app/frontend/components/group/GroupList.vue`
- `app/frontend/components/group/GroupCollectionSpotlight.vue`
- `app/frontend/components/group/GroupSessionsList.vue`
- `app/frontend/components/group/GroupMembersPanel.vue`
- `app/frontend/components/group/InviteCard.vue`
- `app/frontend/components/session/PickingSessionHeader.vue`
- `app/frontend/components/session/GamePicker.vue`
- `app/frontend/components/session/SessionDetailsEditor.vue`
- `app/frontend/components/session/SessionEditor.vue`
- `app/frontend/components/session/SessionSummary.vue`
- `app/frontend/components/session/RsvpDashboard.vue`
- `app/frontend/components/layout/AppShell.vue`
- `app/frontend/components/layout/NavSidebar.vue`
- `app/frontend/components/layout/NavDrawer.vue`
- `app/frontend/components/layout/NavSidebarContent.vue`
- `app/frontend/components/layout/AppNav.vue`
- `app/frontend/components/ui/card/Card.vue`
- `app/frontend/components/ui/button/Button.vue`
- `app/frontend/components/ui/button/index.ts`
- `app/frontend/components/ui/badge/Badge.vue`
- `app/frontend/components/ui/toggle-group/ToggleGroup.vue`
- `app/frontend/components/ui/toggle-group/ToggleGroupItem.vue`
- `app/frontend/components/ui/toggle/index.ts`
- `app/frontend/components/auth/LoginForm.vue`
- `app/frontend/components/auth/SignupForm.vue`
- `app/frontend/views/LoginView.vue`
- `app/frontend/views/SignupView.vue`
- `app/frontend/views/InviteView.vue`
- `app/frontend/views/GroupsView.vue`
- `app/frontend/components/sidebar/RefreshButton.vue`

### Test files
- `spec/frontend/GameCard.spec.ts`
- `tests/e2e/theme.spec.ts`
- `tests/e2e/home.spec.ts`
- `tests/e2e/collection.spec.ts`
- `tests/e2e/group_detail.spec.ts`
- `tests/e2e/session_lifecycle.spec.ts`
- `spec/config/ci_workflow_spec.rb` (referenced by SUMMARY; not read in detail)

---

*UI review completed for Phase 11. No implementation or planning files were modified; unrelated dirty files were preserved.*
