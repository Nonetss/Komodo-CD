import type { ComponentProps, ReactNode } from "react"

import { Text } from "@/components/shared/brand/typography"
import { cn } from "@/lib/utils"

/**
 * Bloque con trazo fino y `bg-surface`: cabecera con título y descripción,
 * cuerpo y, opcionalmente, un pie con las acciones. Con `form`, cuerpo y pie
 * van dentro de un `<form>` con esas props, así el botón de enviar del pie
 * pertenece al formulario.
 */
export function Panel({
  title,
  description,
  headingLevel = "h2",
  footer,
  form,
  className,
  children,
}: {
  title: ReactNode
  description?: ReactNode
  headingLevel?: "h2" | "h3"
  footer?: ReactNode
  form?: ComponentProps<"form">
  className?: string
  children: ReactNode
}) {
  const body = (
    <>
      {children}
      {footer ? (
        <div className="flex flex-wrap justify-end gap-2 border-t px-5 py-4">
          {footer}
        </div>
      ) : null}
    </>
  )

  return (
    <section className={cn("bg-surface rounded-xl border", className)}>
      <header className="space-y-1.5 border-b px-5 py-4">
        <Text as={headingLevel} variant="headline">
          {title}
        </Text>
        {description ? (
          <Text as="p" variant="meta" tone="muted" className="text-pretty">
            {description}
          </Text>
        ) : null}
      </header>
      {form ? <form {...form}>{body}</form> : body}
    </section>
  )
}
