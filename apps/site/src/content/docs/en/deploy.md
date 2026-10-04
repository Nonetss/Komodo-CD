---
title: Deploy with Docker Compose
description: Set Komodo CD up by hand, put it behind HTTPS, pin a version or build the images from source.
order: 4
---

The [one-line installer](../) does all of this for you. This page is the same installation step by step, plus what to change for HTTPS and fixed versions.

## 1. Get the compose file

```bash
mkdir komodo-cd && cd komodo-cd
curl -fsSLO https://raw.githubusercontent.com/Nonetss/Komodo-CD/main/compose.yml
curl -fsSL https://raw.githubusercontent.com/Nonetss/Komodo-CD/main/.env.example -o .env
```

## 2. Generate the secrets

```bash
# Better Auth secret (required)
openssl rand -base64 32

# Initial admin password (required)
openssl rand -base64 16
```

## 3. Fill in `.env`

At least these three variables:

```dotenv
APP_URL=https://deploy.example.com
BETTER_AUTH_SECRET=<output of the first command>
SEED_ADMIN_PASSWORD=<output of the second command>
```

`APP_URL` is the URL the browser and your CI will use, without a trailing slash. Every variable is described in [Configuration](../configuration/).

## 4. Start

```bash
docker compose up -d
```

The app answers on the port set in `PORT` (default `80`). On its first start the backend creates the SQLite database in the `db_data` volume, applies the migrations and creates the admin.

## The compose file

```yaml
services:
  backend:
    image: ghcr.io/nonetss/komodo-cd-backend:latest
    restart: unless-stopped
    volumes:
      - db_data:/data
    environment:
      DATABASE_URL: "file:/data/db.sqlite"
      BETTER_AUTH_URL: "${APP_URL:?APP_URL is required}"
      BETTER_AUTH_SECRET: "${BETTER_AUTH_SECRET:?BETTER_AUTH_SECRET is required}"
      SEED_ADMIN_EMAIL: "${SEED_ADMIN_EMAIL:-admin@example.com}"
      SEED_ADMIN_NAME: "${SEED_ADMIN_NAME:-Admin}"
      SEED_ADMIN_PASSWORD: "${SEED_ADMIN_PASSWORD:?SEED_ADMIN_PASSWORD is required}"
    networks:
      - komodo_net

  frontend:
    image: ghcr.io/nonetss/komodo-cd-frontend:latest
    restart: unless-stopped
    environment:
      BACKEND_URL: "http://backend:3000"
    ports:
      - "${PORT:-80}:80"
    depends_on:
      - backend
    networks:
      - komodo_net

networks:
  komodo_net:

volumes:
  db_data:
```

Only the frontend publishes a port. Its Caddy sends the API to `backend:3000` over the Compose network, so the backend never needs to be exposed.

## Behind HTTPS

The Caddy inside the frontend image serves plain HTTP on port 80 and does not request certificates. Terminate TLS in front of it with the reverse proxy you already use, and set `APP_URL` to the `https://` URL: Better Auth uses it as the trusted origin, so signing in fails if it does not match the address in the browser.

For example, publish Komodo CD on a local port and let a Caddy on the host handle the certificate:

```dotenv
PORT=8080
APP_URL=https://deploy.example.com
```

```text
deploy.example.com {
    reverse_proxy localhost:8080
}
```

## Pin a version

The images are published as `latest` (the `main` branch) and with the version of every release (`1.0.0`, `1.0`). To stay on one, change the tags in `compose.yml`:

```yaml
image: ghcr.io/nonetss/komodo-cd-backend:1.0.0
# …
image: ghcr.io/nonetss/komodo-cd-frontend:1.0.0
```

Keep both images on the same version.

## Build the images from source

From a clone of the repository, `compose.build.yml` extends the same services but builds the images from the monorepo:

```bash
git clone https://github.com/Nonetss/Komodo-CD.git
cd Komodo-CD
cp .env.example .env   # and fill it in
docker compose -f compose.build.yml up -d --build
```

`bun run docker:up` is a shortcut for the same command.
