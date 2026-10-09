import { z } from "zod"

import { SEVERITIES } from "#lib/trivy"

const severityCounts = z.object({
  critical: z.number().int(),
  high: z.number().int(),
  medium: z.number().int(),
  low: z.number().int(),
  unknown: z.number().int(),
})

const imageVulnerability = z.object({
  id: z.string(),
  severity: z.enum(SEVERITIES),
  pkg: z.string(),
  installed: z.string(),
  fixed: z.string().nullable(),
  title: z.string().nullable(),
  url: z.string().nullable(),
  // Dónde lo encontró Trivy: el sistema operativo o un fichero de dependencias
  target: z.string(),
})

const imageSummary = z.object({
  image: z.string(),
  stacks: z.array(z.string()),
  // `none`: sin escanear y con el escaneo desactivado
  status: z.enum(["none", "queued", "scanning", "done", "failed"]),
  // Último escaneo correcto; los conteos son de ese escaneo
  scannedAt: z.string().nullable(),
  // Último intento, haya ido bien o mal
  attemptedAt: z.string().nullable(),
  counts: severityCounts,
  fixable: z.number().int(),
  os: z.string().nullable(),
  error: z.string().nullable(),
  errorKind: z
    .enum(["unauthorized", "not-found", "unavailable", "other"])
    .nullable(),
})

export type ImageSummary = z.infer<typeof imageSummary>

export const securityOutput = {
  list: z.object({
    enabled: z.boolean(),
    images: z.array(imageSummary),
  }),
  get: imageSummary.extend({
    digest: z.string().nullable(),
    vulnerabilities: z.array(imageVulnerability),
  }),
  scan: z.object({ queued: z.array(z.string()) }),
}
