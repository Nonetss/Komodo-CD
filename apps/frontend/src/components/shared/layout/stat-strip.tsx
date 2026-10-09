import type { ReactNode } from "react"

import { Text } from "@/components/shared/brand/typography"
import { cn } from "@/lib/utils"

export interface StatStripItem {
  label: string
  value: ReactNode
  /** `signal` para lo que pide acción; `muted` para el total o lo neutro */
  tone?: "default" | "signal" | "muted"
  /** Valor técnico (un commit, un hash) en mono en vez de cifra */
  mono?: boolean
}

const VALUE_TONE = {
  default: "",
  signal: "text-signal-ink",
  muted: "text-muted-foreground",
}

/**
 * Franja de recuentos o hechos: etiqueta mono encima y cifra grande debajo,
 * abierta por el trazo grueso a la izquierda y separada por líneas finas.
 */
export function StatStrip({
  items,
  className,
}: {
  items: StatStripItem[]
  className?: string
}) {
  return (
    <dl className={cn("border-rule flex flex-wrap gap-y-4 rule-l", className)}>
      {items.map((item) => (
        <div
          key={item.label}
          className="flex min-w-0 flex-col gap-2 border-r px-5 last:border-r-0"
        >
          <Text
            as="dt"
            variant="label"
            tone={item.tone === "signal" ? "signal" : "muted"}
          >
            {item.label}
          </Text>
          <Text
            as="dd"
            variant={item.mono ? "data" : "stat"}
            className={cn(
              item.mono && "text-xl font-medium",
              VALUE_TONE[item.tone ?? "default"]
            )}
          >
            {item.value}
          </Text>
        </div>
      ))}
    </dl>
  )
}
