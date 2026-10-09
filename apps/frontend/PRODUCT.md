# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Small technical teams and homelab operators who already run [Komodo](https://komo.do) to host their Docker stacks. They open the console in short, task-driven visits: after a push, after a failed deploy, or when an ntfy alert arrives (often from a phone). They want to see the state of every stack and launch a pull or redeploy without opening Komodo itself. A second, non-human user is the CI pipeline, which calls the REST API with an API key.

## Product Purpose

Komodo CD is a thin continuous-deployment layer between people, CI pipelines and a Komodo instance. It stores the Komodo connection and credentials, shows the state, services and images of every stack, lets people Pull, Redeploy or Pull + Redeploy, and turns `POST /api/v0/deploy` into the same action from CI. Success is a deploy launched and confirmed (live) in a few seconds, with a clear record of who ran it and how it ended.

## Positioning

A deliberately small surface in front of Komodo with isolated credentials: the Komodo connection, ntfy settings and API keys can only be changed from a signed-in session, while CI keys are limited to deploying and reading stacks and history. A pipeline never touches Komodo's own API or configuration. Deploys started from CI or other tabs show up live.

## Operating Context

- Self-hosted behind a Caddy gateway on a single published port; one Komodo connection per instance.
- Used on desktop and on phones, often in response to an alert.
- People authenticate with a session; pipelines authenticate with `x-api-key`.
- Optional ntfy notifications (ntfy.sh or self-hosted) on deploy failure.

## Capabilities and Constraints

- Stacks overview with search and filters (running, stopped, with issues); per-stack state, services and images.
- Deploy actions: Pull, Redeploy, Pull + Redeploy; ready-to-paste `curl` snippets per stack and action for CI.
- Deploy history (origin, actor, outcome) and live deploy events.
- Komodo connection (credentials), ntfy settings and API-key management, all session-only.
- UI in Spanish and English via the i18n dictionaries; dark and light themes.
- Frontend stack: Astro 7 SSR, React 19 islands, Tailwind v4, shadcn/ui, TanStack Query.
- Komodo errors surface as 502 (Komodo error) or 503 (no connection configured); the UI must make those states legible.

## Brand Commitments

Name: Komodo CD. The UI language is bilingual (es/en) and both themes are first-class. No logo, palette or voice has been declared binding.

## Evidence on Hand

Product screenshots in `/img` (stacks, deploy, history, connection, light theme). The project site in `apps/site` (English and Spanish docs). No customer testimonials, benchmarks or usage numbers exist; do not invent them.

## Product Principles

1. **Thin by design.** Do one job, the deploy loop, and defer everything else to Komodo.
2. **Credentials stay in one place.** Anything that changes configuration or credentials is session-only; CI gets the narrowest key that works.
3. **State is always honest.** Show real, live Komodo state and make Komodo errors and missing connections explicit, never silent.
4. **Safe at a glance, fast to act.** The common action is one click away; destructive or credential-changing actions need a deliberate second step.
5. **Usable from a phone in the middle of an incident.**

## Accessibility & Inclusion

- Spanish and English must stay at parity; all copy goes through the dictionaries.
- Dark and light themes must both work.
- The console must be usable on mobile viewports.
- Destructive buttons use two-click confirmation.
