# Komodo CD — Docker

Monorepo (Turborepo + Bun workspaces) for Komodo CD, plus the production deployment using images published on GHCR.

|              | Path                             | Stack                                          |
| ------------ | -------------------------------- | ---------------------------------------------- |
| **Backend**  | [`apps/backend`](apps/backend)   | Bun + Hono (thin server: auth, oRPC, OpenAPI)  |
| **Frontend** | [`apps/frontend`](apps/frontend) | Astro 7 (SSR) + React + TanStack Query + Caddy |

| Package             | Description                                                      |
| ------------------- | ---------------------------------------------------------------- |
| `@komodo-cd/api`    | oRPC routers (`v0`), Komodo client service                       |
| `@komodo-cd/auth`   | Better Auth config + session resolver (cookie or `x-api-key`)    |
| `@komodo-cd/db`     | Drizzle v1 (SQLite/libsql): schema, relations, migrations, seed  |
| `@komodo-cd/env`    | Validated server env (t3-env + zod)                              |
| `@komodo-cd/logger` | Shared pino logger                                               |
| `@komodo-cd/config` | Shared `tsconfig`                                                |

| Stacks                    | Deploy                    |
| ------------------------- | ------------------------- |
| ![Stacks](img/stacks.png) | ![Deploy](img/deploy.png) |

| History                       | Credentials                          |
| ----------------------------- | ------------------------------------ |
| ![History](img/historial.png) | ![Credentials](img/credenciales.png) |

## Requirements

- Docker + Docker Compose v2
- Internet access to pull images

## Quick start

### One-line install (interactive)

```bash
curl -fsSL https://raw.githubusercontent.com/Nonetss/komodo-cd-docker/main/start.sh | bash
```

Or clone and run manually:

```bash
git clone https://github.com/Nonetss/komodo-cd-docker.git
cd komodo-cd-docker
./start.sh
```

---

### Manual setup

#### 1. Generate secrets

```bash
# Better Auth secret (required)
openssl rand -base64 32

# Initial admin password (required)
openssl rand -base64 16
```

#### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env` and fill at least these three variables:

```env
APP_URL=https://your-domain.com
BETTER_AUTH_SECRET=<output of first openssl command>
SEED_ADMIN_PASSWORD=<output of second openssl command>
```

#### 3. Start

```bash
docker compose up -d
```

The app will be available on the port configured in `PORT` (default `80`).

---

## compose.yml

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

---

## Environment variables

| Variable              | Required | Description                                             |
| --------------------- | -------- | ------------------------------------------------------- |
| `APP_URL`             | ✅       | Public app URL, without trailing slash                  |
| `BETTER_AUTH_SECRET`  | ✅       | Secret used to sign sessions. `openssl rand -base64 32` |
| `SEED_ADMIN_PASSWORD` | ✅       | Password for admin user created on startup              |
| `PORT`                | —        | Host exposed port. Default `80`                         |
| `SEED_ADMIN_EMAIL`    | —        | Admin email. Default `admin@example.com`                |
| `SEED_ADMIN_NAME`     | —        | Admin name. Default `Admin`                             |

## GitHub Actions integration

Full example: image build and push + automatic deploy to a Komodo CD stack.

```yaml
name: Build, Publish and Deploy

on:
  push:
    branches:
      - main
      - "v*"

jobs:
  build:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write

    steps:
      - uses: actions/checkout@v4

      - name: Log in to GHCR
        uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ghcr.io/${{ github.repository }}
          tags: |
            type=raw,value=latest,enable={{is_default_branch}}
            type=ref,event=branch
            type=sha,prefix={{branch}}-,format=short

      - name: Build and push
        uses: docker/build-push-action@v6
        with:
          context: .
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}

      - name: Pull + Redeploy stack
        run: |
          curl -X POST ${{ secrets.KOMODO_CD_URL }}/api/v0/deploy \
            -H "x-api-key: ${{ secrets.KOMODO_API_KEY }}" \
            -H "Content-Type: application/json" \
            -d '{"stack":"${{ vars.STACK_NAME }}","action":"pull-redeploy"}'
```

**Required repository secrets and variables:**

| Key              | Type     | Description                                                               |
| ---------------- | -------- | ------------------------------------------------------------------------- |
| `KOMODO_CD_URL`  | Secret   | URL of your Komodo CD instance (example: `https://komodo-cd.example.com`) |
| `KOMODO_API_KEY` | Secret   | API key generated from the dashboard                                      |
| `APP_URL`        | Variable | Public app URL used to bake both frontend build args                      |
| `STACK_NAME`     | Variable | Stack name in Komodo                                                      |

---

## Development

Requirements: [Bun](https://bun.sh) ≥ 1.4.

```bash
bun install

cp apps/backend/.env.example apps/backend/.env   # SQLite: DATABASE_URL=file:./dev.db

bun run dev            # backend (:3000) + frontend (:4321) with turbo watch
bun run dev:backend    # only backend
bun run dev:frontend   # only frontend
```

| Script                  | Description                                       |
| ----------------------- | ------------------------------------------------- |
| `bun run build`         | Build all apps (`turbo build`)                    |
| `bun run check-types`   | Type-check all apps                               |
| `bun run format`        | Format with Biome                                 |
| `bun run check`         | Biome lint + format with autofix                  |
| `bun run db:generate`   | Generate Drizzle migrations (`packages/db`)       |
| `bun run db:studio`     | Open Drizzle Studio (`packages/db`)               |
| `bun run docker:up`     | Build images from source and start the stack      |

The Dockerfiles live in `apps/*/Dockerfile` but the build context is always the repo root:

```bash
docker build -f apps/backend/Dockerfile -t komodo-cd-backend .
docker build -f apps/frontend/Dockerfile -t komodo-cd-frontend .
```

`.github/workflows/docker-build.yml` builds and pushes both images to `ghcr.io/nonetss/komodo-cd-backend` and `ghcr.io/nonetss/komodo-cd-frontend` on every push to `main`.

---

## Update to latest version

```bash
docker compose pull
docker compose up -d
```

## Useful commands

```bash
# Show logs in real time
docker compose logs -f

# Show backend logs only
docker compose logs -f backend

# Restart one service
docker compose restart backend

# Stop everything
docker compose down

# Stop and remove DB volume (⚠️ deletes all data)
docker compose down -v
```

## Persistent data

SQLite DB is stored in Docker volume `db_data`, mounted at `/data` inside the backend container. Data survives restarts and image updates.

To make a manual backup:

```bash
docker run --rm \
  -v komodo_db_data:/data \
  -v $(pwd):/backup \
  alpine tar czf /backup/db-backup.tar.gz -C /data .
```

To restore:

```bash
docker run --rm \
  -v komodo_db_data:/data \
  -v $(pwd):/backup \
  alpine tar xzf /backup/db-backup.tar.gz -C /data
```
