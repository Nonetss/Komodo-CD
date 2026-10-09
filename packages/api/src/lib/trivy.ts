import type {
  ImageScanErrorKind,
  ImageVulnerability,
  VulnerabilitySeverity,
} from "@komodo-cd/db/schema"
import { env } from "@komodo-cd/env/server"
import { z } from "zod"

// Trivy corta a los 10 minutos; si aun así no termina, se mata el proceso
const TRIVY_TIMEOUT = "10m"
const KILL_AFTER_MS = 11 * 60 * 1000
const MAX_ERROR_LENGTH = 500

export const SEVERITIES = [
  "CRITICAL",
  "HIGH",
  "MEDIUM",
  "LOW",
  "UNKNOWN",
] as const satisfies readonly VulnerabilitySeverity[]

/** Un escaneo que no terminó, con el motivo ya clasificado. */
export class TrivyScanError extends Error {
  constructor(
    readonly kind: ImageScanErrorKind,
    message: string
  ) {
    super(message)
    this.name = "TrivyScanError"
  }
}

/**
 * Motivo de un fallo a partir de la salida de error de Trivy. El registry
 * responde DENIED también para repos que no existen o no se ven, así que
 * "sin acceso" se comprueba antes que "no encontrado".
 */
export function classifyTrivyError(stderr: string): ImageScanErrorKind {
  if (/UNAUTHORIZED|DENIED|authentication required/i.test(stderr)) {
    return "unauthorized"
  }
  if (/MANIFEST_UNKNOWN|NAME_UNKNOWN|manifest unknown/i.test(stderr)) {
    return "not-found"
  }
  // twirp es el protocolo con el servidor de Trivy; ENOENT, el binario
  if (/twirp|ENOENT|executable (file )?not found/i.test(stderr)) {
    return "unavailable"
  }
  return "other"
}

/**
 * Última línea con contenido de la salida de error, sin el prefijo de log de
 * Trivy (`<fecha>\tFATAL\tFatal error\t`) ni la viñeta `* ` de sus listas.
 */
export function trivyErrorMessage(stderr: string): string {
  const line =
    stderr
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)
      .at(-1) ?? "Trivy terminó sin dar motivo"
  const message = line
    .replace(/^\S+\t(FATAL|ERROR)\t(Fatal error\t)?/, "")
    .replace(/^\*\s+/, "")
  return message.slice(0, MAX_ERROR_LENGTH)
}

// Solo la parte del informe JSON de Trivy que se usa; el resto pasa sin validar
const trivyVulnerability = z.looseObject({
  VulnerabilityID: z.string(),
  PkgName: z.string(),
  InstalledVersion: z.string().nullish(),
  FixedVersion: z.string().nullish(),
  Severity: z.string().nullish(),
  Title: z.string().nullish(),
  PrimaryURL: z.string().nullish(),
})

const trivyReport = z.looseObject({
  Metadata: z
    .looseObject({
      OS: z
        .looseObject({ Family: z.string(), Name: z.string().nullish() })
        .nullish(),
      RepoDigests: z.array(z.string()).nullish(),
    })
    .nullish(),
  Results: z
    .array(
      z.looseObject({
        Target: z.string(),
        Vulnerabilities: z.array(trivyVulnerability).nullish(),
      })
    )
    .nullish(),
})

export type ScanResult = {
  os: string | null
  digest: string | null
  counts: Record<Lowercase<VulnerabilitySeverity>, number>
  fixable: number
  vulnerabilities: ImageVulnerability[]
}

const toSeverity = (value: string | null | undefined): VulnerabilitySeverity =>
  SEVERITIES.find((s) => s === value?.toUpperCase()) ?? "UNKNOWN"

const severityRank = (s: VulnerabilitySeverity) => SEVERITIES.indexOf(s)

/** Resume el informe JSON de `trivy image --format json`. */
export function parseTrivyReport(raw: string): ScanResult {
  const report = trivyReport.parse(JSON.parse(raw))
  const os = report.Metadata?.OS
  const digest = report.Metadata?.RepoDigests?.[0] ?? null

  const seen = new Set<string>()
  const vulnerabilities: ImageVulnerability[] = []
  for (const result of report.Results ?? []) {
    for (const v of result.Vulnerabilities ?? []) {
      const installed = v.InstalledVersion ?? ""
      const key = [v.VulnerabilityID, v.PkgName, installed, result.Target]
      const id = key.join("\0")
      if (seen.has(id)) continue
      seen.add(id)
      vulnerabilities.push({
        id: v.VulnerabilityID,
        severity: toSeverity(v.Severity),
        pkg: v.PkgName,
        installed,
        fixed: v.FixedVersion || null,
        title: v.Title || null,
        url: v.PrimaryURL || null,
        target: result.Target,
      })
    }
  }
  vulnerabilities.sort(
    (a, b) =>
      severityRank(a.severity) - severityRank(b.severity) ||
      a.id.localeCompare(b.id) ||
      a.pkg.localeCompare(b.pkg)
  )

  // Se cuentan CVEs distintas, no pares paquete × CVE: la misma CVE en
  // `python3.9` y `libpython3.9-stdlib` es un único problema que arreglar.
  // Al ir ordenadas, la primera aparición de cada id es la más grave.
  const counts = { critical: 0, high: 0, medium: 0, low: 0, unknown: 0 }
  const counted = new Set<string>()
  const fixable = new Set<string>()
  for (const v of vulnerabilities) {
    if (v.fixed) fixable.add(v.id)
    if (counted.has(v.id)) continue
    counted.add(v.id)
    counts[v.severity.toLowerCase() as keyof typeof counts]++
  }

  return {
    os: os ? [os.Family, os.Name].filter(Boolean).join(" ") : null,
    digest,
    counts,
    fixable: fixable.size,
    vulnerabilities,
  }
}

class TrivyService {
  /** El escaneo solo está activo con un servidor de Trivy configurado. */
  isEnabled() {
    return !!env.TRIVY_SERVER_URL
  }

  /**
   * Escanea `image` con el cliente de Trivy contra el servidor y devuelve el
   * informe JSON tal cual. La imagen se lee del registry (`remote`), sin
   * Docker, y el cliente no escribe caché en disco. Lanza `TrivyScanError`.
   */
  async run(image: string, { signal }: { signal?: AbortSignal } = {}) {
    const server = env.TRIVY_SERVER_URL
    if (!server) {
      throw new TrivyScanError("unavailable", "Trivy no está configurado")
    }

    let proc: Bun.Subprocess<"ignore", "pipe", "pipe">
    try {
      proc = Bun.spawn({
        cmd: [
          "trivy",
          "image",
          "--server",
          server,
          "--format",
          "json",
          "--quiet",
          "--scanners",
          "vuln",
          "--image-src",
          "remote",
          "--cache-backend",
          "memory",
          "--timeout",
          TRIVY_TIMEOUT,
          image,
        ],
        stdin: "ignore",
        stdout: "pipe",
        stderr: "pipe",
        signal: signal
          ? AbortSignal.any([signal, AbortSignal.timeout(KILL_AFTER_MS)])
          : AbortSignal.timeout(KILL_AFTER_MS),
      })
    } catch (err) {
      // Sin binario `trivy` en el PATH, Bun.spawn lanza ENOENT
      const message = err instanceof Error ? err.message : String(err)
      throw new TrivyScanError(classifyTrivyError(message), message)
    }

    const [stdout, stderr, exitCode] = await Promise.all([
      new Response(proc.stdout).text(),
      new Response(proc.stderr).text(),
      proc.exited,
    ])

    if (signal?.aborted) {
      throw new TrivyScanError("other", "Escaneo cancelado")
    }
    if (exitCode !== 0) {
      if (proc.signalCode) {
        throw new TrivyScanError(
          "other",
          "Trivy no terminó a tiempo y se ha cortado"
        )
      }
      throw new TrivyScanError(
        classifyTrivyError(stderr),
        trivyErrorMessage(stderr)
      )
    }
    return stdout
  }
}

export const trivyService = new TrivyService()
