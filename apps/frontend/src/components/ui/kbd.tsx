import type * as React from "react"

import { cn } from "@/lib/utils"

/** Una tecla o atajo (`⌘K`, `esc`, `↵`) dibujado como una tecla pequeña. */
function Kbd({ className, ...props }: React.ComponentProps<"kbd">) {
  return (
    <kbd
      data-slot="kbd"
      className={cn(
        "bg-muted text-muted-foreground pointer-events-none inline-flex h-5 min-w-5 shrink-0 items-center justify-center border px-1.5 font-mono text-[0.6875rem] font-medium select-none",
        className
      )}
      {...props}
    />
  )
}

/** Teclas que se pulsan juntas o se listan seguidas (`↑ ↓`). */
function KbdGroup({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="kbd-group"
      className={cn("inline-flex items-center gap-1", className)}
      {...props}
    />
  )
}

export { Kbd, KbdGroup }
