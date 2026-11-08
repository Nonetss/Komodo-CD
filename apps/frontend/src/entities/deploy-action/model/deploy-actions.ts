import { Download, RotateCw, Zap } from "lucide-react"

import type { DeployAction } from "@/lib/api-types"

export const DEPLOY_ACTIONS = [
  "pull",
  "redeploy",
  "pull-redeploy",
] as const satisfies readonly DeployAction[]

/** Icono canónico de cada acción, igual en Stacks y en Deploy */
export const ACTION_ICON = {
  pull: Download,
  redeploy: RotateCw,
  "pull-redeploy": Zap,
} as const satisfies Record<DeployAction, unknown>

/** Clave i18n de cada acción (`deploy.actions.<key>`) */
export const ACTION_I18N = {
  pull: "pull",
  redeploy: "redeploy",
  "pull-redeploy": "pullRedeploy",
} as const satisfies Record<DeployAction, string>

/** Marcador de la key en los `curl` de ejemplo (se resalta al mostrarlos) */
export const API_KEY_PLACEHOLDER = "<api-key>"

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

/**
 * La GitHub Action del repositorio (`action.yml` en la raíz). Sigue la major
 * de la app: se sube junto con ella.
 */
export const DEPLOY_ACTION_REF = "Nonetss/Komodo-CD@v2"

/** Secreto del repositorio del que el paso de ejemplo lee la key */
export const DEPLOY_ACTION_SECRET = "KOMODO_API_KEY"

/** Formatos del snippet de CI; el primero es el de por defecto */
export const SNIPPET_FORMATS = ["action", "curl"] as const
export type SnippetFormat = (typeof SNIPPET_FORMATS)[number]

/**
 * Escalar YAML: tal cual si es seguro (letras, espacios, `.` `/` `:` `@` `-`,
 * sin `: ` ni espacio al final), si no entre comillas dobles (JSON es YAML)
 */
function yamlScalar(value: string) {
  const plain =
    /^[\w./-][\w ./:@-]*$/.test(value) &&
    !/:( |$)/.test(value) &&
    !value.endsWith(" ")
  return plain ? value : JSON.stringify(value)
}

/**
 * Paso de workflow con la action. La key nunca va en claro: se lee de un
 * secreto del repositorio, también cuando se acaba de crear.
 */
export function buildDeployWorkflowStep(
  appUrl: string,
  stack: string,
  action: DeployAction
) {
  return [
    `- name: ${yamlScalar(`Deploy ${stack}`)}`,
    `  uses: ${DEPLOY_ACTION_REF}`,
    "  with:",
    `    url: ${yamlScalar(appUrl)}`,
    `    api-key: \${{ secrets.${DEPLOY_ACTION_SECRET} }}`,
    `    stack: ${yamlScalar(stack)}`,
    `    action: ${action}`,
  ].join("\n")
}
