## Why

Every pipeline that deploys through Komodo CD copies the same hand-written `curl` step (URL, `x-api-key`, JSON body, `--fail-with-body`), and small mistakes in it (a missing `--fail-with-body`, a broken JSON quote, a secret interpolated into the shell) go unnoticed until a deploy silently does nothing. A reusable GitHub Action turns that step into four inputs.

## What Changes

- A composite GitHub Action in the repository root (`action.yml`), used as `uses: Nonetss/Komodo-CD@v2` with the inputs `url`, `api-key`, `stack` and `action` (default `pull-redeploy`). It validates the inputs, sends `POST <url>/api/v0/deploy`, fails the step on any non-2xx answer or connection error with Komodo CD's message, and exposes the HTTP status and the message as outputs. No Docker image: it runs `curl` on the runner, so it also works in Gitea Actions.
- A workflow that, on every `vX.Y.Z` tag, moves the major tag (`vX`) to that release, so `@v2` follows the latest 2.x release.
- The README and the site's "Deploy from CI" page (English and Spanish) show the action as the GitHub/Gitea way to deploy; the `curl` request stays documented for any other CI.
- The dashboard's CI snippet (Deploy page, stack detail, new API key panel) gets a selector between `curl` and a ready-to-copy step for the action, which reads the key from the `KOMODO_API_KEY` secret.
- No database migration. No backend or API change.

## Capabilities

### New Capabilities

- `deploy-action`: the reusable GitHub Action that triggers a deploy through `POST /api/v0/deploy`: its inputs, validation, outputs and failure behaviour.

### Modified Capabilities

- `continuous-integration`: a new requirement for the workflow that moves the major version tag of the action on each release.
- `deployment`: the CI snippet offers the `curl` command or a GitHub Action step.
- `api-key-management`: the new key panel shows that snippet (its `curl` format carries the key).
- `stacks-overview`: the stack detail's CI snippet has both formats.

## Impact

- New files: `action.yml`, `.github/workflows/action-tag.yml`.
- Frontend: `entities/deploy-action` (snippet builder and `DeploySnippet`), `CodeBlock` and a YAML highlighter, the Deploy page, the stack detail, the created key panel and both locales.
- Docs: `README.md`, `apps/site/src/content/docs/en/ci.md`, `apps/site/src/content/docs/es/ci.md`.
- `@v2` only exists after the next `v2.*.*` release is tagged and pushed; until then the action is usable with an exact tag or `@main`.
