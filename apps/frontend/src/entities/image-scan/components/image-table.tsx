import { useQueryClient } from "@tanstack/react-query"
import { ChevronRight, RotateCw } from "lucide-react"
import { useEffect, useId, useRef } from "react"
import { useTranslation } from "react-i18next"

import { Text } from "@/components/shared/brand/typography"
import { ColumnHeader } from "@/components/shared/data-display/column-header"
import { RelativeTime } from "@/components/shared/data-display/relative-time"
import { StatusTag } from "@/components/shared/data-display/status-dot"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { SeverityCount } from "@/entities/image-scan/components/severity"
import { VulnerabilityTable } from "@/entities/image-scan/components/vulnerability-table"
import { useImageDetail } from "@/entities/image-scan/hooks/use-security"
import { isScanPending } from "@/entities/image-scan/model/images"
import { ImageRef, StackLink } from "@/entities/stack"
import type { ImageSummary, VulnerabilitySeverity } from "@/lib/api-types"
import { getErrorMessage, orpc } from "@/lib/orpc"
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
  const { t } = useTranslation()
  const scanned = image.scannedAt ? (
    <RelativeTime date={image.scannedAt} />
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
        os={detail.data.os}
        digest={detail.data.digest}
        scannedAt={detail.data.scannedAt}
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
  stack,
}: {
  image: ImageSummary
  open: boolean
  onToggle: () => void
  canScan: boolean
  scanning: boolean
  onScan: () => void
  stack?: string
}) {
  const { t } = useTranslation()
  const panelId = useId()
  // Sin un escaneo correcto no hay cifras que enseñar
  const hasData = !!image.scannedAt
  const stacks = image.stacks.filter((name) => name !== stack)
  // Abierta, la fila se queda pegada bajo la barra superior (h-14) mientras
  // se recorren sus vulnerabilidades, para saber siempre de qué imagen son
  const cell = (padding: string) =>
    cn(
      padding,
      open && "bg-muted border-rule rule-b",
      open && !stack && "sticky top-14 z-10"
    )

  return (
    <tbody className="border-t">
      <tr className={cn("align-top", !open && "hover:bg-muted/50")}>
        <th
          scope="row"
          className={cell("max-w-0 py-3.5 pr-4 pl-2 text-left font-normal")}
        >
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
              {stacks.length > 0 ? (
                <Text
                  variant="meta-sm"
                  tone="muted"
                  className="flex flex-wrap gap-x-2"
                >
                  {stack ? <span>{t("security.alsoIn")}</span> : null}
                  {stacks.map((name) => (
                    <StackLink key={name} name={name} />
                  ))}
                </Text>
              ) : null}
            </div>
          </div>
        </th>
        {SEVERITY_COLUMNS.map(({ key, severity }) => (
          <td key={key} className={cell("py-3.5 pr-4 text-right")}>
            {hasData ? (
              <SeverityCount severity={severity} value={image.counts[key]} />
            ) : null}
          </td>
        ))}
        <td className={cell("py-3.5 pr-4 text-right")}>
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
        <td className={cell("py-3.5 pr-2 whitespace-nowrap")}>
          <ScanStatus image={image} />
        </td>
        <td className={cell("py-2.5 pr-2 text-right")}>
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
          <td colSpan={COLUMN_COUNT} className="pt-3 pb-10">
            {/* Tarjeta propia: lo que va dentro es de esta imagen y su borde
                marca dónde acaba antes de la siguiente */}
            <section
              aria-label={image.image}
              className="bg-card text-card-foreground flex flex-col gap-4 rounded-lg border p-5 shadow-sm"
            >
              <ImageVulnerabilities image={image} />
            </section>
          </td>
        </tr>
      ) : null}
    </tbody>
  )
}

/**
 * Tabla de imágenes: referencia y stacks, una columna por severidad (CVEs
 * distintas), cuántas tienen fix, el estado del escaneo y reescanear. Cada
 * fila se despliega en el sitio con sus vulnerabilidades. Con `stack`, la
 * tabla va dentro de la ficha de ese stack: no lo repite en cada fila y no
 * fija la fila abierta, porque ahí la tabla tiene su propio scroll.
 */
export function ImageTable({
  images,
  open,
  onToggle,
  canScan,
  scanning,
  onScan,
  stack,
}: {
  images: ImageSummary[]
  open: Set<string>
  onToggle: (image: string) => void
  canScan: boolean
  /** Petición de escaneo en vuelo: `"all"`, una imagen o `null` */
  scanning: string | null
  onScan: (image: string) => void
  /** Stack en cuya ficha va la tabla */
  stack?: string
}) {
  const { t } = useTranslation()
  return (
    // Sin `overflow` en pantallas grandes: rompería la fila fija de la
    // imagen abierta (y ahí la tabla ya cabe)
    <div className={cn("overflow-x-auto", !stack && "lg:overflow-visible")}>
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
            stack={stack}
          />
        ))}
      </table>
    </div>
  )
}
