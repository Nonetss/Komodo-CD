import { Loader2, Trash2 } from "lucide-react"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"

import { Text } from "@/components/shared/brand/typography"
import { Button } from "@/components/ui/button"
import { useApiKeyDelete } from "@/features/api-keys/hooks/use-api-keys"
import type { ApiKey } from "@/lib/api-types"
import { getErrorMessage } from "@/lib/orpc"
import { notifyError, notifySuccess } from "@/lib/toast"

export function ApiKeyRow({ apiKey }: { apiKey: ApiKey }) {
  const { t, i18n } = useTranslation()
  const deleteKey = useApiKeyDelete()
  const [confirming, setConfirming] = useState(false)

  useEffect(() => {
    if (!confirming) return
    const timer = setTimeout(() => setConfirming(false), 3000)
    return () => clearTimeout(timer)
  }, [confirming])

  const remove = async () => {
    if (!confirming) {
      setConfirming(true)
      return
    }
    setConfirming(false)
    try {
      await deleteKey.mutateAsync({ id: apiKey.id })
      notifySuccess(t("apikeys.deleted"), apiKey.name ?? undefined)
    } catch (err) {
      notifyError(t("apikeys.errorDelete"), getErrorMessage(err, ""))
    }
  }

  const created = new Intl.DateTimeFormat(i18n.language, {
    dateStyle: "medium",
  }).format(new Date(apiKey.createdAt))

  return (
    <li className="group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/40">
      <div className="min-w-0 flex-1">
        <Text as="p" variant="headline" className="truncate">
          {apiKey.name ?? "—"}
        </Text>
        <Text
          as="p"
          variant="meta"
          tone="muted"
          className="flex flex-wrap items-center gap-x-2"
        >
          <Text variant="data">
            {apiKey.start ? `${apiKey.start}••••••` : apiKey.id}
          </Text>
          <span aria-hidden className="text-border">
            ·
          </span>
          <span>{t("apikeys.created", { date: created })}</span>
        </Text>
      </div>
      <Button
        variant={confirming ? "destructive" : "ghost"}
        size={confirming ? "sm" : "icon-sm"}
        onClick={remove}
        disabled={deleteKey.isPending}
        aria-label={
          confirming ? t("common.confirmDelete") : t("apikeys.deleteLabel")
        }
        title={t("apikeys.deleteLabel")}
        className={
          confirming
            ? undefined
            : "text-muted-foreground opacity-70 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100"
        }
      >
        {deleteKey.isPending ? (
          <Loader2 className="animate-spin" />
        ) : (
          <Trash2 />
        )}
        {confirming && t("common.confirmDelete")}
      </Button>
    </li>
  )
}
