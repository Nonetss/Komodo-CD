import type { TFunction } from "i18next"

import {
  type GroupedVulnerability,
  groupPackages,
} from "@/features/security/model/images"
import { SEVERITIES, severityKey } from "@/features/security/model/severity"

// Un `|` dentro de una celda rompería la tabla Markdown
const cell = (text: string) => text.replace(/\|/g, "\\|").replace(/\n/g, " ")

type ReportKey =
  | "title"
  | "os"
  | "digest"
  | "scanned"
  | "filter"
  | "total"
  | "id"
  | "severity"
  | "packages"
  | "installed"
  | "fixed"
  | "description"
  | "noFix"

/**
 * Informe en Markdown de las vulnerabilidades de una imagen, listo para pegar
 * en una incidencia o un chat: cabecera con la imagen, el sistema, el digest,
 * la fecha y el filtro aplicado, los recuentos y una fila por CVE y versión.
 */
export function buildVulnerabilityReport({
  t,
  image,
  os,
  digest,
  scannedAt,
  filterLabel,
  vulnerabilities,
}: {
  t: TFunction
  image: string
  os: string | null
  digest: string | null
  scannedAt: string | null
  filterLabel: string
  vulnerabilities: GroupedVulnerability[]
}) {
  const r = (key: ReportKey) => t(`security.report.${key}`)
  const counts = SEVERITIES.map((s) => {
    const n = vulnerabilities.filter((v) => v.severity === s).length
    return n > 0 ? `${t(`security.severity.${severityKey(s)}`)}: ${n}` : null
  }).filter(Boolean)

  const lines = [
    `# ${r("title")}: ${image}`,
    "",
    ...(os ? [`- ${r("os")}: ${os}`] : []),
    ...(digest ? [`- ${r("digest")}: ${digest}`] : []),
    ...(scannedAt ? [`- ${r("scanned")}: ${scannedAt}`] : []),
    `- ${r("filter")}: ${filterLabel}`,
    `- ${r("total")}: ${vulnerabilities.length}${counts.length ? ` (${counts.join(", ")})` : ""}`,
    "",
    `| ${r("id")} | ${r("severity")} | ${r("packages")} | ${r("installed")} | ${r("fixed")} | ${r("description")} |`,
    "| --- | --- | --- | --- | --- | --- |",
  ]
  for (const v of vulnerabilities) {
    const id = v.url ? `[${v.id}](${v.url})` : v.id
    const severity = t(`security.severity.${severityKey(v.severity)}`)
    for (const group of groupPackages(v.packages, image)) {
      const packages = group.names.join(", ")
      lines.push(
        `| ${cell(id)} | ${severity} | ${cell(group.target ? `${packages} (${group.target})` : packages)} | ${cell(group.installed)} | ${cell(group.fixed ?? r("noFix"))} | ${cell(v.title ?? "")} |`
      )
    }
  }
  return `${lines.join("\n")}\n`
}
