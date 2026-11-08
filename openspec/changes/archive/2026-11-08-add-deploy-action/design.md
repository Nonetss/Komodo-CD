## Context

See proposal.md - Why. The deploy contract is `v0.deploy.trigger` (`POST /api/v0/deploy`, `protectedProcedure`, specified in `deployment`). This change adds no procedure and does not touch the API: the action is one more client of that endpoint, like the dashboard's `curl` snippets.

## Goals / Non-Goals

**Goals:**

- One step, four inputs, the same behaviour as the documented `curl --fail-with-body`, plus readable errors and outputs.
- Works unchanged in Gitea Actions.

**Non-Goals:**

- Waiting for the Trivy scan or failing on vulnerabilities: that stays a documented `curl` + `jq` step.
- A Docker image for other CIs: plain `curl` is still documented for them.
- Publishing to the GitHub Marketplace (it rejects repositories that contain workflow files).

## Decisions

- **Composite action, not a Docker action.** No image to build, publish and pull on each job; runs on any runner OS that has `bash` and `curl`. A Docker action would add a fourth image and only run on Linux runners.
- **`action.yml` in the repository root.** That is what makes `uses: Nonetss/Komodo-CD@v2` work; a subfolder would need `Nonetss/Komodo-CD/<folder>@v2`. The action is versioned with the app's own `vX.Y.Z` tags, since its contract is the app's API.
- **Inputs through `env`, never `${{ inputs.* }}` inside `run`.** Expression expansion in `run` is pasted into the script before bash parses it, so a stack name could inject commands.
- **JSON built in bash, without `jq`.** Gitea's default runner images do not always ship `jq`. Control characters are rejected as invalid input, so escaping `\` and `"` is enough for a JSON string. The answer's `message` is read with `jq` when it is available and with a `sed` fallback otherwise; the raw body is used when neither finds it.
- **No `curl` timeout.** Komodo CD waits for Komodo to finish; the job's own `timeout-minutes` bounds it.
- **Major tag workflow separate from `docker-build.yml`.** It needs `contents: write` and must not wait for the image builds; a tag pushed with `GITHUB_TOKEN` triggers no other workflow, and `vX` does not match `v*.*.*` anyway.

- **Dashboard snippet as a tab of the code block, `curl` by default.** One `DeploySnippet` in `entities/deploy-action` serves the three places that showed the `curl`, so they stay identical. The step reads the key from `${{ secrets.KOMODO_API_KEY }}` even on the new key panel: a key pasted into a workflow file ends up in git history.

## Risks / Trade-offs

- [`@v2` does not exist until the next release] → until the next `v2.*.*` tag is pushed, pin an exact tag or `@main`.
- [A breaking change to the deploy API breaks `@vX`] → it would be a major version of the app, which gets a new major tag.
