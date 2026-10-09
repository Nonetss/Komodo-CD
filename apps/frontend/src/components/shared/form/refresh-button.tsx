import { RefreshCw } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

/** Botón de recargar una query: el icono gira mientras se refresca. */
export function RefreshButton({
  query,
  label,
}: {
  query: { isFetching: boolean; refetch: () => unknown }
  /** Etiqueta accesible (p. ej. "Actualizar stacks") */
  label: string
}) {
  const { t } = useTranslation()
  return (
    <Button
      variant="outline"
      onClick={() => query.refetch()}
      disabled={query.isFetching}
      aria-label={label}
    >
      <RefreshCw className={cn(query.isFetching && "animate-spin")} />
      <span className="hidden sm:inline">{t("common.refresh")}</span>
    </Button>
  )
}
