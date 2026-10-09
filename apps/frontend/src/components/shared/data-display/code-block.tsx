import type { ReactNode } from "react"

import { highlightShell } from "@/components/shared/data-display/highlight-shell"
import { CopyButton } from "@/components/shared/form/copy-button"
import { cn } from "@/lib/utils"

type CodeBlockProps = {
  code: string
  /**
   * Etiqueta en la barra superior (p. ej. "POST /api/v0/deploy · redeploy").
   * Sin ella no hay barra y el botón de copiar va dentro del bloque
   */
  label?: ReactNode
  /** `shell` resalta comando, flags, URLs, cadenas y el cuerpo JSON */
  language?: "shell" | "text"
  className?: string
}

export function CodeBlock({
  code,
  label,
  language = "text",
  className,
}: CodeBlockProps) {
  const body = (
    <pre className="bg-code text-code-foreground overflow-x-auto px-5 py-4 font-mono text-xs leading-6">
      <code>{language === "shell" ? highlightShell(code) : code}</code>
    </pre>
  )
  if (!label) {
    return (
      <div className={cn("relative text-left", className)}>
        {body}
        <CopyButton
          value={code}
          withLabel
          size="sm"
          className="text-code-foreground/70 hover:bg-code-foreground/10 hover:text-code-foreground absolute top-2 right-2"
        />
      </div>
    )
  }
  // La barra va sobre el fondo de la página y el código en un bloque de
  // tinta, oscuro en los dos temas
  return (
    <div className={cn("text-left", className)}>
      <div className="border-rule flex min-h-9 items-center justify-between gap-2 rule-b">
        <span className="text-muted-foreground truncate font-mono text-xs">
          {label}
        </span>
        <CopyButton value={code} withLabel className="shrink-0" />
      </div>
      {body}
    </div>
  )
}
