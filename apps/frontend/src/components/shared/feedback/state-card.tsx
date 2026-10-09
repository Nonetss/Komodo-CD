import type { LucideIcon } from "lucide-react"
import type { ReactNode } from "react"

import { Text } from "@/components/shared/brand/typography"
import { cn } from "@/lib/utils"

/**
 * Estado a todo el ancho (vacío o error): un hueco discontinuo
 * sobre `bg-surface`, no un contenedor. Icono plano, sin caja de fondo.
 */
export function StateCard({
  icon: Icon,
  title,
  description,
  action,
  tone = "muted",
  className,
}: {
  icon?: LucideIcon
  title: ReactNode
  description?: ReactNode
  action?: ReactNode
  tone?: "muted" | "destructive"
  className?: string
}) {
  return (
    <div
      className={cn(
        "bg-surface flex flex-col items-center gap-3 rounded-xl border border-dashed px-6 py-16 text-center",
        className
      )}
    >
      {Icon ? (
        <Icon
          aria-hidden
          strokeWidth={1.5}
          className={cn(
            "text-muted-foreground size-10",
            tone === "destructive" && "text-destructive"
          )}
        />
      ) : null}

      <div>
        <Text
          as="p"
          variant="headline"
          tone={tone === "destructive" ? "destructive" : "default"}
        >
          {title}
        </Text>
        {description ? (
          <Text
            as="p"
            tone="muted"
            className="mx-auto mt-1 max-w-sm leading-relaxed text-pretty wrap-break-word"
          >
            {description}
          </Text>
        ) : null}
      </div>
      {action ? <div className="mt-1">{action}</div> : null}
    </div>
  )
}
