# Phase 5: Design System Foundation - Research

**Researched:** 2026-07-13
**Domain:** Vue 3 / Tailwind v4 / Material 3 / shadcn-vue UI primitives
**Confidence:** MEDIUM

## Summary

This phase replaces the ad-hoc Tailwind palette and hand-rolled layout components with a single "Tabletop Social" Material 3 design system. The work is almost entirely client-side: generate M3 tonal palettes from the indigo seed `#4f46e5`, expose them as Tailwind v4 CSS-first tokens, scaffold shadcn-vue/reka-ui primitives, and rebuild the app shell with a 280px sidebar + mobile drawer.

The core integration risk is between Tailwind v4's `@theme inline` and Material 3's large token surface. Tailwind v4 generates utility classes from CSS variables in `@theme`, but for dark mode we need those variables to switch values via `:root` / `.dark`. The correct pattern is a build-time Node script that runs `@material/material-color-utilities` to generate `--md-sys-color-*` CSS custom properties, then an `@theme inline` block that maps those custom properties to Tailwind utilities like `bg-surface`, `text-primary`, etc. The generated CSS is committed; the M3 library stays a dev dependency.

shadcn-vue 2.x is the standard CLI for Vue 3 + Vite + Tailwind v4. It scaffolds source files into `app/frontend/components/ui/`, installs `reka-ui` as the headless primitive, and provides the `cn()` utility. The components are source-owned, so no third-party runtime registry is used. For icons, `@iconify/vue` with on-demand API loading is the recommended default; the full Material Symbols JSON data package (`@iconify-json/material-symbols`) is available for offline use but is flagged as a suspicious auto-generated package by the legitimacy seam, so it should only be used if offline operation is mandatory.

**Primary recommendation:** Run the M3 token generation script once, commit the resulting CSS, then use `npx shadcn-vue@latest add` for each primitive, overriding the generated CSS variables with the M3 token map. Rebuild the shell in new components alongside the old ones and delete the old shell only after verification.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **M3 Token Strategy:** Use `@material/material-color-utilities` to generate the full M3 tonal palette from the indigo `#4f46e5` seed color. A Node build script runs the library, outputs CSS custom properties, and the generated CSS is committed to `styles.css`. No runtime dependency on the library — it's a dev/build-time tool only.
- **Full M3 Token System:** Define the full M3 token system in `@theme`: primary, secondary, tertiary, error + all on-* variants + containers + surface levels (0-5) + outline + outline-variant. This is future-proof for all v1.1 surfaces.
- **Semantic Aliases:** Add semantic aliases on top of M3 roles: `badge-draft` (gray/neutral), `badge-invited` (indigo/primary), `badge-picking` (amber), `badge-completed` (green), plus `success`, `warning`, `error` mapped to M3 roles. One-time setup, all phases benefit.
- **Both Light and Dark M3 Palettes:** Include both light and dark M3 palettes now. The `ui` Pinia store already has a `theme` field. Components use semantic tokens that auto-switch via CSS custom properties. Phase 11 adds the toggle UI + QA — the token infrastructure is ready.
- **Token Generation Approach:** Build script + committed CSS. Write a Node script (e.g., `scripts/generate-m3-tokens.ts`) that runs `@material/material-color-utilities` with the indigo seed, outputs CSS custom properties into `app/frontend/entrypoints/styles.css`. Run once, commit the generated CSS. Re-run only if the seed color changes.
- **shadcn-vue + reka-ui:** Use shadcn-vue + reka-ui as the primitive component foundation. shadcn-vue CLI scaffolds component source files into the project (full ownership). reka-ui (formerly radix-vue) provides headless accessibility primitives (Dialog, Dropdown, Select, Tooltip, Tabs, Checkbox, etc.).
- **Override shadcn-vue CSS Variables:** Override shadcn-vue's default CSS variables (`--background`, `--foreground`, `--primary`, `--card`, `--border`, `--radius`, etc.) with M3 tonal palette tokens. Components keep shadcn structure/behavior but use M3 colors, Inter font, rounded-xl radius, M3 elevation.
- **Full Primitive Library:** Build the full primitive library in Phase 5: Button, Input, Badge, Card, Avatar, Skeleton, Icon, Dialog, Dropdown, Select, Tooltip, Tabs, Checkbox, Collapsible. One-time setup so all v1.1 phases (8-10) can use any primitive without waiting.
- **Class Utilities:** Install `clsx` + `tailwind-merge` + `cva` for class merging and variant management. The `cn()` utility = `clsx` + `tailwind-merge`. `cva` provides structured variant definitions for each primitive.
- **Hybrid Loading:** Inter font self-hosted via `@fontsource/inter` (npm, bundled with app). Material Symbols Outlined icons loaded via `@iconify/vue` with on-demand icon fetching.
- **Iconify:** Install `@fontsource/inter` variable font (full weight range 100-900, single file). Add `@import` or import in `application.ts`.
- **Iconify Vue:** Install `@iconify/vue` for icon management. Build a wrapper `<Icon>` component (or use Iconify's `<Icon icon="material-symbols:home" />` API directly). Icons are fetched on-demand from the Iconify API (or self-hosted via `@iconify/json` for offline use — researcher to decide).
- **Replace Inline SVGs:** Replace all 6 existing inline SVGs across 5 components (MobileDrawer close, AppHeader hamburger, CollapsibleSection chevron, CollapsibleGroup chevron, EmptyState inbox) with Iconify `<Icon>` calls during Phase 5.
- **Filters Move:** Filters move into `CollectionView`'s own left panel. The 280px sidebar no longer contains collection filters. `CollectionView` gets its own internal filter sidebar (structured per COLL-19 in Phase 9).
- **Collectors in Sidebar:** Collectors (BGG username list + add/remove) become a collapsible section below nav items in the main 280px sidebar. Nav sidebar structure: `[New Session button (primary, full-width)]` → `[Home, Collection, Hot, Groups, Account]` → `divider` → `[collectors section (collapsible)]` → `spacer` → `[Settings, Logout]`.
- **Mobile Drawer Mirrors Desktop:** Mobile drawer mirrors desktop sidebar: nav items + collectors section. Filters stay in CollectionView (accessible from within the view). Drawer uses shadcn-vue Sheet primitive.
- **Nav Items:** Nav items use icon + label with grouped sections. Each nav item has a Material Symbol icon + text label. Sections: `[New Session (primary button)]` / `[Home, Collection, Hot, Groups, Account]` / `[Settings, Logout]`. Auth-contextual (Login/Signup replace Account when logged out).
- **New Shell Components:** Create new components (e.g., `AppNav.vue`, `NavSidebar.vue`, `NavDrawer.vue`) alongside old ones. Wire new components in `App.vue`. Delete old `AppShell.vue`, `AppHeader.vue`, `Sidebar.vue`, `MobileDrawer.vue` once the new shell is verified.

### Agent's Discretion
- Iconify offline vs. API mode (self-host `@iconify/json` vs. runtime API fetch) — researcher to evaluate based on bundle size and offline dev needs.
- Exact shadcn-vue CLI configuration (component output directory, tsconfig paths) — researcher to determine current shadcn-vue CLI setup for Vue 3 + Vite + Tailwind v4.
- M3 surface tonal layering implementation details (Level 0 = `surface`, Level 1 = `surface-container` with 1px `outline` border) — researcher to map M3 elevation levels to Tailwind v4 tokens.
- Whether to use `unplugin-vue-components` for auto-importing primitives — researcher to evaluate.
- Exact Node script structure for M3 token generation — researcher to determine `@material/material-color-utilities` API for generating CSS custom properties.

### Deferred Ideas (OUT OF SCOPE)
- None — discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| DS-01 | App uses the "Tabletop Social" Material 3 design system (Inter font, indigo `#4f46e5` primary, M3 tonal palette, Material Symbols Outlined icons) | `@material/material-color-utilities` + `DynamicScheme` for M3 palette; `@fontsource-variable/inter` for Inter; `@iconify/vue` + Material Symbols prefix for icons |
| DS-02 | App shell has a 280px fixed sidebar (Home/Collection/Hot/Groups/Account + Settings/Logout + "New Session" primary button) with mobile drawer | shadcn-vue `Sheet` primitive + new `NavSidebar.vue`/`NavDrawer.vue` shell components; existing `ui.sidebarOpen` Pinia state reused |
| DS-03 | Cards use rounded-xl corners, soft shadows, and M3 surface tonal layering (Level 0 background, Level 1 cards with 1px border) | Tailwind v4 `@theme` tokens for `surface`, `surface-container`, `outline`; shadcn-vue `Card` primitive overridden with M3 tokens |
| DS-04 | Status badges render with semantic colors (Draft=gray, Invited=indigo, Picking=amber, Completed=green) using small-caps label-sm typography | shadcn-vue `Badge` primitive + custom `cva` variants mapping to M3 semantic aliases; Tailwind `text-sm font-semibold uppercase tracking-wider` |
| DS-05 | Loading states use skeleton loaders (animated pulse placeholders matching game card layout) | shadcn-vue `Skeleton` primitive; shape variants for `card`, `text`, `circle`, `rect`, `avatar` matching existing `ResultsSkeleton.vue` layout |
| DS-06 | Avatars are circular with deterministic per-username color backgrounds and white centered initials | shadcn-vue `Avatar` primitive + deterministic hash from `useMemberColor.ts` + M3 tokenized 15-slot palette |
</phase_requirements>

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Design tokens | Browser / Client | Build / Node script | Tokens are generated at build time and consumed as CSS custom properties by the browser; no server involvement needed |
| UI primitives | Browser / Client | — | shadcn-vue + reka-ui are client-side Vue components; all rendering happens in the browser |
| App shell | Browser / Client | — | NavSidebar, NavDrawer, and main layout are client-side Vue components driven by Pinia UI state |
| Font loading | Browser / Client | Build | `@fontsource-variable/inter` is bundled by Vite and served as static font files |
| Icon loading | Browser / Client | — | `@iconify/vue` fetches icon SVG data from the Iconify API at runtime (or from bundled JSON if offline mode is chosen) |
| Dark mode toggle state | Browser / Client | — | `ui.theme` Pinia field controls the `.dark` class; CSS custom properties switch values |

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@material/material-color-utilities` | `0.4.0` | Generate M3 tonal palette from the indigo seed | Google's official Material 3 color library; supports `DynamicScheme` for the full surface-level token set the deprecated `Scheme` class lacks [CITED: github.com/material-foundation/material-color-utilities] |
| `@fontsource-variable/inter` | `5.2.8` | Self-hosted Inter variable font | Fontsource is the standard self-hosting path for Google Fonts; the `-variable` package provides weights 100–900 in a single CSS file [CITED: fontsource.org] |
| `@iconify/vue` | `5.0.1` | Material Symbols Outlined icon component | Vue-native wrapper around the Iconify API; renders SVG, supports on-demand loading, and is the default icon stack for shadcn-vue [CITED: iconify.design] |
| `shadcn-vue` (CLI) | `2.7.4` | Scaffold source-owned primitives | Official Vue port of shadcn; supports Vite + Tailwind v4 and installs components as local files [CITED: shadcn-vue.com/docs/installation/vite] |
| `reka-ui` | `2.10.1` | Headless accessible primitives | Required peer/runtime primitive for shadcn-vue (Dialog, Dropdown, Select, Tooltip, Tabs, Checkbox, Collapsible, Sheet) [CITED: reka-ui.com/llms.txt] |
| `class-variance-authority` | `0.7.1` | Variant-driven class definitions | Standard `cva` stack used by shadcn-vue for Button, Badge, etc. [CITED: cva.style/docs] |
| `clsx` | `2.1.1` | Conditional class string construction | Tiny, fast replacement for `classnames`; used inside `cn()` [CITED: npmjs.com/package/clsx] |
| `tailwind-merge` | `3.6.0` | Resolve Tailwind class conflicts | Required for `cn()` so later props override earlier classes without duplicate utilities [CITED: npmjs.com/package/tailwind-merge] |
| `tailwindcss` | `4.3.2` (already installed) | CSS-first theme and utilities | Project already uses Tailwind v4 with `@theme`; M3 tokens extend this block [CITED: tailwindcss.com/docs/theme] |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@iconify-json/material-symbols` | `1.2.83` | Offline Material Symbols icon data | Use only if offline/enterprise proxy rules require no runtime API calls; otherwise prefer on-demand API loading |
| `unplugin-vue-components` | `32.1.0` | Auto-import Vue components | **Not recommended** for primitives; explicit imports from `@/components/ui/...` are clearer and type-safer |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `@fontsource-variable/inter` | Google Fonts CDN link | CDN is simpler but introduces a third-party network dependency and FOIT/FOUT; self-hosting is the project preference for monorepo deployment |
| `@iconify/vue` API mode | `@iconify-json/material-symbols` + `addCollection()` | Offline mode bundles ~11 MB of icon data; API mode loads only used icons at runtime, which is better for the ~20 icons this app uses |
| `reka-ui` | `radix-vue` | `radix-vue` was renamed to `reka-ui`; shadcn-vue 2.x depends on `reka-ui`, so using `radix-vue` would conflict |
| `class-variance-authority` | Hand-rolled variant objects | `cva` is the standard and is already how shadcn-vue components are structured; hand-rolling is error-prone |
| `unplugin-vue-components` | Explicit imports | Explicit imports preserve type-checking and tree-shaking without extra Vite config complexity |

**Installation:**

```bash
npm install @fontsource-variable/inter @iconify/vue reka-ui class-variance-authority clsx tailwind-merge
npm install --save-dev @material/material-color-utilities

# Optional: offline icon data (see audit below)
# npm install --save-dev @iconify-json/material-symbols
```

**Version verification:**

```bash
npm view @fontsource-variable/inter version     # 5.2.8
npm view @iconify/vue version                   # 5.0.1
npm view @material/material-color-utilities version  # 0.4.0
npm view reka-ui version                        # 2.10.1
npm view shadcn-vue version                     # 2.7.4
npm view class-variance-authority version       # 0.7.1
npm view clsx version                           # 2.1.1
npm view tailwind-merge version                 # 3.6.0
```

## Package Legitimacy Audit

| Package | Registry | Age | Downloads | Source Repo | Verdict | Disposition |
|---------|----------|-----|-----------|-------------|---------|-------------|
| `@fontsource-variable/inter` | npm | 10 months | 2.05M/wk | github.com/fontsource/font-files | OK | Approved |
| `@iconify/vue` | npm | 2 months | 652k/wk | github.com/iconify/iconify | OK | Approved |
| `@material/material-color-utilities` | npm | 6 months | 198k/wk | github.com/material-foundation/material-color-utilities | OK | Approved |
| `clsx` | npm | 2+ years | 92.5M/wk | github.com/lukeed/clsx | OK | Approved |
| `tailwind-merge` | npm | 2 months | 63.4M/wk | github.com/dcastil/tailwind-merge | OK | Approved |
| `class-variance-authority` | npm | 8 months | 50M/wk | github.com/joe-bell/cva | OK | Approved |
| `reka-ui` | npm | 2 weeks | 1.14M/wk | github.com/unovue/reka-ui | SUS | Keep — required by shadcn-vue; add `checkpoint:human-verify` before install |
| `shadcn-vue` | npm | 1 month | 75k/wk | github.com/unovue/shadcn-vue | OK | Approved |
| `unplugin-vue-components` | npm | 2 months | 967k/wk | github.com/unplugin/unplugin-vue-components | OK | Approved (not recommended) |
| `@iconify-json/material-symbols` | npm | 6 days | 135k/wk | none (auto-generated) | SUS | Keep only if offline mode is required; add `checkpoint:human-verify` before install |

**Packages removed due to [SLOP] verdict:** none

**Packages flagged as suspicious [SUS]:**
- `reka-ui` — flagged as "too-new" (published 2026-06-26). This is the official shadcn-vue primitive dependency and is actively maintained by unovue. The planner should add a `checkpoint:human-verify` before install.
- `@iconify-json/material-symbols` — flagged as "too-new" and "no-repository". This is an auto-generated data package produced by the Iconify project from the main `iconify/iconify` repo. Only install if offline icon hosting is required; otherwise use on-demand API mode.

## Architecture Patterns

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                         Browser                              │
│  ┌─────────────┐    ┌─────────────────────────────────────┐ │
│  │ @fontsource  │    │        Vue 3 SPA                   │ │
│  │ -variable/   │───▶│  ┌───────────────────────────────┐ │ │
│  │ inter/wght   │    │  │ App.vue                         │ │ │
│  └─────────────┘    │  │  ├─ NavSidebar (desktop)        │ │ │
│                     │  │  ├─ NavDrawer  (mobile Sheet)   │ │ │
│  ┌─────────────┐    │  │  └─ router-view                 │ │ │
│  │ @iconify/vue│───▶│  └───────────────────────────────┘ │ │
│  │ on-demand   │    │         │                          │ │
│  │ API         │    │         ▼                          │ │
│  └─────────────┘    │  ┌───────────────────────────────┐ │ │
│                     │  │ Primitive Library             │ │ │
│  ┌─────────────┐    │  │  Button, Input, Badge, Card,  │ │ │
│  │ styles.css   │───▶│  │  Avatar, Skeleton, Icon,    │ │ │
│  │ (M3 tokens)  │    │  │  Dialog, Dropdown, Select,    │ │ │
│  └─────────────┘    │  │  Tooltip, Tabs, Collapsible   │ │ │
│                     │  └───────────────────────────────┘ │ │
│                     │         │                          │ │
│                     │         ▼                          │ │
│                     │  ┌───────────────────────────────┐ │ │
│                     │  │ Pinia UI store (theme,        │ │ │
│                     │  │ sidebarOpen, filtersOpen,     │ │ │
│                     │  │ collectorsOpen)               │ │ │
│                     │  └───────────────────────────────┘ │ │
│                     └─────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ GraphQL / WS
                              ▼
                       Rails 8 API-only
```

### Recommended Project Structure

```
app/frontend/
├── entrypoints/
│   ├── application.ts          # Pinia + Router + Apollo + font import
│   └── styles.css              # Tailwind + M3 @theme + custom properties
├── components/
│   ├── ui/                     # shadcn-vue primitives (auto-scaffolded)
│   │   ├── button/
│   │   ├── input/
│   │   ├── badge/
│   │   ├── card/
│   │   ├── avatar/
│   │   ├── skeleton/
│   │   ├── icon/               # custom wrapper (optional)
│   │   ├── dialog/
│   │   ├── dropdown-menu/
│   │   ├── select/
│   │   ├── tooltip/
│   │   ├── tabs/
│   │   ├── collapsible/
│   │   └── sheet/
│   ├── layout/
│   │   ├── AppShell.vue        # new shell (replaces old AppShell)
│   │   ├── NavSidebar.vue      # 280px desktop sidebar
│   │   ├── NavDrawer.vue       # mobile Sheet drawer
│   │   └── AppNav.vue          # nav item primitive
│   ├── common/
│   │   ├── MemberAvatar.vue    # deprecated → use Avatar primitive
│   │   ├── CollapsibleSection.vue # deprecated → use Collapsible primitive
│   │   └── EmptyState.vue      # keep, replace inline SVG with Icon
│   └── collection/
│       ├── ResultsSkeleton.vue # deprecated → use Skeleton primitive
│       └── GameCard.vue        # reference for Card primitive styling
├── composables/
│   └── useMemberColor.ts       # keep hash logic, tokenize palette
├── stores/
│   └── ui.ts                   # add .dark class toggle helpers
├── router/
│   └── index.ts                # no route changes
└── apollo/
    └── client.ts               # no changes
scripts/
└── generate-m3-tokens.ts       # build-time M3 token generator
```

### Pattern 1: M3 Token Generation Script

**What:** A Node/TypeScript script runs `@material/material-color-utilities` once and writes the full light/dark M3 token set into `app/frontend/entrypoints/styles.css`.

**When to use:** Run once after setting the seed color and re-run only when the seed changes. The script is build-time only, so the M3 library stays a dev dependency.

**Example:**

```typescript
// scripts/generate-m3-tokens.ts
import { writeFileSync } from 'node:fs'
import {
  Hct,
  DynamicScheme,
  Variant,
  hexFromArgb,
} from '@material/material-color-utilities'

const SEED = '#4f46e5'

const M3_ROLES = [
  'primary', 'onPrimary', 'primaryContainer', 'onPrimaryContainer',
  'secondary', 'onSecondary', 'secondaryContainer', 'onSecondaryContainer',
  'tertiary', 'onTertiary', 'tertiaryContainer', 'onTertiaryContainer',
  'error', 'onError', 'errorContainer', 'onErrorContainer',
  'background', 'onBackground', 'surface', 'onSurface',
  'surfaceDim', 'surfaceBright', 'surfaceContainerLowest', 'surfaceContainerLow',
  'surfaceContainer', 'surfaceContainerHigh', 'surfaceContainerHighest',
  'surfaceVariant', 'onSurfaceVariant', 'outline', 'outlineVariant',
  'shadow', 'scrim', 'inverseSurface', 'inverseOnSurface', 'inversePrimary',
] as const

function camelToKebab(s: string) {
  return s.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()
}

function renderScheme(scheme: DynamicScheme, indent = '  ') {
  return M3_ROLES.map((role) => {
    const argb = (scheme as unknown as Record<string, number>)[role]
    return `${indent}--md-sys-color-${camelToKebab(role)}: ${hexFromArgb(argb)};`
  }).join('\n')
}

const source = Hct.fromInt(parseInt(SEED.replace('#', '0xff'), 16))
const light = new DynamicScheme({
  sourceColorHct: source,
  variant: Variant.TONAL_SPOT,
  contrastLevel: 0,
  isDark: false,
})
const dark = new DynamicScheme({
  sourceColorHct: source,
  variant: Variant.TONAL_SPOT,
  contrastLevel: 0,
  isDark: true,
})

const css = `@import "tailwindcss";

@theme {
  --font-sans: 'Inter Variable', ui-sans-serif, system-ui, sans-serif;
  --radius-sm: 0.25rem;
  --radius-md: 0.375rem;
  --radius-lg: 0.5rem;
  --radius-xl: 0.75rem;
  --radius-2xl: 1rem;
}

@theme inline {
  /* Surfaces */
  --color-surface: var(--md-sys-color-surface);
  --color-on-surface: var(--md-sys-color-on-surface);
  --color-surface-dim: var(--md-sys-color-surface-dim);
  --color-surface-bright: var(--md-sys-color-surface-bright);
  --color-surface-container-lowest: var(--md-sys-color-surface-container-lowest);
  --color-surface-container-low: var(--md-sys-color-surface-container-low);
  --color-surface-container: var(--md-sys-color-surface-container);
  --color-surface-container-high: var(--md-sys-color-surface-container-high);
  --color-surface-container-highest: var(--md-sys-color-surface-container-highest);
  --color-surface-variant: var(--md-sys-color-surface-variant);
  --color-on-surface-variant: var(--md-sys-color-on-surface-variant);
  --color-outline: var(--md-sys-color-outline);
  --color-outline-variant: var(--md-sys-color-outline-variant);

  /* Primary */
  --color-primary: var(--md-sys-color-primary);
  --color-on-primary: var(--md-sys-color-on-primary);
  --color-primary-container: var(--md-sys-color-primary-container);
  --color-on-primary-container: var(--md-sys-color-on-primary-container);

  /* Secondary */
  --color-secondary: var(--md-sys-color-secondary);
  --color-on-secondary: var(--md-sys-color-on-secondary);
  --color-secondary-container: var(--md-sys-color-secondary-container);
  --color-on-secondary-container: var(--md-sys-color-on-secondary-container);

  /* Tertiary */
  --color-tertiary: var(--md-sys-color-tertiary);
  --color-on-tertiary: var(--md-sys-color-on-tertiary);
  --color-tertiary-container: var(--md-sys-color-tertiary-container);
  --color-on-tertiary-container: var(--md-sys-color-on-tertiary-container);

  /* Error */
  --color-error: var(--md-sys-color-error);
  --color-on-error: var(--md-sys-color-on-error);
  --color-error-container: var(--md-sys-color-error-container);
  --color-on-error-container: var(--md-sys-color-on-error-container);

  /* Semantic badges */
  --color-badge-draft: var(--md-sys-color-surface-variant);
  --color-badge-draft-foreground: var(--md-sys-color-on-surface-variant);
  --color-badge-invited: var(--md-sys-color-primary-container);
  --color-badge-invited-foreground: var(--md-sys-color-on-primary-container);
  --color-badge-picking: var(--color-warning-container);
  --color-badge-picking-foreground: var(--color-warning);
  --color-badge-completed: var(--color-success-container);
  --color-badge-completed-foreground: var(--color-success);
  --color-warning: var(--color-warning);
  --color-warning-container: var(--color-warning-container);
  --color-success: var(--color-success);
  --color-success-container: var(--color-success-container);

  /* Shadows */
  --shadow-card: 0 1px 2px 0 rgb(0 0 0 / 0.05), 0 1px 3px 0 rgb(0 0 0 / 0.1);
}

:root {
  color-scheme: light;
${renderScheme(light)}
  --color-warning: #f59e0b;
  --color-warning-container: #fef3c7;
  --color-success: #22c55e;
  --color-success-container: #dcfce7;
}

.dark {
  color-scheme: dark;
${renderScheme(dark)}
  --color-warning: #fbbf24;
  --color-warning-container: #451a03;
  --color-success: #86efac;
  --color-success-container: #14532d;
}

@layer base {
  * {
    @apply border-outline;
  }
  body {
    @apply bg-surface text-on-surface;
  }
}
`

writeFileSync('app/frontend/entrypoints/styles.css', css)
```

**Key insight:** The deprecated `Scheme` class returned by `themeFromSourceColor` does **not** include `surfaceContainer*` roles. Use `DynamicScheme` directly with `Variant.TONAL_SPOT` to get the full M3 surface tonal layering required by the UI-SPEC [CITED: github.com/material-foundation/material-color-utilities].

### Pattern 2: `cn()` + `cva` for Primitive Variants

**What:** shadcn-vue installs a `lib/utils.ts` with `cn() = clsx + tailwind-merge`. Each primitive uses `cva()` to define variants and `cn()` to merge external classes.

**When to use:** Every primitive component (Button, Badge, Card, Avatar, Skeleton).

**Example:**

```typescript
// app/frontend/lib/utils.ts
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

```vue
<!-- app/frontend/components/ui/badge/Badge.vue -->
<script setup lang="ts">
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center justify-center rounded-full px-2.5 py-0.5 text-sm font-semibold uppercase tracking-wider transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-primary-container text-on-primary-container',
        draft: 'bg-badge-draft text-badge-draft-foreground',
        invited: 'bg-badge-invited text-badge-invited-foreground',
        picking: 'bg-badge-picking text-badge-picking-foreground',
        completed: 'bg-badge-completed text-badge-completed-foreground',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

type BadgeProps = VariantProps<typeof badgeVariants>

interface Props {
  variant?: BadgeProps['variant']
  class?: string
}

const props = defineProps<Props>()
</script>

<template>
  <span :class="cn(badgeVariants({ variant }), props.class)">
    <slot />
  </span>
</template>
```

### Pattern 3: App Shell with NavSidebar + NavDrawer

**What:** The new shell splits desktop and mobile navigation into two components that share the same nav-item list and collectors section. The desktop sidebar is a fixed 280px block; the mobile drawer is a shadcn-vue `Sheet` from the left.

**When to use:** Replace the existing `AppShell.vue`/`Sidebar.vue`/`MobileDrawer.vue` wiring once the new components are verified.

**Example outline:**

```vue
<!-- app/frontend/App.vue -->
<script setup lang="ts">
import AppShell from '@/components/layout/AppShell.vue'
</script>

<template>
  <AppShell>
    <router-view />
  </AppShell>
</template>
```

```vue
<!-- app/frontend/components/layout/AppShell.vue (new) -->
<script setup lang="ts">
import NavSidebar from './NavSidebar.vue'
import NavDrawer from './NavDrawer.vue'
</script>

<template>
  <div class="min-h-screen bg-surface">
    <NavSidebar class="hidden md:flex" />
    <NavDrawer class="md:hidden" />
    <main class="md:ml-[280px] min-h-screen">
      <slot />
    </main>
  </div>
</template>
```

### Anti-Patterns to Avoid

- **Do not use the deprecated `Scheme` class** from `@material/material-color-utilities`; it lacks `surfaceContainer` levels. Use `DynamicScheme` with `Variant.TONAL_SPOT` [CITED: github.com/material-foundation/material-color-utilities].
- **Do not import `@fontsource/inter` (non-variable)**; it requires one file per weight. Use `@fontsource-variable/inter` for the single-file 100–900 range.
- **Do not mix old hardcoded colors (`bg-indigo-600`, `text-neutral-600`) with new tokens** during the migration. Either stay on old colors or move fully to the token set.
- **Do not put collection filters in the 280px nav sidebar** per DS-02; filters belong in `CollectionView`'s own panel (COLL-19).
- **Do not duplicate server data in Pinia**; Pinia holds only UI state (sidebar open, theme, draft filters). Server data stays in Apollo's normalized cache — this boundary is unchanged.
- **Do not use `v-html` for user-generated content inside primitives** (badges, avatars, cards); render only text/initials to avoid XSS.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| M3 tonal palette from seed | Manual HCT/OKLCH interpolation | `@material/material-color-utilities` `DynamicScheme` | M3 color science is subtle (hue/chroma/tone, accessibility contrast, dynamic color). The library is the reference implementation. |
| Accessible dialog / drawer / menu | Custom `<div>` + click handlers | `reka-ui` primitives + shadcn-vue wrappers | Focus trapping, `aria-*`, Escape handling, keyboard navigation, and portal layering are easy to get wrong. |
| Tailwind class merging | String concatenation with ternaries | `cn()` = `clsx` + `tailwind-merge` | Prevents conflicting classes (`px-2` then `px-4`) and keeps components readable. |
| Icon loading system | Inline SVGs copied into every component | `@iconify/vue` | On-demand SVG loading, 300k+ icons, consistent `aria` handling, no bundle bloat for unused icons. |
| Variant-driven component classes | Inline `if/else` class maps | `cva` (`class-variance-authority`) | Type-safe variants, compound variants, default variants; standard across shadcn-vue. |
| Mobile drawer animation | CSS-only transition panel | shadcn-vue `Sheet` built on `reka-ui` Dialog | Provides overlay, focus management, scroll locking, and snap-to-edge behavior out of the box. |

**Key insight:** The primitives in this phase are all well-solved problems. The value this phase adds is the *design system glue* (M3 tokens, shell layout, deterministic avatar palette) and the *migration hygiene* (replacing ad-hoc classes with tokens), not rebuilding headless accessibility from scratch.

## Runtime State Inventory

> This phase re-architects layout components and migrates inline SVGs but does not rename a domain entity or move persisted data. The following inventory answers each category explicitly.

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | None. The design system is purely presentational; no database, cache, or file records store layout components, color values, or icon names. | None |
| Live service config | None. No external SaaS, CDN config, or dashboard registers the old `AppShell`/`Sidebar`/`MobileDrawer` names. | None |
| OS-registered state | None. No OS task scheduler entries, launchd plists, or systemd units reference the app shell components. | None |
| Secrets/env vars | None. No secret keys or environment variable names depend on the old shell component names. | None |
| Build artifacts | Vite production builds and Playwright screenshots may cache the old component CSS/classes. The old `AppShell.vue`, `AppHeader.vue`, `Sidebar.vue`, `MobileDrawer.vue` should be deleted after the new shell is verified. | Delete old layout files after verification; run `bin/vite build` and Playwright health check to ensure no stale CSS. |

**Nothing found in category:** Stored data, Live service config, OS-registered state, and Secrets/env vars are explicitly "None — verified by codebase inspection."

## Common Pitfalls

### Pitfall 1: Using `themeFromSourceColor` and the deprecated `Scheme` class

**What goes wrong:** The returned `Theme.schemes.light` is a `Scheme` instance that only has `surface` and `surfaceVariant`; it does **not** have `surfaceContainer`, `surfaceContainerHigh`, etc. The UI-SPEC requires Level 1 cards to use `surface-container`.

**Why it happens:** The README examples highlight `themeFromSourceColor` and `applyTheme`, which use the older `Scheme` API. The newer `DynamicScheme` API is less documented in quickstarts.

**How to avoid:** Instantiate `DynamicScheme` directly with `Variant.TONAL_SPOT` and iterate its getters for the full surface-level token set (see Pattern 1).

**Warning signs:** Build succeeds but `bg-surface-container` resolves to nothing or a fallback color; cards look flat or use the wrong token.

### Pitfall 2: Forgetting `@theme inline` when referencing CSS custom properties

**What goes wrong:** Writing `--color-surface: var(--md-sys-color-surface);` inside a plain `@theme` block can cause Tailwind to generate the CSS custom property with the variable reference as its value, which may not resolve correctly in all contexts.

**Why it happens:** In Tailwind v4, `@theme` variables are also CSS custom properties. When the value is a `var()` reference, you usually want the utility class to contain the literal `var()` and not emit a circular custom property.

**How to avoid:** Use `@theme inline { --color-surface: var(--md-sys-color-surface); }`. This inlines the value into generated utilities and avoids the extra custom-property layer.

**Warning signs:** Colors render correctly in some places but not in custom CSS or arbitrary values; dev-tools show `--color-surface: var(--md-sys-color-surface)` defined in a place where `--md-sys-color-surface` is out of scope.

### Pitfall 3: Icon-only controls without accessible labels

**What goes wrong:** The mobile hamburger toggle and drawer close button use only an icon. Without an `aria-label` or visually hidden text, screen readers announce an unlabeled button.

**Why it happens:** Replacing inline SVGs with `<Icon>` removes the default `aria-label` that may have been on the surrounding `<button>`.

**How to avoid:** Always provide `aria-label="Open navigation"` / `aria-label="Close navigation"` on the trigger/close buttons, or wrap the icon with a `<span class="sr-only">` label.

**Warning signs:** Lighthouse or axe reports "button-name" violation; screen reader says "button" with no context.

### Pitfall 4: Installing `@fontsource/inter` instead of `@fontsource-variable/inter`

**What goes wrong:** The non-variable package requires a separate CSS file per weight (e.g., `400.css`, `600.css`). Importing only the default weight breaks Tailwind `font-bold` / `font-light` utilities.

**Why it happens:** The npm package name is similar; the variable-font variant is the newer Fontsource v5 convention.

**How to avoid:** Install `@fontsource-variable/inter` and import `@fontsource-variable/inter/wght.css`. Use `font-family: 'Inter Variable'` in CSS or `--font-sans`.

**Warning signs:** Font weights look wrong; only one weight renders; dev-tools network tab shows multiple font files instead of one.

### Pitfall 5: Mixing old and new shell components during migration

**What goes wrong:** If `App.vue` still references the old `AppShell` while the new `NavSidebar` is being built, duplicate sidebars, double headers, or missing mobile drawers appear.

**Why it happens:** The phase intentionally creates new components alongside old ones for safer migration, so the cut-over must be explicit.

**How to avoid:** Keep the old files until the new `AppShell.vue` is wired in `App.vue` and verified. Then delete `AppShell.vue`, `AppHeader.vue`, `Sidebar.vue`, and `MobileDrawer.vue` in a single cleanup task.

**Warning signs:** Two sidebars visible on desktop; missing mobile menu; console warnings about unused imports from the old files.

## Code Examples

### Material 3 Token Generation (build-time)

See Pattern 1 for the full script. The generated CSS is committed to `app/frontend/entrypoints/styles.css`.

### Inter Font + Tailwind v4 Setup

```typescript
// app/frontend/entrypoints/application.ts
import '@fontsource-variable/inter/wght.css'
import { createApp } from 'vue'
import App from '../App.vue'
import './styles.css'

// ... existing Pinia/Router/Apollo setup unchanged
```

```css
/* app/frontend/entrypoints/styles.css — excerpt */
@theme {
  --font-sans: 'Inter Variable', ui-sans-serif, system-ui, sans-serif;
}
```

### Iconify Material Symbols Icon

```vue
<!-- app/frontend/components/ui/icon/Icon.vue (optional wrapper) -->
<script setup lang="ts">
import { Icon as IconifyIcon } from '@iconify/vue'

interface Props {
  name: string
  class?: string
}

defineProps<Props>()
</script>

<template>
  <IconifyIcon
    :icon="`material-symbols:${name}`"
    :class="$props.class"
    aria-hidden="true"
  />
</template>
```

```vue
<!-- app/frontend/components/layout/AppHeader.vue -->
<script setup lang="ts">
import { useUiStore } from '@/stores/ui'
import Icon from '@/components/ui/icon/Icon.vue'

const ui = useUiStore()
</script>

<template>
  <button
    type="button"
    class="md:hidden p-2 rounded-md hover:bg-surface-container-high focus-visible:ring-2 focus-visible:ring-primary"
    aria-label="Open navigation"
    @click="ui.openSidebar"
  >
    <Icon name="menu" class="h-6 w-6 text-on-surface" />
  </button>
</template>
```

### shadcn-vue Component Usage

```vue
<script setup lang="ts">
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import Icon from '@/components/ui/icon/Icon.vue'

function initials(username: string) {
  return username.charAt(0).toUpperCase()
}
</script>

<template>
  <Card class="rounded-xl border border-outline bg-surface-container shadow-card hover:shadow-md hover:-translate-y-1 transition-all duration-300">
    <CardHeader>
      <CardTitle class="text-heading text-on-surface">Game Title</CardTitle>
    </CardHeader>
    <CardContent>
      <div class="flex gap-2">
        <Badge variant="invited">Invited</Badge>
        <Badge variant="picking">Picking</Badge>
      </div>
      <div class="mt-4 flex -space-x-2">
        <Avatar class="ring-2 ring-white bg-primary text-on-primary">
          <AvatarFallback>AL</AvatarFallback>
        </Avatar>
      </div>
      <Button class="mt-4 w-full">
        <Icon name="add" class="mr-2 h-4 w-4" />
        New Session
      </Button>
    </CardContent>
  </Card>

  <!-- Skeleton matching GameCard layout -->
  <div class="rounded-xl border border-outline bg-surface-container p-3 space-y-2 animate-pulse">
    <Skeleton class="aspect-[4/3] w-full bg-surface-variant" />
    <Skeleton class="h-4 w-3/4 bg-surface-variant" />
    <Skeleton class="h-3 w-1/2 bg-surface-variant" />
    <div class="flex gap-2">
      <Skeleton class="h-5 w-8 bg-surface-variant" />
      <Skeleton class="h-5 w-8 bg-surface-variant" />
    </div>
    <div class="flex -space-x-1 pt-1">
      <Skeleton class="h-5 w-5 rounded-full bg-surface-variant ring-2 ring-white" />
      <Skeleton class="h-5 w-5 rounded-full bg-surface-variant ring-2 ring-white" />
    </div>
  </div>
</template>
```

### Deterministic Avatar Palette with M3 Tokens

```typescript
// app/frontend/composables/useMemberColor.ts
const PALETTE = [
  'bg-primary text-on-primary',
  'bg-secondary text-on-secondary',
  'bg-tertiary text-on-tertiary',
  'bg-error text-on-error',
  'bg-primary-container text-on-primary-container',
  'bg-secondary-container text-on-secondary-container',
  'bg-tertiary-container text-on-tertiary-container',
  'bg-error-container text-on-error-container',
  'bg-surface-variant text-on-surface-variant',
  'bg-inverse-surface text-inverse-on-surface',
  'bg-warning text-on-surface',         // custom semantic
  'bg-success text-on-surface',         // custom semantic
  'bg-primary-fixed text-on-primary-fixed',
  'bg-secondary-fixed text-on-secondary-fixed',
  'bg-tertiary-fixed text-on-tertiary-fixed',
]

export function hashUsername(username: string): number {
  let hash = 0
  for (const char of username) {
    hash = (hash << 5) - hash + char.charCodeAt(0)
    hash = hash & hash
  }
  return Math.abs(hash)
}

export function useMemberColor(username: string) {
  return PALETTE[hashUsername(username) % PALETTE.length]
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Hardcoded Tailwind colors (`bg-indigo-600`, `text-neutral-600`) | M3 CSS custom property tokens generated from seed | Phase 5 | Single source of truth for colors; dark mode ready without `dark:` prefixes everywhere |
| Inline SVGs in components | `@iconify/vue` on-demand Material Symbols | Phase 5 | Consistent icon set, accessible labels, no raw SVG duplication |
| Google Fonts CDN | `@fontsource-variable/inter` self-hosted | Phase 5 | No external request dependency, supports offline dev, one variable file |
| Custom hand-rolled `Sidebar` / `MobileDrawer` | shadcn-vue `Sheet` + new `NavSidebar`/`NavDrawer` | Phase 5 | Accessible focus/overlay behavior, unified nav structure |
| `MemberAvatar.vue` hardcoded Tailwind palette | `Avatar` primitive + M3 tokenized 15-slot palette | Phase 5 | Colors align with design system; deterministic per-username behavior preserved |

**Deprecated/outdated:**
- `@fontsource/inter` (non-variable): use `@fontsource-variable/inter`.
- `graphql-batch` / old `graphql` patterns: not relevant here but already superseded by `GraphQL::Dataloader` on the backend.
- `radix-vue`: renamed to `reka-ui`; do not install `radix-vue` alongside `reka-ui`.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | The project will use `npm`/`npx` instead of `pnpm` for shadcn-vue CLI commands | Standard Stack | If the user switches to pnpm, the commands still work but lockfile may need reconciliation. The package scripts already use npm. |
| A2 | `shadcn-vue` CLI init will accept the existing `@/*` → `app/frontend/*` path mapping and not overwrite `tsconfig.json` paths in a breaking way | Standard Stack | tsconfig already defines the path; init may add redundant entries. Review diff before committing. |
| A3 | On-demand Iconify API loading is acceptable for development and production | Standard Stack | If the environment blocks external API calls, icons will not load. The offline fallback (`@iconify-json/material-symbols`) is documented but flagged SUS. |
| A4 | `DynamicScheme` with `Variant.TONAL_SPOT` is the correct M3 variant for the indigo seed | Architecture Patterns | Other variants (Vibrant, Expressive) produce different secondary/tertiary palettes. TONAL_SPOT is the conservative M3 default. |
| A5 | Custom `warning` and `success` colors are acceptable as static hex values rather than generated from the M3 seed | Code Examples | If strict M3 generation is required, the script can be extended to use `customColor()` with amber/green seeds. Static values match the UI-SPEC table. |
| A6 | `unplugin-vue-components` is not needed for primitives | Standard Stack | If auto-import is desired later, it can be added without breaking the design system. |

## Open Questions (RESOLVED)

1. **Iconify offline requirement**
   - What we know: API mode is the default, loads only used icons, and matches the project constraints. The offline package `@iconify-json/material-symbols` exists but is flagged SUS and adds ~11 MB of JSON.
   - What was unclear: Whether the target environment (CI, prod VPS, developer with spotty internet) allows runtime calls to `api.iconify.design`.
   - RESOLVED: Start with API mode (on-demand fetching). Do NOT install `@iconify-json/material-symbols` (SUS, 11 MB). Revisit offline bundling only if network failures are observed in CI or production. Plan 05-01 Task 2 installs only `@iconify/vue@5.0.1` and uses the on-demand API.

2. **shadcn-vue init impact on existing Vite/Tailwind config**
   - What we know: shadcn-vue init installs `components.json`, the `cn()` utility, and default CSS variables. The project already has `vite.config.ts` with `@tailwindcss/vite`, `tsconfig.json` with `@/*`, and `styles.css` with a minimal `@theme` block.
   - What was unclear: Whether init will overwrite `styles.css` or create a new CSS file. We need to preserve the existing import and Apollo setup in `application.ts`.
   - RESOLVED: Run `npx shadcn-vue@latest init` and inspect the diff to `tsconfig.json` and `styles.css` before committing. If init creates a separate `tailwind.css` or `globals.css`, merge its content into `app/frontend/entrypoints/styles.css` and delete the extra file. Do not let init overwrite the `@/*` path mapping or break the existing `@import "tailwindcss"` line. Plan 05-01 Task 2 documents this merge step explicitly.

3. **Exact surface-level mapping to UI-SPEC "Level 0 / Level 1"**
   - What we know: M3 has `surface`, `surfaceContainerLowest`, `surfaceContainerLow`, `surfaceContainer`, `surfaceContainerHigh`, `surfaceContainerHighest`. The UI-SPEC says Level 0 = `surface` and Level 1 = `surface-container` with a 1px `outline` border.
   - What was unclear: Whether higher surfaces (cards stacked on cards, dialogs) should use `surface-container-high` or `surface-container-highest`.
   - RESOLVED: Map Level 0 → `surface`, Level 1 → `surface-container`, Level 2 → `surface-container-high`, Level 3+ → `surface-container-highest`. Document this in the design tokens comment block in `styles.css` so later phases use consistent levels. Plan 05-01 Task 2 generates all surface-container roles via the M3_ROLES array, and Plan 05-04 (primitive scaffolding) applies Level 1 (`bg-surface-container border-outline`) to the Card primitive.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | npm, Vite, shadcn-vue CLI | ✓ | 20.20.2 | — |
| npm | Package installation | ✓ | 10.8.2 | — |
| Ruby | Rails backend (existing) | ✓ | 3.4.9 | — |
| Bundler | Rails gem management | ✓ | 2.6.9 | — |
| pnpm | shadcn-vue docs examples | ✗ | — | Use `npm`/`npx` (project already uses npm) |
| Vite dev server | Vue HMR | ✓ | 8.1.3 (from package.json) | — |
| Tailwind CSS v4 | Design tokens | ✓ | 4.3.2 (from package.json) | — |

**Missing dependencies with no fallback:** none

**Missing dependencies with fallback:**
- `pnpm` — not installed. The project uses npm, so shadcn-vue CLI commands should be invoked with `npx shadcn-vue@latest` instead of `pnpm dlx`.

## Security Domain

> This phase is primarily UI/presentation; it does not introduce new auth, session, backend input, or cryptographic paths. The controls below focus on the few ASVS categories that touch design-system implementation.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | No | — |
| V3 Session Management | No | — |
| V4 Access Control | No | — |
| V5 Input Validation | Yes | Primitives must never render user-supplied HTML; Badge/Avatar/Card only output text/initials; `Icon` uses safe SVG data from Iconify. |
| V6 Cryptography | No | — |
| V7 Error Handling | No | — |
| V8 Data Protection | No | — |
| V9 Communication | No | — |
| V10 Malicious Code | No | — |
| V11 Business Logic | No | — |
| V12 File Uploads | No | — |
| V13 API | No | — |
| V14 Configuration | No | — |

### Known Threat Patterns for Vue + Tailwind + Iconify

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| XSS via user content rendered in Badge/Card | Tampering | Never use `v-html` with user data; use text bindings and escape via Vue's template compiler. |
| Icon name injection | Tampering | Only accept icon names from a known allowlist; `Iconify` renders SVG but arbitrary icon names could leak data to the Iconify API. |
| Missing accessible names on icon-only controls | Information Disclosure | Add `aria-label` or visually hidden text to all icon-only buttons. |
| CSS custom property injection | Tampering | M3 custom properties are generated from a fixed seed and committed CSS; do not allow user input to write CSS variables. |

## Sources

### Primary (HIGH confidence)
- **npm registry** — verified package versions: `@fontsource-variable/inter@5.2.8`, `@iconify/vue@5.0.1`, `@material/material-color-utilities@0.4.0`, `reka-ui@2.10.1`, `shadcn-vue@2.7.4`, `class-variance-authority@0.7.1`, `clsx@2.1.1`, `tailwind-merge@3.6.0` [VERIFIED: npm registry].
- **Project codebase** — `tsconfig.json` `@/*` path, `vite.config.ts`, `app/frontend/entrypoints/styles.css`, existing `AppShell.vue`, `Sidebar.vue`, `MobileDrawer.vue`, `MemberAvatar.vue`, `useMemberColor.ts`, `ui.ts` store [VERIFIED: codebase].
- **Tailwind CSS v4 Theme docs** — `@theme` vs `@theme inline`, CSS-first token generation, namespaces, and custom property behavior [CITED: tailwindcss.com/docs/theme].

### Secondary (MEDIUM confidence)
- **shadcn-vue Vite installation guide** — `npx shadcn-vue@latest init`, `npx shadcn-vue@latest add <component>`, default path `@/components/ui` [CITED: shadcn-vue.com/docs/installation/vite].
- **shadcn-vue theming guide** — CSS variable convention, token list, radius scale, and dark mode approach [CITED: shadcn-vue.com/docs/theming].
- **shadcn-vue component docs** — Button, Avatar, Sheet, Collapsible API examples [CITED: shadcn-vue.com/docs/components/{button,avatar,sheet,collapsible}].
- **reka-ui docs** — Dialog, DropdownMenu, Sheet anatomy and API [CITED: reka-ui.com/docs/components/{dialog,dropdown-menu}].
- **Material Color Utilities TypeScript source** — `DynamicScheme`, `Variant.TONAL_SPOT`, `MaterialDynamicColors`, `applyTheme` custom property generation [CITED: github.com/material-foundation/material-color-utilities].
- **Fontsource Inter docs** — `@fontsource-variable/inter/wght.css` import and `font-family: 'Inter Variable'` [CITED: fontsource.org/fonts/inter/install].
- **Iconify Vue docs** — on-demand API loading, `Icon` component API, offline alternatives via `@iconify-json/*` [CITED: iconify.design/docs/icon-components/vue and iconify.design/docs/icons/json].
- **cva docs** — `cva()` variant API with `defaultVariants` and `compoundVariants` [CITED: cva.style/docs].

### Tertiary (LOW confidence)
- **M3 elevation/surface mapping** — Level 0 → `surface`, Level 1 → `surface-container` interpretation derived from M3 spec and UI-SPEC; exact mapping for higher levels inferred [ASSUMED].
- **Warning/success hex values** — Taken from UI-SPEC table directly; not generated from the M3 seed [CITED: 05-UI-SPEC.md].

## Metadata

**Confidence breakdown:**
- Standard stack: **HIGH** — all package versions verified on npm registry; official docs confirm compatibility.
- Architecture: **MEDIUM** — official shadcn-vue/reka-ui docs support the patterns; M3 surface-level mapping required one inference from the spec.
- Pitfalls: **MEDIUM** — sourced from code inspection and official docs; one inference about `@theme inline` behavior from Tailwind v4 docs.

**Research date:** 2026-07-13
**Valid until:** 2026-10-13 (stable for Tailwind v4, shadcn-vue 2.x, and Material 3; revisit sooner if shadcn-vue 3 or Vite 9 changes the init flow)
