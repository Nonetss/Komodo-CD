## 1. Action

- [x] 1.1 Add `action.yml` in the repository root: composite action with the inputs `url`, `api-key`, `stack`, `action` (default `pull-redeploy`), the outputs `status` and `message`, inputs passed through `env`, validation, JSON body built in bash, `curl` without timeout, error annotations on failure
- [x] 1.2 Add a job to `.github/workflows/ci.yml` that runs the action (`uses: ./`) against a local mock server and checks success, a `502` failure and input validation

## 2. Major tag

- [x] 2.1 Add `.github/workflows/action-tag.yml`: on `v*.*.*` tags without a `-` suffix, force-move `vX` to the tag's commit

## 3. Docs

- [x] 3.1 Show the action in the GitHub Actions section of `README.md`, keeping the `curl` request for other CIs
- [x] 3.2 Same in `apps/site/src/content/docs/en/ci.md` and `es/ci.md`, with the inputs, outputs and the Gitea note

## 4. Validation

- [x] 4.1 Run `bun run check-types`, `bunx biome check .` and `openspec validate --all --strict`; run the action's script locally against a mock server

## 5. Dashboard snippet

- [x] 5.1 Add `buildDeployWorkflowStep`, `DEPLOY_ACTION_REF` and `DEPLOY_ACTION_SECRET` to `apps/frontend/src/entities/deploy-action/model/deploy-actions.ts`
- [x] 5.2 Add YAML highlighting (`highlight-yaml.tsx`) and a `tabs` slot to `CodeBlock`
- [x] 5.3 Add `DeploySnippet` (`curl` / `GitHub Action` selector, hint per format) to `entities/deploy-action`, replacing `DeployCurlHint`, and use it on the Deploy page, the stack detail and the created key panel
- [x] 5.4 Add the copy (`deploy.snippetFormat`, `formatCurl`, `formatAction`, `curlHint`, `actionHint`, `actionKeyHint`) to both `es.ts` and `en.ts`, moving `stacks.ciHint` to `deploy.curlHint`
- [x] 5.5 Run `bun run check-types`, `bunx biome check .` and `bun run tailwind:check`
