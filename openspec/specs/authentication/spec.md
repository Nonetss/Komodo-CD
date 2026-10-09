# Authentication

## Purpose

Signs people into the dashboard with email and password through Better Auth, seeds the initial administrator, resolves every backend request to a user (session cookie or `x-api-key`) and keeps the dashboard's pages behind a session.

## Requirements

### Requirement: Better Auth with email and password

The backend SHALL configure Better Auth (`packages/auth/src/index.ts`) with the Drizzle SQLite adapter, email and password sign-in, `BETTER_AUTH_SECRET` as its secret, `BETTER_AUTH_URL` as its base URL and only trusted origin, the loopback and private Docker ranges (`127.0.0.1`, `::1`, `172.16.0.0/12`, `10.0.0.0/8`) as trusted proxies, and the API Key plugin. Its handler SHALL be mounted at `/api/auth/*` for `GET` and `POST`. Sessions SHALL use Better Auth's signed cookie cache with a 60-second lifetime, so most session lookups do not query the database.

#### Scenario: Sign in

- **WHEN** a user posts valid credentials to `/api/auth/sign-in/email`
- **THEN** Better Auth SHALL answer with the session cookies

#### Scenario: Request from an untrusted origin

- **WHEN** a browser on an origin other than `BETTER_AUTH_URL` calls a Better Auth endpoint that changes state
- **THEN** Better Auth SHALL reject it

### Requirement: Seeded administrator

On every boot, after applying migrations, the backend SHALL create the user `SEED_ADMIN_EMAIL` with `SEED_ADMIN_PASSWORD` and the name `SEED_ADMIN_NAME` (default `Admin`) through Better Auth's sign-up, unless a user with that email already exists. When the email or the password is not set, it SHALL log a warning and skip the creation. A failure creating the admin SHALL be logged and SHALL NOT stop the boot. There is no public sign-up page; every account comes from this seed.

#### Scenario: First boot

- **WHEN** the backend boots on an empty database with the seed variables set
- **THEN** the admin user SHALL be created and able to sign in

#### Scenario: Later boots

- **WHEN** the backend boots and the admin email already exists
- **THEN** no user SHALL be created and the existing password SHALL NOT change

### Requirement: Session resolution

Every backend request after the auth routes SHALL be resolved to `{ user, session }` by `resolveSession` (`packages/auth/src/session.ts`). When an `x-api-key` header is present, it SHALL be verified with the API Key plugin: a valid, enabled key SHALL resolve to a user whose id is the key owner, whose name is `API Key: <key name>` (or `API Key`) and whose session is `null`; an invalid key SHALL resolve to no user, without falling back to the cookie. Without the header, the Better Auth session cookie SHALL be used. Resolution SHALL only identify the caller; authorization is enforced by each procedure (see `api-access-control`).

#### Scenario: Valid API key

- **WHEN** a request carries a valid `x-api-key` and no cookie
- **THEN** the resolved user SHALL be the key's owner and the session SHALL be `null`

#### Scenario: Invalid API key with a valid cookie

- **WHEN** a request carries an invalid `x-api-key` and a valid session cookie
- **THEN** the request SHALL be resolved as anonymous

### Requirement: Login page

The dashboard SHALL serve a public login page at `/login` with an email and password form that signs in through the Better Auth client and, on success, navigates to `/`. A failed sign-in SHALL show a translated error inline (`role="alert"`). The form SHALL use `method="post"` and its submit button SHALL stay disabled until the island has hydrated, so credentials never end up in a URL. The page SHALL offer the language and theme toggles and, on wide screens, a brand panel with a CI `curl` example.

#### Scenario: Wrong password

- **WHEN** the user submits a wrong password
- **THEN** the page SHALL stay on `/login` and show the error message

### Requirement: Pages require a session

The frontend's SSR middleware SHALL resolve the session of every page request by calling the backend's `get-session` at `BACKEND_URL`, forwarding the request headers. `/login` (and its sub-paths), `/icons/*` and the logo files SHALL be public. Without a session, the request SHALL be redirected to `/login`. When the backend cannot be reached or answers with an error, the middleware SHALL answer `503 Service Unavailable` with `cache-control: no-store` and log the reason, instead of redirecting. Any `Set-Cookie` the backend returns while refreshing the cookie cache SHALL be forwarded to the browser. The resolved user and session SHALL be exposed in `Astro.locals`.

#### Scenario: Anonymous visit

- **WHEN** a browser without a session requests `/stacks`
- **THEN** it SHALL be redirected to `/login`

#### Scenario: Backend down

- **WHEN** the backend is unreachable and a browser requests `/history`
- **THEN** the frontend SHALL answer `503` without redirecting to `/login`

### Requirement: Log out

The dashboard shell SHALL offer a log-out button that signs out through the Better Auth client and navigates to `/login`.

#### Scenario: Log out

- **WHEN** a signed-in user clicks the log-out button
- **THEN** the session SHALL end and the browser SHALL land on `/login`
