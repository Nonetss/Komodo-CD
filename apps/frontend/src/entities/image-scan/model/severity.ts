import type { ImageSummary, VulnerabilitySeverity } from "@/lib/api-types"

/** De más grave a menos, como las ordena el backend. */
export const SEVERITIES: VulnerabilitySeverity[] = [
  "CRITICAL",
  "HIGH",
  "MEDIUM",
  "LOW",
  "UNKNOWN",
]

export type SeverityKey = keyof ImageSummary["counts"]

export const severityKey = (s: VulnerabilitySeverity) =>
  s.toLowerCase() as SeverityKey

/**
 * Tinta de cada severidad con los tonos del tema: crítica en peligro, alta en
 * el acento (lo que pide acción), media en aviso y el resto apagado.
 */
export const SEVERITY_INK: Record<VulnerabilitySeverity, string> = {
  CRITICAL: "text-danger",
  HIGH: "text-signal",
  MEDIUM: "text-warning",
  LOW: "text-muted-foreground",
  UNKNOWN: "text-muted-foreground",
}

/** Relleno de cada severidad para barras y marcas, con los mismos tonos. */
export const SEVERITY_FILL: Record<VulnerabilitySeverity, string> = {
  CRITICAL: "bg-danger",
  HIGH: "bg-signal",
  MEDIUM: "bg-warning",
  LOW: "bg-muted-foreground/50",
  UNKNOWN: "bg-muted-foreground/50",
}
