# ADR-013: Re-enable RuboCop Indentation Cops Over rails-omakase Defaults

## Status

accepted

## Context

The project inherits RuboCop configuration from `rubocop-rails-omakase` (ADR-001). The omakase gem disables two core indentation cops by design:

- **`Layout/IndentationConsistency`** — disabled because Rails convention uses `private` / `protected` as isolated calls (not indented), and the cop would flag private-only concerns where every method is private.
- **`Layout/IndentationWidth`** — disabled for the same reason; it "doesn't behave properly with private-only concerns" per the gem's own comments.

During local development we noticed that saving a Ruby file in Zed did **not** fix module/class indentation, even though `format_on_save` was configured. Investigation showed the omakase defaults suppress the cops entirely, so RuboCop autocorrect never touches indentation.

The team wants editor-driven formatting to keep module/class nesting consistent without manual effort, and is willing to accept the known false-positive on private-only concerns (which this project does not use).

## Decision

We will **override the omakase defaults** and explicitly enable the two indentation cops in `.rubocop.yml`:

```yaml
Layout/IndentationConsistency:
  Enabled: true

Layout/IndentationWidth:
  Enabled: true
```

This keeps the rest of the omakase rule set intact while restoring the indentation behavior that developers expect from a formatter.

## Consequences

- RuboCop autocorrect (and therefore Zed's `format_on_save`) now fixes module/class indentation.
- Files that nest `class` inside `module` (or `def` inside `class`) will be indented by two spaces per level automatically.
- If the project ever adopts private-only concerns (a class where *every* method sits below a single `private` call), RuboCop will flag the "extra" indentation as an offense. The project currently does not use that pattern.
- Developers must not assume omakase covers indentation; the override is required for editor formatting to behave.

## Alternatives Considered

- **Keep omakase defaults** — rejected: editor formatting silently ignores indentation, leading to inconsistent nesting across the codebase.
- **Enable only `Layout/IndentationConsistency`** — rejected: without `IndentationWidth`, the formatter still does not know how many spaces to use when it does indent.
- **Enable the full `Layout` department** — rejected: omakase intentionally disables many layout cops to stay minimal; we only want the two indentation cops.

## References

- `rubocop-rails-omakase` gem `rubocop.yml` (comments on `Layout/IndentationConsistency` and `Layout/IndentationWidth`)
- `.rubocop.yml` in this repo
- Zed editor `settings.json` (RuboCop formatter configuration)
