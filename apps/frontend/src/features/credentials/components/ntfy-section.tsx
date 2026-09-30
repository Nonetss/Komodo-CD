import {
  BellOff,
  BellRing,
  Loader2,
  Pause,
  Pencil,
  Play,
  Send,
  Trash2,
} from "lucide-react"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"

import { Text } from "@/components/shared/brand/typography"
import {
  MetadataCell,
  MetadataList,
} from "@/components/shared/data-display/metadata-cell"
import { StatusTag } from "@/components/shared/data-display/status-dot"
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
import type { NtfyConfig } from "@/lib/api-types"
import { getErrorMessage } from "@/lib/orpc"
import { notifyError, notifySuccess } from "@/lib/toast"

/** Avisos por ntfy cuando falla un deploy: resumen, alta y edición. */
export function NtfySection() {
  const { t } = useTranslation()
  const configQuery = useNtfyConfig()
  const config = configQuery.data
  const [editing, setEditing] = useState(false)

  let main: React.ReactNode
  if (configQuery.isError) {
    main = (
      <StateCard
        tone="destructive"
        icon={BellOff}
        title={t("ntfy.errorLoad")}
        description={getErrorMessage(configQuery.error, "")}
        action={
          <Button variant="outline" onClick={() => configQuery.refetch()}>
            {t("common.retry")}
          </Button>
        }
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
          <Button onClick={() => setEditing(true)}>
            <BellRing />
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
  const [confirming, setConfirming] = useState(false)

  useEffect(() => {
    if (!confirming) return
    const timer = setTimeout(() => setConfirming(false), 3000)
    return () => clearTimeout(timer)
  }, [confirming])

  // Sin `token`: el backend conserva el guardado
  const toggle = async () => {
    try {
      await save.mutateAsync({
        url: config.url,
        topic: config.topic,
        enabled: !config.enabled,
      })
      notifySuccess(config.enabled ? t("ntfy.paused") : t("ntfy.resumed"))
    } catch (err) {
      notifyError(t("ntfy.errorSave"), getErrorMessage(err, ""))
    }
  }

  const sendTest = async () => {
    try {
      const res = await test.mutateAsync(undefined)
      notifySuccess(t("ntfy.testSent"), res.message)
    } catch (err) {
      notifyError(t("ntfy.errorTest"), getErrorMessage(err, ""))
    }
  }

  const onRemove = async () => {
    if (!confirming) {
      setConfirming(true)
      return
    }
    setConfirming(false)
    try {
      await remove.mutateAsync(undefined)
      notifySuccess(t("ntfy.deleted"))
    } catch (err) {
      notifyError(t("ntfy.errorDelete"), getErrorMessage(err, ""))
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-end gap-2">
        <Button
          variant={confirming ? "destructive" : "ghost"}
          size="sm"
          onClick={onRemove}
          disabled={remove.isPending}
          aria-label={t("ntfy.deleteLabel")}
        >
          {remove.isPending ? <Loader2 className="animate-spin" /> : <Trash2 />}
          {confirming ? t("common.confirmDelete") : t("common.delete")}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={toggle}
          disabled={save.isPending}
        >
          {save.isPending ? (
            <Loader2 className="animate-spin" />
          ) : config.enabled ? (
            <Pause />
          ) : (
            <Play />
          )}
          {config.enabled ? t("ntfy.pause") : t("ntfy.resume")}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={sendTest}
          disabled={test.isPending}
        >
          {test.isPending ? <Loader2 className="animate-spin" /> : <Send />}
          {t("ntfy.test")}
        </Button>
        <Button variant="outline" size="sm" onClick={onEdit}>
          <Pencil />
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
          <span className="block truncate font-mono text-xs tracking-tight">
            {config.url}
          </span>
        </MetadataCell>
        <MetadataCell label={t("ntfy.topicLabel")}>
          <span className="block truncate font-mono text-xs tracking-tight">
            {config.topic}
          </span>
        </MetadataCell>
        <MetadataCell label={t("ntfy.tokenLabel")}>
          {config.hasToken ? t("ntfy.tokenSet") : t("ntfy.tokenNone")}
        </MetadataCell>
      </MetadataList>
    </div>
  )
}
