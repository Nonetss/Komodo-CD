import type { ComponentProps } from "react"

import { stackHref } from "@/entities/stack/model/stack-href"
import { cn } from "@/lib/utils"

/**
 * Nombre de un stack como enlace a su ficha: se tiñe de Signal y se subraya
 * al pasar el ratón. El tamaño y el peso los pone quien lo envuelve.
 */
export function StackLink({
  name,
  className,
  ...props
}: { name: string } & Omit<ComponentProps<"a">, "href" | "children">) {
  return (
    <a
      {...props}
      href={stackHref(name)}
      className={cn(
        "hover:text-signal-ink underline-offset-4 hover:underline",
        className
      )}
    >
      {name}
    </a>
  )
}
