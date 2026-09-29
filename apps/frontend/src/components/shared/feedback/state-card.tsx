import { Loader2, type LucideIcon } from "lucide-react"
import type { ReactNode } from "react"

import { Text } from "@/components/shared/brand/typography"
import { cn } from "@/lib/utils"

/**
 * Estado a todo el ancho (carga, vacío, error, éxito): un hueco discontinuo
 * sobre `bg-surface`, no un contenedor. Icono plano, sin caja de fondo.
 */
export function StateCard({
  icon: Icon,
  spinner = false,
  title,
  description,
  action,
  tone = "muted",
  className,
}: {
  icon?: LucideIcon
  spinner?: boolean
  title: ReactNode
  description?: ReactNode
  action?: ReactNode
  tone?: "muted" | "destructive" | "celebrate"
  className?: string
}) {
  return (
    <div
      className={cn(
        "bg-surface flex flex-col items-center gap-3 rounded-xl border border-dashed px-6 py-16 text-center",
        tone === "celebrate" && "border-solid",
        className
      )}
    >
      {spinner ? (
        <Loader2 className="text-muted-foreground size-6 animate-spin" />
      ) : Icon ? (
        <Icon
          aria-hidden
          strokeWidth={1.5}
          className={cn(
            "text-muted-foreground size-10",
            tone === "destructive" && "text-destructive",
            tone === "celebrate" && "text-primary"
          )}
        />
      ) : null}

      <div>
        <Text
          as="p"
          variant={tone === "celebrate" ? "display" : "headline"}
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
