---
title: Deploy from CI
description: Create an API key and trigger a Pull, Redeploy or Pull + Redeploy from GitHub Actions, Gitea Actions or any script.
order: 3
---

CI talks to the same endpoint the dashboard's curl snippets use: `POST /api/v0/deploy`, authenticated with an API key in the `x-api-key` header.

## Create an API key

Open **API Keys** (`/keys`), give the key a name (the pipeline or repository it is for) and create it. The full key is shown **only once**: copy it into your CI secrets right away. Afterwards the list shows only its first characters.

Actions made with a key are recorded in the history as `API Key: <name>`, so one key per pipeline tells you which one deployed what. Deleting a key revokes it immediately.

## The request

```bash
curl --fail-with-body -X POST https://deploy.example.com/api/v0/deploy \
  -H "x-api-key: $KOMODO_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"stack":"my-stack","action":"pull-redeploy"}'
```

| Field | Value |
| --- | --- |
| `stack` | The stack name in Komodo. |
| `action` | `pull`, `redeploy` or `pull-redeploy`. |

The request returns once Komodo has accepted the action; the deploy itself runs in Komodo, where you can follow it. A success answers `200` with:

```json
{
  "success": true,
  "message": "Acción 'pull-redeploy' completada para 'my-stack'",
  "stack": "my-stack",
  "action": "pull-redeploy"
}
```

A missing or invalid key answers `401`. If Komodo rejects the action (an unknown stack, a key without permission, Komodo unreachable), the answer is `502` with Komodo's message in `message` (`503` if Komodo CD has no Komodo connection yet), and the failure is recorded in the history like any other action. `--fail-with-body` makes curl exit with an error on those, so the CI step fails too.

The page of each stack in **Stacks** and the **Deploy** page show the step for the action below with the stack and action filled in, ready to copy, and this same command under the **curl** tab.

## GitHub Actions

The repository ships a GitHub Action, `Nonetss/Komodo-CD@v2`, that sends this same request: you give it four inputs instead of writing the `curl`. A workflow that builds and pushes an image to GHCR and then redeploys the stack that runs it:

```yaml
name: Build, Publish and Deploy

on:
  push:
    branches:
      - main

jobs:
  build:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write

    steps:
      - uses: actions/checkout@v7

      - name: Log in to GHCR
        uses: docker/login-action@v4
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Build and push
        uses: docker/build-push-action@v7
        with:
          context: .
          push: true
          tags: ghcr.io/${{ github.repository }}:latest

      - name: Pull + Redeploy stack
        uses: Nonetss/Komodo-CD@v2
        with:
          url: ${{ secrets.KOMODO_CD_URL }}
          api-key: ${{ secrets.KOMODO_API_KEY }}
          stack: ${{ vars.STACK_NAME }}
          action: pull-redeploy
```

It expects these repository secrets and variables:

| Key | Type | Value |
| --- | --- | --- |
| `KOMODO_CD_URL` | Secret | The public URL of Komodo CD, for example `https://deploy.example.com`. |
| `KOMODO_API_KEY` | Secret | The API key created above. |
| `STACK_NAME` | Variable | The stack name in Komodo. |

### The action's inputs and outputs

| Input | Required | Value |
| --- | --- | --- |
| `url` | Yes | The public URL of Komodo CD. |
| `api-key` | Yes | The API key. Pass it as a secret. |
| `stack` | Yes | The stack name in Komodo. |
| `action` | No | `pull`, `redeploy` or `pull-redeploy` (the default). |

The step waits until Komodo has finished, like the request, and fails on any answer that is not `2xx` (or when Komodo CD cannot be reached), with Komodo CD's message as the error. It exposes two outputs: `status`, the HTTP code, and `message`, the answer's message. The API key never shows up in the log.

`@v2` follows the latest 2.x release. To freeze it, pin an exact tag (`@v2.3.0`) or a commit SHA.

## Fail on vulnerabilities

Every successful deploy queues a [Trivy](https://trivy.dev) scan of the stack's images, and the same API key reads the results. The scan runs in the background, so a pipeline that wants to block on the result waits until none of the stack's images is `queued` or `scanning`, then checks the counts:

```yaml
      - name: Fail on critical vulnerabilities
        env:
          URL: ${{ secrets.KOMODO_CD_URL }}
          KEY: ${{ secrets.KOMODO_API_KEY }}
          STACK: ${{ vars.STACK_NAME }}
        run: |
          for i in $(seq 1 60); do
            images=$(curl -sf "$URL/api/v0/security/images" -H "x-api-key: $KEY" \
              | jq --arg s "$STACK" '[.images[] | select(.stacks | index($s))]')
            echo "$images" | jq -e 'all(.status != "queued" and .status != "scanning")' > /dev/null && break
            sleep 10
          done
          echo "$images" | jq -e 'map(.counts.critical) | add == 0'
```

A scan that could not pull the image (a private registry, for example) ends as `failed` with `errorKind: "unauthorized"` and keeps zero counts, so decide in the `jq` filter whether that should fail the job.

## Gitea Actions

Gitea Actions runs the same workflow syntax: put the file in `.gitea/workflows/` and define the same secrets and variables in the repository settings. The deploy step does not change: Gitea runs the action from GitHub too, since it only needs `bash` and `curl` on the runner.

## Without a CI

The endpoint is plain HTTP and JSON, so anything that can run curl can deploy: a cron job, a Git hook or a script on your laptop.
