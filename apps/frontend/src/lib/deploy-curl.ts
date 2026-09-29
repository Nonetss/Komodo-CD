import type { DeployAction } from "@/lib/api-types"

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
  appUrl: string,
  stack: string,
  action: DeployAction,
  apiKey = "<tu-api-key>"
) {
  return [
    `curl -X POST ${appUrl}/api/v0/deploy \\`,
    `  -H "x-api-key: ${apiKey}" \\`,
    `  -H "Content-Type: application/json" \\`,
    `  -d '{"stack":"${stack}","action":"${action}"}'`,
  ].join("\n")
}
