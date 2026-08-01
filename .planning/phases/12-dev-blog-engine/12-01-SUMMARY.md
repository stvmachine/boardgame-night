---
phase: 12-dev-blog-engine
plan: 01
subsystem: infra
tags: [ruby, kramdown, psych, erb, rails, graphql, static-site-generator, dev-blog]

requires:
  - phase: 13-react-migration-parity
    provides: React 19 + Apollo Client 3 frontend verified as the sole deployed SPA; no Vue runtime/source remains.

provides:
  - Pure-Ruby dev-blog engine (Psych + kramdown + ERB) under lib/dev_blog.rb
  - GET /blog route and DevBlogController serving generated public/dev-blog/index.html before the SPA catch-all
  - Focused RSpec regression spec for safe YAML, metadata/body escaping, secret isolation, and routing
  - Refreshed ADR-014 capturing the React-era engine and delivery contract
  - 12-COVERAGE.md declaring no external API integration

affects:
  - 12-dev-blog-engine plans 02-06
  - Dockerfile (future blog build step)
  - Kamal deploy configuration (future DEV_BLOG_HOST routing)

actuals:
  tokens: 6082
  tasks: 2
  commits: 3

tech-stack:
  added:
    - kramdown (markdown-to-HTML converter)
  patterns:
    - Plain Ruby static-site builder that can run without booting Rails or reading .env.bggeek
    - Psych.safe_load with permitted_classes: [Date], no symbols, aliases disabled
    - Separate escaping boundaries for ERB templates (trusted), metadata (escaped), and converted body HTML (sanitized)
    - Generated public/dev-blog/ ignored from git; source markdown + builder + tests are canonical

key-files:
  created:
    - lib/dev_blog.rb
    - app/controllers/dev_blog_controller.rb
    - spec/lib/dev_blog/tracer_spec.rb
    - .planning/phases/12-dev-blog-engine/12-COVERAGE.md
  modified:
    - Gemfile
    - Gemfile.lock
    - config/routes.rb
    - .gitignore
    - docs/adr/014-dev-blog-engine.md

key-decisions:
  - Refreshed ADR-014 in place instead of recreating it; updated Vue-era language to React 19 and documented /blog + DEV_BLOG_HOST delivery.
  - Added HtmlSanitizer to DevBlog::MarkdownConverter so raw HTML nodes are escaped rather than passed through.
  - Pinned patched loofah, rails-html-sanitizer, rails, and graphql to pass bundler-audit rather than ignoring unrelated pre-existing advisories.

patterns-established:
  - "Psych.safe_load boundary: permitted_classes limited to Date, no symbols, aliases disabled."
  - "Nokogiri-based HTML sanitizer for raw tag/event-attribute stripping on kramdown output."
  - "Rails controller serves only an allowlisted generated index file with explicit 404 fallback."
  - "Generated public/dev-blog/ is gitignored; CI/Docker rebuilds from docs/development/."

requirements-completed: [BLOG-01, BLOG-02]

coverage:
  - id: D1
    description: Pure-Ruby dev-blog engine parses repository markdown frontmatter safely and converts markdown to HTML without booting Rails.
    requirement: BLOG-02
    verification:
      - kind: unit
        ref: "bundle exec rspec spec/lib/dev_blog/tracer_spec.rb#DevBlog.PostParser accepts Date frontmatter and renders markdown"
        status: pass
      - kind: unit
        ref: "bundle exec rspec spec/lib/dev_blog/tracer_spec.rb#DevBlog.PostParser rejects object tags without constructing objects"
        status: pass
      - kind: unit
        ref: "bundle exec rspec spec/lib/dev_blog/tracer_spec.rb#DevBlog.PostParser rejects YAML aliases"
        status: pass
    human_judgment: false
  - id: D2
    description: DevBlog converter escapes metadata, rejects raw HTML nodes, and blocks unsafe URI schemes before ERB injection.
    requirement: BLOG-02
    verification:
      - kind: unit
        ref: "bundle exec rspec spec/lib/dev_blog/tracer_spec.rb#DevBlog.MarkdownConverter escapes title/description metadata and rejects raw scripts"
        status: pass
    human_judgment: false
  - id: D3
    description: Builder runs without reading BGG credentials or dotenv files; generated HTML contains no credential names or values.
    requirement: BLOG-02
    verification:
      - kind: unit
        ref: "bundle exec rspec spec/lib/dev_blog/tracer_spec.rb#DevBlog.Builder does not leak BGG or credential values from the environment"
        status: pass
    human_judgment: false
  - id: D4
    description: GET /blog returns the generated index before the React SPA catch-all; missing index returns 404.
    requirement: BLOG-02
    verification:
      - kind: integration
        ref: "bundle exec rspec spec/lib/dev_blog/tracer_spec.rb#DevBlog GET /blog returns the generated index and routes before the SPA wildcard"
        status: pass
      - kind: integration
        ref: "bundle exec rspec spec/lib/dev_blog/tracer_spec.rb#DevBlog GET /blog returns 404 when the generated index is missing"
        status: pass
    human_judgment: false
  - id: D5
    description: ADR-014 remains accepted and accurately records the React 19 frontend, /blog route, bin/build-dev-blog, DEV_BLOG_HOST, and deferred scope.
    requirement: BLOG-01
    verification:
      - kind: other
        ref: "grep -E '^## Status|^accepted|^## Decision' docs/adr/014-dev-blog-engine.md && grep -q 'React 19' docs/adr/014-dev-blog-engine.md"
        status: pass
    human_judgment: false
  - id: D6
    description: Dependency audit passes with the locked kramdown resolution and no newly introduced vulnerable gems.
    requirement: BLOG-01
    verification:
      - kind: other
        ref: "bundle exec bundler-audit check"
        status: pass
    human_judgment: false

# Metrics
duration: 11min
completed: 2026-08-01
status: complete
---

# Phase 12 Plan 01: Dev Blog Engine Tracer Summary

**Pure-Ruby markdown-to-HTML builder with Psych safe loading, kramdown, ERB, and a same-origin `/blog` route that proves the architecture before later plans expand it.**

## Performance

- **Duration:** 11 min
- **Started:** 2026-08-01T22:19:54Z
- **Completed:** 2026-08-01T22:31:03Z
- **Tasks:** 2
- **Files modified:** 9

## Accomplishments

- Implemented the `DevBlog` namespace in `lib/dev_blog.rb` with safe YAML frontmatter parsing, kramdown conversion, raw-HTML/unsafe-link sanitization, and an ERB-based index builder.
- Added `GET /blog` via `DevBlogController#index` before the React SPA catch-all, serving only `public/dev-blog/index.html` with `text/html; charset=utf-8`, inline disposition, and a public cache header.
- Generated the first index from the existing authentication post and verified it without booting Rails or reading BGG credentials.
- Added a focused RSpec regression spec proving safe YAML, metadata/body escaping, secret isolation, and route-before-SPA behavior.
- Refreshed ADR-014 to reflect React 19, `/blog`, `bin/build-dev-blog`, `DEV_BLOG_HOST`, and the deferred feature list.
- Created `12-COVERAGE.md` declaring that this plan adds no external API integration.

## Task Commits

Each task was committed atomically:

1. **Task 1: Prove one markdown post through the pure-Ruby builder and same-origin route** - `a3b6927` (feat)
2. **Task 2: Lock the tracer security contract and reconcile ADR-014** - `a9efc76` (test)

## Files Created/Modified

- `lib/dev_blog.rb` - `DevBlog` namespace: `PostParser`, `MarkdownConverter`, `HtmlSanitizer`, `Builder`
- `app/controllers/dev_blog_controller.rb` - Serves generated index or 404
- `config/routes.rb` - Added `GET /blog` before SPA wildcard
- `spec/lib/dev_blog/tracer_spec.rb` - Regression spec for safe boundaries and routing
- `docs/adr/014-dev-blog-engine.md` - React-era refresh of accepted engine decision
- `.planning/phases/12-dev-blog-engine/12-COVERAGE.md` - No-external-API declaration
- `Gemfile` / `Gemfile.lock` - Added `kramdown`; pinned patched transitive gems
- `.gitignore` - Ignore generated `public/dev-blog/`

## Decisions Made

- Refreshed the existing ADR-014 instead of recreating it; updated all Vue/Pinia language to React 19 + Apollo Client 3.
- Kept `bin/build-dev-blog` named in ADR-014 as the canonical plain-Ruby CLI while not implementing it in this tracer plan.
- Added `DevBlog::HtmlSanitizer` using Nokogiri to escape raw script/style/iframe/etc. tags and strip event-handler attributes, satisfying the “reject raw HTML nodes” requirement.
- Pinned patched `loofah`, `rails-html-sanitizer`, `rails`, and `graphql` versions to make `bundler-audit` pass rather than leaving unrelated pre-existing advisories unaddressed.

## Deviations from Plan

### Safe-resume deviation

**Old docs-only baseline preserved but superseded**
- **Found during:** Plan start
- **Issue:** The safe-resume gate identified two earlier docs-only commits (`d6b2b51` and `ef75a12`) that wrote ADR-014 and an ADR index update. The new plan replans the phase around a production tracer and ADR reconciliation, so the old commits alone do not satisfy the new tasks.
- **Resolution:** The old commits were left in place as valid baseline history. The existing ADR-014 was refreshed in place rather than recreated, and the new tracer implementation, controller, route, spec, and coverage artifact were executed from scratch.
- **Files modified:** `docs/adr/014-dev-blog-engine.md`
- **Committed in:** `a9efc76` (Task 2)

### Auto-fixed Issues

**1. [Rule 1 - Bug] Raw HTML nodes passed through kramdown into generated output**
- **Found during:** Task 2 (writing tracer_spec.rb)
- **Issue:** `DevBlog::MarkdownConverter` relied on kramdown's `parse_block_html: false`/`parse_span_html: false` to keep raw HTML from becoming DOM nodes, but raw `<script>` tags were still emitted verbatim into `body_html`.
- **Fix:** Added `DevBlog::HtmlSanitizer` using `Nokogiri::HTML5.fragment` to escape raw unsafe tags (`script`, `style`, `iframe`, `object`, `embed`, `form`, `input`, `textarea`, `button`) and strip `on*` event attributes.
- **Files modified:** `lib/dev_blog.rb`
- **Verification:** `bundle exec rspec spec/lib/dev_blog/tracer_spec.rb` raw-script case now passes.
- **Committed in:** `a9efc76` (Task 2)

**2. [Rule 3 - Blocking] bundler-audit failed on pre-existing transitive gem advisories**
- **Found during:** Task 2 verification (`bundle exec bundler-audit check`)
- **Issue:** `loofah` 2.25.1, `rails-html-sanitizer` 1.7.0, `rails` 8.1.3, and `graphql` 2.6.3 had published security advisories. The failure blocked the required audit acceptance criterion.
- **Fix:** Added explicit Gemfile pins for the patched versions (`loofah >= 2.25.2`, `rails-html-sanitizer >= 1.7.1`, `rails ~> 8.1.3 >= 8.1.3.1`, `graphql ~> 2.6 >= 2.6.6`) and ran `bundle install`.
- **Files modified:** `Gemfile`, `Gemfile.lock`
- **Verification:** `bundle exec bundler-audit check` now reports `No vulnerabilities found`; full `bundle exec rspec` still passes (508 examples, 0 failures).
- **Committed in:** `a9efc76` (Task 2)

---

**Total deviations:** 1 safe-resume deviation + 2 auto-fixed issues (1 bug, 1 blocking)
**Impact on plan:** All deviations were necessary to satisfy the plan's acceptance criteria and security posture. No scope creep beyond the tracer contract.

## Issues Encountered

- The first draft of `DevBlog::MarkdownConverter` did not escape raw HTML blocks; fixed by adding `HtmlSanitizer`.
- `bundler-audit` surfaced unrelated pre-existing advisories in transitive gems; fixed by pinning patched versions.
- The route spec initially built output into the wrong directory (the controller expects `public/dev-blog/index.html`, not `out/index.html`); fixed by building into `public_dir/dev-blog` and stubbing `Rails.public_path` to `public_dir`.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Tracer architecture is proven and regression-tested.
- Plan 12-02 can refactor the single-file `lib/dev_blog.rb` into dedicated files (`lib/dev_blog/post.rb`, etc.) without changing public contracts.
- Plan 12-03 can expand post pages, index ordering, draft exclusion, and stale-output cleanup.
- Plan 12-04 can add `bin/build-dev-blog` and Dockerfile build integration.
- Plan 12-05/12-06 can add configurable `DEV_BLOG_HOST` routing and maintainer docs.

---
*Phase: 12-dev-blog-engine*
*Completed: 2026-08-01*

## Self-Check: PASSED

- All key files exist on disk.
- Task commits `a3b6927` and `a9efc76` are present in repository history.
- `bundle exec rspec spec/lib/dev_blog/tracer_spec.rb` passes (7 examples, 0 failures).
- `bundle exec bundler-audit check` reports no vulnerabilities.
- Full backend suite passes (508 examples, 0 failures).
- Generated `public/dev-blog/index.html` exists and contains the authentication post title.
- `GET /blog` returns 200 via `Rack::MockRequest` before the SPA catch-all.
