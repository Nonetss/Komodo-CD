import { sql } from "drizzle-orm"
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core"

export type ImageScanStatus = "queued" | "scanning" | "done" | "failed"

export type ImageScanErrorKind =
  | "unauthorized"
  | "not-found"
  | "unavailable"
  | "other"

export type VulnerabilitySeverity =
  | "CRITICAL"
  | "HIGH"
  | "MEDIUM"
  | "LOW"
  | "UNKNOWN"

/** Una vulnerabilidad del informe de Trivy, ya resumida. */
export type ImageVulnerability = {
  id: string
  severity: VulnerabilitySeverity
  pkg: string
  installed: string
  fixed: string | null
  title: string | null
  url: string | null
  target: string
}

/**
 * Último escaneo de Trivy de cada imagen, por la referencia tal cual la da
 * Komodo. Un escaneo fallido conserva el resultado anterior (conteos,
 * vulnerabilidades y `scannedAt`) y solo anota el error y `attemptedAt`.
 */
export const imageScanTable = sqliteTable(
  "image_scan",
  {
    image: text("image").primaryKey(),
    status: text("status").$type<ImageScanStatus>().notNull(),
    digest: text("digest"),
    os: text("os"),
    critical: integer("critical").notNull().default(0),
    high: integer("high").notNull().default(0),
    medium: integer("medium").notNull().default(0),
    low: integer("low").notNull().default(0),
    unknown: integer("unknown").notNull().default(0),
    fixable: integer("fixable").notNull().default(0),
    vulnerabilities: text("vulnerabilities", { mode: "json" })
      .$type<ImageVulnerability[]>()
      .notNull()
      .default(sql`'[]'`),
    error: text("error"),
    errorKind: text("error_kind").$type<ImageScanErrorKind>(),
    requestedAt: integer("requested_at", { mode: "timestamp" }),
    scannedAt: integer("scanned_at", { mode: "timestamp" }),
    attemptedAt: integer("attempted_at", { mode: "timestamp" }),
  },
  (table) => [index("image_scan_status_idx").on(table.status)]
)

export type ImageScan = typeof imageScanTable.$inferSelect
export type NewImageScan = typeof imageScanTable.$inferInsert
