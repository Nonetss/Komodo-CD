import { ShieldCheck } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Text } from "@/components/shared/brand/typography"
import { CodeBlock } from "@/components/shared/data-display/code-block"
import { CopyButton } from "@/components/shared/form/copy-button"
import { Button } from "@/components/ui/button"
import { buildDeployCurl } from "@/entities/deploy-action"
import { useAppUrl } from "@/hooks/use-app-url"

/** Key recién creada: se muestra una sola vez, con su curl de ejemplo */
export function CreatedKey({
  value,
  onDismiss,
}: {
  value: string
  onDismiss: () => void
}) {
  const { t } = useTranslation()
  const appUrl = useAppUrl()
  return (
    <section className="bg-surface space-y-5 rounded-xl border p-5">
      <div className="flex items-start gap-2.5">
        <ShieldCheck
          aria-hidden
          className="text-success mt-0.5 size-5 shrink-0"
        />
        <div>
          <Text as="h2" variant="headline">
            {t("apikeys.keyCreated")}
          </Text>
          <Text as="p" variant="meta" tone="muted">
            {t("apikeys.keyCreatedHint")}
          </Text>
        </div>
      </div>

      <div className="bg-background flex items-center gap-1 rounded-md border py-1 pr-1 pl-3">
        <code className="min-w-0 flex-1 truncate text-xs">{value}</code>
        <CopyButton value={value} withLabel size="sm" />
      </div>

      <div className="space-y-2">
        <Text as="p" variant="label" tone="muted">
          {t("apikeys.useInGithubActions")}
        </Text>
        <CodeBlock
          language="shell"
          label="POST /api/v0/deploy"
          code={buildDeployCurl(
            appUrl,
            t("deploy.exampleStack"),
            "pull-redeploy",
            value
          )}
        />
      </div>

      <div className="flex justify-end">
        <Button variant="outline" onClick={onDismiss}>
          {t("apikeys.dismiss")}
        </Button>
      </div>
    </section>
  )
}
