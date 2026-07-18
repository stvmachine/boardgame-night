# Phase 11: Closeout Evidence Ledger

**Created:** 2026-07-18
**Status:** Verified
**Plan:** 11-05

## D-08 / DEBT-03: Legacy BGG Import Cleanup

### Canonical import path

| Check | Result | Command / Source |
|-------|--------|------------------|
| Namespaced job file exists | ✅ PASS | `test -f app/jobs/bgg/import_collection_job.rb` |
| Duplicate root job absent | ✅ PASS | `test ! -e app/jobs/import_collection_job.rb` |
| Only one `Bgg::ImportCollectionJob` class definition | ✅ PASS | `grep -r 'class Bgg::ImportCollectionJob' app/jobs/` → 1 match |
| Unsafe `fetch_and_persist!` absent from app/ | ✅ PASS | `rg -l 'fetch_and_persist!' app --glob '*.rb'` → no matches |
| Canonical job calls `CollectionFetcher` | ✅ PASS | `rg -q 'CollectionFetcher' app/jobs/bgg/import_collection_job.rb` |
| Canonical job calls `persist_collection!` | ✅ PASS | `rg -q 'persist_collection!' app/jobs/bgg/import_collection_job.rb` |
| Concurrency key `bgg_api` present | ✅ PASS | `rg -q 'key: "bgg_api"' app/jobs/bgg/import_collection_job.rb` |
| Focused job specs pass | ✅ PASS | `bundle exec rspec spec/jobs/bgg/import_collection_job_spec.rb spec/services/bgg/collection_persister_spec.rb` → 19 examples, 0 failures |

### Source

- Canonical: `app/jobs/bgg/import_collection_job.rb` (defines `Bgg::ImportCollectionJob`)
- Fetcher: `app/services/bgg/collection_fetcher.rb`
- Persister: `app/services/bgg/collection_persister.rb` (provides `persist_collection!`)
- Specs: `spec/jobs/bgg/import_collection_job_spec.rb` (15 examples), `spec/services/bgg/collection_persister_spec.rb` (4 examples)

---

## D-09 / DEBT-04: Restored v1.0 Requirement Evidence

The six v1.0 requirement rows below are restored as checked with their implementation evidence linked to the existing v1.0 milestone audit. No audit narrative is duplicated here.

| Requirement | Implementation evidence | Verification evidence | Source |
|-------------|-----------------------|---------------------|--------|
| **BGG-01** — Fetch BGG user collection with correct base games + expansions via two-call workaround | Bgg::CollectionFetcher implements the `subtype=boardgame` + `excludesubtype=boardgameexpansion` / `subtype=boardgameexpansion` two-call pattern; XML fixtures cover single-vs-array normalization | RSpec specs with ported XML fixtures; rate-limiter/throttle/retry specs | [v1.0 Milestone Audit](../v1.0-MILESTONE-AUDIT.md) |
| **BGG-04** — Persisted collections merge into deduplicated view via pure database query | `BggThing.merged_for_users` scope; BggCollection model with deduplication merge query | Rails integration specs; collection merge query tests | [v1.0 Milestone Audit](../v1.0-MILESTONE-AUDIT.md) |
| **BGG-05** — Collection imports as Solid Queue background jobs with explicit retry/discard | `Bgg::ImportCollectionJob` with `limits_concurrency to: 1, key: "bgg_api"` and `retry_on`/`discard_on` | Focused job specs (15 examples) | [v1.0 Milestone Audit](../v1.0-MILESTONE-AUDIT.md) |
| **COLL-01** — N-user merge with owner color-avatars in responsive layout | N-user GraphQL merge resolver; color-avatar mapping; responsive grid layout | Collection View component tests; E2E merge flow | [v1.0 Milestone Audit](../v1.0-MILESTONE-AUDIT.md) |
| **COLL-03** — Fuzzy search, filter by players/time/complexity, sort by name/rating/year/complexity | Fuse.js client-side search; filter/sort/group composables and controls | Filter/sort unit tests; Collection View integration tests | [v1.0 Milestone Audit](../v1.0-MILESTONE-AUDIT.md) |
| **COLL-05** — Hot/trending games on landing page with well-formed game cards | TrendingGames component; HomeView dashboard; BggThing hot cache | HomeDashboard specs; E2E home smoke test | [v1.0 Milestone Audit](../v1.0-MILESTONE-AUDIT.md) |

---

## D-10 / DS-02: App Shell Evidence

| Check | Result | Source |
|-------|--------|--------|
| DS-02 implementation verified in Phase 5 | ✅ PASS | [Phase 5 Verification](../phases/05-design-system-foundation/05-VERIFICATION.md) — row 2: DS-02 |
| Desktop sidebar renders at 280px width | ✅ PASS | `tests/e2e/shell.spec.ts` — `desktop sidebar shows 280px nav shell` |
| Desktop sidebar contains nav items | ✅ PASS | `tests/e2e/shell.spec.ts` — Home, Collection, Hot, Groups, Account links |
| Mobile drawer available | ✅ PASS | `tests/e2e/shell.spec.ts` — `mobile hides sidebar and opens sheet drawer` |

---

## DEBT-01: E2E Test Suite in CI

| Check | Result | Source |
|-------|--------|--------|
| Dedicated Chromium CI job | ✅ PASS | `.github/workflows/ci.yml` — `e2e` job with least-privilege `contents: read` |
| Fixture-safe deterministic Playwright harness | ✅ PASS | `spec/frontend/e2eFixtureGuard.spec.ts` — 15 guard/recovery tests |
| Full protected Chromium suite passes | ✅ PASS | `npm run e2e` — 30/30 tests, SHA parity verified |
| Playwright zero retries, failure-only diagnostics | ✅ PASS | `tests/e2e/playwright.config.ts` — `retries: 0`, `screenshot: only-on-failure`, `trace: retain-on-failure` |
| Completion gate evidence | ✅ PASS | [11-02-SUMMARY.md](11-02-SUMMARY.md) — all D-01 through D-04 coverage rows |

---

## DEBT-02: Action Cable Development Path

| Check | Result | Source |
|-------|--------|--------|
| Rails `/cable` mount before SPA wildcard | ✅ PASS | `config/routes.rb` — `mount ActionCable.server => "/cable"` |
| Solid Cable development adapter | ✅ PASS | `config/cable.yml` — `adapter: solid_cable` |
| Narrow Vite origin allowlist | ✅ PASS | `config/environments/development.rb` — `allowed_request_origins` |
| Vite WebSocket proxy for `/cable` | ✅ PASS | `vite.config.ts` — `/cable` proxy with `ws: true` |
| Apollo consumer at `/cable` | ✅ PASS | `app/frontend/apollo/client.ts` — `createConsumer('/cable')` |
| Route/adapter/origin/proxy/consumer contract | ✅ PASS | `spec/config/action_cable_contract_spec.rb` — 9 examples, 0 failures |
| Real browser Action Cable welcome | ✅ PASS | `tests/e2e/action_cable.spec.ts` — received `{"type":"welcome"}` |
| Completion gate evidence | ✅ PASS | [11-03-SUMMARY.md](11-03-SUMMARY.md) — all D-05 through D-07 coverage rows |

---

## DEBT-04 (closeout): Requirement Status Update

| Check | Result | Source |
|-------|--------|--------|
| DEBT-04 checked row exists | ✅ PASS | `.planning/REQUIREMENTS.md` — `- [x] **DEBT-04**` |
| DEBT-04 traceability Complete | ✅ PASS | `.planning/REQUIREMENTS.md` — Traceability table row `DEBT-04 | Phase 11 | Complete` |
| All six v1.0 rows checked | ✅ PASS | BGG-01, BGG-04, BGG-05, COLL-01, COLL-03, COLL-05 all `- [x]` |
| Audit link present | ✅ PASS | `v1.0-MILESTONE-AUDIT.md` referenced |
| Evidence link present | ✅ PASS | `11-EVIDENCE.md` referenced |

---

*Generated: 2026-07-18*
*Phase 11 Plan 05 closeout ledger*
