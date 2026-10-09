---
title: Upgrades and backups
description: Move to a new version, back up and restore the database, and the Compose commands you will use day to day.
order: 8
---

## Upgrade

From the directory with `compose.yml` and `.env`:

```bash
docker compose pull
docker compose up -d
```

The backend applies any new database migration on startup, so there is no extra step. If you pinned a version, change the image tags in `compose.yml` to the new one first. Releases and their notes are on the [releases page](https://github.com/Nonetss/Komodo-CD/releases).

Back up the database before a major version jump.

### Coming from a version without the gateway

Caddy used to live inside the frontend image; it is now its own `gateway` service, and the new frontend image no longer listens on port 80. Download the new `compose.yml` before pulling, otherwise the published port answers nothing:

```bash
curl -fsSL https://raw.githubusercontent.com/Nonetss/Komodo-CD/main/compose.yml -o compose.yml
docker compose pull
docker compose up -d --remove-orphans
```

## What to back up

Everything Komodo CD stores is in one SQLite file, `/data/db.sqlite`, on the `db_data` volume: users, API keys, the Komodo connection, the ntfy settings and the history. Keep a copy of `.env` too, since it holds `BETTER_AUTH_SECRET` and the admin settings.

Data survives restarts, `docker compose down` and image upgrades. **`docker compose down -v` deletes the volume** and with it every user, key and setting.

## Back up

Stop the backend so the file is not written while it is copied, archive the volume, and start it again:

```bash
docker compose stop backend
docker run --rm \
  --volumes-from "$(docker compose ps -aq backend)" \
  -v "$PWD":/backup \
  alpine tar czf /backup/db-backup.tar.gz -C /data .
docker compose start backend
```

`--volumes-from` mounts the backend's volume whatever name Compose gave it (it is prefixed with the project name, usually the directory).

## Restore

```bash
docker compose stop backend
docker run --rm \
  --volumes-from "$(docker compose ps -aq backend)" \
  -v "$PWD":/backup \
  alpine sh -c "rm -rf /data/* && tar xzf /backup/db-backup.tar.gz -C /data"
docker compose start backend
```

## Useful commands

```bash
# Follow the logs of both services
docker compose logs -f

# Only the backend
docker compose logs -f backend

# Restart one service
docker compose restart backend

# Stop everything (data is kept)
docker compose down
```
