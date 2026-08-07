# Phase 12 Plan 07: Dev Blog Deployment Evidence

This document records the automated pre-deployment evidence for Plan 12-07 Task 1 and leaves the real DNS/TLS/Kamal-proxy reachability gate open for human action.

## Source revision

```text
bd871c91d054fb5b9c68e52648ac7a09a7791a8b
```

## Focused RSpec suites

Command run:

```bash
DEV_BLOG_HOST=blog.example.test \
BGG_TOKEN=phase12-secret-sentinel \
DOTENV_PRIVATE_KEY_BGGEEK=phase12-key-sentinel \
rtk rspec --tag='~docker' spec/lib/dev_blog spec/requests/dev_blog_controller_spec.rb
```

Result:

```text
✓ RSpec: 149 passed (3.21s)
```

The Docker image-build example was excluded with `--tag='~docker'` because Plan 12-07 explicitly marks the full Docker image build as `awaiting human action / longer local run`. All other build, delivery, controller, and content-pipeline examples passed.

## Plain-Ruby build

Command run:

```bash
bin/build-dev-blog
```

Result:

```text
Built 6 posts and 14 ADRs in /Users/estvmachine/Projects/personal/boardgame-night-rails-vue/public/dev-blog
```

## Post manifest

Generated post pages:

```text
public/dev-blog/posts/authentication-with-rails-built-ins/index.html
public/dev-blog/posts/board-game-night-lifecycle/index.html
public/dev-blog/posts/challenges-and-decisions/index.html
public/dev-blog/posts/graphql-api-guide/index.html
public/dev-blog/posts/graphql-wiring-react-to-rails/index.html
public/dev-blog/posts/merged-collection-query-deep-dive/index.html
```

Directory content hash (SHA-256 of all `public/dev-blog` file hashes, sorted):

```text
64dd068ed1082ed7ed43ae52479841c4ce13a10b9d4e61b228a3e7ff9a15be10
```

## Accepted-ADR manifest

Generated ADR pages:

```text
public/dev-blog/adrs/001-monorepo-rails-api-vue-spa/index.html
public/dev-blog/adrs/002-rails-owns-bgg-communication/index.html
public/dev-blog/adrs/003-graphql-n-plus-one-dataloader/index.html
public/dev-blog/adrs/004-solid-queue-cache-cable/index.html
public/dev-blog/adrs/005-bgg-collection-import-pipeline/index.html
public/dev-blog/adrs/006-vue-apollo-normalized-cache/index.html
public/dev-blog/adrs/007-dry-rails-validation-contracts/index.html
public/dev-blog/adrs/008-authentication-session-strategy/index.html
public/dev-blog/adrs/009-provisional-user-accounts-rsvp/index.html
public/dev-blog/adrs/010-group-invitation-tokens/index.html
public/dev-blog/adrs/011-group-collection-view/index.html
public/dev-blog/adrs/012-session-lifecycle-state-machine/index.html
public/dev-blog/adrs/013-rubocop-indentation-cops/index.html
public/dev-blog/adrs/014-dev-blog-engine/index.html
```

Catalog check:

```bash
ruby -Ilib -rdev_blog -e 'puts DevBlog::AdrCatalog.load(...).length'
```

Result: `14` — matches the generated ADR page count.

## Kamal configuration rendering

Command run:

```bash
APP_HOST=app.example.test \
DEV_BLOG_HOST=blog.example.test \
KAMAL_REGISTRY_PASSWORD=phase12-registry-sentinel \
bin/kamal config > tmp/phase12-final-kamal-config.txt
```

Result: exit 0. The rendered file is at `tmp/phase12-final-kamal-config.txt` (596 bytes) and is **not** committed because it is under `tmp/` and contains the sentinel registry placeholder. The file was produced successfully; the contents are omitted here to avoid recording any credential-shaped value.

## Docker image build

Status: **awaiting human action / longer local run**

The full `docker build` of the Rails + React image is slow on this machine and was not run as part of the focused evidence. The Dockerfile stage that runs `bin/build-dev-blog` is already covered by the plain-Ruby build and by the Dockerfile assertions in `spec/lib/dev_blog/docker_delivery_spec.rb` (which passed when the Docker image-build example was skipped). The image build should be performed in CI or in a dedicated long-running environment.

## External reachability

Status: **awaiting human action**

Real DNS, TLS, and Kamal-proxy verification cannot be completed by automation without operator-controlled infrastructure. The operator must:

1. Export real `APP_HOST` and `DEV_BLOG_HOST` hostnames.
2. Create/confirm A/AAAA records for both hosts pointing to the Kamal VPS.
3. Open ports 80 and 443 inbound.
4. Run the configured Kamal deploy.
5. Verify HTTPS requests for both host-root and `/blog/` index, post, ADR, and stylesheet paths.
6. Confirm the ADR page shows the historical notice.

No real hostname, IP, or credential value is recorded in this document.

## Secret hygiene

- All sentinel values used in this evidence are placeholders (`phase12-*`).
- No production domain, IP, account, registry token, dotenv key, or Rails master key is recorded here.
- The rendered Kamal config file is under `tmp/` and is gitignored.
- `public/dev-blog/` is gitignored and was not committed.
