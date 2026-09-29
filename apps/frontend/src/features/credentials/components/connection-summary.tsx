import { ExternalLink, Loader2, Pencil, Trash2 } from "lucide-react"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"

import { Text } from "@/components/shared/brand/typography"
import {
  MetadataCell,
  MetadataList,
} from "@/components/shared/data-display/metadata-cell"
import { StatusTag } from "@/components/shared/data-display/status-dot"
import { Button } from "@/components/ui/button"
import { useCredentialsDelete } from "@/features/credentials/hooks/use-credentials"
import { useStacks } from "@/features/stacks"
import type { Credential } from "@/lib/api-types"
import { getErrorMessage } from "@/lib/orpc"
import { notifyError, notifySuccess } from "@/lib/toast"

/** Conexión configurada: nombre, estado, URL y número de stacks */
export function ConnectionSummary({
  credential,
  onReplace,
}: {
  credential: Credential
  onReplace: () => void
}) {
  const { t } = useTranslation()
  // El estado se deduce de si la lista de stacks responde
  const stacks = useStacks()
  const deleteCredentials = useCredentialsDelete()
  const [confirming, setConfirming] = useState(false)

  useEffect(() => {
    if (!confirming) return
    const timer = setTimeout(() => setConfirming(false), 3000)
    return () => clearTimeout(timer)
  }, [confirming])

  const remove = async () => {
    if (!credential.name) return
    if (!confirming) {
      setConfirming(true)
      return
    }
    setConfirming(false)
    try {
      await deleteCredentials.mutateAsync({ name: credential.name })
      notifySuccess(t("credentials.deleted", { name: credential.name }))
    } catch (err) {
      notifyError(t("credentials.errorDelete"), getErrorMessage(err, ""))
    }
  }

  const checking = stacks.isLoading || (stacks.isFetching && !stacks.data)

  return (
    <section>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Text as="h2" variant="headline">
          {credential.name ?? "—"}
        </Text>
        <div className="flex items-center gap-2">
          <Button
            variant={confirming ? "destructive" : "ghost"}
            size="sm"
            onClick={remove}
            disabled={deleteCredentials.isPending}
            aria-label={t("credentials.deleteLabel")}
          >
            {deleteCredentials.isPending ? (
              <Loader2 className="animate-spin" />
            ) : (
              <Trash2 />
            )}
            {confirming ? t("common.confirmDelete") : t("common.delete")}
          </Button>
          <Button variant="outline" size="sm" onClick={onReplace}>
            <Pencil />
            {t("credentials.replace")}
          </Button>
        </div>
      </div>

      <MetadataList columns={3} className="mt-4">
        <MetadataCell label={t("credentials.statusLabel")}>
          {checking ? (
            <StatusTag>
              <Loader2 className="size-3 animate-spin" />
              {t("credentials.checking")}
            </StatusTag>
          ) : stacks.isError ? (
            <StatusTag tone="danger" ink>
              {t("credentials.unreachable")}
            </StatusTag>
          ) : (
            <StatusTag tone="success">{t("credentials.connected")}</StatusTag>
          )}
        </MetadataCell>
        <MetadataCell label={t("credentials.urlLabel")}>
          {credential.url ? (
            <a
              href={credential.url}
              target="_blank"
              rel="noreferrer"
              className="hover:text-primary inline-flex max-w-full items-center gap-1.5 font-mono text-xs tracking-tight transition-colors"
            >
              <span className="truncate">{credential.url}</span>
              <ExternalLink aria-hidden className="size-3 shrink-0" />
            </a>
          ) : (
            "—"
          )}
        </MetadataCell>
        <MetadataCell label={t("credentials.stacksLabel")}>
          <span className="tabular-nums">
            {stacks.data ? stacks.data.length : "—"}
          </span>
        </MetadataCell>
      </MetadataList>

      {stacks.isError && (
        <Text
          as="p"
          variant="meta"
          className="text-danger mt-3 wrap-break-word"
        >
          {getErrorMessage(stacks.error, "")}
        </Text>
      )}
    </section>
  )
}
