---
title: Configuration
description: Every environment variable of the Compose deployment, and what reads it.
order: 5
---

Komodo CD is configured with a `.env` file next to `compose.yml`. Docker Compose reads it and passes each value to the container that needs it. Everything else (the Komodo connection, API keys, ntfy alerts) is configured from the dashboard and stored in the database.

## `.env`

| Variable | Required | Description |
| --- | --- | --- |
| `APP_URL` | Yes | Public URL of the app, without a trailing slash. The backend receives it as `BETTER_AUTH_URL` and uses it for CORS and as the trusted origin for sign-in. |
| `BETTER_AUTH_SECRET` | Yes | Signs sessions and tokens. Generate it with `openssl rand -base64 32`. |
| `SEED_ADMIN_PASSWORD` | Yes | Password of the admin created on startup, at least 8 characters. |
| `PORT` | No | Host port published by the frontend. Default `80`. |
| `SEED_ADMIN_EMAIL` | No | Email of the admin. Default `admin@example.com`. |
| `SEED_ADMIN_NAME` | No | Name of the admin. Default `Admin`. |
| `TRIVY_SERVER_URL` | No | Trivy server the backend scans images with. Default `http://trivy:4954`, the `trivy` service of `compose.yml`. Set it only to use another server. |

## The admin account

On every start the backend looks for a user with `SEED_ADMIN_EMAIL` and creates it if it does not exist. It never changes an existing user, so editing `SEED_ADMIN_PASSWORD` later does not reset the password of an admin that is already there.

## Changing the secret

`BETTER_AUTH_SECRET` can be rotated: after a restart every session is invalid and users sign in again. Do not remove it or leave it empty, the backend refuses to start without it.

## Set by `compose.yml`

These are fixed in the compose file and rarely need to change:

| Variable | Container | Value |
| --- | --- | --- |
| `DATABASE_URL` | backend | `file:/data/db.sqlite`, inside the `db_data` volume. |
| `BACKEND_URL` | frontend | `http://backend:3000`, where the server-side rendering reaches the backend to check the session. |

## Image scanning

The `trivy` service in `compose.yml` runs a Trivy server pinned to the same version as the client inside the backend image. On first start it downloads its vulnerability database from the Internet into the `trivy_cache` volume, and keeps it updated. The backend, in turn, pulls each image to scan straight from its registry, so both need outbound access. Until the database is ready, scans fail and can be retried from the **Security** page.

Images from private registries are tried as well; when the backend cannot pull one, the scan is shown as "no registry access" and the other images carry on.

The backend also reads `LOG_LEVEL` (`fatal`, `error`, `warn`, `info`, `debug` or `trace`; default `info`). To use it, add it to the backend's `environment` in `compose.yml`.

## The URL in the curl snippets

The curl commands that the dashboard shows for each stack use the address you opened the dashboard with. Open it through the public URL your CI will call, and the snippets are ready to paste.
