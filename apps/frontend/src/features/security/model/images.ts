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
  v: GroupedVulnerability,
  { severity, fixableOnly }: VulnerabilityFilter
) =>
  (severity === "all" || v.severity === severity) && (!fixableOnly || v.fixable)

/** Un paquete afectado por una vulnerabilidad. */
export type AffectedPackage = Pick<
  ImageVulnerability,
  "pkg" | "installed" | "fixed" | "target"
>

/** Una CVE con todos los paquetes de la imagen en los que aparece. */
export type GroupedVulnerability = Pick<
  ImageVulnerability,
  "id" | "severity" | "title" | "url"
> & {
  packages: AffectedPackage[]
  /** Algún paquete tiene versión corregida */
  fixable: boolean
}

/**
 * Agrupa por CVE: Trivy da una entrada por paquete, así que la misma CVE en
 * `python3.9` y `libpython3.9-stdlib` sale dos veces. Conserva el orden (de
 * más grave a menos) de la primera aparición.
 */
export function groupVulnerabilities(
  vulnerabilities: ImageVulnerability[]
): GroupedVulnerability[] {
  const byId = new Map<string, GroupedVulnerability>()
  for (const v of vulnerabilities) {
    const pkg = {
      pkg: v.pkg,
      installed: v.installed,
      fixed: v.fixed,
      target: v.target,
    }
    const group = byId.get(v.id)
    if (group) {
      group.packages.push(pkg)
      group.fixable ||= !!v.fixed
    } else {
      byId.set(v.id, {
        id: v.id,
        severity: v.severity,
        title: v.title,
        url: v.url,
        packages: [pkg],
        fixable: !!v.fixed,
      })
    }
  }
  return [...byId.values()]
}
