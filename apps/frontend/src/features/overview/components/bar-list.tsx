import type { ReactNode } from "react"

import { Text } from "@/components/shared/brand/typography"
import { cn } from "@/lib/utils"

export interface BarListItem {
  key: string
  label: ReactNode
  value: number
  /** Relleno de la barra (`bg-…`); por defecto, tinta apagada */
  fill?: string
}

/**
 * Barras horizontales finas, una por fila: la etiqueta a la izquierda, la
 * barra desde una base común y la cifra en su punta. La escala es el valor
 * más alto de la lista; un valor 0 deja la pista vacía.
 */
export function BarList({
  items,
  className,
}: {
  items: BarListItem[]
  className?: string
}) {
  const max = Math.max(1, ...items.map((i) => i.value))
  return (
    <ul className={cn("flex flex-col gap-2.5", className)}>
      {items.map((item) => (
        <li
          key={item.key}
          className="grid grid-cols-[minmax(0,9rem)_minmax(0,1fr)] items-center gap-4"
        >
          <span className="min-w-0 truncate text-sm">{item.label}</span>
          <span className="flex min-w-0 items-center gap-2">
            {item.value > 0 ? (
              <span
                aria-hidden
                className={cn(
                  "h-2 rounded-r-sm",
                  item.fill ?? "bg-foreground/40"
                )}
                style={{ width: `${(item.value / max) * 85}%` }}
              />
            ) : null}
            <Text variant="data" tone={item.value > 0 ? "default" : "muted"}>
              {item.value}
            </Text>
          </span>
        </li>
      ))}
    </ul>
  )
}
