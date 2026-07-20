---
phase: 9
reviewers: [codex, gsd-plan-checker]
reviewed_at: 2026-07-15T12:42:37Z
plans_reviewed:
  - 09-01-PLAN.md
  - 09-02-PLAN.md
  - 09-03-PLAN.md
  - 09-04-PLAN.md
  - 09-05-PLAN.md
  - 09-06-PLAN.md
  - 09-07-PLAN.md
verdict: BLOCK
risk: HIGH
---

# Phase 9 Plan Review

## Review Coverage

- **Codex CLI:** completed a source-grounded review of all seven plans.
- **GSD plan checker:** completed an independent source-grounded review.
- **Claude CLI:** installed but unavailable because it was not authenticated; its output was excluded.

## Overall Verdict

**BLOCK** — The plans are comprehensive and cover all eight Phase 9 requirements, but execution must not start until the unsigned UI contract and dirty-worktree verification failures are corrected. Several additional correctness and plan-alignment issues should be incorporated before execution.

## Consensus Strengths

- All Phase 9 requirements are mapped across the seven plans.
- The dependency graph is acyclic and safe, although conservative.
- Authorization, backward compatibility, generated GraphQL contracts, and regression coverage receive unusually strong attention.
- The immutable `ScopedMergedThing` direction is safer than mutable GraphQL query-context scope.
- Persisted Hot-item enrichment correctly avoids per-card BGG detail calls.
- Permalink plans preserve the `group` invite-token versus legacy-grouping distinction.
- Merged and group Apollo collection queries remain mutually exclusive.
- The final plan includes meaningful frontend, backend, schema/codegen, build, and browser gates.

## Consensus Blockers

### B1 — Phase 9 UI-SPEC is unsigned

**Evidence:**

- `09-UI-SPEC.md:4` declares `status: draft`.
- `09-UI-SPEC.md:697-705` leaves all checker dimensions unchecked and says `Approval: pending`.
- `.planning/config.json` enables the UI safety gate.

All seven plans treat exact UI copy, geometry, interaction, cardinality, and accessibility rules as approved acceptance criteria. Execution against an explicitly pending contract is unsafe.

**Required correction:** Re-run the UI checker, resolve any findings, check all six dimensions, and mark the contract approved. Also determine whether Phase 5's similarly pending metadata is stale.

### B2 — Plans 09-05 and 09-06 contain guaranteed-failing manifest checks

**Evidence:**

- `package.json` and `package-lock.json` are already modified in the inherited worktree.
- `09-05-PLAN.md:104` and `09-06-PLAN.md:104` run `git diff --quiet -- package.json package-lock.json`.

Those checks compare the dirty worktree against `HEAD`, so they fail even when the shadcn CLI introduces no new package changes.

**Required correction:** Capture and compare before/after checksums or diff snapshots for `package.json`, `package-lock.json`, and `components.json` around each generator invocation.

Example:

```bash
before="$(shasum package.json package-lock.json components.json)"
./node_modules/.bin/shadcn-vue add slider --yes
after="$(shasum package.json package-lock.json components.json)"
test "$before" = "$after"
```

## Additional Blocking Correctness Issue

### B3 — HOME-02's “base game” count is not implementable from current persistence

**Evidence:**

- `app/models/bgg_thing.rb:23` currently reports every persisted thing as non-expansion.
- The model has no persisted subtype/expansion column.
- `09-01-PLAN.md` promises a distinct persisted **base-game** count without adding subtype persistence or defining a reliable filter.

The proposed count would include expansions while claiming otherwise.

**Required decision:** Either redefine the stat as “distinct games in your collection” or add and backfill persisted subtype/expansion identity before implementing the base-game count.

## High-Priority Plan Corrections

### H1 — Preserve anonymous public merged collections explicitly in 09-03

`09-03-PLAN.md:128` can be read as returning collection payloads only for authenticated users. Existing anonymous multi-username collection behavior must remain public. Authentication should affect only the attached history scope: signed-out items still return, with `lastPlayedAt: null`.

### H2 — Reconcile Reset all with view-mode persistence

`09-06-PLAN.md:148` says Reset all clears filter and view state. View mode is presentation state and D-15 requires it to survive URL sharing. Unless the approved UI contract explicitly says otherwise, Reset all should clear search/player/time/complexity/rating/owner restrictions while preserving view, sort, grouping, collectors, and the group invite token.

### H3 — Align HomeHero ownership

- `09-UI-SPEC.md:218` and `09-PATTERNS.md` specify `HomeHero.vue`.
- `09-01-PLAN.md` instead restyles `UsernameForm.vue` in place.

Either create `HomeHero.vue` or update the UI-SPEC and pattern map to make the in-place approach intentional.

### H4 — Document and test the scoped wrapper

`09-03-PLAN.md` introduces `ScopedMergedThing`, while the existing research/pattern map proposes mutable context scope. The wrapper is safer, but the plan must document delegation and explicitly test scalar fields, owners, polls, best-player-count, `id`, `objectid`, and raw `BggThing` consumers.

### H5 — Reduce or explicitly justify 09-06 scope

`09-06-PLAN.md` owns 15 files. Its tasks are bounded, but extracting the Toggle/ToggleGroup scaffold or moving it into the primitive plan would reduce integration risk.

## Medium-Priority Corrections

- **09-02:** Permit the existing cached `Bgg::Client#hot` call on cache miss; prohibit per-card detail calls rather than all BGG calls. Scope SQL-count assertions to enrichment queries.
- **09-03:** Define the exact timestamp contract (`scheduled_at`, completion time, or `created_at` fallback) and explicitly union owned and membership groups.
- **09-04:** Make the E2E completed-session update idempotently set `picked_game`, state, and fixed scheduled time on every seed run. Define invalid timestamp parsing.
- **09-05:** Define one range normalization policy—clamp or reject—and test it consistently.
- **09-06:** Account for duplicate hidden DOM if desktop and Sheet panels are mounted simultaneously. Keep owner semantics consistently OR-based.
- **09-07:** Replace the generated-file clean-diff gate with regeneration checksums unless prior plans are guaranteed committed. Prefer semantic external links and avoid invalid nested interactive elements.
- Split 09-07's very large final command into focused gates for clearer failures.

## Dependency Assessment

The reviewers differed slightly:

- Codex considered the seven-wave chain over-serialized and suggested consolidating the three GraphQL additions before branching into Home and Collection work.
- The GSD plan checker considered the linear chain acceptable because Plans 01-03 all touch schema/codegen outputs and serialization avoids merge conflicts.

**Resolution:** Keep the linear order unless plans are restructured around one shared backend-contract plan. The current order is safe, but it should be described as file-conflict serialization rather than a product dependency.

## Plan-by-Plan Verdicts

| Plan | Verdict | Required changes |
|------|---------|------------------|
| 09-01 | BLOCK | Resolve base-game count; align HomeHero ownership; defer exact UI acceptance until sign-off |
| 09-02 | PASS WITH CHANGES | Clarify Hot cache/detail-call boundary and scoped SQL assertions |
| 09-03 | PASS WITH CHANGES | Preserve public anonymous items; document/test wrapper delegation and timestamp contract |
| 09-04 | PASS WITH CHANGES | Make fixture update idempotent; define invalid-date behavior |
| 09-05 | BLOCK | Replace dirty-tree manifest gate; include `components.json`; settle range/reset semantics |
| 09-06 | BLOCK | Replace dirty-tree gate; settle reset/view behavior; reduce or justify 15-file scope |
| 09-07 | PASS WITH CHANGES | Fix generated-file gate assumptions; tighten semantic link/nested-control behavior |

## Required Sequence Before Execution

1. Approve or revise `09-UI-SPEC.md` through the UI safety workflow.
2. Incorporate this review into all affected plans.
3. Resolve the HOME-02 base-game product/data decision.
4. Re-run the plan checker.
5. Execute Phase 9 only after the verdict is PASS.

## Planner Handoff

Use:

`/gsd-plan-phase 9 --reviews`

The planner must read this file and preserve unrelated Phase 1, package-manifest, and E2E fixture changes.
