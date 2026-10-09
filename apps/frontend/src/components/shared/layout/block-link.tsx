import { ArrowRight } from "lucide-react"

import { textVariants } from "@/components/shared/brand/typography"
import { cn } from "@/lib/utils"

/** Enlace de la cabecera de un bloque a su página ("Ver stacks →"). */
export function BlockLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      className={cn(
        textVariants({ role: "label", tone: "muted" }),
        "hover:text-foreground inline-flex items-center gap-1.5"
      )}
    >
      {label}
      <ArrowRight aria-hidden className="size-3.5" />
    </a>
  )
}
