import { type LucideIcon, ServerCrash } from "lucide-react"
import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"

import { StateCard } from "@/components/shared/feedback/state-card"
import { Button } from "@/components/ui/button"
import { getErrorMessage } from "@/lib/orpc"

/**
 * Estado de error de una query: el mensaje del backend y un botón para
 * reintentar, más las acciones extra que pase la página.
 */
export function QueryErrorCard({
  query,
  title,
  icon = ServerCrash,
  actions,
}: {
  query: { error: unknown; refetch: () => unknown }
  title: ReactNode
  icon?: LucideIcon
  actions?: ReactNode
}) {
  const { t } = useTranslation()
  return (
    <StateCard
      tone="destructive"
      icon={icon}
      title={title}
      description={getErrorMessage(query.error, "")}
      action={
        <div className="flex flex-wrap justify-center gap-2">
          <Button variant="outline" onClick={() => query.refetch()}>
            {t("common.retry")}
          </Button>
          {actions}
        </div>
      }
    />
  )
}
