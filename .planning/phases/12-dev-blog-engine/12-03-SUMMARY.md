---
phase: 12-dev-blog-engine
plan: 03
subsystem: api
tags: [ruby, kramdown, dev-blog, static-site-generator, cli, rake, security]

requires:
  - phase: 12-dev-blog-engine
    plan: 02
    provides: Safe primitives DevBlog::Post, PostParser, MarkdownConverter, TemplateRenderer

provides:
  - Deterministic DevBlog::Builder.build with date-descending/slug tie-break sorting, draft exclusion, duplicate slug detection, and stale-output cleanup
  - Immutable DevBlog::BuildResult exposing posts, output_dir, and generated_files
  - Canonical executable bin/build-dev-blog that runs without Rails, dotenv, or BGG secrets
  - Rake task dev_blog:build without :environment dependency
  - Generated /public/dev-blog/ output ignored and secret-scan tested
  - Focused RSpec coverage for path containment, staged rollback, deterministic output, CLI, and Rake wrapper

affects:
  - 12-dev-blog-engine plan 04 (ADR catalog builder extension seam)

actuals:
  tokens: 18500
  tasks: 2
  commits: 3

tech-stack:
  added: []
  patterns:
    - Immutable value object BuildResult with frozen posts and byte map
    - Canonical-path containment checks using realpath and separator-aware descendant test
    - Staged output replacement with backup and restore on swap failure
    - Plain-Ruby CLI with OptionParser and repo-root-relative source/output defaults
    - Rake shell delegation without Rails :environment
    - Sentinel secret scan in generated output and stderr/stdout

key-files:
  created:
    - bin/build-dev-blog
    - lib/tasks/dev_blog.rake
    - spec/lib/dev_blog/builder_spec.rb
  modified:
    - lib/dev_blog.rb

key-decisions:
  - "Kept Plan 12-01 backward-compatible build(source_dir:, output_dir:) call shape while making production entrypoints always pass project_root:"
  - "Used realpath + separator-aware descendant check to prevent sibling-prefix and symlink path escapes"
  - "Performed staged replacement into output_dir parent so backup and staging directories live on the same filesystem as the output"
  - "Restored prior output if the staged swap fails after a successful backup move"
  - "Required asset files (styles.css) to exist rather than silently skipping missing assets"

patterns-established:
  - "Builder discovers only YYYY-MM-DD-*.md files, excluding README.md and non-markdown files"
  - "Posts sort by date descending, slug ascending, with deterministic duplicate slug rejection"
  - "Generated relative links resolve at host root and under /blog/: ./styles.css, ./posts/<slug>/, ../../, ../../styles.css"
  - "CLI and Rake wrapper never load Rails or environment files; verification uses sentinel secrets and realpath checks"

requirements-completed: [BLOG-02, BLOG-05]

coverage:
  - id: D1
    description: DevBlog::Builder.build discovers dated posts, excludes drafts by default, and sorts date-descending with slug tie-break
    requirement: BLOG-02
    verification:
      - kind: unit
        ref: "spec/lib/dev_blog/builder_spec.rb#DevBlog::Builder.build"
        status: pass
    human_judgment: false
  - id: D2
    description: Stale output files are removed across rebuilds and a failed build restores the prior successful output
    requirement: BLOG-02
    verification:
      - kind: unit
        ref: "spec/lib/dev_blog/builder_spec.rb#DevBlog::Builder.build stale and rollback cases"
        status: pass
    human_judgment: false
  - id: D3
    description: Source/output paths cannot escape the project root via prefix, sibling, or symlink traversal
    requirement: BLOG-02
    verification:
      - kind: unit
        ref: "spec/lib/dev_blog/builder_spec.rb#DevBlog::Builder.build outside project root and symlink cases"
        status: pass
    human_judgment: false
  - id: D4
    description: Generated output contains no sentinel credential names or values
    requirement: BLOG-05
    verification:
      - kind: unit
        ref: "spec/lib/dev_blog/builder_spec.rb#DevBlog::Builder.build secret leakage and CLI entrypoint specs"
        status: pass
    human_judgment: false
  - id: D5
    description: Executable CLI builds defaults and options without loading Rails or dotenv
    requirement: BLOG-05
    verification:
      - kind: integration
        ref: "spec/lib/dev_blog/builder_spec.rb#DevBlog::Builder plain-Ruby entrypoints"
        status: pass
    human_judgment: false
  - id: D6
    description: Rake wrapper invokes the CLI without :environment prerequisite and generated output is ignored
    requirement: BLOG-05
    verification:
      - kind: integration
        ref: "spec/lib/dev_blog/builder_spec.rb#DevBlog::Builder plain-Ruby entrypoints"
        status: pass
    human_judgment: false

duration: 35min
completed: 2026-08-02
status: complete
---

# Phase 12 Plan 03: Deterministic Builder, CLI, and Rake Wrapper Summary

**Completed the deterministic dev-blog build pipeline: Builder, canonical plain-Ruby CLI, no-environment Rake wrapper, ignored generated output, and focused safety/regression specs.**

## Performance

- **Duration:** ~35 min (including three errored executor transport recoveries)
- **Started:** 2026-08-02
- **Completed:** 2026-08-02
- **Tasks:** 2
- **Files modified:** 4 implementation + 1 spec

## Accomplishments

- Hardened `DevBlog::Builder` to canonicalize source/output paths with `realpath` and a separator-aware descendant check, blocking sibling-prefix and symlink escapes.
- Implemented staged output replacement: build into a temp dir in the output parent, back up existing output, swap, and restore the backup if the swap fails.
- Added `DevBlog::BuildResult` as an immutable frozen value object exposing `posts`, `output_dir`, and `generated_files`.
- Preserved the Plan 12-01 `build(source_dir:, output_dir:)` call shape for backward compatibility while making production entrypoints pass `project_root:`.
- Created executable `bin/build-dev-blog` with `--source`, `--output`, and `--include-drafts` options; it runs without Rails, dotenv, Node, or BGG secrets.
- Added `dev_blog:build` Rake task as a shell delegation to the CLI with no `:environment` prerequisite.
- Verified `/public/dev-blog/` remains gitignored and generated output is never tracked.
- Extended `spec/lib/dev_blog/builder_spec.rb` with tests for path containment, rollback, deterministic output, stale cleanup, CLI behavior, Rake wrapper, and sentinel secret absence.

## Task Commits

| Task | Commit | Description |
|------|--------|-------------|
| 1 (visual) | `5398ab5` | Designer: semantic index/post templates and standalone stylesheet |
| 1 (mechanical) | `dee74a8` | Deterministic `Builder`, `BuildResult`, CLI, and no-env Rake wrapper |
| 2 | `21de34e` | Builder safety, rollback, CLI, and Rake wrapper specs |

## Deviations

- **Executor transport failures:** Three worker-agent sessions (`gsd-executor`, `fixer`) returned empty/errored payloads. The orchestrator reconciled the partial `lib/dev_blog.rb`/`builder_spec.rb` state and completed the work directly rather than spawning further agents.
- **Test harness fix:** Moved Builder and CLI sandboxes into the repository `tmp/` directory to avoid macOS `/var`→`/private/var` symlink mismatches in assertions.
- **No `.gitignore` change required:** the `/public/dev-blog` rule was already added by the Plan 12-01 tracer commit.

## Verification

- `bundle exec rspec spec/lib/dev_blog/` → 74 passed, 0 failures
- `ruby -Ilib -e 'require "dev_blog"'` → Rails not loaded
- `bin/build-dev-blog` with sentinel secrets → exit 0, 1 post built, no secrets in stdout/stderr/output
- `bin/rake dev_blog:build` → exit 0, delegates to CLI
- `git check-ignore -q public/dev-blog/index.html` → ignored

## Next

Plan 12-04 extends the Builder and templates to publish the accepted ADR catalog as a dedicated "Architecture Decisions" section on the blog index.
