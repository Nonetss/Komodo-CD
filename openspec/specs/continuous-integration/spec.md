# Continuous Integration

## Purpose

Verifies every change with lint, types, tests and a migration check, publishes the Docker images only after that verification passes and only for the images a push can affect, and publishes the project website.

## Requirements

### Requirement: Verification workflow

`.github/workflows/ci.yml` SHALL run on every pull request and when called by another workflow. On Bun's version from `packageManager`, it SHALL install with `--frozen-lockfile` and run, failing on the first error: `bunx biome ci .`, `bun run check-types`, `bun run test` and `bun run db:check`. A new push to the same pull request SHALL cancel the previous run.

#### Scenario: Type error in a pull request

- **WHEN** a pull request introduces a type error
- **THEN** the `verify` job SHALL fail

### Requirement: Image publishing

`.github/workflows/docker-build.yml` SHALL run on pushes to `main`, to `v*` branches and on `v*.*.*` tags. It SHALL call the verification workflow first and build no image if it fails. It SHALL rebuild only the images whose inputs changed since the previous commit (backend: `apps/backend/`, `packages/`, root manifests and lockfile; frontend: `apps/frontend/`, `packages/`, root manifests and lockfile; gateway: `apps/gateway/`), rebuilding all of them on tags, new branches, force pushes or changes to the workflows or `.dockerignore`. Images SHALL be pushed to `ghcr.io/<owner>/komodo-cd-<name>` tagged `latest` on the default branch, with the branch name, `<branch>-<short sha>` on branches, and `X.Y.Z` and `X.Y` on version tags, with a per-image build cache.

#### Scenario: Frontend-only change

- **WHEN** a commit to `main` changes only files under `apps/frontend/`
- **THEN** only the frontend image SHALL be rebuilt and pushed

#### Scenario: Release

- **WHEN** the tag `v1.2.3` is pushed
- **THEN** all three images SHALL be published as `1.2.3` and `1.2`

### Requirement: Website publishing

`.github/workflows/pages.yml` SHALL build `apps/site` and deploy it to GitHub Pages on pushes to `main` that touch `apps/site/**`, `img/**`, `bun.lock` or the workflow itself, and on manual dispatch. Deployments SHALL run one at a time and never be cancelled mid-publish.

#### Scenario: Docs edit

- **WHEN** a commit to `main` changes a page under `apps/site/src/content/docs/`
- **THEN** the website SHALL be rebuilt and published
