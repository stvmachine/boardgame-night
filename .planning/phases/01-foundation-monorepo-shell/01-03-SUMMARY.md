---
phase: "01-foundation-monorepo-shell"
plan: "01-03"
subsystem: "deploy"
tags:
  - docker
  - kamal
  - deploy
  - multi-stage
  - dotenvx
  - production-image
status: complete
duration: "~30 minutes"
completed: "2026-07-02"
commits:
  - hash: "9d150af"
    message: "feat(01-foundation-monorepo-shell): multi-stage Dockerfile — Node 20 build → Ruby 3.4 runtime with dotenvx"
  - hash: "f3469a9"
    message: "test(01-foundation-monorepo-shell): add docker:verify rake task with deploy/Docker assertions"
  - hash: "760ea32"
    message: "feat(01-foundation-monorepo-shell): multi-stage Docker build + Kamal deploy.yml placeholders"
requirements:
  - DEPLOY-01
  - DEPLOY-02
key-files:
  created:
    - bin/generate-index-html.mjs
    - lib/tasks/docker_verify.rake
  modified:
    - Dockerfile
    - config/deploy.yml
tech-stack:
  added:
    - "Docker multi-stage (Node 20 build → Ruby 3.4 runtime)"
    - "dotenvx runtime decryption in CMD"
    - "Kamal 2 deploy.yml with DOTENV_PRIVATE_KEY_BGGEEK"
  patterns:
    - "Generate public/index.html from Vite manifest in Docker build"
    - "npm install --force for platform-specific optional deps (fsevents)"
    - "Separate deploy config with placeholder values for server/registry"
decisions:
  - "Use `npm install --ignore-scripts --force` instead of `npm ci` because fsevents is a non-optional dependency in the lockfile but only works on macOS; Docker Linux builds need --force to skip platform validation"
  - "Generate public/index.html from Vite manifest (bin/generate-index-html.mjs) rather than expecting vite-plugin-ruby to produce it — vite-plugin-ruby only outputs hashed assets + manifest, not an HTML entry file"
  - "Use shell history-safe `test ! -e` (via `sh -c` quoting) instead of `! test -e` in rake task, because zsh treats bare `!` as history expansion"
  - "Keep ruby:3.4.9-slim (matching .ruby-version) for runtime stage, not 3.4.10"
dependencies:
  requires:
    - "01-02 (Vue SPA shell + vite_rails setup)"
  affects:
    - "Phase 02 (BGG integration — deploy config for production)"
---

# Phase 1 Plan 3: Docker + Kamal Multi-Stage Image — Summary

Build the single Docker image that contains Rails 8.1.3 + compiled Vue 3.5.35 SPA (multi-stage Node build → Ruby runtime), and scaffold Kamal 2.12 `config/deploy.yml` with placeholder values for server/registry/secrets.

## Tasks

### Task 1: Multi-stage Dockerfile with Node build + Ruby runtime

**Commit:** `9d150af`

Created a two-stage `Dockerfile`:

- **Stage 1** (`FROM node:20-slim AS build`): `WORKDIR /app`, `COPY package.json package-lock.json ./`, `RUN npm install --ignore-scripts --force`, `COPY . .` (subject to `.dockerignore`), `RUN npm run build` (Vite), `RUN node bin/generate-index-html.mjs`
- **Stage 2** (`FROM ruby:3.4.9-slim`): system deps (build-essential, libvips, sqlite3, etc.), `npm install -g @dotenvx/dotenvx`, `bundle install --without development test`, `COPY --from=build /app /app`, `EXPOSE 3000`, `CMD ["dotenvx", "run", "-f", ".env.bggeek", "--", "bin/rails", "server", "-b", "0.0.0.0", "-p", "3000"]`

**`.dockerignore`** at repo root (gitignored) excludes: `.env.bggeek.keys`, `.env.keys`, `.planning/`, `node_modules/`, `storage/`, `log/`, `tmp/`, `.git/`, `Dockerfile`, `.dockerignore`, test artifacts, `.DS_Store`. Does NOT exclude `.env.bggeek` (encrypted file must be in image for runtime decryption).

**`bin/generate-index-html.mjs`**: Script that reads `public/vite/.vite/manifest.json` after Vite build, extracts the entry point and CSS assets, and writes `public/index.html` with proper `<script>` and `<link>` tags referencing the hashed paths. This is necessary because `vite-plugin-ruby` outputs only the manifest + hashed assets, not an HTML entry file.

### Task 2 (TDD GREEN): Kamal deploy.yml + docker:verify rake task

**RED commit:** `f3469a9` — added `lib/tasks/docker_verify.rake` with 8-step verification: deploy.yml placeholders, docker build, SPA presence, Rails executable, .env key absence, .env.bggeek presence, no deploy/push.

**GREEN commit:** `760ea32` — implemented `config/deploy.yml` with D-14 placeholders:
- `service: boardgame-night`
- `image: ghcr.io/youruser/boardgame-night`
- `servers.web: [192.168.0.1]`
- `registry.server: ghcr.io`
- `env.secret: [RAILS_MASTER_KEY, DOTENV_PRIVATE_KEY_BGGEEK]`
- Preserved volumes, aliases, builder arch, and accessory comments from Rails 8 scaffold

## Verification Results

All 8 `bundle exec rake docker:verify` checks pass:

| # | Check | Result |
|---|-------|--------|
| 1 | config/deploy.yml placeholders (service, image, DOTENV, RAILS_MASTER_KEY, YAML parse) | ✅ |
| 2 | `docker build .` exits 0 | ✅ (image: sha256:b26bc609a57a) |
| 3 | `public/index.html` exists (compiled SPA) | ✅ |
| 4 | `bin/rails` executable | ✅ |
| 5 | `.env.bggeek.keys` ABSENT (T-3-01 security) | ✅ |
| 6 | `.env.keys` ABSENT (T-3-01 security) | ✅ |
| 7 | `.env.bggeek` PRESENT (encrypted) | ✅ |
| 8 | No kamal deploy or docker push invoked (D-12) | ✅ |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] `npm ci` fails on Linux for macOS-only `fsevents` dependency**
- **Found during:** Task 2 RED phase (docker build test)
- **Issue:** `fsevents@2.3.3` is listed as a non-optional dependency in `package.json` (generated on macOS by npm 8). `npm ci` and `npm install` both fail on Docker Linux with `EBADPLATFORM: unsupported platform`.
- **Fix:** Added `--force` flag to `npm install`. The `fsevents` module is a no-op on Linux and the `--force` flag skips the platform validation check without changing the lockfile contents.
- **Files modified:** `Dockerfile`
- **Commit:** `760ea32`

**2. [Rule 1 - Bug] `public/vite/index.html` doesn't exist after `npm run build`**
- **Found during:** Task 2 GREEN phase (docker build failed at `cp public/vite/index.html public/index.html`)
- **Issue:** `vite-plugin-ruby` only outputs a manifest and hashed assets (JS/CSS), not an `index.html` file. The plan assumed `public/vite/index.html` would be created by the Vite build.
- **Fix:** Created `bin/generate-index-html.mjs` script that reads the Vite manifest and generates `public/index.html` with correct hashed asset references. Dockerfile runs this script after `npm run build`.
- **Files created:** `bin/generate-index-html.mjs`
- **Files modified:** `Dockerfile`
- **Commit:** `760ea32`

**3. [Rule 1 - Bug] Shell negation `! test -e` causes zsh history expansion**
- **Found during:** Task 2 verification
- **Issue:** Ruby `system()` calls `! test -e path` which zsh interprets as history expansion (`!test`), breaking the negation check. The file-absent checks falsely reported files as present.
- **Fix:** Changed to `sh -c 'test ! -e path'` (quoting the entire shell command to prevent zsh from seeing the `!`). The `test ! -e` form is semantically identical and shell-safe.
- **Files modified:** `lib/tasks/docker_verify.rake`
- **Commit:** `760ea32`

## Known Stubs

- `config/deploy.yml` uses placeholder values: `ghcr.io/youruser/boardgame-night` (image), `192.168.0.1` (server), commented-out registry credentials. These are intentional D-14 placeholders per plan spec and must be replaced before actual deploy.
- `public/index.html` is generated inside the Docker image only (not on host filesystem) — correct behavior; the file only needs to exist in production containers.

## Threat Flags

| Flag | File | Description |
|------|------|-------------|
| threat_flag: secrets-in-image | Dockerfile (Stage 2) | The final image contains the encrypted `.env.bggeek` file. This is **intentional and secured by design**: the file is encrypted with dotenvx and the private decryption key (`DOTENV_PRIVATE_KEY_BGGEEK`) is never baked into the image — it's injected at runtime via Kamal `env.secret`. The `.dockerignore` explicitly excludes `.env.bggeek.keys` and `.env.keys` to prevent private key leakage. |
