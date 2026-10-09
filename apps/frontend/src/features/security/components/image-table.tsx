import { useQueryClient } from "@tanstack/react-query"
import { ChevronRight, RotateCw } from "lucide-react"
import { useEffect, useId, useRef } from "react"
import { useTranslation } from "react-i18next"

import { Text } from "@/components/shared/brand/typography"
import { ColumnHeader } from "@/components/shared/data-display/column-header"
import { StatusTag } from "@/components/shared/data-display/status-dot"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { ImageRef, StackLink } from "@/entities/stack"
import { SeverityCount } from "@/features/security/components/severity"
import { VulnerabilityTable } from "@/features/security/components/vulnerability-table"
import { useImageDetail } from "@/features/security/hooks/use-security"
import { isScanPending } from "@/features/security/model/images"
import type { ImageSummary, VulnerabilitySeverity } from "@/lib/api-types"
import { getErrorMessage, orpc } from "@/lib/orpc"
import { relativeTime } from "@/lib/relative-time"
import { cn } from "@/lib/utils"

// Columnas de cifras, de más grave a menos (la desconocida queda en el detalle)
const SEVERITY_COLUMNS = [
  { key: "critical", severity: "CRITICAL" },
  { key: "high", severity: "HIGH" },
  { key: "medium", severity: "MEDIUM" },
  { key: "low", severity: "LOW" },
] as const satisfies readonly {
  key: keyof ImageSummary["counts"]
  severity: VulnerabilitySeverity
}[]

// Imagen + cifras + "con fix" + estado + acción
const COLUMN_COUNT = SEVERITY_COLUMNS.length + 4

/** Estado del escaneo: en curso, fallido (con el motivo) o cuándo se hizo. */
function ScanStatus({ image }: { image: ImageSummary }) {
  const { t, i18n } = useTranslation()
  const scannedAt = image.scannedAt ? new Date(image.scannedAt) : null
  const scanned = scannedAt ? (
    <Text
      as="time"
      variant="data"
      tone="muted"
      dateTime={image.scannedAt ?? undefined}
      title={new Intl.DateTimeFormat(i18n.language, {
        dateStyle: "full",
        timeStyle: "medium",
      }).format(scannedAt)}
    >
      {relativeTime(scannedAt, i18n.language)}
    </Text>
  ) : null

  switch (image.status) {
    case "queued":
      return (
        <StatusTag tone="muted" pulse>
          {t("security.status.queued")}
        </StatusTag>
      )
    case "scanning":
      return (
        <StatusTag tone="info" pulse>
          {t("security.status.scanning")}
        </StatusTag>
      )
    case "failed":
      return (
        <span className="flex flex-col gap-0.5">
          <StatusTag tone="danger" ink title={image.error ?? undefined}>
            {t(`security.failure.${image.errorKind ?? "other"}`)}
          </StatusTag>
          {scanned}
        </span>
      )
    case "done":
      return scanned
    default:
      return (
        <Text variant="label" tone="muted">
          {t("security.status.none")}
        </Text>
      )
  }
}

/** Vulnerabilidades de la fila abierta, pedidas al abrirla. */
function ImageVulnerabilities({ image }: { image: ImageSummary }) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const detail = useImageDetail(image.image, true)

  // Cuando termina un escaneo (cambia el último intento), recarga la tabla
  const attempt = useRef(image.attemptedAt)
  useEffect(() => {
    if (attempt.current === image.attemptedAt) return
    attempt.current = image.attemptedAt
    queryClient.invalidateQueries({
      queryKey: orpc.v0.security.get.key({ input: { image: image.image } }),
    })
  }, [image.attemptedAt, image.image, queryClient])

  if (!image.scannedAt) {
    return (
      <Text as="p" tone="muted" className="py-2">
        {image.status === "failed"
          ? (image.error ?? t("security.failure.other"))
          : image.status === "none"
            ? t("security.disabled")
            : t("security.vulns.notYet")}
      </Text>
    )
  }
  if (detail.isError) {
    return (
      <Text as="p" tone="destructive" className="py-2">
        {getErrorMessage(detail.error, t("security.vulns.error"))}
      </Text>
    )
  }
  if (!detail.data) {
    return (
      <div className="space-y-3 py-2">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-4 w-full" />
        ))}
      </div>
    )
  }
  return (
    <div className="flex flex-col gap-3">
      {image.status === "failed" && image.error ? (
        <Text
          as="p"
          variant="meta"
          tone="destructive"
          className="wrap-break-word"
        >
          {image.error}
        </Text>
      ) : null}
      {detail.data.os || detail.data.digest ? (
        <Text as="p" variant="data" tone="muted" className="break-all">
          {[detail.data.os, detail.data.digest].filter(Boolean).join(" · ")}
        </Text>
      ) : null}
      <VulnerabilityTable
        image={image.image}
        vulnerabilities={detail.data.vulnerabilities}
      />
    </div>
  )
}

function ImageRows({
  image,
  open,
  onToggle,
  canScan,
  scanning,
  onScan,
}: {
  image: ImageSummary
  open: boolean
  onToggle: () => void
  canScan: boolean
  scanning: boolean
  onScan: () => void
}) {
  const { t } = useTranslation()
  const panelId = useId()
  // Sin un escaneo correcto no hay cifras que enseñar
  const hasData = !!image.scannedAt

  return (
    <tbody className="border-t">
      <tr className={cn("align-top", open && "bg-muted/40")}>
        <th scope="row" className="max-w-0 py-3.5 pr-4 text-left font-normal">
          <div className="flex min-w-0 items-start gap-1.5">
            <button
              type="button"
              onClick={onToggle}
              aria-expanded={open}
              aria-controls={open ? panelId : undefined}
              aria-label={t(open ? "security.collapse" : "security.expand", {
                image: image.image,
              })}
              className="text-muted-foreground hover:text-foreground focus-visible:ring-ring -ml-1 flex size-5 shrink-0 cursor-pointer items-center justify-center outline-none focus-visible:ring-2"
            >
              <ChevronRight
                aria-hidden
                className={cn(
                  "size-4 transition-transform",
                  open && "rotate-90"
                )}
              />
            </button>
            <div className="flex min-w-0 flex-col gap-1">
              <button
                type="button"
                onClick={onToggle}
                tabIndex={-1}
                className="min-w-0 cursor-pointer text-left"
              >
                <ImageRef image={image.image} className="text-sm" />
              </button>
              <Text
                variant="meta-sm"
                tone="muted"
                className="flex flex-wrap gap-x-2"
              >
                {image.stacks.map((name) => (
                  <StackLink key={name} name={name} />
                ))}
              </Text>
            </div>
          </div>
        </th>
        {SEVERITY_COLUMNS.map(({ key, severity }) => (
          <td key={key} className="py-3.5 pr-4 text-right">
            {hasData ? (
              <SeverityCount severity={severity} value={image.counts[key]} />
            ) : null}
          </td>
        ))}
        <td className="py-3.5 pr-4 text-right">
          {hasData ? (
            <Text
              variant="data"
              tone={image.fixable > 0 ? "default" : "muted"}
              className="text-sm"
            >
              {image.fixable > 0 ? image.fixable : "—"}
            </Text>
          ) : null}
        </td>
        <td className="py-3.5 pr-2 whitespace-nowrap">
          <ScanStatus image={image} />
        </td>
        <td className="py-2.5 text-right">
          {canScan ? (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              icon={RotateCw}
              loading={scanning}
              disabled={isScanPending(image)}
              onClick={onScan}
              title={t("security.rescan")}
              aria-label={t("security.rescanImage", { image: image.image })}
              className="text-muted-foreground hover:text-foreground"
            />
          ) : null}
        </td>
      </tr>
      {open ? (
        <tr id={panelId}>
          <td colSpan={COLUMN_COUNT} className="pt-1 pb-8 pl-6">
            <ImageVulnerabilities image={image} />
          </td>
        </tr>
      ) : null}
    </tbody>
  )
}

/**
 * Tabla de imágenes: referencia y stacks, una columna por severidad (CVEs
 * distintas), cuántas tienen fix, el estado del escaneo y reescanear. Cada
 * fila se despliega en el sitio con sus vulnerabilidades.
 */
export function ImageTable({
  images,
  open,
  onToggle,
  canScan,
  scanning,
  onScan,
}: {
  images: ImageSummary[]
  open: Set<string>
  onToggle: (image: string) => void
  canScan: boolean
  /** Petición de escaneo en vuelo: `"all"`, una imagen o `null` */
  scanning: string | null
  onScan: (image: string) => void
}) {
  const { t } = useTranslation()
  return (
    <div className="border-rule overflow-x-auto rule-t">
      <table className="w-full min-w-208 border-collapse">
        <thead>
          <tr className="text-left">
            <ColumnHeader>{t("security.columns.image")}</ColumnHeader>
            {SEVERITY_COLUMNS.map(({ key }) => (
              <ColumnHeader key={key} className="w-20 text-right">
                {t(`security.columns.${key}`)}
              </ColumnHeader>
            ))}
            <ColumnHeader className="w-20 text-right">
              {t("security.columns.fixable")}
            </ColumnHeader>
            <ColumnHeader className="w-36">
              {t("security.columns.scanned")}
            </ColumnHeader>
            <ColumnHeader align="right" className="w-10">
              <span className="sr-only">{t("security.rescan")}</span>
            </ColumnHeader>
          </tr>
        </thead>
        {images.map((image) => (
          <ImageRows
            key={image.image}
            image={image}
            open={open.has(image.image)}
            onToggle={() => onToggle(image.image)}
            canScan={canScan}
            scanning={scanning === image.image}
            onScan={() => onScan(image.image)}
          />
        ))}
      </table>
    </div>
  )
}
