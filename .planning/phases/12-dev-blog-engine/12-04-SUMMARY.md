---
phase: 12-dev-blog-engine
plan: 04
subsystem: api
tags: [ruby, kramdown, dev-blog, static-site-generator, adr, architecture-decisions, security]

requires:
  - phase: 12-dev-blog-engine
    plan: 03
    provides: Deterministic Builder, CLI, Rake wrapper, and generated-output policy

provides:
  - Immutable typed DevBlog::Adr distinct from Post
  - Strict README-backed DevBlog::AdrCatalog parser with fail-closed validation
  - Historical-framed ADR page rendering through fixed adr.html.erb template
  - ADR-aware Builder that adds adrs/<output-slug>/index.html to the deterministic generated-file map
  - CLI/Rake entrypoints default to canonical docs/adr/README.md catalog
  - Focused integrity and end-to-end specs proving accepted-ADR coverage, determinism, stale cleanup, and secret absence

affects:
  - 12-dev-blog-engine plan 05+ (future publishing features, if any, must reuse the same catalog/builder seam)

actuals:
  tokens: 4896
  tasks: 3
  commits: 3

tech-stack:
  added: []
  patterns:
    - Immutable typed value object (DevBlog::Adr) separate from Post to model different editorial semantics
    - Strict bounded README Index table parsing with row-level grammar, path, and body validation
    - Direct relative .md path policy enforced before filesystem access (no traversal/encoded/symlink/README escape)
    - Accepted-only filter applied after full-catalog validation so malformed non-accepted rows still fail closed
    - Single validated generated-file map extended with ADR pages; collision checks across posts/assets/ADRs
    - Historical notice rendered before converter-owned body_html boundary, preserving unchanged canonical ADR prose
    - CLI sentinel secret scan covers every emitted byte including ADR pages

key-files:
  created:
    - lib/dev_blog/adr_catalog.rb
    - spec/lib/dev_blog/adr_catalog_spec.rb
  modified:
    - lib/dev_blog.rb
    - lib/dev_blog/template_renderer.rb
    - bin/build-dev-blog
    - docs/adr/README.md
    - spec/lib/dev_blog/builder_spec.rb

key-decisions:
  - "Kept Adr distinct from Post because historical decisions and current engineering posts have different metadata, framing, and publication rules."
  - "Validated the entire README catalog before filtering accepted rows so proposed/deprecated rows cannot hide structural errors."
  - "Enforced a direct relative .md policy with explicit rejection of traversal, percent-encoding, dot files, symlinks, and README self-links."
  - "Added ADR pages to the existing staged generated-file map rather than introducing a second output writer."
  - "Reconciled only README title cells for ADR-008, ADR-011, and ADR-014; left bodies, statuses, dates, and filenames untouched."

patterns-established:
  - "ADR catalog row must match exact ADR-NNN link text, ./NNN-slug.md link, title, status, and ISO date grammar."
  - "Body H1 and ## Status values are checked against catalog metadata without exposing body contents in errors."
  - "output_slug is <three-digit-number>-<filename-slug> giving stable adrs/NNN-slug/index.html paths."
  - "Builder defaults to docs/adr/README.md when project_root is provided and accepts explicit nil for post-only tests."
  - "CLI --no-adrs and --adr-catalog options let CI/tests control ADR participation without changing defaults."

requirements-completed: [BLOG-02, BLOG-05]

coverage:
  - id: D1
    description: Immutable DevBlog::Adr value and README-backed accepted catalog parser
    requirement: BLOG-02
    verification:
      - kind: unit
        ref: "spec/lib/dev_blog/adr_catalog_spec.rb#DevBlog::AdrCatalog.load"
        status: pass
    human_judgment: false
  - id: D2
    description: Strict catalog, path, heading, status, and uniqueness integrity checks fail closed
    requirement: BLOG-02
    verification:
      - kind: unit
        ref: "spec/lib/dev_blog/adr_catalog_spec.rb#malformed/unsafe/duplicate/H1/status cases"
        status: pass
    human_judgment: false
  - id: D3
    description: Complete Architecture Decisions index section and one page per accepted ADR rendered beneath a historical notice
    requirement: BLOG-02
    verification:
      - kind: unit
        ref: "spec/lib/dev_blog/builder_spec.rb#ADR-aware build"
        status: pass
    human_judgment: false
  - id: D4
    description: CLI/Rake entrypoints default to canonical ADR catalog and report post + ADR counts
    requirement: BLOG-05
    verification:
      - kind: integration
        ref: "bin/build-dev-blog && bin/rake -P"
        status: pass
    human_judgment: false
  - id: D5
    description: Deterministic stale-clean ADR output with no sentinel credential names or values in any generated file
    requirement: BLOG-05
    verification:
      - kind: integration
        ref: "spec/lib/dev_blog/builder_spec.rb#does not leak sentinel credential names or values into ADR output"
        status: pass
    human_judgment: false

duration: 65min
completed: 2026-08-02
status: complete
---

# Phase 12 Plan 04: Accepted ADR Catalog Publication Summary

**Published the canonical accepted ADR catalog as a distinct, historically framed Architecture Decisions section alongside engineering posts, with strict README-backed integrity checks and CLI integration.**

## Performance

- **Duration:** ~65 min
- **Started:** 2026-08-02
- **Completed:** 2026-08-02
- **Tasks:** 3
- **Files modified:** 2 new + 5 modified (excluding locked designer templates)

## Accomplishments

- Defined immutable `DevBlog::Adr` typed value separate from `DevBlog::Post` to represent historical decision records.
- Implemented `DevBlog::AdrCatalog.load` to parse only the bounded README Index table, validate every row before accepting, and return accepted rows in ascending ADR-number order.
- Enforced strict row grammar (`ADR-NNN`, `./NNN-safe-slug.md`, title, status, ISO date), direct relative safe paths, regular files, README/symlink/traversal/encoded/dot-file rejection, and duplicate number/slug/path detection.
- Validated each body H1 and `## Status` against catalog metadata without leaking body contents in error messages.
- Reconciled README titles for ADR-008, ADR-011, and ADR-014 to match their canonical H1 headings; left accepted bodies, statuses, dates, and filenames unchanged.
- Added `adr.html.erb` to `TemplateRenderer`'s fixed allowlist and implemented `render_adr(adr:)` so `body_html` remains the sole unescaped converter boundary.
- Extended `DevBlog::Builder` with a default canonical ADR catalog path (overridable with `nil` for isolated post-only tests), included ADR files in the existing validated generated-file map, and reported ADR counts through `BuildResult`.
- Updated `bin/build-dev-blog` with `--adr-catalog` and `--no-adrs` options and output that reports post and ADR counts.
- Verified the canonical build produces exactly 14 ADR pages, preserves Vue-era body text beneath the historical notice, removes stale ADR pages, produces byte-identical output across rebuilds, and contains no sentinel credential names or values.

## Task Commits

Each task was committed atomically:

1. **Task 1 (tracer): Generate one accepted catalog ADR through the complete static lane** - `082d1c3` (feat)
2. **Task 2: Enforce strict catalog, path, heading, status, and uniqueness integrity** - `87278f1` (feat)
3. **Task 3: Publish the complete Architecture Decisions index and deterministic ADR corpus** - `fa34944` (feat)

**Visual layer (locked):** `499b42f` feat(dev-blog): add Plan 12-04 Architecture Decisions template layer (designer-provided `index.html.erb` and `adr.html.erb`, not modified).

## Files Created/Modified

- `lib/dev_blog/adr_catalog.rb` - Immutable `DevBlog::Adr` and strict README-backed accepted catalog parser
- `lib/dev_blog.rb` - ADR-aware `Builder.build`, `BuildResult#adrs`, default canonical catalog path, collision-checked generated-file map
- `lib/dev_blog/template_renderer.rb` - Fixed allowlist extended with `adr.html.erb`; `render_index` accepts `adrs:` and `render_adr` added
- `bin/build-dev-blog` - `--adr-catalog` / `--no-adrs` options and post + ADR count reporting
- `docs/adr/README.md` - Title reconciliations for ADR-008, ADR-011, ADR-014 only
- `spec/lib/dev_blog/adr_catalog_spec.rb` - Catalog integrity regression suite (valid/malformed/unsafe/duplicate/H1/status/real catalog)
- `spec/lib/dev_blog/builder_spec.rb` - End-to-end ADR tracer and real-corpus coverage (links, notice, body text, stale cleanup, determinism, secret scan)

## Decisions Made

- Kept `DevBlog::Adr` separate from `DevBlog::Post` because architecture decisions are a different editorial kind with distinct metadata and historical framing requirements.
- Validated the full catalog before applying the accepted-only filter so structural problems in proposed/deprecated rows cannot pass silently.
- Rejected all symlinks rather than only escape cases to keep "regular file" enforcement unambiguous.
- Reconciled only README title cells, not ADR bodies, to satisfy strict validation without rewriting canonical decision records.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- macOS `/var` → `/private/var` symlink mismatches required `realpath` usage in `AdrCatalog` path validation (mirrors Plan 12-03's `Builder` canonicalization).
- Duplicate output-slug and duplicate canonical-path tests collapsed into the existing duplicate-number check because the link-filename-number enforcement makes those two cases imply duplicate numbers; the uniqueness code still checks all three dimensions as defense-in-depth.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Plan 12-04 ADR publishing seam is complete and ready; any future publishing features (e.g., RSS, tags) must reuse the same `AdrCatalog`/`Builder` generated-file map rather than introduce a second writer.
- The `bin/rake dev_blog:build` wrapper remains unchanged and continues to delegate to the CLI without `:environment`.

## Verification

- `bundle exec rspec spec/lib/dev_blog/` → 99 passed, 0 failures
- `bin/build-dev-blog` with `BGG_TOKEN=phase12-secret-sentinel DOTENV_PRIVATE_KEY_BGGEEK=phase12-key-sentinel` → exit 0, `Built 1 post and 14 ADRs`
- Generated `public/dev-blog/` contained 17 files (index, styles, 14 ADR pages), all `git check-ignore` confirmed ignored
- Sentinel credential scan over all generated files: clean (no `BGG_TOKEN`, `DOTENV_PRIVATE_KEY_BGGEEK`, or sentinel values)
- Git diff shows no ADR body changes and only three README title-cell reconciliations

---
*Phase: 12-dev-blog-engine*
*Completed: 2026-08-02*
