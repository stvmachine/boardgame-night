# Phase 12 API Coverage

**Plan:** 12-01
**Status:** complete
No external API integration: the dev-blog engine reads repository markdown and serves static files; DNS, TLS, and Kamal reachability are deployment verification rather than a third-party API/SDK surface.

This phase adds no external API integrations. The dev-blog engine is a pure-Ruby static site generator that reads repository-authored markdown from `docs/development/` plus the accepted catalog in `docs/adr/` and writes generated HTML to `public/dev-blog/`. It does not call BoardGameGeek, any third-party service, or any authenticated API.
