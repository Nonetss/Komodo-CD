import type { ImageSummary, ImageVulnerability } from "@/lib/api-types"

export type ImageFilter = "all" | "urgent" | "failed"

/** En cola o escaneándose: la lista se refresca sola mientras haya alguna. */
export const isScanPending = (image: ImageSummary) =>
  image.status === "queued" || image.status === "scanning"

/** Tiene vulnerabilidades críticas o altas. */
export const isUrgent = (image: ImageSummary) =>
  image.counts.critical + image.counts.high > 0

export function matchesImage(
  image: ImageSummary,
  { search, filter }: { search: string; filter: ImageFilter }
) {
  const text = search.trim().toLowerCase()
  if (text && !image.image.toLowerCase().includes(text)) return false
  if (filter === "urgent") return isUrgent(image)
  if (filter === "failed") return image.status === "failed"
  return true
}

export type VulnerabilityFilter = {
  severity: ImageVulnerability["severity"] | "all"
  fixableOnly: boolean
}

export const matchesVulnerability = (
  v: ImageVulnerability,
  { severity, fixableOnly }: VulnerabilityFilter
) =>
  (severity === "all" || v.severity === severity) && (!fixableOnly || !!v.fixed)
