---
phase: 13-react-migration-parity
plan: 01
subsystem: frontend-tooling
tags: [react, graphql-codegen, apollo, typescript, vitest, playwright]

requires:
  - phase: 11-polish-e2e-hardening
    provides: Completed product baseline, React test suite, and serialized Playwright acceptance suite
provides:
  - Byte-stable React Apollo hook generation from the committed Rails schema and embedded TypeScript documents
  - Repository-wide strict TypeScript gate covering React, Vitest, Node, and Playwright sources
  - Explicit audited Playwright and Node type dependencies with lockfile provenance
affects: [13-02, 13-03, 13-04, 13-05, 13-06, react-parity, e2e]

actuals:
  tokens: 36205
  tasks: 2
  commits: 5

tech-stack:
  added: ["@playwright/test ^1.61.1", "@types/node ^22.20.1"]
  patterns:
    - Self-contained React Apollo operation output generated beside a separate schema-types artifact
    - Root npm typecheck command validates application and repository-owned tests together

key-files:
  created:
    - app/frontend/generated/types.ts
    - app/frontend/generated/operations.ts
  modified:
    - codegen.ts
    - package.json
    - package-lock.json
    - tsconfig.json
    - app/frontend/lib/graphql/documents.ts
    - app/frontend/pages/AccountPage.tsx
    - tests/vitest/adapters.spec.ts

key-decisions:
  - "Generate operation types and React hooks together so operations.ts is self-contained while retaining generated/types.ts as the schema artifact."
  - "Use the existing importCollection mutation for Account sync rather than preserving a nonexistent syncCollection client operation."
  - "Keep GqlGroup.anonymousBggUsernames required and repair the stale test fixture instead of weakening the production contract."

patterns-established:
  - "GraphQL generation: scan app/frontend TypeScript documents, validate against schema.graphql, and require a byte-identical second pass."
  - "Type boundary: npm run typecheck is the single strict check for React source, Vitest, Node utilities, and Playwright files."

requirements-completed:
  - RMP-03
  - RMP-04
  - RMP-05

coverage:
  - id: D1
    description: Deterministic GraphQL generation emits self-contained React Apollo query and mutation hooks with no Vue runtime imports.
    requirement: RMP-04
    verification:
      - kind: integration
        ref: "npm run codegen (two passes with SHA equality and generated-hook/Vue-import assertions)"
        status: pass
      - kind: integration
        ref: "npm run typecheck"
        status: pass
    human_judgment: false
  - id: D2
    description: Node and Playwright imports resolve from explicit audited devDependencies under the repository-wide TypeScript gate.
    requirement: RMP-05
    verification:
      - kind: integration
        ref: "npm run typecheck"
        status: pass
      - kind: unit
        ref: "npm test (8 files, 143 tests)"
        status: pass
    human_judgment: false
  - id: D3
    description: Schema-invalid score and account-sync operations are repaired at their owning client boundary without weakening production types.
    requirement: RMP-03
    verification:
      - kind: integration
        ref: "npm run codegen"
        status: pass
      - kind: unit
        ref: "tests/vitest/adapters.spec.ts#toGroup"
        status: pass
    human_judgment: false

duration: 6 min
completed: 2026-07-31
status: complete
---

# Phase 13 Plan 01: React GraphQL and TypeScript Toolchain Summary

**Byte-stable React Apollo hooks now generate from the Rails schema, while one strict TypeScript command validates the React, Vitest, Node, and Playwright boundary.**

## Performance

- **Duration:** 6 min
- **Started:** 2026-07-31T22:52:31Z
- **Completed:** 2026-07-31T22:59:06Z
- **Tasks:** 2
- **Files modified:** 9

## Accomplishments

- Replaced the stale Vue-only codegen contract with deterministic React Apollo hooks generated from embedded `.ts`/`.tsx` GraphQL documents.
- Added explicit Playwright and Node type dependencies plus a root `npm run typecheck` gate covering application and test code.
- Repaired schema-invalid score and account-sync operations and kept the strict `GqlGroup` production contract intact while correcting its test fixture.

## Task Commits

Each task was committed atomically:

1. **Task 1: Replace Vue codegen with deterministic React Apollo generation** — `e28f041` (feat)
2. **Task 2 RED: Add the repository TypeScript gate** — `bf0131a` (test)
3. **Task 2 GREEN: Make TypeScript and Playwright dependencies explicit** — `19f159e` (feat)

## Files Created/Modified

- `codegen.ts` — Scans embedded TypeScript GraphQL documents and emits self-contained React Apollo hooks.
- `app/frontend/generated/types.ts` — Generated schema-derived TypeScript artifact.
- `app/frontend/generated/operations.ts` — Generated operation types, documents, and React query/mutation hooks.
- `package.json` — Declares the typecheck command and direct Playwright/Node test dependencies.
- `package-lock.json` — Locks the audited test-toolchain dependency graph.
- `tsconfig.json` — Resolves Node globals and built-ins alongside Vite browser types.
- `tests/vitest/adapters.spec.ts` — Supplies the required anonymous BGG usernames group field.
- `app/frontend/lib/graphql/documents.ts` — Uses the schema's actual `ScoreInput` input type.
- `app/frontend/pages/AccountPage.tsx` — Reuses the supported `importCollection` mutation for account sync.

## Decisions Made

- Kept `generated/types.ts` as the schema artifact while allowing `typescript-operations` v6 to provide the shared input/enum types needed by the self-contained hooks file; adding the base `typescript` plugin to both outputs produced duplicate declarations.
- Reused the existing `IMPORT_COLLECTION` document for account sync and passed the trimmed bound BGG username, because the Rails schema has no `syncCollection` mutation.
- Corrected the adapter fixture with `anonymousBggUsernames: []` rather than making the required production GraphQL field optional.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Repaired schema-invalid embedded GraphQL documents**
- **Found during:** Task 1 (first React codegen pass)
- **Issue:** `SubmitScores` referenced nonexistent `ScoreInputType`, and Account used a nonexistent `syncCollection` mutation, so schema validation blocked all generated hooks.
- **Fix:** Changed the score input to `ScoreInput` and routed account sync through the supported `importCollection(username:)` mutation.
- **Files modified:** `app/frontend/lib/graphql/documents.ts`, `app/frontend/pages/AccountPage.tsx`
- **Verification:** Two codegen passes succeeded and remained byte-identical; strict typecheck passed.
- **Committed in:** `e28f041`

**2. [Rule 1 - Bug] Removed duplicate declarations from generated operations**
- **Found during:** Task 2 RED (`npm run typecheck`)
- **Issue:** Combining the base `typescript` plugin with `typescript-operations` v6 in the same operations output duplicated schema enums and `ScoreInput`.
- **Fix:** Kept `typescript` only for `generated/types.ts`; the self-contained operations output now uses `typescript-operations` plus `typescript-react-apollo`.
- **Files modified:** `codegen.ts`, `app/frontend/generated/operations.ts`
- **Verification:** `npm run typecheck`, `npm test`, and byte-stable double codegen all passed.
- **Committed in:** `19f159e`

---

**Total deviations:** 2 auto-fixed (2 Rule 1 bugs)
**Impact on plan:** Both fixes were required to make the planned schema-validation and strict-typecheck gates truthful; no product scope was added.

## Issues Encountered

- npm reported that the already-present `listr2` codegen dependency prefers Node `>=22.13.0` while this shell runs Node `20.20.2`. Codegen, typecheck, and all 143 Vitest assertions still passed; the lockfile remains deterministic and the declared Node types are compatible with the project's Node 22 target.

## Known Stubs

None. Matches for `placeholder` are ordinary HTML input attributes, and empty object/array defaults are generated helpers or intentional test-fixture values rather than unwired UI data.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- React pages can import generated Apollo hooks with a deterministic schema contract.
- Plan 13-02 can proceed with live Home/Hot data and anonymous quick-start parity on a green type/test foundation.
- No blockers remain for the next plan.

## Self-Check: PASSED

- All key created and modified files exist on disk.
- Task commits `e28f041`, `bf0131a`, and `19f159e` exist in git history.
- The final codegen, typecheck, and 143-test verification gates passed with no uncommitted production diff.

---
*Phase: 13-react-migration-parity*
*Completed: 2026-07-31*
