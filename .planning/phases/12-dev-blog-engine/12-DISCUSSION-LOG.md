# Phase 12: Dev Blog Engine - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-08-02
**Phase:** 12-dev-blog-engine
**Areas discussed:** Engine contract, Content currency, Deployment routing, Build isolation, Presentation scope, Release verification

---

## Engine Contract

| Option | Description | Selected |
|--------|-------------|----------|
| Custom lightweight engine | Preserve ADR-014: Psych safe loading, kramdown, ERB, plain Ruby classes | ✓ |
| Jekyll | Mature pure-Ruby framework with a larger dependency and convention surface | |
| Bridgetown | Modern Ruby SSG with a required Node-oriented frontend pipeline | |

**User's choice:** Auto-selected the existing accepted ADR-014 custom engine.
**Notes:** ADR-014 and its index row already exist, so Plan 12-01 must revalidate/update rather than recreate the decision.

---

## Content Currency

| Option | Description | Selected |
|--------|-------------|----------|
| React-current content | Update every technical claim and snippet to the shipped React 19 application | ✓ |
| Preserve Vue wording | Treat the carried July content as-is | |
| Separate historical archive | Keep old posts unchanged and write parallel migration material | |

**User's choice:** Auto-selected React-current content.
**Notes:** Vue is allowed only when explicitly labeled historical. The existing auth post needs React/AuthContext corrections.

---

## Deployment Routing

| Option | Description | Selected |
|--------|-------------|----------|
| Configurable host plus `/blog` fallback | Use an environment-configured host and same-origin path before real DNS exists | ✓ |
| Hardcoded subdomain | Commit a production hostname despite placeholder deploy config | |
| Separate static service | Deploy the blog independently from Rails/Kamal | |

**User's choice:** Auto-selected configurable host plus path fallback.
**Notes:** Blog routes must precede the SPA catch-all and reject traversal/host injection.

---

## Build Isolation

| Option | Description | Selected |
|--------|-------------|----------|
| Plain Ruby CLI plus Rake wrapper | Generate without Rails boot or BGG secrets | ✓ |
| Rails boot required | Build through Rails runner/task and manage initializer bypasses | |
| External build service | Move generation outside the single image | |

**User's choice:** Auto-selected a plain-Ruby canonical build path.
**Notes:** Docker should generate in the Ruby image stage after app and production gems are present.

---

## Presentation Scope

| Option | Description | Selected |
|--------|-------------|----------|
| Minimal static reading experience | Semantic HTML, standalone CSS, responsive type, focus states, system color mode | ✓ |
| Reuse SPA assets | Load React/Tailwind output into the blog | |
| Full documentation platform | Search, tag pages, RSS, comments, and richer navigation | |

**User's choice:** Auto-selected minimal static pages.
**Notes:** Index and post pages are the complete Phase 12 presentation surface.

---

## Release Verification

| Option | Description | Selected |
|--------|-------------|----------|
| Automation plus real deployment checkpoint | Automate code/image/routing checks and require a human DNS/TLS request | ✓ |
| Claim fully automated reachability | Infer public reachability from request specs | |
| Verify `/blog` only | Ship without validating the required subdomain | |

**User's choice:** Auto-selected automation plus a blocking deployment checkpoint.
**Notes:** Real external reachability cannot be fabricated; record the tested URL/result without secrets.

---

## the agent's Discretion

- Exact static typography and template organization.
- Exact environment variable name, used consistently across routes, deploy docs, and tests.
- Exact prose and excerpts after source verification.
- Rake/CLI delegation shape.

## Deferred Ideas

- RSS/Atom, tag archives, search, comments, pagination, analytics, CMS/admin authoring, and optional syntax highlighting.
