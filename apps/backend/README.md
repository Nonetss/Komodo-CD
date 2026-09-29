# Komodo Backend

> Part of [Komodo CD](https://github.com/Nonetss/komodo-cd-backend). Frontend at [Nonetss/komodo-cd-frontend](https://github.com/Nonetss/komodo-cd-frontend).

REST API to manage and trigger deploys on [Komodo](https://komo.do) stacks from GitHub Actions, Gitea Actions, or any HTTP client. Built with **Hono** + **Bun**, authentication via **Better Auth**, and **SQLite** persistence through Drizzle ORM.

## Stack

- **[Bun](https://bun.sh/)** — Runtime and package manager
- **[Hono](https://hono.dev/)** + [`@hono/zod-openapi`](https://github.com/honojs/middleware/tree/main/packages/zod-openapi) — Web framework with validation and OpenAPI
- **[Better Auth](https://www.better-auth.com/)** — Authentication: email/password and API keys
- **[Drizzle ORM](https://orm.drizzle.team/)** + **[libsql](https://github.com/tursodatabase/libsql)** — Type-safe ORM on top of SQLite
- **[Komodo Client](https://komo.do)** — Official client to interact with the Komodo platform
- **[Scalar](https://scalar.com/)** — Interactive OpenAPI docs

## Endpoints

| Method   | Route                        | Auth              | Description                                     |
| -------- | ---------------------------- | ----------------- | ----------------------------------------------- |
| `POST`   | `/api/v0/deploy`             | API key / session | Triggers an action on a stack                   |
| `GET`    | `/api/v0/stacks`             | API key / session | Lists stacks with status, services, and commits |
| `GET`    | `/api/v0/history`            | session           | Action history with user                        |
| `GET`    | `/api/v0/apikeys`            | session           | Lists user API keys                             |
| `POST`   | `/api/v0/apikeys`            | session           | Creates a new API key                           |
| `DELETE` | `/api/v0/apikeys`            | session           | Deletes an API key                              |
| `GET`    | `/api/v0/deploy/credentials` | session           | Lists Komodo credentials                        |
| `POST`   | `/api/v0/deploy/credentials` | session           | Saves a Komodo credential                       |
| `DELETE` | `/api/v0/deploy/credentials` | session           | Deletes a Komodo credential                     |
| `GET`    | `/health-check`              | —                 | Health check                                    |
| `GET`    | `/scalar`                    | —                 | Interactive docs                                |
| `GET`    | `/doc`                       | —                 | OpenAPI JSON                                    |

### Deploy actions

| Action          | Description                              |
| --------------- | ---------------------------------------- |
| `pull`          | Pulls image without restarting the stack |
| `redeploy`      | Stops and starts the stack again         |
| `pull-redeploy` | Pulls image + full redeploy              |

## Development

```bash
bun install
cp .env.example .env
# Edit .env with your values
bun dev
```

Server starts at `http://localhost:3000`.
Migrations and the admin user are applied automatically on startup.

If you change the DB schema, generate a new migration:

```bash
bunx drizzle-kit generate
```

## Environment variables

| Variable              | Required | Description                                                        |
| --------------------- | -------- | ------------------------------------------------------------------ |
| `DATABASE_URL`        | ✅       | SQLite path. Dev: `file:./dev.db` · Docker: `file:/data/db.sqlite` |
| `BETTER_AUTH_SECRET`  | ✅       | Secret used to sign sessions. `openssl rand -base64 32`            |
| `BETTER_AUTH_URL`     | ✅       | Public frontend URL. Used for CORS and trusted origins             |
| `SEED_ADMIN_EMAIL`    | —        | Admin email created on startup if missing                          |
| `SEED_ADMIN_NAME`     | —        | Initial admin name                                                 |
| `SEED_ADMIN_PASSWORD` | —        | Initial admin password                                             |

## CI/CD usage

Authentication uses an API key passed in the `x-api-key` header. Keys are generated from the frontend dashboard.

```bash
curl -X POST https://app.example.com/api/v0/deploy \
  -H "x-api-key: <your-api-key>" \
  -H "Content-Type: application/json" \
  -d '{"stack":"my-stack","action":"pull-redeploy"}'
```

### GitHub Actions

```yaml
- name: Deploy
  run: |
    curl -X POST ${{ secrets.APP_URL }}/api/v0/deploy \
      -H "x-api-key: ${{ secrets.KOMODO_API_KEY }}" \
      -H "Content-Type: application/json" \
      -d '{"stack":"${{ vars.STACK_NAME }}","action":"pull-redeploy"}'
```

**Required secrets:**

- `APP_URL` — Public app URL (example: `https://app.example.com`)
- `KOMODO_API_KEY` — API key generated from the dashboard

## Docker

The image exposes port `3000` and expects a volume at `/data` for the SQLite DB.

```bash
docker build -t komodo-backend .

docker run -d \
  -p 3000:3000 \
  -v komodo_data:/data \
  -e BETTER_AUTH_SECRET=<secret> \
  -e BETTER_AUTH_URL=https://app.example.com \
  -e SEED_ADMIN_EMAIL=admin@example.com \
  -e SEED_ADMIN_PASSWORD=<password> \
  komodo-backend
```

Or with the root repository `docker-compose.yml` (recommended):

```bash
cp ../.env.example ../.env
# Edit ../.env
docker compose -f ../docker-compose.yml up -d --build
```

## Structure

```
src/
├── api/v0/
│   ├── deploy/
│   │   ├── trigger/          # POST /deploy — triggers actions
│   │   └── credentials/      # Komodo credentials CRUD
│   ├── stacks/               # GET /stacks — stack status
│   ├── history/              # GET /history — action history
│   └── apikeys/              # API keys CRUD
├── core/
│   ├── auth.ts               # Better Auth configuration
│   └── config.ts             # DB client (Drizzle + libsql)
├── db/models/                # Drizzle schemas
├── lib/
│   ├── bootstrap.ts          # Migrations + admin seed on startup
│   └── logger.ts
├── middleware.ts             # Auth: cookie session and API key
└── services/
    └── komodo.ts             # Komodo client (PullStack, DeployStack)
drizzle/                      # Generated SQL migrations
```
