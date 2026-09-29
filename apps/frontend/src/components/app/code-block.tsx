import type { ReactNode } from "react"

import { cn } from "@/lib/utils"
import { CopyButton } from "./copy-button"

type CodeBlockProps = {
  code: string
  /** Etiqueta en la barra superior (p. ej. "curl · redeploy") */
  label?: ReactNode
  className?: string
}

export function CodeBlock({ code, label, className }: CodeBlockProps) {
  return (
    <div
      className={cn(
        "bg-muted/60 overflow-hidden rounded-lg border text-left",
        className
      )}
    >
      <div className="flex items-center justify-between gap-2 border-b py-1 pr-1 pl-3">
        <span className="text-muted-foreground truncate font-mono text-micro">
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
