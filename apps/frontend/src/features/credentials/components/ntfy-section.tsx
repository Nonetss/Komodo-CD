import {
  BellOff,
  BellRing,
  Pause,
  Pencil,
  Play,
  Send,
  Trash2,
} from "lucide-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"

import { Text } from "@/components/shared/brand/typography"
import {
  MetadataCell,
  MetadataList,
} from "@/components/shared/data-display/metadata-cell"
import { StatusTag } from "@/components/shared/data-display/status-dot"
import { QueryErrorCard } from "@/components/shared/feedback/query-error-card"
import { StateCard } from "@/components/shared/feedback/state-card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { NtfyForm } from "@/features/credentials/components/ntfy-form"
import {
  useNtfyConfig,
  useNtfyDelete,
  useNtfySave,
  useNtfyTest,
} from "@/features/credentials/hooks/use-ntfy"
import { useConfirm } from "@/hooks/use-confirm"
import type { NtfyConfig } from "@/lib/api-types"
import { toastMutation } from "@/lib/toast"

/** Avisos por ntfy cuando falla un deploy: resumen, alta y edición. */
export function NtfySection() {
  const { t } = useTranslation()
  const configQuery = useNtfyConfig()
  const config = configQuery.data
  const [editing, setEditing] = useState(false)

  let main: React.ReactNode
  if (configQuery.isError) {
    main = (
      <QueryErrorCard
        query={configQuery}
        icon={BellOff}
        title={t("ntfy.errorLoad")}
      />
    )
  } else if (configQuery.isLoading) {
    main = <Skeleton className="h-20 rounded-none" />
  } else if (editing) {
    main = (
      <NtfyForm
        current={config ?? undefined}
        onCancel={() => setEditing(false)}
        onSaved={() => setEditing(false)}
      />
    )
  } else if (config) {
    main = <NtfySummary config={config} onEdit={() => setEditing(true)} />
  } else {
    main = (
      <StateCard
        icon={BellRing}
        title={t("ntfy.empty")}
        description={t("ntfy.emptyDescription")}
        action={
          <Button icon={BellRing} onClick={() => setEditing(true)}>
            {t("ntfy.add")}
          </Button>
        }
      />
    )
  }

  return (
    <section aria-labelledby="ntfy-title" className="space-y-4">
      <div className="space-y-1.5">
        <Text as="h2" id="ntfy-title" variant="headline">
          {t("ntfy.title")}
        </Text>
        <Text as="p" variant="meta" tone="muted" className="text-pretty">
          {t("ntfy.description")}
        </Text>
      </div>
      {main}
    </section>
  )
}

function NtfySummary({
  config,
  onEdit,
}: {
  config: NtfyConfig
  onEdit: () => void
}) {
  const { t } = useTranslation()
  const save = useNtfySave()
  const test = useNtfyTest()
  const remove = useNtfyDelete()

  // Sin `token`: el backend conserva el guardado
  const toggle = () =>
    toastMutation(
      () =>
        save.mutateAsync({
          url: config.url,
          topic: config.topic,
          enabled: !config.enabled,
        }),
      {
        success: () => ({
          title: config.enabled ? t("ntfy.paused") : t("ntfy.resumed"),
        }),
        error: t("ntfy.errorSave"),
      }
    )

  const sendTest = () =>
    toastMutation(() => test.mutateAsync(undefined), {
      success: t("ntfy.testSent"),
      error: t("ntfy.errorTest"),
    })

  const { confirming, confirm: onRemove } = useConfirm(() =>
    toastMutation(() => remove.mutateAsync(undefined), {
      success: () => ({ title: t("ntfy.deleted") }),
      error: t("ntfy.errorDelete"),
    })
  )

  return (
    <div>
      <div className="flex flex-wrap items-center justify-end gap-2">
        <Button
          variant={confirming ? "destructive" : "ghost"}
          size="sm"
          onClick={onRemove}
          icon={Trash2}
          loading={remove.isPending}
          aria-label={t("ntfy.deleteLabel")}
        >
          {confirming ? t("common.confirmDelete") : t("common.delete")}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={toggle}
          icon={config.enabled ? Pause : Play}
          loading={save.isPending}
        >
          {config.enabled ? t("ntfy.pause") : t("ntfy.resume")}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={sendTest}
          icon={Send}
          loading={test.isPending}
        >
          {t("ntfy.test")}
        </Button>
        <Button variant="outline" size="sm" icon={Pencil} onClick={onEdit}>
          {t("ntfy.edit")}
        </Button>
      </div>

      <MetadataList columns={4} className="mt-4">
        <MetadataCell label={t("credentials.statusLabel")}>
          {config.enabled ? (
            <StatusTag tone="success">{t("ntfy.active")}</StatusTag>
          ) : (
            <StatusTag tone="muted">{t("ntfy.inactive")}</StatusTag>
          )}
        </MetadataCell>
        <MetadataCell label={t("ntfy.urlLabel")}>
          <Text variant="data" className="block truncate">
            {config.url}
          </Text>
        </MetadataCell>
        <MetadataCell label={t("ntfy.topicLabel")}>
          <Text variant="data" className="block truncate">
            {config.topic}
          </Text>
        </MetadataCell>
        <MetadataCell label={t("ntfy.tokenLabel")}>
          {config.hasToken ? t("ntfy.tokenSet") : t("ntfy.tokenNone")}
        </MetadataCell>
      </MetadataList>
    </div>
  )
}
