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

/** Paquetes de una CVE que comparten versión instalada, corregida y origen. */
export type PackageGroup = {
  names: string[]
  installed: string
  fixed: string | null
  /** Fichero donde se encontró; `null` si es el sistema operativo de la imagen */
  target: string | null
}

/**
 * Junta los paquetes de una CVE que van en la misma versión: un paquete de
 * Debian suele traer diez binarios (`libmagickcore-6.q16-6`, `-dev`…) con la
 * misma "instalada → corregida", que se leen mejor en una sola línea.
 */
export function groupPackages(
  packages: AffectedPackage[],
  image: string
): PackageGroup[] {
  const groups = new Map<string, PackageGroup>()
  for (const p of packages) {
    // Trivy nombra el resultado del sistema "<imagen> (<distro>)"
    const target = p.target.startsWith(image) ? null : p.target
    const key = [p.installed, p.fixed ?? "", target ?? ""].join("\0")
    const group = groups.get(key)
    if (group) group.names.push(p.pkg)
    else
      groups.set(key, {
        names: [p.pkg],
        installed: p.installed,
        fixed: p.fixed,
        target,
      })
  }
  return [...groups.values()]
}
