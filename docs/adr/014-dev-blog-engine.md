# ADR-014: Pure-Ruby Static Site Generator for the Dev Blog

## Status

accepted

## Context

Phase 12 adds a small engineering blog under `docs/development/` that explains how the app was built. The blog source is markdown with YAML frontmatter (see the existing post `docs/development/2026-07-21-authentication-with-rails-built-ins.md`). The generated site must be static HTML that can be served from the same Kamal 2 VPS as the main application, ideally on a subdomain.

The project has hard constraints that shape the engine choice:

- **Single Kamal 2 container** — the blog build must be part of the same Docker image that serves the Rails API and the React 19 SPA (`public/`).
- **No Redis, no additional runtime services** — we cannot introduce a separate service just to publish static posts.
- **Prefer pure Ruby over a Node-based build chain** — the React frontend already uses Node/Vite, but the blog should not add another JavaScript toolchain or a Node version requirement if a Ruby-native option exists.
- **Testable with the existing RSpec suite** — generated HTML, index ordering, and frontmatter parsing should be easy to verify in CI without invoking a separate CLI.
- **React 19 frontend** — the production UI is now a React 19 + Apollo Client 3 SPA; the blog is a standalone static site that must not load the SPA runtime or depend on Tailwind's client-side behavior.

We therefore evaluated several Ruby static site generators against these constraints.

## Comparison of Pure-Ruby SSG Options

| Option | New gem dependencies | Node required? | Markdown parser | Template language | Frontmatter handling | Build output | Testability | Kamal integration |
|--------|---------------------|--------------|-----------------|-------------------|----------------------|--------------|-------------|-------------------|
| **Custom lightweight engine** | `kramdown` (and optionally `rouge`) | No | `kramdown` (pure Ruby, CommonMark/GFM compatible) | `ERB` (stdlib) | `Psych` (stdlib YAML) | `public/dev-blog/` (or any configured path) | Plain Ruby classes under `lib/dev_blog/`; tested directly with RSpec | A `bin/build-dev-blog` task runs in the Dockerfile build stage before Puma starts |
| **Bridgetown** | ~50+ gems including Bridgetown core, Active Support, and frontend helpers | **Yes** — Node ≥ 22 for esbuild/PostCSS asset processing | Configurable; default is Markdown via `kramdown` or `markdown-it` depending on config | ERB, Serbea, Liquid via plugins | YAML frontmatter | `output/` directory | Bridgetown ships with its own testing helpers; tests are more framework-coupled | Requires `package.json` and Node tooling in the build container; would extend the existing Docker build with a second frontend pipeline |
| **Jekyll** | ~30 gems including `jekyll`, `liquid`, `kramdown`, `rouge`, `webrick` | No | `kramdown` | Liquid | YAML frontmatter | `_site/` | Jekyll plugins are tested via Jekyll's own test harness; less direct than plain RSpec | Runs with `bundle exec jekyll build`; output is copied to `public/` in the Dockerfile |
| **Middleman** | ~20–30 gems including `middleman-core`, `middleman-cli`, `activesupport`, `tilt` | Optional — only if using the external pipeline for modern JS/CSS | `kramdown` or `redcarpet` | ERB, Slim, Haml, Liquid | YAML frontmatter | `build/` | Historically tested with Cucumber/Aruba; heavier integration story | Core build is pure Ruby, but many community setups add an external Node pipeline for Tailwind/esbuild, which reintroduces the JS tooling we want to avoid |
| **Serbea** | Single gem for the template language | No | Not applicable — Serbea is a template syntax, not a full SSG | Serbea syntax (similar to ERB + Liquid) | Not applicable | Not applicable | Can be used as the template engine inside a custom engine or Bridgetown | Not a standalone SSG, so it does not solve frontmatter parsing, index generation, or output management by itself |

All five options are Ruby-based at their core, but they differ significantly in how much they pull into the project:

- **Bridgetown** is the most modern and Astro-like, but its Node dependency is non-negotiable for asset processing. That violates the "no Node build chain if possible" constraint.
- **Jekyll** is mature, widely used, and pure Ruby, but it brings a Liquid-centric layout model and a non-trivial dependency tree. It also feels like a second application inside the monorepo rather than a library the Rails app owns.
- **Middleman** is powerful but has a heavier footprint and a long history of encouraging external Node pipelines. Its best fit would be a standalone marketing site, not a small blog grafted onto a Rails API app.
- **Serbea** is only a template language, not a complete solution.
- **A custom engine** keeps the footprint minimal, reuses the project’s existing Ruby toolchain and RSpec workflow, and generates exactly the HTML we need for the Kamal subdomain.

## Decision

We will build a **custom, lightweight pure-Ruby static site generator** for the `docs/development/` blog.

The engine is implemented as Ruby library code under `lib/dev_blog/` and uses only:

- `Psych` (stdlib) to parse YAML frontmatter safely.
- `kramdown` (one gem) to convert markdown to HTML.
- `ERB` (stdlib) for layout templates.
- Plain Ruby classes for `Post`, `PostParser`, `MarkdownConverter`, `HtmlSanitizer`, `Builder`, and a Rake task.

Build output is written to `public/dev-blog/` so the existing Rails/Puma static-file serving can host it without a separate service or container. The canonical build command is `bin/build-dev-blog` (a plain-Ruby CLI), with a `bin/rake dev_blog:build` wrapper for maintainers. Both commands call `DevBlog::Builder.build(source_dir:, output_dir:)` and can run without booting Rails or reading `.env.bggeek`.

The generated index is served at `/blog` from the primary host before the React SPA catch-all route. A configurable host constraint (`DEV_BLOG_HOST`) will allow the same generated files to be served from a dedicated blog subdomain; the host value is injected at deploy time and is never hardcoded in the repository.

## Consequences

- **Minimal dependency footprint**: only `kramdown` is added to the Gemfile for the engine itself. Syntax highlighting (`rouge`) is deferred until the post corpus proves it necessary. No Node, no Redis, no extra runtime services.
- **Full control over layout and URL structure**: because the engine is our own code, we can design the index page, post pages, and future RSS feed exactly as needed without fighting a third-party theme or plugin API.
- **RSpec-testable**: parsing, rendering, and the builder can be unit-tested directly with the same RSpec setup the rest of the app uses.
- **Aligned with monorepo deploy**: the build step is just another Rake/CLI invocation inside the Rails image, so Kamal’s single Docker image remains unchanged in shape.
- **Trusted template boundary**: ERB layout templates are committed repository code and are rendered without escaping. YAML frontmatter values and kramdown-produced body HTML cross separate escaping boundaries so that user-facing metadata cannot inject executable markup.
- **Maintenance burden**: we own the engine code, so fixes and features (pagination, tags, RSS) are our responsibility rather than community plugins. This is acceptable because the blog is intentionally small—an index plus a handful of architecture posts.
- **No out-of-the-box features**: Jekyll would give us sitemap, SEO, feeds, and pagination plugins for free. We will add only what the project actually needs, which keeps the scope tight.

## Accepted implementation scope

The following are part of the accepted engine and routing contract:

- `lib/dev_blog.rb` with `DevBlog::PostParser`, `DevBlog::MarkdownConverter`, `DevBlog::HtmlSanitizer`, and `DevBlog::Builder`.
- `app/controllers/dev_blog_controller.rb` serving only `public/dev-blog/index.html` with `text/html; charset=utf-8`, inline disposition, and public cache headers; missing file returns 404.
- `GET /blog` in `config/routes.rb` before the SPA wildcard.
- `bin/build-dev-blog` and `bin/rake dev_blog:build` as canonical build entrypoints.
- Configurable `DEV_BLOG_HOST` host constraint for subdomain delivery.

The following are explicitly deferred and are not part of this ADR's accepted scope:

- RSS/Atom feeds
- Tag archive pages
- Search
- Comments or reactions
- Pagination
- Analytics
- CMS/admin authoring
- Syntax highlighting unless the initial post corpus requires it

## Alternatives Considered

- **Bridgetown** — rejected because it requires Node ≥ 22 for frontend asset processing. That would add a second Node-based build pipeline to the monorepo and complicate the single-container Dockerfile.
- **Jekyll** — rejected despite being pure Ruby and mature. It introduces a separate Liquid-centric framework, a larger dependency tree, and its own `_config.yml` and `_site/` conventions. A custom engine is simpler for the small number of posts we plan to publish.
- **Middleman** — rejected because it is heavier than necessary and its ecosystem commonly pairs it with an external Node pipeline for modern assets. We want to avoid that path.
- **Serbea** — rejected as a standalone choice because it is only a template language. It may be revisited as the template syntax inside a custom engine if we later want a more component-like authoring style.

## References

- `docs/development/2026-07-21-authentication-with-rails-built-ins.md` — existing post format and frontmatter style
- `docs/adr/001-monorepo-rails-api-vue-spa.md` — single Kamal 2 container constraint (superseded frontend stack is now React 19; the monorepo/deploy contract remains)
- `docs/adr/004-solid-queue-cache-cable.md` — no Redis / no additional services constraint
- `.planning/PROJECT.md` § Constraints and § Current Milestone: v2.0 React Migration & Parity
- `.planning/phases/12-dev-blog-engine/12-01-PLAN.md` — the plan that refreshed this ADR after the React cutover
- `.planning/phases/13-react-migration-parity/13-VERIFICATION.md` — verified React 19 + Apollo Client 3 single-SPA state
- [kramdown](https://kramdown.gettalong.org/) — the pure-Ruby markdown parser we will use
- [Bridgetown installation requirements](https://www.bridgetownrb.com/docs/installation) — confirms Node ≥ 22 requirement
- [Jekyll installation requirements](https://jekyllrb.com/docs/installation/) — confirms pure Ruby dependency set
- [Middleman external pipeline](https://middlemanapp.com/advanced/external-pipeline/) — describes optional but common Node integration path
- [Serbea](https://www.serbea.dev/) — template language overview
