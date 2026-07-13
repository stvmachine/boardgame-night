# Phase 5: Design System Foundation - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-07-13
**Phase:** 5-Design System Foundation
**Areas discussed:** M3 Token Strategy, Primitive Components, Icon & Font Loading, App Shell Rearchitecture

---

## M3 Token Strategy

### Q1: How should the M3 tonal palette be generated from the indigo seed color?

| Option | Description | Selected |
|--------|-------------|----------|
| Hand-define tokens | Manually define each M3 role token as CSS custom properties in @theme. Full control, no extra dependency. | |
| Generate via @material/material-color-utilities | Use Google's official M3 color utilities to generate the full tonal palette from indigo seed. M3-spec-compliant. | ✓ |
| Use Tailwind v4 dynamic color utilities | Define seed color, let Tailwind's @theme generate the rest via color-mix(). Lightest dependency. | |

**User's choice:** Generate via @material/material-color-utilities
**Notes:** None

### Q2: How comprehensive should the M3 token set be in @theme?

| Option | Description | Selected |
|--------|-------------|----------|
| Full M3 system | All M3 roles: primary, secondary, tertiary, error + on-* + containers + surface levels (0-5) + outline. | |
| Just what DS-01..06 need | Only tokens referenced by Phase 5 requirements. Add more later. | |
| Full M3 + semantic aliases | Full M3 system plus semantic aliases (badge-draft, badge-invited, badge-picking, badge-completed, success, warning, error). | ✓ |

**User's choice:** Full M3 + semantic aliases
**Notes:** None

### Q3: Should dark mode tokens be included now or deferred to Phase 11?

| Option | Description | Selected |
|--------|-------------|----------|
| Include dark tokens now | Define both light and dark M3 palettes. ui store already has theme field. Phase 11 adds toggle + QA. | ✓ |
| Light only, defer dark to Phase 11 | Define only light palette now. Dark tokens added in Phase 11. | |

**User's choice:** Include dark tokens now
**Notes:** None

### Q4: How should the M3 tokens be generated and committed?

| Option | Description | Selected |
|--------|-------------|----------|
| Build script + committed CSS | Node script runs @material/material-color-utilities, outputs CSS into styles.css. Run once, commit. No runtime dependency. | ✓ |
| Runtime generation in styles.css | Import color utilities in TS module, generate at build time via Vite. More dynamic, more complex. | |
| Manual generation, commit static CSS | Use online M3 theme builder, copy CSS tokens. No npm dependency. | |

**User's choice:** Build script + committed CSS
**Notes:** None

---

## Primitive Components

### Q1: What approach for building design system primitives?

| Option | Description | Selected |
|--------|-------------|----------|
| Vue SFCs from scratch | Build all primitives manually. Full control, manual accessibility. | |
| Radix Vue + Tailwind styling | Install Radix Vue for headless primitives, build simple ones from scratch. | |
| Headless UI + Tailwind styling | Install @headlessui/vue for Dialog/Dropdown/Tooltip. Smaller scope. | |

**User's choice:** shadcn-vue + reka-ui (user typed custom answer)
**Notes:** User specified "use shadcn-vue and reka ui/nuxt ui" — clarified in Q2.

### Q2: Which combination of shadcn-vue/reka-ui/nuxt-ui?

| Option | Description | Selected |
|--------|-------------|----------|
| shadcn-vue + reka-ui | shadcn-vue CLI scaffolds component source into project. reka-ui provides headless accessibility. Full ownership. | ✓ |
| @nuxt/ui v3 (standalone) | Pre-built components, more opinionated. May conflict with M3 tokens. | |
| shadcn-vue for complex, custom for simple | Use shadcn-vue for accessibility-heavy primitives, build simple ones from scratch. | |

**User's choice:** shadcn-vue + reka-ui
**Notes:** None

### Q3: How should shadcn-vue be adapted to M3 design system?

| Option | Description | Selected |
|--------|-------------|----------|
| Override shadcn tokens with M3 | Replace shadcn CSS variables with M3 tonal palette tokens. Components keep structure, use M3 colors. | ✓ |
| Use shadcn as-is, add M3 layer | Keep shadcn default styling, add M3 tokens as separate layer. Two visual systems coexist. | |
| Strip shadcn styles, re-skin with M3 | Strip all default styling, re-skin from scratch with M3 tokens. Maximum control, more effort. | |

**User's choice:** Override shadcn tokens with M3
**Notes:** None

### Q4: Which primitives should be built in Phase 5?

| Option | Description | Selected |
|--------|-------------|----------|
| Core set only | Button, Input, Badge, Card, Avatar, Skeleton, Icon — 7 primitives for DS-01..06. | |
| Core + navigation set | Core 7 + Sidebar nav items, MobileDrawer re-skin, CollapsibleSection re-skin. | |
| Full primitive library | All primitives: Button, Input, Badge, Card, Avatar, Skeleton, Icon, Dialog, Dropdown, Select, Tooltip, Tabs, Checkbox, Collapsible. | ✓ |

**User's choice:** Full primitive library
**Notes:** None

### Q5: How should class merging and variant management work?

| Option | Description | Selected |
|--------|-------------|----------|
| clsx + tailwind-merge + cva | Standard shadcn-vue stack. cn() = clsx + tailwind-merge. cva for structured variants. | ✓ |
| clsx + tailwind-merge only | cn() utility, manual variant definitions. Simpler, fewer deps. | |
| Let shadcn-vue CLI handle it | Follow CLI defaults — no manual decision needed. | |

**User's choice:** clsx + tailwind-merge + cva
**Notes:** None

---

## Icon & Font Loading

### Q1: How should Inter font and Material Symbols Outlined icons be loaded?

| Option | Description | Selected |
|--------|-------------|----------|
| npm self-host (@fontsource) | Install @fontsource packages. Bundled, no external requests. Privacy-friendly. | |
| Google Fonts CDN <link> | Add <link> tags to index.html. Simplest, but external dependency. | |
| Hybrid: npm font + CDN icons | Self-host Inter via @fontsource/inter. Material Symbols via CDN. Balances performance and simplicity. | ✓ |

**User's choice:** Hybrid: npm font + CDN icons
**Notes:** None

### Q2: Which Inter font weights should be bundled?

| Option | Description | Selected |
|--------|-------------|----------|
| Variable font (full range) | One file covers all weights 100-900. Tailwind font-weight utilities work seamlessly. | ✓ |
| Specific weights only | 400, 500, 600, 700. Smaller per-weight files, 4 @font-face declarations. | |
| Variable + italic | Variable font including italic axis. Larger but complete. | |

**User's choice:** Variable font (full range)
**Notes:** None

### Q3: How should Material Symbols Outlined icons be integrated into Vue components?

| Option | Description | Selected |
|--------|-------------|----------|
| CSS class approach | <span class="material-symbols-outlined">home</span>. Simple, no wrapper. No type-checking. | |
| Vue <Icon> wrapper component | <Icon name="home" size="md" />. Type-safe, consistent sizing. | |
| Iconify + @iconify/vue | <Icon icon="material-symbols:home" />. On-demand loading, any icon set. Most flexible. | ✓ |

**User's choice:** Iconify + @iconify/vue
**Notes:** None

### Q4: Should existing inline SVGs be replaced with Iconify icons during Phase 5?

| Option | Description | Selected |
|--------|-------------|----------|
| Replace all inline SVGs | Replace all 6 inline SVGs across 5 components. Consistent icon system. | ✓ |
| Replace in redesigned components only | Only replace in AppShell/Sidebar/MobileDrawer. Leave others for later phases. | |
| Leave inline SVGs as-is | Don't touch existing SVGs. Focus on new components only. | |

**User's choice:** Replace all inline SVGs
**Notes:** None

---

## App Shell Rearchitecture

### Q1: Where should collectors and filters move when the sidebar becomes navigation?

| Option | Description | Selected |
|--------|-------------|----------|
| Filters → CollectionView, collectors → nav sidebar section | Filters move into CollectionView's own panel. Collectors become collapsible section below nav items. | ✓ |
| Both → CollectionView, nav sidebar is pure navigation | Both move into CollectionView. Sidebar is pure nav. Cleanest separation. | |
| Both stay in sidebar as collapsible sections | Nav items at top, then collectors, then filters — all in same sidebar. Scrollable. | |

**User's choice:** Filters → CollectionView, collectors → nav sidebar section
**Notes:** None

### Q2: How should the mobile drawer change with the new navigation?

| Option | Description | Selected |
|--------|-------------|----------|
| Drawer shows nav only | Only nav items. Filters/collectors accessed from within views. | |
| Drawer shows nav + collectors | Mirrors desktop: nav items + collectors section. Filters stay in CollectionView. | ✓ |
| Drawer shows everything | Nav + collectors + filters (current behavior). Everything accessible from mobile. | |

**User's choice:** Drawer shows nav + collectors
**Notes:** None

### Q3: How should nav items be structured in the sidebar?

| Option | Description | Selected |
|--------|-------------|----------|
| Icon + label, grouped sections | Material Symbol icon + text label. Sections: [New Session] / [Home, Collection, Hot, Groups, Account] / [Settings, Logout]. | ✓ |
| Label only, minimal | Text labels only, no icons. Simpler but DS-01 specifies Material Symbols. | |
| Icon + label, flat list | All items in one flat list with icons. No dividers or grouping. | |

**User's choice:** Icon + label, grouped sections
**Notes:** None

### Q4: Should existing shell components be rewritten or replaced?

| Option | Description | Selected |
|--------|-------------|----------|
| Rewrite in-place with shadcn-vue | Replace AppShell/Sidebar/MobileDrawer with shadcn-vue versions. Same file paths. | |
| New components, deprecate old | Create new components alongside old ones. Wire new in App.vue. Delete old after verification. | ✓ |
| Rewrite in-place, keep structure | Rewrite in-place but keep manual layout. Only use shadcn-vue for inner primitives. | |

**User's choice:** New components, deprecate old
**Notes:** None

---

## Agent's Discretion

- Iconify offline vs. API mode (self-host `@iconify/json` vs. runtime API fetch) — researcher to evaluate
- Exact shadcn-vue CLI configuration for Vue 3 + Vite + Tailwind v4 — researcher to determine
- M3 surface tonal layering implementation details — researcher to map M3 elevation levels to Tailwind v4 tokens
- Whether to use `unplugin-vue-components` for auto-importing primitives — researcher to evaluate
- Exact Node script structure for M3 token generation — researcher to determine `@material/material-color-utilities` API

## Deferred Ideas

None — discussion stayed within phase scope.