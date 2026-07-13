import { writeFileSync } from 'node:fs'
import { Hct, DynamicScheme, Variant, hexFromArgb } from '@material/material-color-utilities'

const SEED = '#4f46e5'
const OUTPUT = 'app/frontend/entrypoints/styles.css'

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

function camelToKebab(s: string): string {
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
  /* Tabletop Social font stack: Inter variable font, weights 100-900 */
  --font-sans: 'Inter Variable', ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
  --font-heading: var(--font-sans);

  /* Radius scale (M3 / shadcn-vue hybrid) */
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

  /* Inverse / fixed */
  --color-inverse-surface: var(--md-sys-color-inverse-surface);
  --color-inverse-on-surface: var(--md-sys-color-inverse-on-surface);
  --color-inverse-primary: var(--md-sys-color-inverse-primary);
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);

  /* Semantic badge colors */
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

  /* Shadow */
  --shadow-card: 0 1px 2px 0 rgb(0 0 0 / 0.05), 0 1px 3px 0 rgb(0 0 0 / 0.1);
}

:root {
  color-scheme: light;

  /* Material 3 tonal palette (light) generated from seed ${SEED} */
${renderScheme(light)}

  /* Custom semantic colors (light) */
  --color-warning: #f59e0b;
  --color-warning-container: #fef3c7;
  --color-success: #22c55e;
  --color-success-container: #dcfce7;

  /* shadcn-vue variable overrides mapped to M3 tokens */
  --background: var(--md-sys-color-surface);
  --foreground: var(--md-sys-color-on-surface);
  --card: var(--md-sys-color-surface-container);
  --card-foreground: var(--md-sys-color-on-surface);
  --popover: var(--md-sys-color-surface-container);
  --popover-foreground: var(--md-sys-color-on-surface);
  --primary: var(--md-sys-color-primary);
  --primary-foreground: var(--md-sys-color-on-primary);
  --secondary: var(--md-sys-color-secondary-container);
  --secondary-foreground: var(--md-sys-color-on-secondary-container);
  --muted: var(--md-sys-color-surface-variant);
  --muted-foreground: var(--md-sys-color-on-surface-variant);
  --accent: var(--md-sys-color-primary-container);
  --accent-foreground: var(--md-sys-color-on-primary-container);
  --destructive: var(--md-sys-color-error);
  --border: var(--md-sys-color-outline);
  --input: var(--md-sys-color-outline);
  --ring: var(--md-sys-color-primary);
  --radius: 0.75rem;
}

.dark {
  color-scheme: dark;

  /* Material 3 tonal palette (dark) generated from seed ${SEED} */
${renderScheme(dark)}

  /* Custom semantic colors (dark) */
  --color-warning: #fbbf24;
  --color-warning-container: #451a03;
  --color-success: #86efac;
  --color-success-container: #14532d;

  /* shadcn-vue variable overrides mapped to M3 tokens (dark) */
  --background: var(--md-sys-color-surface);
  --foreground: var(--md-sys-color-on-surface);
  --card: var(--md-sys-color-surface-container);
  --card-foreground: var(--md-sys-color-on-surface);
  --popover: var(--md-sys-color-surface-container);
  --popover-foreground: var(--md-sys-color-on-surface);
  --primary: var(--md-sys-color-primary);
  --primary-foreground: var(--md-sys-color-on-primary);
  --secondary: var(--md-sys-color-secondary-container);
  --secondary-foreground: var(--md-sys-color-on-secondary-container);
  --muted: var(--md-sys-color-surface-variant);
  --muted-foreground: var(--md-sys-color-on-surface-variant);
  --accent: var(--md-sys-color-primary-container);
  --accent-foreground: var(--md-sys-color-on-primary-container);
  --destructive: var(--md-sys-color-error);
  --border: var(--md-sys-color-outline);
  --input: var(--md-sys-color-outline);
  --ring: var(--md-sys-color-primary);
  --radius: 0.75rem;
}

@layer base {
  * {
    @apply border-outline;
  }
  body {
    @apply bg-surface text-on-surface font-sans;
  }
}

/* M3 surface elevation guide for v1.1 redesign surfaces:
   Level 0: bg-surface (page background)
   Level 1: bg-surface-container border-outline (cards, sheets)
   Level 2: bg-surface-container-high (hovered/raised cards)
   Level 3+: bg-surface-container-highest (dialogs, menus)
 */
`

writeFileSync(OUTPUT, css, { encoding: 'utf8' })

console.log(`Wrote M3 tokens to ${OUTPUT}`)
