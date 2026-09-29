import type { ReactNode } from "react"

import { highlightShell } from "@/components/shared/data-display/highlight-shell"
import { CopyButton } from "@/components/shared/form/copy-button"
import { cn } from "@/lib/utils"

type CodeBlockProps = {
  code: string
  /** Etiqueta en la barra superior (p. ej. "POST /api/v0/deploy · redeploy") */
  label?: ReactNode
  /** Sustituye a la etiqueta: controles propios en la barra (p. ej. pestañas) */
  header?: ReactNode
  /** `shell` resalta comando, flags, URLs, cadenas y el cuerpo JSON */
  language?: "shell" | "text"
  className?: string
}

export function CodeBlock({
  code,
  label,
  header,
  language = "text",
  className,
}: CodeBlockProps) {
  return (
    <div
      className={cn(
        "bg-card overflow-hidden rounded-xl border text-left",
        className
      )}
    >
      <div
        className={cn(
          "bg-muted/40 flex min-h-9 items-center justify-between gap-2 border-b pr-1",
          header ? "pl-1" : "pl-3"
        )}
      >
        {header ?? (
          <span className="text-muted-foreground truncate font-mono text-xs tracking-tight">
            {label}
          </span>
        )}
        <CopyButton value={code} withLabel className="shrink-0" />
      </div>
      <pre className="overflow-x-auto px-4 py-3.5 font-mono text-xs leading-6">
        <code>{language === "shell" ? highlightShell(code) : code}</code>
      </pre>
    </div>
  )
}
