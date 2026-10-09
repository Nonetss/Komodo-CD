import { useTranslation } from "react-i18next"

import { Text } from "@/components/shared/brand/typography"
import { BlockLink } from "@/components/shared/layout/block-link"
import { SectionHeader } from "@/components/shared/layout/section-header"
import { StatStrip } from "@/components/shared/layout/stat-strip"
import {
  isUrgent,
  SEVERITIES,
  SEVERITY_FILL,
  SeverityCount,
  severityKey,
  useImages,
} from "@/entities/image-scan"
import { ImageRef } from "@/entities/stack"
import { BlockRowsSkeleton } from "@/features/overview/components/overview-skeletons"
import { ShortList } from "@/features/overview/components/short-list"
import { StackedBar } from "@/features/overview/components/stacked-bar"
import type { ImageSummary } from "@/lib/api-types"
import { getErrorMessage } from "@/lib/orpc"

const EMPTY_IMAGES: ImageSummary[] = []

/** Las imágenes con críticas o altas, de la más grave a la menos. */
const mostExposed = (images: ImageSummary[]) =>
  images
    .filter(isUrgent)
    .sort(
      (a, b) =>
        b.counts.critical - a.counts.critical ||
        b.counts.high - a.counts.high ||
        a.image.localeCompare(b.image)
    )

/**
 * 02 · Seguridad: las CVEs por severidad (sumadas imagen a imagen), cuántas
 * imágenes hay escaneadas y cuántas piden acción, las más expuestas y las que
 * no se pudieron escanear. Sus cuatro hijos son las filas que comparte con el
 * bloque de stacks (ver `overview-page`).
 */
export function SecurityBlock({ className }: { className?: string }) {
  const { t } = useTranslation()
  const imagesQuery = useImages()
  const images = imagesQuery.data?.images ?? EMPTY_IMAGES
  const enabled = imagesQuery.data?.enabled ?? false

  let content: React.ReactNode
  if (imagesQuery.isError) {
    content = (
      <Text as="p" tone="destructive">
        {getErrorMessage(imagesQuery.error, t("security.errorLoad"))}
      </Text>
    )
  } else if (!imagesQuery.isSuccess) {
    content = <BlockRowsSkeleton cells={4} />
  } else if (images.length === 0) {
    content = (
      <Text as="p" variant="meta" tone="muted">
        {t("security.emptyDescription")}
      </Text>
    )
  } else {
    const scanned = images.filter((i) => i.scannedAt)
    const critical = images.filter((i) => i.counts.critical > 0).length
    const fixable = images.filter((i) => isUrgent(i) && i.fixable > 0).length
    const failed = images
      .filter((i) => i.status === "failed")
      .sort((a, b) => a.image.localeCompare(b.image))

    content = (
      <>
        {enabled ? (
          <StackedBar
            segments={SEVERITIES.filter((s) => s !== "UNKNOWN").map((s) => ({
              key: s,
              label: t(`security.severity.${severityKey(s)}`),
              value: scanned.reduce(
                (sum, i) => sum + i.counts[severityKey(s)],
                0
              ),
              fill: SEVERITY_FILL[s],
            }))}
          />
        ) : (
          <Text as="p" variant="meta" tone="muted">
            {t("security.disabledDescription")}
          </Text>
        )}
        <StatStrip
          items={[
            {
              label: t("overview.security.scanned"),
              value: `${scanned.length}/${images.length}`,
              tone: "muted",
            },
            {
              label: t("overview.security.critical"),
              value: critical,
              tone: critical > 0 ? "signal" : "muted",
            },
            { label: t("overview.security.fixable"), value: fixable },
            {
              label: t("overview.security.failed"),
              value: failed.length,
              tone: "muted",
            },
          ]}
        />
        <div className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
          <ShortList
            title={t("overview.security.exposed")}
            items={mostExposed(images)}
            empty={t("overview.security.noneExposed")}
            itemKey={(i) => i.image}
            renderItem={(image) => (
              <>
                <ImageRef image={image.image} nameOnly className="text-sm" />
                <span
                  className="flex shrink-0 gap-2"
                  title={`${t("security.severity.critical")}: ${image.counts.critical} · ${t("security.severity.high")}: ${image.counts.high}`}
                >
                  <SeverityCount
                    severity="CRITICAL"
                    value={image.counts.critical}
                  />
                  <SeverityCount severity="HIGH" value={image.counts.high} />
                </span>
              </>
            )}
          />
          <ShortList
            title={t("overview.security.failedTitle")}
            items={failed}
            empty={t("overview.security.noneFailed")}
            itemKey={(i) => i.image}
            renderItem={(image) => (
              <>
                <ImageRef image={image.image} nameOnly className="text-sm" />
                <Text
                  variant="status"
                  tone="destructive"
                  className="shrink-0"
                  title={image.error ?? undefined}
                >
                  {t(`security.failure.${image.errorKind ?? "other"}`)}
                </Text>
              </>
            )}
          />
        </div>
      </>
    )
  }

  return (
    <section aria-labelledby="overview-security" className={className}>
      <SectionHeader
        number={2}
        id="overview-security"
        title={t("overview.security.title")}
        aside={
          imagesQuery.isSuccess
            ? t("overview.security.imagesAside", { count: images.length })
            : null
        }
        action={
          <BlockLink href="/security" label={t("overview.security.link")} />
        }
      />
      {content}
    </section>
  )
}
