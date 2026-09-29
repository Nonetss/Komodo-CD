import type { ReactNode } from "react"

import { Text } from "@/components/shared/brand/typography"
import { cn } from "@/lib/utils"

/** Etiqueta micro-caps de formularios y franjas de hechos. */
export function FieldLabel({
  htmlFor,
  children,
  className,
}: {
  htmlFor?: string
  children: ReactNode
  className?: string
}) {
  return (
    <Text
      as="label"
      variant="label"
      tone="muted"
      htmlFor={htmlFor}
      className={cn("block", className)}
    >
      {children}
    </Text>
  )
}

/** Campo: etiqueta micro-caps + control + pista o error opcionales. */
export function FormField({
  label,
  htmlFor,
  hint,
  error,
  errorId,
  children,
  className,
}: {
  label: ReactNode
  htmlFor?: string
  hint?: ReactNode
  error?: ReactNode
  errorId?: string
  children: ReactNode
  className?: string
}) {
  return (
    <div className={cn("min-w-0 space-y-2", className)}>
      <FieldLabel htmlFor={htmlFor}>{label}</FieldLabel>
      {children}
      {error ? (
        <p id={errorId} className="text-destructive text-xs">
          {error}
        </p>
      ) : hint ? (
        <Text as="p" variant="meta" tone="muted" className="text-pretty">
          {hint}
        </Text>
      ) : null}
    </div>
  )
}
