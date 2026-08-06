---
phase: 12-dev-blog-engine
plan: 05
type: execute
wave: 5
depends_on: [12-04]
files_modified:
  - docs/development/2026-07-21-authentication-with-rails-built-ins.md
  - docs/development/2026-08-02-merged-collection-query-deep-dive.md
  - docs/development/2026-08-02-graphql-wiring-react-to-rails.md
  - docs/development/2026-08-02-board-game-night-lifecycle.md
  - docs/development/2026-08-02-challenges-and-decisions.md
  - spec/lib/dev_blog/content_pipeline_spec.rb
autonomous: true
requirements: [BLOG-03, BLOG-05]

provides:
  - React-era authentication post updated for AuthContext, localStorage, Apollo resetStore, and Bearer auth
  - Four current-source 2026-08-02 architecture posts covering collection merge, GraphQL wiring, session lifecycle, and backend challenges
  - RSpec content-pipeline gate that verifies generated-site coverage, HTML structure, secret absence, and superseded-frontend rejection

affects:
  - 12-dev-blog-engine (corpus is now published and protected by the pipeline gate)
  - 13-react-migration-parity (published architecture prose reflects the React cutover)

actuals:
  tokens: 8500
  tasks: 3
  commits: 0

tech-stack:
  added: []
  patterns:
    - Markdown + YAML frontmatter for engineering posts, consistent with the existing dev-blog source model
    - Repository-owned prose grounded in current source files and linked to accepted ADRs via GitHub URLs
    - Generated-site verification with Nokogiri HTML5 parsing and sentinel-secret scanning

key-files:
  created:
    - docs/development/2026-08-02-merged-collection-query-deep-dive.md
    - docs/development/2026-08-02-graphql-wiring-react-to-rails.md
    - docs/development/2026-08-02-board-game-night-lifecycle.md
    - docs/development/2026-08-02-challenges-and-decisions.md
    - spec/lib/dev_blog/content_pipeline_spec.rb
  modified:
    - docs/development/2026-07-21-authentication-with-rails-built-ins.md

key-decisions:
  - "Kept the React auth post frontmatter date and title but replaced every Vue/Pinia claim with the current AuthContext + Apollo Client 3 implementation."
  - "Used `localStorage` persistence as the shipped behavior, with explicit XSS trade-off analysis, rather than repeating the original ADR-008 memory-only preference."
  - "Documented the current Apollo HTTP + WebSocket split and explicitly stated that the React client does not use BatchHttpLink, even though the controller retains multiplex compatibility."
  - "Labeled ADR-006 as historical when cited, without editing the canonical ADR body."
  - "Made the content-pipeline spec fail on unlabeled Vue/Pinia references, missing generated links, invalid HTML structure, sentinel-secret leakage, or executable raw HTML."
  - "Verified that the existing Plan 12-04 accepted ADR output remains present and unchanged while post-corpus checks run."

patterns-established:
  - "Engineering posts must include frontmatter, a current code excerpt, and a working ADR repository link."
  - "Superseded frontend stack decisions must be explicitly labeled as historical rather than described as current."
  - "Generated output is scanned for both sentinel values and the credential names that carry them."
  - "Content-currency assertions run against the real `DevBlog::Builder` output, not against source markdown alone."

requirements-completed: [BLOG-03, BLOG-05]

coverage:
  - id: D1
    description: Updated authentication post reflects the current React AuthContext and Apollo token lifecycle
    requirement: BLOG-03
    verification:
      - kind: automated
        ref: "bundle exec ruby -Ilib -rdev_blog -e 'post = DevBlog::PostParser.parse(...) ...'"
        status: pass
    human_judgment: false
  - id: D2
    description: Four new 2026-08-02 architecture posts contain current source excerpts and ADR links
    requirement: BLOG-03
    verification:
      - kind: automated
        ref: "bundle exec ruby -Ilib -rdev_blog -e 'paths = %w[...] ...'"
        status: pass
    human_judgment: false
  - id: D3
    description: Content pipeline spec builds a temporary site, validates all five posts, and rejects superseded frontend claims
    requirement: BLOG-05
    verification:
      - kind: integration
        ref: "BGG_TOKEN=phase12-secret-sentinel DOTENV_PRIVATE_KEY_BGGEEK=phase12-key-sentinel bundle exec rspec spec/lib/dev_blog/content_pipeline_spec.rb spec/lib/dev_blog/"
        status: pass
    human_judgment: false
  - id: D4
    description: Generated output contains no sentinel secret names or values and no executable raw HTML
    requirement: BLOG-05
    verification:
      - kind: integration
        ref: "spec/lib/dev_blog/content_pipeline_spec.rb#no sentinel leak / no executable raw HTML"
        status: pass
    human_judgment: false
  - id: D5
    description: Accepted ADR output from Plan 12-04 remains present and complete in the generated index
    requirement: BLOG-05
    verification:
      - kind: integration
        ref: "spec/lib/dev_blog/content_pipeline_spec.rb#preserves the accepted ADR output"
        status: pass
    human_judgment: false

duration: 75min
completed: 2026-08-02
status: complete
---

# Phase 12 Plan 05: Publish the Current Architecture Corpus Summary

**Repaired the existing authentication post for the React era, authored four new 2026-08-02 architecture posts against live code, and added a generated-site content-pipeline spec that proves the corpus is complete, current, and safe.**

## Performance

- **Duration:** ~75 min
- **Started:** 2026-08-02
- **Completed:** 2026-08-02
- **Tasks:** 3
- **Files modified:** 5 new posts + 1 updated post + 1 new spec

## Accomplishments

- Rewrote `docs/development/2026-07-21-authentication-with-rails-built-ins.md` to reflect the current React `AuthContext`, `localStorage` `bgg-night-token` lifecycle, Apollo Client `resetStore`, and Bearer auth flow. Removed all obsolete Vue/Pinia references. Linked ADR-008 and included current code excerpts from `AuthContext.tsx` and `app/frontend/lib/graphql/apollo.ts`.
- Created `docs/development/2026-08-02-merged-collection-query-deep-dive.md`, tracing the import path (`Bgg::CollectionFetcher`, `Bgg::CollectionPersister`, `ImportCollectionJob`) and the no-live-BGG read path (`BggThing.merged_for_bgg_usernames`, `Types::QueryType#merged_collection`, `Loaders::OwnersLoader`). Linked ADR-002, ADR-003, and ADR-005.
- Created `docs/development/2026-08-02-graphql-wiring-react-to-rails.md`, documenting Apollo Client 3 `createHttpLink`, `setContext` Bearer, `GraphQLWsLink`, `split`, `GraphqlController#execute`, and `BoardgameNightSchema` limits. Explicitly noted the current React client does not use `BatchHttpLink`. Cited ADR-003 and ADR-006 as historical.
- Created `docs/development/2026-08-02-board-game-night-lifecycle.md`, covering the five `NightSession` states (`draft → invited → picking → completed`, plus `cancelled`/`reopen`), host authority, provisional RSVP, going-attendee collection selection, server-ranked suggestions, and host-only pick. Linked ADR-009 through ADR-012.
- Created `docs/development/2026-08-02-challenges-and-decisions.md`, summarizing the BGG rate limit/retry/expansion workaround, persisted collections, no-Redis Solid services, dry-validation boundary, database sessions, and deterministic poll-based scoring. Linked ADR-004, ADR-005, ADR-007, and ADR-008.
- Wrote `spec/lib/dev_blog/content_pipeline_spec.rb` to build a temporary site with the real `DevBlog::Builder`, parse generated HTML with Nokogiri, and verify all five dated posts are linked in the correct order, every post page has valid structure and substantive body, no sentinel credentials leak, no executable raw HTML appears, and the accepted ADR output from Plan 12-04 remains present.

## Task Commits

No commits were made per the instruction to execute and report state without committing.

## Files Created/Modified

- `docs/development/2026-07-21-authentication-with-rails-built-ins.md` — updated for React/Apollo/localStorage
- `docs/development/2026-08-02-merged-collection-query-deep-dive.md` — new collection merge architecture post
- `docs/development/2026-08-02-graphql-wiring-react-to-rails.md` — new React-to-Rails GraphQL transport post
- `docs/development/2026-08-02-board-game-night-lifecycle.md` — new session lifecycle post
- `docs/development/2026-08-02-challenges-and-decisions.md` — new backend trade-offs post
- `spec/lib/dev_blog/content_pipeline_spec.rb` — new generated-site coverage and content-currency gate

## Decisions Made

- Published the current React implementation as the source of truth, even where the original ADR-008 text preferred a memory-only store. The post explicitly calls out the localStorage/XSS trade-off rather than hiding the divergence.
- Kept the four 2026-08-02 posts tightly scoped to the locked architecture topics, with no inferred additional topics.
- Avoided all literal `Vue`/`Pinia`/`@vue` strings in the authored post bodies so the automated stale-frontend gate can reject any regression cleanly.
- Used the real `DevBlog::Builder` in the new spec rather than mocking parsing, so the test protects the actual rendered HTML boundary.
- Left all canonical ADR bodies and the README catalog untouched; only the development posts changed.

## Deviations from Plan

None — all tasks and acceptance criteria were executed as specified.

## Issues Encountered

- The task-2 verification regex required the literal phrase "does not use BatchHttpLink" without bold markdown between the words; the first draft used "does **not** use", which failed the regex. Rephrased to plain text.
- The index-order spec initially expected the four 2026-08-02 posts in a different order; after inspecting the actual `Post` sort (`date` descending, `slug` ascending) the expected order was corrected to `board-game-night-lifecycle`, `challenges-and-decisions`, `graphql-wiring-react-to-rails`, `merged-collection-query-deep-dive`, then the 2026-07-21 authentication post.

## User Setup Required

None — no new environment keys, runtime services, or dependencies were introduced.

## Next Phase Readiness

- The five-post React-era corpus is published and the content pipeline gate is in place.
- Any future posts must satisfy the same frontmatter/code-excerpt/ADR-link requirements and pass the stale-frontend scan.
- Plan 12-04's accepted ADR output remains the separate canonical decision lane; future ADR changes do not require post edits unless they alter the current source being described.

## Verification

- `bundle exec ruby -Ilib -rdev_blog -e` task-1 checks — pass
- `bundle exec ruby -Ilib -rdev_blog -e` task-2 checks — pass
- `BGG_TOKEN=phase12-secret-sentinel DOTENV_PRIVATE_KEY_BGGEEK=phase12-key-sentinel bundle exec rspec spec/lib/dev_blog/content_pipeline_spec.rb spec/lib/dev_blog/` — 106 passed, 0 failures

---
*Phase: 12-dev-blog-engine*
*Completed: 2026-08-02*
