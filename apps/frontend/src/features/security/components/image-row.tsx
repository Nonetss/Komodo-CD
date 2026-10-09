import { useQueryClient } from "@tanstack/react-query"
import { ChevronRight, RotateCw } from "lucide-react"
import { useEffect, useId, useRef } from "react"
import { useTranslation } from "react-i18next"

import { Text } from "@/components/shared/brand/typography"
import { StatusTag } from "@/components/shared/data-display/status-dot"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { ImageRef, StackLink } from "@/entities/stack"
import { SeverityCounts } from "@/features/security/components/severity"
import { VulnerabilityTable } from "@/features/security/components/vulnerability-table"
import { useImageDetail } from "@/features/security/hooks/use-security"
import type { ImageSummary } from "@/lib/api-types"
import { getErrorMessage, orpc } from "@/lib/orpc"
import { relativeTime } from "@/lib/relative-time"
import { cn } from "@/lib/utils"

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
      {t("security.status.scannedAgo", {
        when: relativeTime(scannedAt, i18n.language),
      })}
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
        <div className="flex flex-col items-end gap-1">
          <StatusTag tone="danger" ink title={image.error ?? undefined}>
            {t(`security.failure.${image.errorKind ?? "other"}`)}
          </StatusTag>
          {scanned}
        </div>
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
      <Text as="p" tone="muted" className="py-5">
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
      <Text as="p" tone="destructive" className="py-5">
        {getErrorMessage(detail.error, t("security.vulns.error"))}
      </Text>
    )
  }
  if (!detail.data) {
    return (
      <div className="space-y-3 py-4">
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
      <Text
        as="p"
        variant="label"
        tone="muted"
        className="flex flex-wrap gap-x-2"
      >
        {detail.data.os ? <span>{detail.data.os}</span> : null}
        {detail.data.digest ? (
          <span className="min-w-0 break-all normal-case tracking-normal">
            {detail.data.digest}
          </span>
        ) : null}
      </Text>
      <VulnerabilityTable vulnerabilities={detail.data.vulnerabilities} />
    </div>
  )
}

/**
 * Una imagen: referencia, stacks que la usan, recuento por severidad, estado
 * del escaneo y botón para reescanear. Se despliega en el sitio con sus
 * vulnerabilidades.
 */
export function ImageRow({
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
  const pending = image.status === "queued" || image.status === "scanning"

  return (
    <li className="flex flex-col border-b">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-x-4 gap-y-2 py-4 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center">
        <div className="flex min-w-0 items-start gap-2">
          <button
            type="button"
            onClick={onToggle}
            aria-expanded={open}
            aria-controls={open ? panelId : undefined}
            aria-label={t(open ? "security.collapse" : "security.expand", {
              image: image.image,
            })}
            className="text-muted-foreground hover:text-foreground focus-visible:ring-ring -ml-1 flex size-6 shrink-0 cursor-pointer items-center justify-center outline-none focus-visible:ring-2"
          >
            <ChevronRight
              aria-hidden
              className={cn("size-4 transition-transform", open && "rotate-90")}
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
              variant="label"
              tone="muted"
              className="flex flex-wrap gap-x-2"
            >
              {image.stacks.map((name) => (
                <StackLink key={name} name={name} />
              ))}
            </Text>
          </div>
        </div>

        <div className="col-start-1 pl-7 sm:col-start-auto sm:pl-0">
          {image.scannedAt ? (
            <SeverityCounts counts={image.counts} />
          ) : (
            <Text variant="label" tone="muted">
              —
            </Text>
          )}
        </div>

        <div className="col-start-2 row-start-1 flex items-center justify-end gap-3 sm:col-start-auto">
          <ScanStatus image={image} />
          {canScan ? (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              icon={RotateCw}
              loading={scanning}
              disabled={pending}
              onClick={onScan}
              title={t("security.rescan")}
              aria-label={t("security.rescanImage", { image: image.image })}
              className="text-muted-foreground hover:text-foreground"
            />
          ) : null}
        </div>
      </div>

      {open ? (
        <div id={panelId} className="pb-6 sm:pl-7">
          <ImageVulnerabilities image={image} />
        </div>
      ) : null}
    </li>
  )
}
