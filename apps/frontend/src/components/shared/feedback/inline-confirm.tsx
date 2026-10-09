import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"

import { Text } from "@/components/shared/brand/typography"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

/**
 * Confirmación en el sitio: la pregunta y los botones de confirmar y cancelar
 * sustituyen a los controles que la abren (barra de lote, "desplegar todos").
 * Quien la usa decide cuándo mostrarla. Para borrar con dos clics en el mismo
 * botón está `useConfirm`.
 */
export function InlineConfirm({
  message,
  confirmLabel,
  onConfirm,
  onCancel,
  className,
}: {
  message: ReactNode
  confirmLabel: string
  onConfirm: () => void
  onCancel: () => void
  className?: string
}) {
  const { t } = useTranslation()
  return (
    <div
      className={cn(
        "flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-2",
        className
      )}
    >
      <Text as="p" className="min-w-0 flex-1 font-semibold">
        {message}
      </Text>
      <div className="flex shrink-0 items-center gap-1">
        <Button size="sm" onClick={onConfirm}>
          {confirmLabel}
        </Button>
        <Button size="sm" variant="ghost" onClick={onCancel}>
          {t("common.cancel")}
        </Button>
      </div>
    </div>
  )
}
