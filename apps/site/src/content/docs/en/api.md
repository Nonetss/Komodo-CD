---
title: REST API
description: The endpoints behind the dashboard, how to authenticate and where to find the interactive reference.
order: 6
---

Everything the dashboard does goes through an API that is also published as REST under `/api/v0`. The deploy endpoint is the one CI uses; the rest is there for scripts.

## Authentication

Every endpoint requires one of:

- An **API key** in the `x-api-key` header, created on the **API Keys** page. This is what CI and scripts use.
- A **session cookie**, which the browser gets when you sign in.

A request without either answers `401`. A key acts on behalf of the user who created it and is recorded in the history as `API Key: <name>`.

A key can list stacks, deploy, follow deploys live and read the history. The Komodo connection, the ntfy settings and the API keys themselves need a signed-in session: with a key they answer `403`, so a leaked CI key cannot change them.

## Reference

The backend serves an interactive OpenAPI reference, rendered by Scalar, at `/scalar`, and the OpenAPI document itself at `/doc`. Both are behind the same gateway as the dashboard, so on a default install they are at `https://deploy.example.com/scalar` and `https://deploy.example.com/doc`.

## Endpoints

| Method | Path | Does |
| --- | --- | --- |
| `GET` | `/api/v0/stacks` | Lists the stacks of the Komodo instance, with their state, services and images. |
| `POST` | `/api/v0/deploy` | Runs `pull`, `redeploy` or `pull-redeploy` on a stack. See [Deploy from CI](../ci/). |
| `GET` | `/api/v0/deploy/events` | Live stream (SSE) of deploys as they start and finish. See [Follow deploys live](#follow-deploys-live). |
| `GET` | `/api/v0/history` | The last 100 actions, newest first. |
| `GET` | `/api/v0/deploy/credentials` | The Komodo connection: id, name and URL, never the key or secret. |
| `POST` | `/api/v0/deploy/credentials` | Saves the connection (`name`, `url`, `key`, `secret`), replacing the current one. |
| `DELETE` | `/api/v0/deploy/credentials` | Removes the connection (`name`). |
| `GET` | `/api/v0/deploy/credentials/ntfy` | The ntfy settings, without the token. |
| `POST` | `/api/v0/deploy/credentials/ntfy` | Saves the ntfy settings (`url`, `topic`, `token`, `enabled`). |
| `DELETE` | `/api/v0/deploy/credentials/ntfy` | Removes the ntfy settings. |
| `POST` | `/api/v0/deploy/credentials/ntfy/test` | Sends a test notification, with the saved settings or the ones in the body. |
| `GET` | `/api/v0/apikeys` | Lists your API keys (name, first characters, dates). |
| `POST` | `/api/v0/apikeys` | Creates a key (`name`). The full key is in this response only. |
| `DELETE` | `/api/v0/apikeys` | Deletes a key (`id`). |

API keys are managed per user from a signed-in session, which is how the dashboard calls these three endpoints.

## Examples

List the stacks that have an update:

```bash
curl -s https://deploy.example.com/api/v0/stacks \
  -H "x-api-key: $KOMODO_API_KEY" \
  | jq -r '.stacks[] | select(any(.info.services[]; .update_available)) | .name'
```

Show the last failed actions:

```bash
curl -s https://deploy.example.com/api/v0/history \
  -H "x-api-key: $KOMODO_API_KEY" \
  | jq '.history | map(select(.success == false)) | .[:5]'
```

## Follow deploys live

`GET /api/v0/deploy/events` keeps the connection open and sends [Server-Sent Events](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events) with every deploy, whoever triggered it: the dashboard, another user or a pipeline. The dashboard uses the same stream to refresh the Stacks and History pages on its own.

Each event's `data` is a JSON object with a `type`:

- `subscribed`, sent once on connecting, with `running`: the deploys in progress at that moment.
- `started`, with `run`: `id`, `stack`, `action`, `via` (`session` or `apiKey`), `actorName` and `startedAt`.
- `finished`, with the same `run` plus `success`, `message` and `finishedAt`.

Past events are not replayed: what happened before you connected is in the history. The stream lives in the backend's memory, so it only covers deploys handled by that backend instance.

```bash
curl -N https://deploy.example.com/api/v0/deploy/events \
  -H "x-api-key: $KOMODO_API_KEY"
```
