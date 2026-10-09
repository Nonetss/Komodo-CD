import type * as React from "react"

import { cn } from "@/lib/utils"

/** Campo subrayado: solo el trazo inferior, que pasa al acento con el foco. */
function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "border-rule placeholder:text-muted-foreground flex h-10 w-full min-w-0 border-0 border-b-[1.5px] bg-transparent px-0 py-1 text-base transition-colors outline-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "focus-visible:border-signal",
        "aria-invalid:border-destructive",
        className
      )}
      {...props}
    />
  )
}

export { Input }
