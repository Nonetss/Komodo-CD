import type { ReactNode } from "react"

import { Text } from "@/components/shared/brand/typography"
import { cn } from "@/lib/utils"

/**
 * Tonos del punto de estado. El color vive solo aquí (8px) y, cuando el
 * estado pide atención, en la palabra que lo acompaña: nunca en fondos. Los
 * estados neutros (parado, desconocido) son un aro hueco.
 */
export type StatusTone =
  | "success"
  | "info"
  | "warning"
  | "danger"
  | "primary"
  | "muted"

const DOT: Record<StatusTone, string> = {
  success: "bg-success",
  info: "bg-info",
  warning: "bg-warning",
  danger: "bg-danger",
  primary: "bg-primary",
  muted: "ring-[1.5px] ring-inset ring-muted-foreground",
}

const INK: Record<StatusTone, string> = {
  success: "text-success",
  info: "text-info",
  warning: "text-warning",
  danger: "text-danger",
  primary: "text-primary",
  muted: "text-muted-foreground",
}

export function statusInkClass(tone: StatusTone) {
  return INK[tone]
}

/** Punto de estado de 8px; `pulse` para una acción en curso. */
export function StatusDot({
  tone = "muted",
  pulse = false,
  className,
}: {
  tone?: StatusTone
  pulse?: boolean
  className?: string
}) {
  return (
    <span
      aria-hidden
      className={cn(
        "size-2 shrink-0 rounded-full",
        DOT[tone],
        pulse && "animate-pulse",
        className
      )}
    />
  )
}

/**
 * Palabra de estado en micro-caps, opcionalmente precedida del punto. En gris
 * por defecto; `ink` tiñe la palabra con el tono (para lo que pide atención).
 */
export function StatusTag({
  children,
  tone,
  pulse = false,
  ink = false,
  title,
  className,
}: {
  children: ReactNode
  tone?: StatusTone
  pulse?: boolean
  ink?: boolean
  title?: string
  className?: string
}) {
  return (
    <Text
      variant="status"
      title={title}
      className={cn(
        "inline-flex items-center gap-2 whitespace-nowrap",
        ink && tone ? INK[tone] : "text-muted-foreground",
        className
      )}
    >
      {tone ? <StatusDot tone={tone} pulse={pulse} /> : null}
      {children}
    </Text>
  )
}
