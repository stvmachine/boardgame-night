---
phase: 06
slug: bgg-poll-data-layer
status: verified
# threats_open = count of OPEN threats at or above workflow.security_block_on severity (the blocking gate)
threats_open: 0
asvs_level: 1
created: 2026-07-14
---

# Phase 06 — Security

> Per-phase security contract: threat register, accepted risks, and audit trail.

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| BGG XML response → Rails process | Untrusted third-party XML crosses into Nokogiri parser; malformed/malicious payloads possible | BGG XML v2 responses (public board game data) |
| Solid Queue dispatch → BGG API | Background job egress to boardgamegeek.com under global concurrency lock | HTTPS GET requests to boardgamegeek.com (no credentials in response) |
| GraphQL client → Rails resolver | Frontend/Phase 7 queries poll data via the single GraphQL endpoint | GraphQL queries (thing IDs, collection tokens) |

---

## Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation | Status |
|-----------|----------|-----------|----------|-------------|------------|--------|
| T-06-01 | Tampering / Information Disclosure | Bgg::Client#parse_xml / Bgg::Normalizer XML parsing | high | mitigate | `app/services/bgg/client.rb:112` — `Nokogiri::XML(body) { \|config\| config.strict; config.nonet }` blocks external entity network access and DOCTYPE-based SSRF/file disclosure. Normalizer receives already-parsed docs. | closed |
| T-06-02 | Tampering | Bgg::PollPersister cache/lookup keys | low | accept | Cache keys and BggThing lookups derive from BGG `objectid` integers (`item["id"].to_i`), never user-supplied strings; no user input reaches the persister. | closed |
| T-06-03 | Denial of Service | BackfillPollDataJob / EnrichThingPollsJob / PollsLoader | medium | mitigate | `limits_concurrency to: 1, key: "bgg_api"` serializes all BGG jobs (all three jobs); `find_in_batches(batch_size: 20)` caps memory; `Bgg::RateLimiter` enforces 1 req/5s; `PollsLoader` batches all `thing_ids` in one query with `includes(:bgg_poll_results)` — no N+1; schema `max_complexity`/`max_depth` bound query cost. | closed |
| T-06-04 | Information Disclosure | GraphQL poll resolvers / job error logging | low | mitigate | `app/graphql/boardgame_night_schema.rb:45` — `disable_introspection_entry_points unless Rails.env.development? \|\| Rails.env.test?`. Resolvers read only persisted `BggPoll`/`BggPollResult` rows via `PollsLoader`; no BGG credentials or raw XML exposed. Job errors logged server-side only (Rails.logger). | closed |
| T-06-05 | Denial of Service | BggThing poll_data_fetched_at loop | medium | mitigate | `app/services/bgg/poll_persister.rb` stamps `poll_data_fetched_at: Time.current` on all three paths (lines 36, 42, 50 — with-poll, no-poll, and upsert cases). Backfill job selects `where(poll_data_fetched_at: nil)` so enriched rows are never re-fetched. | closed |
| T-06-SC | Tampering | npm/pip/cargo installs | n/a | accept | No new packages installed in this phase (RESEARCH Package Legitimacy Audit: none new; codegen is an existing project dependency). | closed |

*Status: open · closed · open — below high threshold (non-blocking)*
*Severity: critical > high > medium > low — only open threats at or above workflow.security_block_on (high) count toward threats_open*
*Disposition: mitigate (implementation required) · accept (documented risk) · transfer (third-party)*

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|
| R-06-01 | T-06-02 | Cache keys derive from BGG integer objectids; no user-supplied strings reach the persister. Low likelihood, no realistic attack vector. | gsd-secure-phase | 2026-07-14 |
| R-06-02 | T-06-SC | No new packages introduced in this phase; supply-chain surface unchanged. | gsd-secure-phase | 2026-07-14 |

*Accepted risks do not resurface in future audit runs.*

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-07-14 | 6 | 6 | 0 | gsd-secure-phase (L1 grep-depth, ASVS L1, short-circuit) |

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-07-14