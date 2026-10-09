import { Trash2 } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import { useStackDelete } from "@/features/stacks/hooks/use-stack-delete"
import { useConfirm } from "@/hooks/use-confirm"
import { toastMutation } from "@/lib/toast"

/**
 * Papelera de la cabecera de la ficha que borra el stack en Komodo, con
 * confirmación de dos clics: armada, enseña el texto de confirmar. El aviso de
 * que no se puede deshacer va en el `title`. Bloqueada mientras corre una
 * acción sobre el stack.
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
    <Button
      type="button"
      variant={confirming ? "destructive" : "outline"}
      size={confirming ? "default" : "icon"}
      icon={Trash2}
      loading={deleteStack.isPending}
      disabled={disabled || deleteStack.isPending}
      onClick={remove}
      title={t("stacks.deleteHint")}
      aria-label={
        confirming
          ? t("common.confirmDelete")
          : t("stacks.deleteLabel", { name })
      }
    >
      {confirming ? t("common.confirmDelete") : null}
    </Button>
  )
}
