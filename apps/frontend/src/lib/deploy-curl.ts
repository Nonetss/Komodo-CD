import { PUBLIC_APP_URL } from "astro:env/client"

import type { DeployAction } from "@/lib/api-types"

/** URL pública de la app (la del build o, si no hay, el origen actual). */
export function getAppUrl() {
  const fromBuild = PUBLIC_APP_URL?.replace(/\/$/, "")
  return fromBuild || window.location.origin
}

export const DEPLOY_ACTIONS: DeployAction[] = [
  "pull",
  "redeploy",
  "pull-redeploy",
]

/** Clave i18n de cada acción (`deploy.actions.<key>`) */
export const ACTION_I18N: Record<DeployAction, string> = {
  pull: "pull",
  redeploy: "redeploy",
  "pull-redeploy": "pullRedeploy",
}

export function buildDeployCurl(
  stack: string,
  action: DeployAction,
  apiKey = "<tu-api-key>"
) {
  return [
    `curl -X POST ${getAppUrl()}/api/v0/deploy \\`,
    `  -H "x-api-key: ${apiKey}" \\`,
    `  -H "Content-Type: application/json" \\`,
    `  -d '{"stack":"${stack}","action":"${action}"}'`,
  ].join("\n")
}
