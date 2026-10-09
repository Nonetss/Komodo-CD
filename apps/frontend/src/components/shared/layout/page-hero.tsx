import type { ReactNode } from "react"

import { Text } from "@/components/shared/brand/typography"
import { getAppSurface, type SurfaceId } from "@/lib/app-surfaces"
import { cn } from "@/lib/utils"

/**
 * Cabecera de toda página: el icono de la superficie en el acento como marca,
 * el título en rol `display` (ancho expandido), la descripción y, a la
 * derecha, recuentos, estado y una única acción. Cierra con el trazo grueso.
 */
export function PageHero({
  surface,
  title,
  description,
  meta,
  status,
  action,
  className,
}: {
  surface: SurfaceId
  title: ReactNode
  description?: ReactNode
  meta?: ReactNode
  status?: ReactNode
  action?: ReactNode
  className?: string
}) {
  const Icon = getAppSurface(surface).icon
  const rightItemCount = [meta, status, action].filter(Boolean).length

  return (
    <header
      className={cn(
        "border-rule flex flex-col gap-5 border-b-[1.5px] pb-6 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between",
        className
      )}
    >
      <div className="min-w-0">
        <Icon aria-hidden className="text-signal mb-4 size-5" />
        <Text as="h1" variant="display" className="text-balance">
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
      {rightItemCount > 0 ? (
        <div className="flex min-w-0 flex-wrap items-end gap-x-6 gap-y-4 sm:ml-auto sm:justify-end">
          {meta}
          {status}
          {action}
        </div>
      ) : null}
    </header>
  )
}
