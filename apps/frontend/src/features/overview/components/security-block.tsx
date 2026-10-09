import { useTranslation } from "react-i18next"

import { Text } from "@/components/shared/brand/typography"
import { BlockLink } from "@/components/shared/layout/block-link"
import { SectionHeader } from "@/components/shared/layout/section-header"
import { StatStrip } from "@/components/shared/layout/stat-strip"
import { Skeleton } from "@/components/ui/skeleton"
import {
  isUrgent,
  SEVERITIES,
  SEVERITY_FILL,
  SeverityCount,
  severityKey,
  useImages,
} from "@/entities/image-scan"
import { ImageRef } from "@/entities/stack"
import { BarList } from "@/features/overview/components/bar-list"
import type { ImageSummary } from "@/lib/api-types"
import { getErrorMessage } from "@/lib/orpc"

// Imágenes en la lista de las más expuestas
const EXPOSED_SHOWN = 5

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
    .slice(0, EXPOSED_SHOWN)

/**
 * 02 · Seguridad: cuántas imágenes hay escaneadas y cuántas piden acción, las
 * CVEs por severidad (sumadas imagen a imagen) y las imágenes más expuestas.
 */
export function SecurityBlock() {
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
    content = (
      <div className="space-y-3">
        <Skeleton className="h-14 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    )
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
    const failed = images.filter((i) => i.status === "failed").length
    const exposed = mostExposed(images)

    content = (
      <>
        {enabled ? null : (
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
              value: failed,
              tone: "muted",
            },
          ]}
        />
        <div className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
          <div className="flex min-w-0 flex-col gap-3">
            <Text as="h3" variant="caption">
              {t("overview.security.bySeverity")}
            </Text>
            <BarList
              items={SEVERITIES.filter((s) => s !== "UNKNOWN").map((s) => ({
                key: s,
                label: t(`security.severity.${severityKey(s)}`),
                value: scanned.reduce(
                  (sum, i) => sum + i.counts[severityKey(s)],
                  0
                ),
                fill: SEVERITY_FILL[s],
              }))}
            />
          </div>
          <div className="flex min-w-0 flex-col gap-2">
            <Text as="h3" variant="caption">
              {t("overview.security.exposed")}
            </Text>
            {exposed.length === 0 ? (
              <Text as="p" variant="meta" tone="muted">
                {t("overview.security.noneExposed")}
              </Text>
            ) : (
              <ul className="divide-y border-y">
                {exposed.map((image) => (
                  <li
                    key={image.image}
                    className="flex min-w-0 items-center gap-3 py-2"
                  >
                    <ImageRef
                      image={image.image}
                      className="min-w-0 flex-1 text-sm"
                    />
                    <span
                      className="flex shrink-0 gap-2"
                      title={`${t("security.severity.critical")}: ${image.counts.critical} · ${t("security.severity.high")}: ${image.counts.high}`}
                    >
                      <SeverityCount
                        severity="CRITICAL"
                        value={image.counts.critical}
                      />
                      <SeverityCount
                        severity="HIGH"
                        value={image.counts.high}
                      />
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </>
    )
  }

  return (
    <section
      aria-labelledby="overview-security"
      className="flex flex-col gap-6"
    >
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
