# syntax=docker/dockerfile:1
# check=error=true

# Multi-stage Dockerfile for boardgame-night-rails-vue
# Stage 1: Node build — compile Vue 3 SPA via Vite
# Stage 2: Ruby runtime — Rails 8.1.3 serves the compiled SPA + GraphQL API
#
# Production usage:
#   docker build -t boardgame-night .
#   docker run -d -p 3000:3000 \
#     -e DOTENV_PRIVATE_KEY_BGGEEK=<key> \
#     -e RAILS_MASTER_KEY=<key> \
#     boardgame-night
#
# Kamal handles the env secret injection at deploy time (config/deploy.yml env.secret).
# No kamal deploy or docker push in Phase 1 — verify locally: docker build .

# =============================================================================
# Stage 1: Node 20 build stage — compile Vue SPA into public/vite/
# =============================================================================

FROM node:20-slim AS build

WORKDIR /app

# Install npm dependencies (cached via package*.json for layer reuse)
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

# Copy application source code (filtered by .dockerignore — .env.bggeek IS included)
COPY . .

# Build the SPA — vite-plugin-ruby outputs to public/vite/ (per vite.json default)
RUN npm run build

# Copy compiled index.html to public/ for the SPA controller
# Rails serves public/ as static files, and SpaController renders public/index.html
RUN cp public/vite/index.html public/index.html

# =============================================================================
# Stage 2: Ruby 3.4 runtime stage — Rails 8.1 API-only server
# =============================================================================

FROM ruby:3.4.9-slim

# Install system dependencies needed for Ruby gem native extensions and dotenvx
RUN apt-get update -qq && \
    apt-get install --no-install-recommends -y \
    build-essential curl git libjemalloc2 libreadline-dev libssl-dev \
    libvips libyaml-dev nodejs npm pkg-config sqlite3 zlib1g-dev && \
    rm -rf /var/lib/apt/lists /var/cache/apt/archives

# Install dotenvx for encrypted .env.bggeek decryption at runtime
# The encrypted file .env.bggeek is committed; DOTENV_PRIVATE_KEY_BGGEEK is
# injected via Kamal env.secret (not baked into the image)
RUN npm install -g @dotenvx/dotenvx

# Set production Rails environment
ENV RAILS_ENV=production \
    RAILS_LOG_TO_STDOUT=1

WORKDIR /app

# Install Ruby gems (cached via Gemfile.lock for layer reuse)
COPY Gemfile Gemfile.lock ./
RUN bundle install --without development test

# Copy entire app from build stage — includes compiled public/vite/ + public/index.html
COPY --from=build /app /app

EXPOSE 3000

# Start Rails server via dotenvx for .env.bggeek decryption
# DOTENV_PRIVATE_KEY_BGGEEK is injected at runtime via Kamal env.secret (not in this file)
CMD ["dotenvx", "run", "-f", ".env.bggeek", "--", "bin/rails", "server", "-b", "0.0.0.0", "-p", "3000"]
