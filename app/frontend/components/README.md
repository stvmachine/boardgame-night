# Felt & Ink — component library

Atomic-design implementation of the BoardGameNight redesign. **All styling is
Tailwind `className` — no inline `style={{}}`.** Colors come from semantic tokens
defined in `app/frontend/styles.css`; they switch automatically between the light
("warm paper") and dark ("lit table") themes.

## Layers

```
components/
  atoms/        # smallest primitives (shadcn-shaped)
  molecules/    # small compositions of atoms
  organisms/    # page sections (nav, panels, lists)
  templates/    # route layouts (shells with <Outlet/>)
pages/          # compose organisms; own data fetching
```

Import via the barrels: `@/components/atoms`, `@/components/molecules`.

## Tokens (use these, never raw hex)

- Surfaces: `bg-page bg-surface bg-surface-2 bg-inset`
- Ink text: `text-ink text-ink-2 text-muted text-faint`
- Lines: `border-line border-line-soft`
- Brand/status: `primary primary-fg accent star good good-bg warn warn-bg bad bad-bg info info-bg`
- **Contrast panels** (near-black in light, raised surface in dark, always light
  text — tonight's table, hero device, group header, CTA):
  `bg-contrast bg-contrast-2 text-on-contrast text-on-contrast-muted text-on-contrast-faint border-contrast-line`
  (or `<Card tone="contrast">`). **Never** use `bg-ink` for these — it flips in dark mode.
- Type: `font-display` (Bricolage), `font-mono` / `numeric` (JetBrains Mono, tabular),
  display scale `text-display text-h1 text-h2 text-h3`.
- Radius `rounded-chip|md|card|shell|pill`, shadow `shadow-card|lift|shell`,
  cover fallback `cover-weave`, motion `press` / `lift`.

## Atoms (`@/components/atoms`)

| Component                             | Key props                                                                                                  |
| ------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `Button`                              | `variant` primary·ink·outline·subtle·ghost·accent·destructive·link, `size` sm·default·lg·pill·icon·icon-lg |
| `LinkButton`                          | `to` + Button props                                                                                        |
| `Badge`                               | `tone` neutral·good·warn·bad·info·ink·primary                                                              |
| `StatusPill`                          | `state` (SessionState), `dot`                                                                              |
| `ReasonChip`                          | `tone` good·vote·neutral·penalty·more                                                                      |
| `Chip`                                | `active`, `count`                                                                                          |
| `Avatar`                              | `name`, `seed`, `tone`, `size` xs·sm·md·lg·xl, `ring`                                                      |
| `Eyebrow`                             | `tone` muted·primary·faint                                                                                 |
| `Card` (+Header/Title/Content/Footer) | `tone` paper·inset·surface2·contrast·ghost·picked, `interactive`                                           |
| `Input`                               | native input                                                                                               |
| `Separator`                           | `orientation`, `soft`                                                                                      |
| `Meter`                               | `value` 0-100, `tone` primary·warn·bad, `size` — **use for all data-driven bars**                          |
| `Score`                               | `value`, `size` sm·md·lg·xl, `warn`, `showLabel`                                                           |
| `StarRating`                          | `value`, `withMax`                                                                                         |
| `Stat` / `StatRow`                    | `value`, `label`                                                                                           |
| `Logo`                                | `mark`                                                                                                     |
| `IconButton`                          | `solid`                                                                                                    |
| `Skeleton`                            | —                                                                                                          |
| `SegmentedControl`                    | `options`, `value`, `onChange`, `tone` paper·ink                                                           |

## Molecules (`@/components/molecules`)

`GameCover`, `GameCard`, `GameCardSkeleton`, `RankedGameCard`, `RankedGameRow`,
`ReasonChipList`, `AvatarStack`, `MemberRow`, `SessionRow`, `DateChip`, `StepCard`,
`TrendingCard`, `FilterGroup`, `ScoreBreakdown`, `EmptyState` / `FannedCovers`, `Field`.

## Templates

`AppShell` (auth app: sticky TopNav + tab bar + quiet footer), `PublicShell`
(marketing + full footer), `AuthShell` (centered). Pages render inside these via
`<Outlet/>` — pages must **not** add their own nav/footer.
