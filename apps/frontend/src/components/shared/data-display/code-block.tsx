import type { ReactNode } from "react"

import { CopyButton } from "@/components/shared/form/copy-button"
import { cn } from "@/lib/utils"

type CodeBlockProps = {
  code: string
  /** Etiqueta en la barra superior (p. ej. "POST /api/v0/deploy · redeploy") */
  label?: ReactNode
  className?: string
}

export function CodeBlock({ code, label, className }: CodeBlockProps) {
  return (
    <div
      className={cn(
        "bg-card/40 overflow-hidden rounded-xl border text-left",
        className
      )}
    >
      <div className="flex items-center justify-between gap-2 border-b py-1 pr-1 pl-3">
        <span className="text-muted-foreground truncate font-mono text-xs tracking-tight">
          {label}
        </span>
        <CopyButton value={code} withLabel />
      </div>
      <pre className="overflow-x-auto p-3 font-mono text-xs leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  )
}
