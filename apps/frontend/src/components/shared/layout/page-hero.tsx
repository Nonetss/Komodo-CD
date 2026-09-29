import { Fragment, type ReactNode } from "react"

import { Text } from "@/components/shared/brand/typography"
import { getAppSurface, type SurfaceId } from "@/lib/app-surfaces"
import { cn } from "@/lib/utils"

export interface HeroCountSegment {
  count: number
  label: string
}

/**
 * Recuento tipografiado de la cabecera ("12 running · 20 total"): la cifra en
 * tinta, la etiqueta en gris y un "·" de trazo fino entre segmentos. El último
 * segmento es siempre el total; si es 0 no se muestra nada.
 */
export function HeroCount({
  segments,
  className,
}: {
  segments: HeroCountSegment[]
  className?: string
}) {
  const total = segments[segments.length - 1]
  if (!total || total.count <= 0) return null

  return (
    <Text
      as="p"
      variant="meta"
      tone="muted"
      className={cn("tabular-nums", className)}
    >
      {segments.map((segment, index) => (
        <Fragment key={segment.label}>
          {index > 0 ? <span className="text-border mx-2">·</span> : null}
          <span className="text-foreground">{segment.count}</span>{" "}
          {segment.label}
        </Fragment>
      ))}
    </Text>
  )
}

/**
 * Cabecera de toda página: icono plano en el color de acento (sin caja),
 * título en rol `display`, descripción `meta` y, a la derecha, recuento,
 * estado y una única acción.
 */
export function PageHero({
  surface,
  title,
  description,
  meta,
  status,
  action,
  className,
}: {
  surface: SurfaceId
  title: ReactNode
  description?: ReactNode
  meta?: ReactNode
  status?: ReactNode
  action?: ReactNode
  className?: string
}) {
  const Icon = getAppSurface(surface).icon
  const rightItemCount = [meta, status, action].filter(Boolean).length

  return (
    <header
      className={cn(
        "flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between",
        className
      )}
    >
      <div className="flex min-w-0 items-center gap-2.5">
        <Icon aria-hidden className="text-primary size-5 shrink-0" />
        <div className="min-w-0">
          <Text as="h1" variant="display" className="text-balance">
            {title}
          </Text>
          {description ? (
            <Text
              as="p"
              variant="meta"
              tone="muted"
              className="mt-0.5 text-pretty"
            >
              {description}
            </Text>
          ) : null}
        </div>
      </div>
      {rightItemCount > 0 ? (
        <div
          className={cn(
            "flex w-full min-w-0 flex-wrap items-center gap-3 sm:ml-auto sm:w-auto sm:justify-end",
            rightItemCount > 1 ? "justify-between" : "justify-end"
          )}
        >
          {meta}
          {status}
          {action}
        </div>
      ) : null}
    </header>
  )
}
