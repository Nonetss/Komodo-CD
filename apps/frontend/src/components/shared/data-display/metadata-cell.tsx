import type { ReactNode } from "react"

import { Text } from "@/components/shared/brand/typography"
import { cn } from "@/lib/utils"

/**
 * Etiqueta micro-caps sobre un valor. Se usa dentro de `MetadataList`, que
 * emite el `<dl>`; cada celda emite su `<dt>`/`<dd>`.
 */
export function MetadataCell({
  label,
  children,
  action,
  tone = "default",
  className,
}: {
  label: string
  children: ReactNode
  /** Afordancia junto al valor (p. ej. copiar) */
  action?: ReactNode
  tone?: "default" | "destructive"
  className?: string
}) {
  return (
    <div className={cn("min-w-0", className)}>
      <Text as="dt" variant="caption" tone="muted">
        {label}
      </Text>
      <Text
        as="dd"
        className={cn(
          "mt-1.5 min-w-0",
          tone === "destructive" && "text-destructive",
          action && "flex items-center gap-1"
        )}
      >
        {children}
        {action}
      </Text>
    </div>
  )
}

/**
 * Franja de hechos: rejilla de `MetadataCell` enmarcada por `border-y`, en
 * vez de una tarjeta alrededor de los datos.
 */
export function MetadataList({
  columns,
  bordered = true,
  children,
  className,
}: {
  columns: 1 | 2 | 3 | 4
  bordered?: boolean
  children: ReactNode
  className?: string
}) {
  return (
    <dl
      className={cn(
        "grid gap-x-6 gap-y-5 py-5",
        columns === 1 && "grid-cols-1",
        columns === 2 && "grid-cols-1 sm:grid-cols-2",
        columns === 3 && "grid-cols-1 sm:grid-cols-3",
        columns === 4 && "grid-cols-2 lg:grid-cols-4",
        bordered && "border-y",
        className
      )}
    >
      {children}
    </dl>
  )
}
