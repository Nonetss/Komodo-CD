import type { ReactNode } from "react"

import { Text } from "@/components/shared/brand/typography"
import { cn } from "@/lib/utils"

/**
 * Cabecera de sección ("01 Servicios"): el título en rol `section`, una nota
 * a la derecha y, opcionalmente, una acción. El número solo se pasa cuando las
 * secciones van ordenadas por algo (el resumen, por urgencia) y va en tono
 * apagado: el acento se queda para lo que pide acción. Se apoya en el trazo
 * grueso; lo que sigue se separa con líneas finas.
 */
export function SectionHeader({
  number,
  title,
  as = "h2",
  id,
  aside,
  action,
  className,
}: {
  number?: number
  title: ReactNode
  as?: "h2" | "h3"
  id?: string
  /** Nota corta (p. ej. "2 stacks"), en mono */
  aside?: ReactNode
  action?: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        "border-rule flex flex-wrap items-baseline gap-x-5 gap-y-2 rule-b pb-3",
        className
      )}
    >
      {number !== undefined ? (
        <Text variant="label" tone="muted" aria-hidden>
          {String(number).padStart(2, "0")}
        </Text>
      ) : null}
      <Text as={as} id={id} variant="section" className="min-w-0 flex-1">
        {title}
      </Text>
      {aside ? (
        <Text variant="label" tone="muted">
          {aside}
        </Text>
      ) : null}
      {action}
    </div>
  )
}
