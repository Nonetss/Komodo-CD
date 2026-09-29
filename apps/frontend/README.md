# Komodo Frontend

> Part of [Komodo CD](https://github.com/Nonetss/komodo-cd-frontend). Backend at [Nonetss/komodo-cd-backend](https://github.com/Nonetss/komodo-cd-backend).

Web dashboard to manage deploys on [Komodo](https://komo.do) stacks. Built with **Astro 6** + **React 19**, **Tailwind CSS 4**, and **Shadcn UI**. It communicates with the [backend](https://github.com/Nonetss/komodo-cd-backend) through an Nginx proxy in production.

## Stack

- **[Astro 6](https://astro.build/)** — SSR with Node adapter
- **[React 19](https://react.dev/)** — Interactive components
- **[Tailwind CSS 4](https://tailwindcss.com/)** + **[Shadcn UI](https://ui.shadcn.com/)** — UI
- **[Better Auth](https://www.better-auth.com/)** — Auth client with session support
- **[Bun](https://bun.sh/)** — Runtime and package manager
- **Nginx** — Production reverse proxy (joins frontend + backend on a single port)

## Features

- **Stacks** — View all Komodo stacks with status, services, repo, and commits. Per-stack actions: Pull, Redeploy, Pull + Redeploy. Copyable curl snippets per stack and action.
- **History** — Log of all executed actions with user, result, and timestamp.
- **Manual deploy** — Form with stack autocomplete to trigger deploys.
- **Credentials** — Manage Komodo credentials (URL, API key, secret).
- **API Keys** — Create, list, and revoke API keys for CI/CD.

## Development

```bash
bun install
cp .env.example .env
# Edit .env with your values
bun dev
```

Requires backend running at `http://localhost:3000`. Dev server starts at `http://localhost:4321` and automatically proxies `/api/*` to the backend.

## Environment variables

| Variable          | Build-time | Description                                                                                               |
| ----------------- | ---------- | --------------------------------------------------------------------------------------------------------- |
| `BETTER_AUTH_URL` | ✅         | Base URL for better-auth calls (`/api/auth/*`). In production: the public app URL                         |
| `PUBLIC_APP_URL`  | ✅         | URL shown in dashboard curl snippets. If unset, `window.location.origin` is used as fallback              |
| `BACKEND_URL`     | —          | Internal backend URL. Used by Nginx for proxying. Only relevant in Docker (default `http://backend:3000`) |

> Variables marked as **Build-time** are baked into the bundle during `bun run build`. Pass them as `ARG` when building the Docker image.

## Docker

The image includes Nginx as reverse proxy: it serves the Astro frontend on `/` and routes `/api/*` to the backend container.

```bash
docker build \
  --build-arg PUBLIC_APP_URL=https://app.example.com \
  --build-arg BETTER_AUTH_URL=https://app.example.com \
  -t komodo-frontend .

docker run -d \
  -p 80:80 \
  -e BACKEND_URL=http://backend:3000 \
  komodo-frontend
```

Or with the root repository `docker-compose.yml` (recommended):

```bash
cp ../.env.example ../.env
# Edit ../.env
docker compose -f ../docker-compose.yml up -d --build
```

## CI/CD

The repository includes a GitHub Actions workflow (`.github/workflows/docker-build.yml`) that builds and publishes the image to GHCR automatically on every push to `main` or branches with `v*` prefix.

The image is published as `ghcr.io/<owner>/<repo>:latest`.

## Structure

```
src/
├── components/
│   ├── features/
│   │   └── dashboard/
│   │       ├── Dashboard.tsx        # Main tabs
│   │       ├── StacksPanel.tsx      # Stacks view + actions + curls
│   │       ├── HistoryPanel.tsx     # Action history
│   │       ├── DeployPanel.tsx      # Manual deploy
│   │       ├── CredentialsPanel.tsx # Credentials management
│   │       └── ApiKeysPanel.tsx     # API keys management
│   └── ui/                          # Shadcn UI components
├── lib/
│   ├── api.ts                       # Axios client with all endpoints
│   └── auth.ts                      # Better Auth client
├── pages/
│   ├── index.astro                  # Redirects to /dashboard or /login
│   ├── dashboard.astro              # Main dashboard (protected)
│   └── login/                       # Login page
├── middleware.ts                    # Session-based route protection
└── styles/
gateway/
└── nginx.conf                       # Nginx config (with envsubst)
entrypoint.sh                        # Starts Astro + Nginx
```
