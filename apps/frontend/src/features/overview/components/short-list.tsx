import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"

import { Text } from "@/components/shared/brand/typography"
import { cn } from "@/lib/utils"

// Filas a la vista en cada columna; el resto, tras "y N más"
const SHOWN = 5

/**
 * Lista corta de un bloque del resumen: título, hasta cinco filas por columna
 * separadas por líneas finas y "y N más" con lo que no cabe, o una línea si
 * está vacía. Todas tienen el mismo tope de filas para que los bloques vecinos
 * midan lo mismo; con `columns` las filas siguen en la columna de al lado
 * (lado a lado desde `sm`).
 */
export function ShortList<T>({
  title,
  items,
  empty,
  itemKey,
  renderItem,
  columns = 1,
}: {
  title: string
  items: T[]
  empty: string
  itemKey: (item: T) => string
  renderItem: (item: T) => ReactNode
  columns?: 1 | 2
}) {
  const { t } = useTranslation()
  const shown = items.slice(0, SHOWN * columns)
  const hidden = items.length - shown.length
  const chunks = Array.from(
    { length: Math.ceil(shown.length / SHOWN) },
    (_, i) => shown.slice(i * SHOWN, (i + 1) * SHOWN)
  )
  return (
    <div className="flex min-w-0 flex-col gap-2">
      <Text as="h3" variant="caption">
        {title}
      </Text>
      {items.length === 0 ? (
        <Text as="p" variant="meta" tone="muted">
          {empty}
        </Text>
      ) : (
        <div className={cn("grid gap-x-8", columns === 2 && "sm:grid-cols-2")}>
          {chunks.map((chunk, i) => (
            <ul
              key={itemKey(chunk[0])}
              // Apiladas, la línea de arriba la pone la columna anterior
              className={cn("divide-y border-y", i > 0 && "max-sm:border-t-0")}
            >
              {chunk.map((item) => (
                <li
                  key={itemKey(item)}
                  className="flex min-h-10 min-w-0 items-center justify-between gap-3 py-2"
                >
                  {renderItem(item)}
                </li>
              ))}
              {hidden > 0 && i === chunks.length - 1 ? (
                <li className="py-2">
                  <Text variant="meta-sm" tone="muted">
                    {t("overview.more", { count: hidden })}
                  </Text>
                </li>
              ) : null}
            </ul>
          ))}
        </div>
      )}
    </div>
  )
}
