---
title: Getting started
description: Install Komodo CD next to your Komodo instance with one command and sign in for the first time.
order: 1
---

Komodo CD is a small continuous-deployment dashboard on top of [Komodo](https://komo.do). It lists the stacks of one Komodo instance with their state, lets you Pull or Redeploy them by hand, records every action, and exposes the same actions as one HTTP endpoint for your CI. It ships as two Docker images, backend and frontend, and keeps its data in a SQLite file.

## Requirements

- A Linux host with Docker and the Compose plugin (`docker compose`).
- `curl` and `openssl`, which the installer uses to download files and generate the secret.
- A running Komodo instance that host can reach over HTTPS, and permission to create an API key in it.

## Install with one command

Create an empty directory for the deployment, `cd` into it and run:

```bash
mkdir komodo-cd && cd komodo-cd
curl -fsSL https://raw.githubusercontent.com/Nonetss/Komodo-CD/main/scripts/bootstrap.sh | bash
```

The script is interactive even when piped, because it reads your answers from the terminal. It asks for:

1. The **host port** to publish (default `80`).
2. The **public URL** the browser and your CI will use, for example `https://deploy.example.com`, without a trailing slash.
3. The **first admin**: name, email and a password of at least 8 characters.

Then it generates `BETTER_AUTH_SECRET` with `openssl`, downloads `compose.yml`, writes `.env` (mode `600`) in the current directory and offers to pull the images from `ghcr.io` and start the stack. It never overwrites an existing `.env`: delete it first if you want to start over.

Setting `KCD_REF` on the `bash` side (`… | KCD_REF=v1.0.0 bash`) picks which version of `compose.yml` it downloads (default `main`).

## Sign in

The backend applies the database migrations and creates the admin from `.env` on startup, so there is no separate setup step. After a few seconds, open the public URL and sign in with the email and password you chose.

## Next steps

- [Connect Komodo](./first-run/): add your instance and run a first deploy from the dashboard.
- [Deploy from CI](./ci/): create an API key and call the deploy endpoint from GitHub or Gitea Actions.
- [Deploy with Docker Compose](./deploy/): the same installation by hand, behind HTTPS.
