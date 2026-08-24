# ADR-017: Adopt oxfmt (Oxc) as the JavaScript/TypeScript Formatter

## Status

accepted

## Context

The Ruby side has an enforced style (RuboCop — see [ADR-013](./013-rubocop-indentation-cops.md)),
but the frontend (`app/frontend/`, `tests/`) had **no formatter at all** — no Prettier,
Biome, ESLint, or config. Style was maintained by hand (it had drifted toward single
quotes, no semicolons), which is unenforceable and produces noisy, inconsistent diffs.

We want an automated formatter with a `--check` mode suitable for CI. The request was to
use **oxfmt** (the formatter from the [Oxc](https://oxc.rs) toolchain) rather than
Prettier.

## Decision

Adopt **`oxfmt`** as the sole JS/TS/TSX (and JSON/CSS/etc.) formatter, using its
**default configuration** — no style overrides.

- `oxfmt` is a dev dependency; config lives in `.oxfmtrc.json` (created via `oxfmt --init`).
- The only config entry is `ignorePatterns: ["app/frontend/generated/**"]` — GraphQL
  codegen output is machine-generated and overwritten by `npm run codegen`, so formatting
  it is pointless and would make `fmt:check` fail after each regen. This is a scoping
  exclusion, **not** a style override.
- npm scripts:
  - `fmt` → `oxfmt app/frontend tests vite.config.ts codegen.ts`
  - `fmt:check` → `oxfmt --check …` (CI-friendly; non-zero exit on drift).
- oxfmt respects `.gitignore` by default, so `node_modules`, build output, etc. are skipped.
- Applying it reformatted the frontend to oxfmt's defaults (double quotes, semicolons,
  tab indentation) in one pass. We accept the defaults deliberately: zero style bikeshedding,
  and the whole tree is now consistent and enforceable.

## Consequences

- **One large one-time reformat**: adopting any formatter on a never-formatted tree
  rewrites nearly every file (~134 here). The diff is style-only; `tsc` and the full
  `vitest` suite pass unchanged after it.
- Fast: oxfmt formats the whole frontend in ~150ms (it is markedly faster than Prettier),
  so `fmt`/`fmt:check` are cheap enough to run on every commit and in CI.
- The codebase's previous hand-maintained style (single quotes, no semicolons) is replaced
  by oxfmt defaults. This is intentional — enforced-and-consistent beats hand-curated.
- New JS/TS contributions must be formatted (`npm run fmt`); CI should gate on
  `npm run fmt:check`.
- Generated GraphQL types/operations remain excluded and keep whatever `graphql-codegen`
  emits.

## Alternatives Considered

- **Prettier** — the de-facto standard, but the explicit ask was oxfmt, which is
  substantially faster and offers a Prettier-compatible option surface if we ever need to
  tune it.
- **Configure oxfmt to preserve the old style** (single quotes, no semicolons) — considered
  and rejected in favor of defaults, per the decision to avoid style customization.
- **Biome** — a capable formatter+linter, but heavier than needed here and not requested.
- **No formatter (status quo)** — rejected: unenforceable, noisy diffs.

## References

- `.oxfmtrc.json`, `package.json` (`fmt`, `fmt:check` scripts)
- oxfmt: <https://oxc.rs/docs/guide/usage/formatter> · <https://www.npmjs.com/package/oxfmt>
- Related: [ADR-013](./013-rubocop-indentation-cops.md) (Ruby formatting via RuboCop)
