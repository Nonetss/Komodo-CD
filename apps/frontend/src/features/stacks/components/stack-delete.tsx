import { Trash2 } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Text } from "@/components/shared/brand/typography"
import { SectionHeader } from "@/components/shared/layout/section-header"
import { Button } from "@/components/ui/button"
import { useStackDelete } from "@/features/stacks/hooks/use-stack-delete"
import { useConfirm } from "@/hooks/use-confirm"
import { toastMutation } from "@/lib/toast"

/**
 * Última sección de la ficha: borrar el stack en Komodo, con confirmación de
 * dos clics. Bloqueada mientras corre una acción sobre el stack.
 */
export function StackDelete({
  name,
  disabled,
}: {
  name: string
  disabled: boolean
}) {
  const { t } = useTranslation()
  const deleteStack = useStackDelete()
  const { confirming, confirm: remove } = useConfirm(() =>
    toastMutation(() => deleteStack.mutateAsync({ stack: name }), {
      success: () => ({ title: t("stacks.deleted", { name }) }),
      error: t("stacks.errorDelete"),
    })
  )

  return (
    <section aria-labelledby="stack-delete" className="flex flex-col gap-4">
      <SectionHeader
        as="h3"
        id="stack-delete"
        title={t("stacks.deleteTitle")}
      />
      <div className="flex flex-wrap items-center justify-between gap-x-8 gap-y-3">
        <Text
          as="p"
          variant="meta"
          tone="muted"
          className="max-w-prose min-w-0 flex-1 text-pretty"
        >
          {t("stacks.deleteHint")}
        </Text>
        <Button
          type="button"
          variant={confirming ? "destructive" : "outline"}
          icon={Trash2}
          loading={deleteStack.isPending}
          disabled={disabled || deleteStack.isPending}
          onClick={remove}
          aria-label={
            confirming
              ? t("common.confirmDelete")
              : t("stacks.deleteLabel", { name })
          }
        >
          {confirming ? t("common.confirmDelete") : t("common.delete")}
        </Button>
      </div>
    </section>
  )
}
