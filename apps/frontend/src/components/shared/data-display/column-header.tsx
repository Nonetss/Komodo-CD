import type { ReactNode } from "react"

import { Text } from "@/components/shared/brand/typography"
import { cn } from "@/lib/utils"

/**
 * Cabecera de columna de las tablas: rol `label` en tono apagado. La última
 * columna (acciones, estado) se alinea a la derecha y no deja hueco a su lado.
 */
export function ColumnHeader({
  align = "left",
  className,
  children,
}: {
  align?: "left" | "right"
  className?: string
  children: ReactNode
}) {
  return (
    <th
      scope="col"
      className={cn(
        "py-3 font-normal",
        align === "right" ? "text-right" : "pr-4",
        className
      )}
    >
      <Text variant="label" tone="muted">
        {children}
      </Text>
    </th>
  )
}
