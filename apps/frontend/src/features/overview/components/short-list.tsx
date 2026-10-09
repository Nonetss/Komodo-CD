import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"

import { Text } from "@/components/shared/brand/typography"

// Filas a la vista en cada lista; el resto, tras "y N más"
const SHOWN = 5

/**
 * Lista corta de un bloque del resumen: título, hasta cinco filas separadas
 * por líneas finas y "y N más" con lo que no cabe, o una línea si está vacía.
 * Todas tienen el mismo tope para que los bloques vecinos midan lo mismo.
 */
export function ShortList<T>({
  title,
  items,
  empty,
  itemKey,
  renderItem,
}: {
  title: string
  items: T[]
  empty: string
  itemKey: (item: T) => string
  renderItem: (item: T) => ReactNode
}) {
  const { t } = useTranslation()
  const hidden = items.length - SHOWN
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
        <ul className="divide-y border-y">
          {items.slice(0, SHOWN).map((item) => (
            <li
              key={itemKey(item)}
              className="flex min-h-10 min-w-0 items-center justify-between gap-3 py-2"
            >
              {renderItem(item)}
            </li>
          ))}
          {hidden > 0 ? (
            <li className="py-2">
              <Text variant="meta-sm" tone="muted">
                {t("overview.more", { count: hidden })}
              </Text>
            </li>
          ) : null}
        </ul>
      )}
    </div>
  )
}
