import { useState } from "react"
import { Trans, useTranslation } from "react-i18next"

import { Text } from "@/components/shared/brand/typography"
import { CodeBlock } from "@/components/shared/data-display/code-block"
import { Segmented } from "@/components/shared/form/segmented"
import {
  API_KEY_PLACEHOLDER,
  buildDeployCurl,
  buildDeployWorkflowStep,
  DEPLOY_ACTION_SECRET,
  SNIPPET_FORMATS,
  type SnippetFormat,
} from "@/entities/deploy-action/model/deploy-actions"
import { useAppUrl } from "@/hooks/use-app-url"
import type { DeployAction } from "@/lib/api-types"
import { cn } from "@/lib/utils"

type DeploySnippetProps = {
  stack: string
  action: DeployAction
  /** Key real recién creada; sin ella el `curl` lleva `<api-key>` */
  apiKey?: string
  className?: string
}

/**
 * La acción lista para CI, como paso de la GitHub Action (por defecto) o como
 * `curl`, con
 * la pista de qué sustituir debajo. El paso nunca lleva la key en claro: la
 * lee de un secreto del repositorio.
 */
export function DeploySnippet({
  stack,
  action,
  apiKey,
  className,
}: DeploySnippetProps) {
  const { t } = useTranslation()
  const appUrl = useAppUrl()
  const [format, setFormat] = useState<SnippetFormat>(SNIPPET_FORMATS[0])
  const label: Record<SnippetFormat, string> = {
    curl: t("deploy.formatCurl"),
    action: t("deploy.formatAction"),
  }

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <CodeBlock
        language={format === "curl" ? "shell" : "yaml"}
        tabs={
          <Segmented
            value={format}
            onChange={setFormat}
            aria-label={t("deploy.snippetFormat")}
            options={SNIPPET_FORMATS.map((f) => ({
              value: f,
              label: label[f],
            }))}
          />
        }
        code={
          format === "curl"
            ? buildDeployCurl(appUrl, stack, action, apiKey)
            : buildDeployWorkflowStep(appUrl, stack, action)
        }
      />
      <SnippetHint format={format} withKey={!!apiKey} />
    </div>
  )
}

/** Qué sustituir o dónde guardar la key, según el formato */
function SnippetHint({
  format,
  withKey,
}: {
  format: SnippetFormat
  withKey: boolean
}) {
  // Con la key ya puesta en el `curl` no queda nada que sustituir
  if (format === "curl" && withKey) return null
  const i18nKey =
    format === "curl"
      ? "deploy.curlHint"
      : withKey
        ? "deploy.actionKeyHint"
        : "deploy.actionHint"
  return (
    <Text as="p" variant="meta" tone="muted" className="text-pretty">
      <Trans
        i18nKey={i18nKey}
        values={{
          placeholder: API_KEY_PLACEHOLDER,
          secret: DEPLOY_ACTION_SECRET,
        }}
        components={{
          code: <code className="text-signal-ink text-xs" />,
          keys: (
            // biome-ignore lint/a11y/useAnchorContent: Trans inyecta el texto
            <a
              href="/keys"
              className="text-foreground hover:text-signal-ink decoration-signal underline underline-offset-4"
            />
          ),
        }}
      />
    </Text>
  )
}
