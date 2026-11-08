import { ShieldCheck } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Text } from "@/components/shared/brand/typography"
import { CopyButton } from "@/components/shared/form/copy-button"
import { Button } from "@/components/ui/button"
import { DeploySnippet } from "@/entities/deploy-action"

/** Key recién creada: se muestra una sola vez, con su snippet de CI */
export function CreatedKey({
  value,
  onDismiss,
}: {
  value: string
  onDismiss: () => void
}) {
  const { t } = useTranslation()
  return (
    <section className="border-rule space-y-5 rule-y py-5">
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
        <Text as="p" variant="caption" tone="muted">
          {t("apikeys.useInGithubActions")}
        </Text>
        <DeploySnippet
          stack={t("deploy.exampleStack")}
          action="pull-redeploy"
          apiKey={value}
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
