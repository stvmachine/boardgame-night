# Phase 5: Design System Foundation - Context

**Gathered:** 2026-07-13
**Status:** Ready for planning

<domain>
## Phase Boundary

This phase delivers the "Tabletop Social" Material 3 design system foundation for the boardgame-night-rails-vue app:

1. **Design tokens** — Full M3 tonal palette (light + dark) generated from indigo `#4f46e5` seed, with semantic aliases for status badges. Defined in Tailwind v4 `@theme` block.
2. **UI primitive library** — Full set of shadcn-vue/reka-ui-based components (Button, Input, Badge, Card, Avatar, Skeleton, Icon, Dialog, Dropdown, Select, Tooltip, Tabs, Checkbox, Collapsible) styled with M3 tokens. Installed via shadcn-vue CLI, tokens overridden with M3 values.
3. **App shell redesign** — New 280px navigation sidebar (Home/Collection/Hot/Groups/Account + Settings/Logout + "New Session" primary button) with icon+label grouped sections. Mobile drawer mirrors nav + collectors. Old AppShell/Sidebar/MobileDrawer deprecated.
4. **Font & icon infrastructure** — Inter variable font via `@fontsource/inter`, Material Symbols Outlined via `@iconify/vue` with on-demand loading. All existing inline SVGs replaced with Iconify icons.
5. **Class merging utilities** — `clsx` + `tailwind-merge` + `cva` for variant management across all primitives.

**Out of scope:** Redesigning individual views (Home, Collection, Group Detail, Picking) — those are Phases 8-10. Suggestion engine — Phases 6-7. Dark mode toggle UI — Phase 11 (tokens defined now, toggle deferred). E2E tests — Phase 11.

</domain>

<decisions>
## Implementation Decisions

### M3 Token Strategy
- **D-01:** Use `@material/material-color-utilities` to generate the full M3 tonal palette from the indigo `#4f46e5` seed color. A Node build script runs the library, outputs CSS custom properties, and the generated CSS is committed to `styles.css`. No runtime dependency on the library — it's a dev/build-time tool only.
- **D-02:** Define the **full M3 token system** in `@theme`: primary, secondary, tertiary, error + all on-* variants + containers + surface levels (0-5) + outline + outline-variant. This is future-proof for all v1.1 surfaces.
- **D-03:** Add **semantic aliases** on top of M3 roles: `badge-draft` (gray/neutral), `badge-invited` (indigo/primary), `badge-picking` (amber), `badge-completed` (green), plus `success`, `warning`, `error` mapped to M3 roles. One-time setup, all phases benefit.
- **D-04:** Include **both light and dark M3 palettes** now. The `ui` Pinia store already has a `theme` field. Components use semantic tokens that auto-switch via CSS custom properties. Phase 11 adds the toggle UI + QA — the token infrastructure is ready.
- **D-05:** Token generation approach: **build script + committed CSS**. Write a Node script (e.g., `scripts/generate-m3-tokens.ts`) that runs `@material/material-color-utilities` with the indigo seed, outputs CSS custom properties into `app/frontend/entrypoints/styles.css`. Run once, commit the generated CSS. Re-run only if the seed color changes.

### Primitive Components
- **D-06:** Use **shadcn-vue + reka-ui** as the primitive component foundation. shadcn-vue CLI scaffolds component source files into the project (full ownership). reka-ui (formerly radix-vue) provides headless accessibility primitives (Dialog, Dropdown, Select, Tooltip, Tabs, Checkbox, etc.).
- **D-07:** **Override shadcn-vue's default CSS variables** (--background, --foreground, --primary, --card, --border, --radius, etc.) with M3 tonal palette tokens. Components keep shadcn structure/behavior but use M3 colors, Inter font, rounded-xl radius, M3 elevation. This is the key integration point between shadcn-vue and the Tabletop Social design system.
- **D-08:** Build the **full primitive library** in Phase 5: Button, Input, Badge, Card, Avatar, Skeleton, Icon, Dialog, Dropdown, Select, Tooltip, Tabs, Checkbox, Collapsible. One-time setup so all v1.1 phases (8-10) can use any primitive without waiting.
- **D-09:** Install **`clsx` + `tailwind-merge` + `cva`** (class-variance-authority) for class merging and variant management. The `cn()` utility = `clsx` + `tailwind-merge`. `cva` provides structured variant definitions for each primitive. This is the standard shadcn-vue stack.

### Icon & Font Loading
- **D-10:** **Hybrid loading**: Inter font self-hosted via `@fontsource/inter` (npm, bundled with app). Material Symbols Outlined icons loaded via **`@iconify/vue`** with on-demand icon fetching (only used icons are loaded at runtime).
- **D-11:** Install `@fontsource/inter` **variable font** (full weight range 100-900, single file). Covers all Tailwind font-weight utilities. Add `@import` or import in `application.ts`.
- **D-12:** Install `@iconify/vue` for icon management. Build a wrapper `<Icon>` component (or use Iconify's `<Icon icon="material-symbols:home" />` API directly). Icons are fetched on-demand from the Iconify API (or self-hosted via `@iconify/json` for offline use — researcher to decide).
- **D-13:** **Replace all 6 existing inline SVGs** across 5 components (MobileDrawer close, AppHeader hamburger, CollapsibleSection chevron, CollapsibleGroup chevron, EmptyState inbox) with Iconify `<Icon>` calls during Phase 5. Consistent icon system, no raw SVG in templates.

### App Shell Rearchitecture
- **D-14:** **Filters move into CollectionView's own left panel.** The 280px sidebar no longer contains collection filters. CollectionView gets its own internal filter sidebar (structured per COLL-19 in Phase 9). Phase 5 sets up the shell structure; Phase 9 builds the rich filter sidebar content.
- **D-15:** **Collectors (BGG username list + add/remove) become a collapsible section below nav items** in the main 280px sidebar. Nav sidebar structure: `[New Session button (primary, full-width)]` → `[Home, Collection, Hot, Groups, Account]` → `divider` → `[collectors section (collapsible)]` → `spacer` → `[Settings, Logout]`.
- **D-16:** **Mobile drawer mirrors desktop sidebar**: nav items + collectors section. Filters stay in CollectionView (accessible from within the view). Drawer uses shadcn-vue Sheet primitive.
- **D-17:** Nav items use **icon + label with grouped sections**. Each nav item has a Material Symbol icon + text label. Sections: `[New Session (primary button)]` / `[Home, Collection, Hot, Groups, Account]` / `[Settings, Logout]`. Auth-contextual (Login/Signup replace Account when logged out).
- **D-18:** Create **new components** (e.g., `AppNav.vue`, `NavSidebar.vue`, `NavDrawer.vue`) alongside old ones. Wire new components in `App.vue`. Delete old `AppShell.vue`, `AppHeader.vue`, `Sidebar.vue`, `MobileDrawer.vue` once the new shell is verified. Safer migration with temporary duplication.

### Agent's Discretion
- Iconify offline vs. API mode (self-host `@iconify/json` vs. runtime API fetch) — researcher to evaluate based on bundle size and offline dev needs.
- Exact shadcn-vue CLI configuration (component output directory, tsconfig paths) — researcher to determine current shadcn-vue CLI setup for Vue 3 + Vite + Tailwind v4.
- M3 surface tonal layering implementation details (Level 0 = `surface`, Level 1 = `surface-container` with 1px `outline` border) — researcher to map M3 elevation levels to Tailwind v4 tokens.
- Whether to use `unplugin-vue-components` for auto-importing primitives — researcher to evaluate.
- Exact Node script structure for M3 token generation — researcher to determine `@material/material-color-utilities` API for generating CSS custom properties.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Planning
- `.planning/PROJECT.md` — Project overview, constraints, key decisions (v1.1 milestone: UI Redesign + Suggestion Engine). Stitch project reference: "BoardGame Night UI Redesign" (projects/2288729336915094585).
- `.planning/REQUIREMENTS.md` — DS-01 through DS-06 requirements (Phase 5 scope). Traceability table maps each requirement to Phase 5.
- `.planning/ROADMAP.md` §Phase 5 — Phase goal, success criteria (5 criteria), dependencies (Phase 4), requirements list.
- `.planning/STATE.md` — Current position (Phase 5), stack pins (Tailwind v4 CSS-first, Apollo 3.13.9, Inter font, indigo primary, Material Symbols Outlined).

### Existing Frontend Code (Integration Points)
- `app/frontend/entrypoints/styles.css` — Current Tailwind v4 `@theme` block (only 2 tokens: `--color-accent`, `--color-destructive`). This is where M3 tokens will be defined.
- `app/frontend/entrypoints/application.ts` — Vue app bootstrap (Pinia + Router + Apollo). Font imports go here.
- `app/frontend/App.vue` — Root component. AppShell + Sidebar wiring. New nav components replace this.
- `app/frontend/components/layout/AppShell.vue` — Current app shell (header + 280px sidebar + main). To be deprecated.
- `app/frontend/components/layout/Sidebar.vue` — Current sidebar (collectors + filters). To be deprecated; collectors move to new NavSidebar, filters move to CollectionView.
- `app/frontend/components/layout/MobileDrawer.vue` — Current mobile drawer. To be deprecated; replaced by shadcn-vue Sheet-based NavDrawer.
- `app/frontend/components/common/MemberAvatar.vue` — Existing avatar component (deterministic color, 4 sizes). Migrate to M3-tokenized Avatar primitive.
- `app/frontend/components/common/CollapsibleSection.vue` — Existing accordion panel. Migrate to shadcn-vue Collapsible.
- `app/frontend/components/collection/ResultsSkeleton.vue` — Existing skeleton loader (game-card shape). Generalize into Skeleton primitive.
- `app/frontend/components/collection/GameCard.vue` — Existing game card. Reference for card structure when building Card primitive.
- `app/frontend/composables/useMemberColor.ts` — Deterministic color palette hash. Reference for Avatar color logic.
- `app/frontend/stores/ui.ts` — UI Pinia store (sidebarOpen, theme, filtersOpen, collectorsOpen). Theme field for dark mode.
- `app/frontend/router/index.ts` — 11 routes, lazy-loaded, auth guard. Nav items map to these routes.
- `app/frontend/index.html` — SPA shell. Font/icon CDN links go here if needed.
- `vite.config.ts` — Vite config (Vue + Tailwind + Ruby plugins, `@` alias, dev proxy). New plugins (if any) go here.
- `config/vite.json` — vite_rails config (`sourceCodeDir: app/frontend`).
- `package.json` — Current dependencies. New deps: `@fontsource/inter`, `@iconify/vue`, `clsx`, `tailwind-merge`, `cva`, `reka-ui`, `@material/material-color-utilities` (dev).

### External References
- Stitch project "BoardGame Night UI Redesign" (projects/2288729336915094585) — "Tabletop Social" design system. Visual reference for the M3 design.
- shadcn-vue documentation — CLI setup, component installation, theming with CSS variables.
- reka-ui documentation — Headless primitive API (formerly radix-vue).
- `@material/material-color-utilities` — M3 color system library for generating tonal palettes from a seed color.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **`MemberAvatar.vue`** — Well-structured avatar with deterministic color hash (15-color palette) and 4 sizes (xs/sm/md/lg). Migrate to M3-tokenized Avatar primitive. Color palette should reference M3 tokens instead of hardcoded Tailwind colors.
- **`EmptyState.vue`** — Generic empty state with icon, heading, body, optional action button. Good candidate for design system pattern. Needs Iconify icon integration.
- **`CollapsibleSection.vue`** — Generic accordion panel with chevron + badge slot. Migrate to shadcn-vue Collapsible primitive.
- **`ResultsSkeleton.vue`** — Skeleton loader matching GameCard layout (animate-pulse + bg-neutral-200). Generalize into `<Skeleton>` with shape variants (circle, text, card, rect).
- **`GameCard.vue`** — Rich game card with thumbnail, name, meta, rating/weight badges, owner avatars. Reference for Card primitive structure and Badge patterns.
- **`useMemberColor.ts`** — Deterministic color hash composable. Keep logic, tokenize the palette.
- **All 6 Pinia stores** — UI-only state, design-system agnostic. `ui.ts` has `theme` field for dark mode.
- **All composables** (`useCollectionFilters`, `useCollapsedGroups`, `usePermalink`, `useSyncStatus`, `useRefreshCollection`) — Business logic, independent of presentation.

### Established Patterns
- **Tailwind v4 CSS-first** — `@import "tailwindcss"` + `@theme {}` in `styles.css`. No `tailwind.config.js`. This is the correct foundation for M3 tokens.
- **Vue 3 Composition API + `<script setup lang="ts">`** — All components use this pattern exclusively. No Options API.
- **`@` alias → `app/frontend`** — All imports use `@/components/...`, `@/stores/...`, `@/composables/...`.
- **Button pattern** (20+ instances): `bg-indigo-600 text-white hover:bg-indigo-700 rounded-md px-4 py-2 text-sm font-medium focus:ring-2 focus:ring-indigo-500`. Replace with `<Button variant="primary">` using M3 tokens.
- **Input pattern** (22+ instances): `rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500`. Replace with `<Input>` using M3 tokens.
- **Badge pattern** (10+ instances): inline `rounded-full px-2 py-0.5 text-xs font-medium` with hardcoded semantic colors. Replace with `<Badge variant="...">` using M3 semantic aliases.
- **Inline SVG pattern** (6 instances across 5 components): raw `<svg>` in templates. Replace with `<Icon icon="material-symbols:..." />`.
- **Apollo InMemoryCache** for server data, **Pinia** for UI-only state. This boundary is maintained.

### Integration Points
- **`entrypoints/styles.css`** — Single entry point for all design tokens. Extend `@theme` block with full M3 palette + semantic aliases + Inter font family + radius/shadow tokens.
- **`entrypoints/application.ts`** — Import `@fontsource/inter/variable.css` here. Register any Vue plugins if needed.
- **`App.vue`** — Replace AppShell/Sidebar wiring with new NavSidebar/NavDrawer components.
- **`vite.config.ts`** — Add any new Vite plugins (e.g., `unplugin-vue-components` for auto-import if researcher recommends).
- **`package.json`** — Add: `@fontsource/inter`, `@iconify/vue`, `clsx`, `tailwind-merge`, `class-variance-authority`, `reka-ui`. Dev: `@material/material-color-utilities`.
- **`components/common/`** — New design system primitives live here (alongside existing MemberAvatar, CollapsibleSection).
- **`components/layout/`** — New nav shell components (AppNav, NavSidebar, NavDrawer) live here. Old components deprecated then deleted.
- **`router/index.ts`** — Nav items map to existing routes. No route changes needed in Phase 5.

</code_context>

<specifics>
## Specific Ideas

- The Stitch "Tabletop Social" design system (projects/2288729336915094585) is the visual reference. Researcher should examine the Stitch project for exact color values, card styles, badge styles, and avatar patterns.
- M3 surface tonal layering: Level 0 = background (`surface`), Level 1 = cards (`surface-container` with 1px `outline` border). This maps to M3 elevation system.
- Status badge semantic colors are explicitly specified: Draft=gray, Invited=indigo, Picking=amber, Completed=green. These become semantic aliases in the token system.
- Skeleton loaders must match the game card layout (thumbnail placeholder, text lines, badge placeholders, avatar placeholders). The existing `ResultsSkeleton.vue` is the reference shape.
- Avatars are circular with deterministic per-username colored backgrounds and white centered initials. The existing `MemberAvatar.vue` + `useMemberColor.ts` already implement this — tokenize the palette and migrate to the Avatar primitive.
- The "New Session" button in the sidebar is a primary action button (full-width, indigo/primary color, prominent). It's the CTA for creating a new boardgame night session.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 5-Design System Foundation*
*Context gathered: 2026-07-13*