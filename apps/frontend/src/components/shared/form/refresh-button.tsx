import { RefreshCw } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

/** Botón de recargar una query: el icono gira mientras se refresca. */
export function RefreshButton({
  query,
  label,
  iconOnly = false,
}: {
  query: { isFetching: boolean; refetch: () => unknown }
  /** Etiqueta accesible (p. ej. "Actualizar stacks") */
  label: string
  /** Solo el icono, para cabeceras estrechas (la etiqueta va en el título) */
  iconOnly?: boolean
}) {
  const { t } = useTranslation()
  return (
    <Button
      variant={iconOnly ? "ghost" : "outline"}
      size={iconOnly ? "icon" : "default"}
      onClick={() => query.refetch()}
      disabled={query.isFetching}
      aria-label={label}
      title={iconOnly ? label : undefined}
    >
      <RefreshCw className={cn(query.isFetching && "animate-spin")} />
      {iconOnly ? null : (
        <span className="hidden sm:inline">{t("common.refresh")}</span>
      )}
    </Button>
  )
}
