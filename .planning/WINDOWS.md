---
schema_version: 1
open_count: 1
waived_count: 0
fixed_count: 0
total_count: 1
last_updated: 2026-08-01T12:05:03.868Z
---

# Broken Windows Ledger

> Cross-phase defect register. `/gsd-ship` blocks while `open_count > 0`.
> Waive with `gsd-tools windows waive <id> "<reason>"` (reason required).
> Mark fixed with `gsd-tools windows fixed <id>`.

| id | phase | kind | file | line | description | status | reason | recorded_at | resolved_at |
|----|-------|------|------|------|-------------|--------|--------|-------------|-------------|
| 1 | 13 | todo | app/frontend/lib/graphql/adapters.ts | 154 | Categories/mechanics are not exposed by MergedThing, so extractCategories intentionally returns an empty array | open |  | 2026-08-01T12:05:03.868Z |  |

````json
[
  {
    "id": 1,
    "kind": "todo",
    "phase": "13",
    "file": "app/frontend/lib/graphql/adapters.ts",
    "line": 154,
    "description": "Categories/mechanics are not exposed by MergedThing, so extractCategories intentionally returns an empty array",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-01T12:05:03.868Z",
    "resolved_at": null
  }
]
````
