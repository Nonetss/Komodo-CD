## MODIFIED Requirements

### Requirement: Compose stack

`compose.yml` SHALL run the services `backend`, `frontend` and `gateway` from `ghcr.io/nonetss/komodo-cd-{backend,frontend,gateway}:latest`, and `trivy` from `aquasec/trivy` pinned to the same version the backend image ships, all on one private network, each with `init: true` and `restart: unless-stopped`. Only `gateway` SHALL publish a port (`${PORT:-80}:80`). The backend SHALL get `DATABASE_URL=file:/data/db.sqlite` on the `db_data` volume, `BETTER_AUTH_URL` from `APP_URL`, the seed admin variables, `TRIVY_SERVER_URL` (default `http://trivy:4954`) and `TRIVY_RESCAN_INTERVAL_HOURS` (default `24`); compose SHALL refuse to start without `APP_URL`, `BETTER_AUTH_SECRET` and `SEED_ADMIN_PASSWORD`. The frontend SHALL reach the backend at `http://backend:3000`. The `trivy` service SHALL run `trivy server` on `0.0.0.0:4954` with its vulnerability database cached on the `trivy_cache` volume.

#### Scenario: Missing secret

- **WHEN** `docker compose up` runs without `BETTER_AUTH_SECRET` in the environment or `.env`
- **THEN** compose SHALL fail with `BETTER_AUTH_SECRET is required`

#### Scenario: Backend not exposed

- **WHEN** the stack runs and a client outside the Docker network connects to port `3000`, `4321` or `4954` on the host
- **THEN** the connection SHALL fail, because only the gateway publishes a port

#### Scenario: Trivy database kept across restarts

- **WHEN** the `trivy` container is recreated
- **THEN** it SHALL reuse the vulnerability database from the `trivy_cache` volume instead of downloading it again

#### Scenario: Rescan interval from .env

- **WHEN** `.env` sets `TRIVY_RESCAN_INTERVAL_HOURS=6` and the stack starts
- **THEN** the backend SHALL receive `TRIVY_RESCAN_INTERVAL_HOURS=6`, and `24` when `.env` does not set it
