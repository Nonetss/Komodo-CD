---
title: Architecture
description: The four containers, how a request travels through them, and what Komodo CD stores.
order: 7
---

Komodo CD is a thin layer between people, pipelines and one Komodo instance. It does not deploy anything by itself: it asks Komodo to.

## Services

| Service | Image | Inside |
| --- | --- | --- |
| `gateway` | `ghcr.io/nonetss/komodo-cd-gateway` | Caddy on port `80`, the only published port. It routes every request and adds basic security headers. |
| `frontend` | `ghcr.io/nonetss/komodo-cd-frontend` | Astro SSR (React islands) on port `4321`, reachable only inside the Compose network. |
| `backend` | `ghcr.io/nonetss/komodo-cd-backend` | Bun + Hono on port `3000`: Better Auth, the oRPC API, its REST version and the OpenAPI reference. It also ships the `trivy` client. |
| `trivy` | `aquasec/trivy` | Trivy server on port `4954`, reachable only inside the Compose network. It keeps the vulnerability database in the `trivy_cache` volume. |

The backend keeps its data in a SQLite file, `/data/db.sqlite`, on the `db_data` volume. There is no database server.

## Routing

The gateway splits the traffic:

| Request | Goes to |
| --- | --- |
| `/rpc/*` | Backend: the typed RPC protocol the dashboard uses. |
| `/api/*` | Backend: the REST API (`/api/v0/*`) and Better Auth (`/api/auth/*`). |
| `/doc`, `/scalar` | Backend: OpenAPI document and interactive reference. |
| Anything else | Astro SSR, which renders the dashboard. |

Astro checks the session on every page from the server side, through the backend, and redirects to the sign-in page when there is none.

## Who is asking

Every API request is resolved to a user before it runs:

1. If it carries `x-api-key`, the key is verified and the request acts as the key's owner, named `API Key: <name>`.
2. Otherwise the Better Auth session cookie is checked.
3. Without either, the request answers `401`.

## Talking to Komodo

The backend loads the Komodo connection from the database when it starts and every time it is saved, and keeps one client for it. With that client it:

- Reads `ListStacks` on every stacks request, asking for every page on Komodo v2. Nothing about the stacks is cached or stored.
- Runs `PullStack` and `DeployStack` for the three actions. Pull + Redeploy is one then the other.

Komodo then does the work on your servers through its Periphery agents, as it would for an action launched from its own UI.

## After an action

Every action, successful or not, is written to the history with the user, the stack, the action and the message. When one fails and ntfy alerts are on, the backend publishes an alert to the configured topic. A slow or unreachable ntfy server never holds the deploy back: the alert gives up after five seconds and the failure is only logged.

## Scanning images

The images to scan are the ones Komodo reports for the stacks' services. The backend keeps a small queue (two scans at a time, never the same image twice) and runs `trivy image` in client mode against the `trivy` server for each one, reading the image straight from its registry. An image is queued:

- the first time it shows up, or when its scan was interrupted by a restart: the **Security** page (or `GET /api/v0/security/images`) queues it when it lists the images;
- after every successful deploy, for the images of that stack;
- on demand, from the page or `POST /api/v0/security/scan`.

Only the latest result per image is kept. A rescan that fails keeps the previous result and marks the failure.

## What is stored

| Data | Where |
| --- | --- |
| Users, sessions and API keys | Better Auth tables. |
| The Komodo connection (name, URL, key and secret) | `komodo` table. The API never returns the key or the secret. |
| ntfy settings (server, topic, token, on or off) | `ntfy` table. The token is never returned either. |
| History of actions | `action_history` table. |
| Latest Trivy result per image (counts, vulnerabilities, errors) | `image_scan` table. |

All of it is in the `db_data` volume: see [Upgrades and backups](../upgrading/).
