import { Download, RotateCw, Zap } from "lucide-react"

import type { DeployAction } from "@/lib/api-types"

export const DEPLOY_ACTIONS: DeployAction[] = [
  "pull",
  "redeploy",
  "pull-redeploy",
]

/** Icono canónico de cada acción, igual en Stacks y en Deploy */
export const ACTION_ICON = {
  pull: Download,
  redeploy: RotateCw,
  "pull-redeploy": Zap,
} as const satisfies Record<DeployAction, unknown>

/** Clave i18n de cada acción (`deploy.actions.<key>`) */
export const ACTION_I18N: Record<DeployAction, string> = {
  pull: "pull",
  redeploy: "redeploy",
  "pull-redeploy": "pullRedeploy",
}

/** Marcador de la key en los `curl` de ejemplo (se resalta al mostrarlos) */
export const API_KEY_PLACEHOLDER = "<tu-api-key>"

export function buildDeployCurl(
  appUrl: string,
  stack: string,
  action: DeployAction,
  apiKey = API_KEY_PLACEHOLDER
) {
  return [
    `curl -X POST ${appUrl}/api/v0/deploy \\`,
    `  -H "x-api-key: ${apiKey}" \\`,
    `  -H "Content-Type: application/json" \\`,
    `  -d '{"stack":"${stack}","action":"${action}"}'`,
  ].join("\n")
}
