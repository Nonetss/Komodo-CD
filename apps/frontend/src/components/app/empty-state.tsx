import type { LucideIcon } from "lucide-react"
import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

type EmptyStateProps = {
  icon: LucideIcon
  title: ReactNode
  description?: ReactNode
  action?: ReactNode
  tone?: "default" | "danger"
  className?: string
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  tone = "default",
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed px-6 py-12 text-center",
        className
      )}
    >
      <div
        className={cn(
          "flex size-10 items-center justify-center rounded-lg border",
          tone === "danger"
            ? "bg-danger/10 border-danger/20 text-danger"
            : "bg-muted text-muted-foreground"
        )}
      >
        <Icon className="size-5" />
      </div>
      <div className="max-w-sm space-y-1">
        <p className="text-heading">{title}</p>
        {description && (
          <p className="text-muted-foreground text-label text-pretty">
            {description}
          </p>
        )}
      </div>
      {action && <div className="pt-1">{action}</div>}
    </div>
  )
}
