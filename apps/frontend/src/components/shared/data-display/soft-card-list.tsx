import type { ComponentProps } from "react"

import { cn } from "@/lib/utils"

type DivProps = ComponentProps<"div"> & { as?: "div" }
type UlProps = ComponentProps<"ul"> & { as: "ul" }
type OlProps = ComponentProps<"ol"> & { as: "ol" }

/**
 * Contenedor de filas: un único bloque con trazo fino, `bg-card/40` y
 * `divide-y` entre hijos. Una lista por contenedor, nunca filas como tarjetas.
 */
export function SoftCardList(props: DivProps | UlProps | OlProps) {
  const { as = "div", className, ...rest } = props
  const classes = cn(
    "bg-card/40 divide-y overflow-hidden rounded-xl border",
    className
  )

  if (as === "ul") return <ul className={classes} {...(rest as UlProps)} />
  if (as === "ol") return <ol className={classes} {...(rest as OlProps)} />
  return <div className={classes} {...(rest as DivProps)} />
}
