import { Trash2 } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Text } from "@/components/shared/brand/typography"
import { Button } from "@/components/ui/button"
import { useApiKeyDelete } from "@/features/api-keys/hooks/use-api-keys"
import { useConfirm } from "@/hooks/use-confirm"
import type { ApiKey } from "@/lib/api-types"
import { toastMutation } from "@/lib/toast"

export function ApiKeyRow({ apiKey }: { apiKey: ApiKey }) {
  const { t, i18n } = useTranslation()
  const deleteKey = useApiKeyDelete()
  const { confirming, confirm: remove } = useConfirm(() =>
    toastMutation(() => deleteKey.mutateAsync({ id: apiKey.id }), {
      success: () => ({
        title: t("apikeys.deleted"),
        description: apiKey.name ?? undefined,
      }),
      error: t("apikeys.errorDelete"),
    })
  )

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
        icon={Trash2}
        loading={deleteKey.isPending}
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
        {confirming && t("common.confirmDelete")}
      </Button>
    </li>
  )
}
