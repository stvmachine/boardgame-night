---
phase: 12-dev-blog-engine
plan: 07
type: execute
wave: 7
depends_on: [12-06]
files_modified:
  - docs/development/README.md
  - .planning/phases/12-dev-blog-engine/12-DEPLOYMENT-EVIDENCE.md
autonomous: false
requirements: [BLOG-04, BLOG-05]

provides:
  - Maintainer runbook covering authoring, build, preview, tests, CI, Docker, Kamal, DNS/TLS, URL shapes, rollback, and accepted-ADR rules
  - Non-secret deployment evidence record with passing pre-deployment checks and explicit human-action checkpoints

affects:
  - 12-dev-blog-engine (Plan 12-07 closed; D-19 external reachability manually waived)

actuals:
  tokens: 12000
  tasks: 1
  commits: 1

tech-stack:
  added: []
  patterns:
    - Repository-owned Markdown runbook kept alongside the generated blog
    - Evidence recorded as a planning-phase artifact, not as application code
    - Sentinel env values used only for local verification; no real secrets recorded

key-files:
  created:
    - docs/development/README.md
    - .planning/phases/12-dev-blog-engine/12-DEPLOYMENT-EVIDENCE.md

key-decisions:
  - "Documented the working focused RSpec command without setting RAILS_MASTER_KEY, because the repository uses config/master.key and an invalid env value would fail Rails boot."
  - "Excluded the :docker image-build example from the local evidence run because Plan 12-07 marks the full Docker build as awaiting human action / longer local run."
  - "Rendered the Kamal config with .test hostnames and a sentinel registry password into tmp/phase12-final-kamal-config.txt, then recorded only the file existence and size rather than its contents."
  - "Accepted the operator's waiver of the D-19 external DNS/TLS/proxy reachability checkpoint; the remaining verification steps are preserved in the evidence file for future reference."

patterns-established:
  - "Runbook uses APP_HOST/DEV_BLOG_HOST variables only; no invented production domains."
  - "Evidence allowlists commands, exit results, paths, and public URL shapes; it excludes registry tokens, private keys, dotenv keys, and Rails credentials."

requirements-completed: [BLOG-05]

coverage:
  - id: D1
    description: Maintainer runbook covers authoring, build, preview, focused tests, CI, Docker, Kamal, DNS/TLS, URL shapes, rollback, and accepted-ADR rules
    requirement: BLOG-05
    verification:
      - kind: human_review
        ref: "docs/development/README.md table of contents and commands"
        status: pass
    human_judgment: true
  - id: D2
    description: Focused RSpec suites pass (149 examples) with the Docker image-build example excluded
    requirement: BLOG-05
    verification:
      - kind: integration
        ref: "DEV_BLOG_HOST=blog.example.test BGG_TOKEN=phase12-secret-sentinel DOTENV_PRIVATE_KEY_BGGEEK=phase12-key-sentinel rtk rspec --tag='~docker' spec/lib/dev_blog spec/requests/dev_blog_controller_spec.rb"
        status: pass
    human_judgment: false
  - id: D3
    description: Plain-Ruby build produces 6 posts, 14 ADRs, and a stable directory hash
    requirement: BLOG-05
    verification:
      - kind: integration
        ref: "bin/build-dev-blog && find public/dev-blog -type f -print0 | sort -z | xargs -0 shasum -a 256 | shasum -a 256"
        status: pass
    human_judgment: false
  - id: D4
    description: Kamal config renders successfully with .test hostnames and a sentinel registry password
    requirement: BLOG-05
    verification:
      - kind: integration
        ref: "APP_HOST=app.example.test DEV_BLOG_HOST=blog.example.test KAMAL_REGISTRY_PASSWORD=phase12-registry-sentinel bin/kamal config > tmp/phase12-final-kamal-config.txt"
        status: pass
    human_judgment: false
  - id: D5
    description: External DNS/TLS/Kamal-proxy reachability gate (D-19) was manually waived by the operator on 2026-08-07
    requirement: BLOG-04
    verification:
      - kind: human_action
        ref: "12-DEPLOYMENT-EVIDENCE.md External reachability section"
        status: waived
    human_judgment: true
    rationale: "Operator manually waived D-19; real DNS/TLS/VPS credentials were not available."

duration: 45min
completed: 2026-08-07
status: complete
---

# Phase 12 Plan 07 Task 1: Maintainer Runbook and Pre-Deployment Evidence Summary

**Authored the complete maintainer runbook and recorded the pre-deployment evidence for the dev blog. The plan was closed with the operator's waiver of the external DNS/TLS/Kamal-proxy reachability checkpoint (D-19).**

## Performance

- **Duration:** ~45 min
- **Started:** 2026-08-07
- **Completed:** 2026-08-07
- **Task:** 1 of 2 (Task 2 D-19 manually waived by operator)
- **Files modified:** 2 new

## Accomplishments

- Created `docs/development/README.md` with sections on post filename/frontmatter rules, content safety, drafts, CLI and Rake build commands, generated output layout, deterministic/stale-clean behavior, local preview, focused RSpec commands, CI behavior, accepted ADR rules, Docker image build, Kamal configuration, DNS/TLS, public URL shapes, rollback, and explicit out-of-scope deferred features.
- Created `.planning/phases/12-dev-blog-engine/12-DEPLOYMENT-EVIDENCE.md` recording the source revision, passing focused RSpec suites (149 examples), plain-Ruby build output, post and accepted-ADR manifests, directory hash, Kamal config rendering, and a manually waived external reachability section for D-19.
- Verified that the focused RSpec suites pass when the Docker image-build example is excluded (`--tag='~docker'`), matching the plan's instruction that the full Docker build is a longer human-run checkpoint.
- Verified that `bin/build-dev-blog` generates 6 posts and 14 ADRs, and that the ADR count matches `DevBlog::AdrCatalog.load`.
- Verified that `bin/kamal config` renders with `.test` hostnames and a sentinel registry password, producing the ignored `tmp/phase12-final-kamal-config.txt` file.

## Task Commits

- `dbf96c1` docs(dev-blog): add maintainer runbook and deployment evidence for Plan 12-07

## Files Created/Modified

- `docs/development/README.md` — complete maintainer runbook
- `.planning/phases/12-dev-blog-engine/12-DEPLOYMENT-EVIDENCE.md` — non-secret deployment evidence record

## Decisions Made

- Removed the `RAILS_MASTER_KEY=phase12-master-sentinel` placeholder from the documented focused test command because the repository uses `config/master.key`; an invalid env value overrides the real key and prevents Rails from booting. The working command uses only `DEV_BLOG_HOST`, `BGG_TOKEN`, and `DOTENV_PRIVATE_KEY_BGGEEK` sentinels.
- Excluded the `:docker` image-build example from the local evidence run. The full Rails + React Docker image build is slow locally and is left for CI or a dedicated long-running environment, as Plan 12-07 instructs.
- Recorded the Kamal config file path and size rather than its contents, because the rendered file contains the sentinel registry password.
- Accepted the operator's waiver of the D-19 external DNS/TLS/proxy reachability checkpoint; the remaining verification steps are preserved in the evidence file for future reference. No real hostname, IP, or credential was recorded.

## Deviations from Plan

None. The documented focused RSpec command differs from the plan's literal command only in omitting the invalid `RAILS_MASTER_KEY` sentinel, which is a necessary correction for the local environment. The verification still covers the same examples and asserts the same behavior.

## Issues Encountered

- The plan's verification command included `RAILS_MASTER_KEY=phase12-master-sentinel`. Setting that value causes `ActiveSupport::MessageEncryptor::InvalidMessage` because the env value overrides the real `config/master.key`. The working command omits `RAILS_MASTER_KEY` and relies on the existing key file.
- The `docker_delivery_spec` image-build example is tagged `:docker` and was excluded from the local evidence run to avoid the long build time. All other examples in that spec pass.

## User Setup Required

None. The operator waived the D-19 external reachability gate. The remaining public-reachability steps in the evidence file may be exercised later if the operator chooses to deploy the blog to real DNS/TLS infrastructure.

## Next Phase Readiness

- Plan 12-07 is complete with D-19 manually waived.
- No further Task 2 action is required to close this phase.

## Verification

- `DEV_BLOG_HOST=blog.example.test BGG_TOKEN=phase12-secret-sentinel DOTENV_PRIVATE_KEY_BGGEEK=phase12-key-sentinel rtk rspec --tag='~docker' spec/lib/dev_blog spec/requests/dev_blog_controller_spec.rb` → `✓ RSpec: 149 passed (3.21s)`
- `bin/build-dev-blog` → `Built 6 posts and 14 ADRs in /Users/estvmachine/Projects/personal/boardgame-night-rails-vue/public/dev-blog`
- `ruby -Ilib -rdev_blog -e 'puts DevBlog::AdrCatalog.load(...).length'` → `14`
- `APP_HOST=app.example.test DEV_BLOG_HOST=blog.example.test KAMAL_REGISTRY_PASSWORD=phase12-registry-sentinel bin/kamal config > tmp/phase12-final-kamal-config.txt` → exit 0, 596 bytes produced under `tmp/`

---
*Phase: 12-dev-blog-engine*
*Plan 12-07 completed: 2026-08-07*
*D-19 external reachability gate: manually waived*
