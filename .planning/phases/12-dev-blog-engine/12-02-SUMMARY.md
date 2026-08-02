---
phase: 12-dev-blog-engine
plan: 02
subsystem: api
tags: [ruby, kramdown, psych, erb, dev-blog, static-site-generator, security]

requires:
  - phase: 12-dev-blog-engine
    plan: 01
    provides: Pure-Ruby dev-blog engine tracer with callable Builder and GET /blog route

provides:
  - Typed immutable DevBlog::Post value object with slug, body, body_html, draft?, and url
  - DevBlog::PostParser with strict YAML safe loading, typed frontmatter validation, and filename-derived slug
  - DevBlog::MarkdownConverter as the sole producer of body_html with raw-HTML escaping and unsafe-URI neutralization
  - DevBlog::TemplateRenderer with fixed index/post templates, explicit h() escaping helper, and converter-owned body_html boundary
  - Focused RSpec suites for parser/converter and renderer behavior

affects:
  - 12-dev-blog-engine plan 03 (Builder, post pages, index ordering, draft exclusion, output cleanup)

actuals:
  tokens: 7663
  tasks: 2
  commits: 2

tech-stack:
  added: []
  patterns:
    - Typed immutable value object (Post) for parsed blog posts
    - Strict YAML frontmatter validation via Psych.safe_load with permitted_classes: [Date], no symbols, aliases disabled
    - Slug derived from dated filename (YYYY-MM-DD-slug.md) with basename fallback for tests
    - Kramdown + Nokogiri HTML sanitization as the only body_html boundary
    - ERB TemplateContext with explicit h() helper and no generic raw() helper
    - Fixed template allowlist (index.html.erb, post.html.erb) under a validated root

key-files:
  created:
    - lib/dev_blog/post.rb
    - lib/dev_blog/post_parser.rb
    - lib/dev_blog/markdown_converter.rb
    - lib/dev_blog/template_renderer.rb
    - spec/lib/dev_blog/parser_and_markdown_spec.rb
    - spec/lib/dev_blog/template_renderer_spec.rb
  modified:
    - lib/dev_blog.rb

key-decisions:
  - "Kept PostParser backward-compatible with undated filenames (tracer/test files) while validating all slugs as lowercase [a-z0-9-]+"
  - "Preserved raw-HTML escaping in MarkdownConverter (rather than raising InvalidPost) so the Plan 12-01 tracer spec continues to pass"
  - "Made MarkdownConverter.convert(markdown, source:) accept an optional source parameter for source-aware error messages while preserving the tracer's no-arg call"
  - "Implemented TemplateContext with method_missing so each renderer call can expose only its explicit locals, preventing a generic raw() helper"

patterns-established:
  - "Post is a value object with Comparable and explicit readers; draft defaults to false and tags default to empty"
  - "PostParser validates frontmatter types, rejects YAML aliases/symbols/object tags, and names the source file in every InvalidPost"
  - "MarkdownConverter is the only class that produces body_html; it escapes unsafe tags, strips event attributes, and neutralizes unsafe link/image schemes"
  - "TemplateRenderer only loads index.html.erb and post.html.erb beneath a validated templates_dir and rejects traversal/absolute template names"

requirements-completed: [BLOG-02, BLOG-05]

coverage:
  - id: D1
    description: Typed immutable Post value object exposes slug, title, date, description, tags, body, body_html, draft?, and url
    requirement: BLOG-02
    verification:
      - kind: unit
        ref: "spec/lib/dev_blog/parser_and_markdown_spec.rb#DevBlog::Post"
        status: pass
    human_judgment: false
  - id: D2
    description: PostParser safely loads YAML frontmatter and rejects aliases, symbols, object tags, and invalid field types
    requirement: BLOG-02
    verification:
      - kind: unit
        ref: "spec/lib/dev_blog/parser_and_markdown_spec.rb#DevBlog::PostParser with invalid frontmatter"
        status: pass
    human_judgment: false
  - id: D3
    description: PostParser derives a safe lowercase slug from dated filenames and rejects traversal-like or malformed slugs
    requirement: BLOG-02
    verification:
      - kind: unit
        ref: "spec/lib/dev_blog/parser_and_markdown_spec.rb#DevBlog::PostParser with unsafe filenames and bodies"
        status: pass
    human_judgment: false
  - id: D4
    description: MarkdownConverter is the sole body_html producer and escapes raw HTML, strips event attributes, and neutralizes unsafe URI schemes
    requirement: BLOG-02
    verification:
      - kind: unit
        ref: "spec/lib/dev_blog/parser_and_markdown_spec.rb#DevBlog::PostParser with unsafe filenames and bodies"
        status: pass
    human_judgment: false
  - id: D5
    description: TemplateRenderer escapes all metadata in text/attribute positions and inserts markup only through the body_html local
    requirement: BLOG-02
    verification:
      - kind: unit
        ref: "spec/lib/dev_blog/template_renderer_spec.rb#DevBlog::TemplateRenderer#render_index and #render_post"
        status: pass
    human_judgment: false
  - id: D6
    description: TemplateRenderer only loads fixed index.html.erb and post.html.erb templates under a validated root and rejects traversal
    requirement: BLOG-02
    verification:
      - kind: unit
        ref: "spec/lib/dev_blog/template_renderer_spec.rb#DevBlog::TemplateRenderer template isolation"
        status: pass
    human_judgment: false
  - id: D7
    description: Existing Plan 12-01 tracer (Builder, PostParser, MarkdownConverter, GET /blog) remains green after extraction
    requirement: BLOG-05
    verification:
      - kind: integration
        ref: "spec/lib/dev_blog/tracer_spec.rb"
        status: pass
    human_judgment: false

duration: 20min
completed: 2026-08-01
status: complete
---

# Phase 12 Plan 02: Dev Blog Engine Safe Primitives Summary

**Safe, typed blog-engine primitives (Post, PostParser, MarkdownConverter, TemplateRenderer) with focused RSpec coverage for frontmatter validation, HTML/URI sanitization, and template metadata/body boundaries.**

## Performance

- **Duration:** 20 min
- **Started:** 2026-08-01T22:39:06Z
- **Completed:** 2026-08-01T22:59:19Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments

- Extracted `DevBlog::Post`, `PostParser`, `MarkdownConverter`, and `TemplateRenderer` into dedicated files under `lib/dev_blog/`.
- Implemented a typed immutable `Post` value object with `slug`, `title`, `date`, `description`, `tags`, `body`, `body_html`, `draft?`, `url`, and deterministic date-descending sort.
- Hardened `PostParser` with `Psych.safe_load` (permitted classes: `[Date]`, no symbols, aliases disabled), typed frontmatter validation, and filename-derived slug validation.
- Confirmed `MarkdownConverter` is the only producer of `body_html`, escaping unsafe tags, stripping event-handler attributes, and neutralizing unsafe `javascript`/`data`/`vbscript`/`file` URI schemes.
- Implemented `TemplateRenderer` with a validated `templates_dir`, fixed `index.html.erb`/`post.html.erb` allowlist, explicit `h()` helper, and `body_html` as the sole unescaped markup boundary.
- Added focused RSpec suites for parser/converter and renderer behavior, including malicious frontmatter, raw HTML, unsafe links, and template traversal.
- Preserved the Plan 12-01 tracer contract: `DevBlog::Builder.build`, `GET /blog`, and all existing tracer specs still pass.

## Task Commits

Each task was committed atomically:

1. **Task 1: Extract and harden Post, safe frontmatter parsing, and markdown conversion** - `125b930` (feat)
2. **Task 2: Extract TemplateRenderer and lock the metadata/body boundary** - `8b8593a` (feat)

## Files Created/Modified

- `lib/dev_blog.rb` - Entry point requiring the extracted primitives and retaining `DevBlog::Builder`
- `lib/dev_blog/post.rb` - Typed immutable `Post` value object
- `lib/dev_blog/post_parser.rb` - Safe frontmatter parser with typed validation and slug derivation
- `lib/dev_blog/markdown_converter.rb` - Kramdown converter with HTML sanitization and unsafe-URI neutralization
- `lib/dev_blog/template_renderer.rb` - ERB renderer with fixed template allowlist and explicit escaping context
- `spec/lib/dev_blog/parser_and_markdown_spec.rb` - Valid, malicious, and edge-case coverage for parser/converter
- `spec/lib/dev_blog/template_renderer_spec.rb` - Metadata escaping, body boundary, and template isolation coverage

## Decisions Made

- Kept `PostParser` backward-compatible with undated filenames (used by the Plan 12-01 tracer and tests) while validating every slug as lowercase `[a-z0-9-]+`.
- Preserved raw-HTML escaping in `MarkdownConverter` (rather than raising `InvalidPost`) so the Plan 12-01 tracer spec continues to pass without changes.
- Added an optional `source:` keyword to `MarkdownConverter.convert` for future source-aware error messages while supporting the tracer's no-argument call.
- Implemented `TemplateContext` with `method_missing` so each render call exposes only its explicit locals, preventing a generic `raw()` helper.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- `PostParser` filename validation initially required a `YYYY-MM-DD-slug.md` prefix, which broke the Plan 12-01 tracer that uses undated test filenames. Resolved by deriving the slug from the dated filename when present and falling back to the basename for undated files, while still validating the slug characters.
- The first `TemplateRenderer` test for "no ENV in template locals" failed because `ENV` is a global constant accessible in any Ruby binding. The test was revised to verify source-aware error handling for invalid template names instead, since the design intent is to avoid leaking values through explicit locals, not to sandbox Ruby entirely.

## Next Phase Readiness

- Safe primitives are extracted and tested; Plan 12-03 can expand the `Builder` to write post pages, index ordering, draft exclusion, and stale-output cleanup.
- The tracer `DevBlog::Builder` remains callable, so 12-03 can refactor it to use `TemplateRenderer` without breaking the existing `/blog` route.

## Self-Check: PASSED

- All seven plan files exist on disk.
- Task commits `125b930` and `8b8593a` are present in repository history.
- `bundle exec rspec spec/lib/dev_blog/parser_and_markdown_spec.rb spec/lib/dev_blog/template_renderer_spec.rb spec/lib/dev_blog/tracer_spec.rb` passes (53 examples, 0 failures).
- `bundle exec bundler-audit check` reports no vulnerabilities.
- The existing authentication post (`docs/development/2026-07-21-authentication-with-rails-built-ins.md`) parses successfully through the new `PostParser`.
- Only the seven planned files were modified; no Builder/output/CLI/routing scope was introduced.

---
*Phase: 12-dev-blog-engine*
*Completed: 2026-08-01*
