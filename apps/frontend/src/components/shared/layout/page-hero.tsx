import type { ReactNode } from "react"

import { Text } from "@/components/shared/brand/typography"
import { cn } from "@/lib/utils"

/**
 * Cabecera de toda página: el título en rol `display`, la descripción y, a la
 * derecha, recuentos, estado y una única acción. Con `toolbar` (buscador,
 * filtros), los recuentos bajan a una fila propia y la toolbar ocupa su
 * izquierda en vez de dejar el hueco vacío. Cierra con el trazo grueso.
 */
export function PageHero({
  title,
  description,
  meta,
  status,
  action,
  toolbar,
  className,
}: {
  title: ReactNode
  description?: ReactNode
  meta?: ReactNode
  status?: ReactNode
  action?: ReactNode
  toolbar?: ReactNode
  className?: string
}) {
  const rightItemCount = [meta, status, action].filter(Boolean).length
  const right =
    rightItemCount > 0 ? (
      <div className="flex min-w-0 flex-wrap items-end gap-x-6 gap-y-4 sm:ml-auto sm:justify-end">
        {meta}
        {status}
        {action}
      </div>
    ) : null

  return (
    <header
      className={cn(
        "border-rule flex flex-col gap-5 rule-b pb-6 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between",
        className
      )}
    >
      <div className="min-w-0">
        <Text as="h1" variant="display" className="text-balance lg:text-7xl">
          {title}
        </Text>
        {description ? (
          <Text
            as="p"
            variant="meta"
            tone="muted"
            className="mt-3 max-w-prose text-pretty"
          >
            {description}
          </Text>
        ) : null}
      </div>
      {toolbar ? (
        <div className="flex w-full flex-wrap items-end gap-x-6 gap-y-5 sm:basis-full">
          <div className="min-w-0 flex-1 basis-60">{toolbar}</div>
          {right}
        </div>
      ) : (
        right
      )}
    </header>
  )
}
