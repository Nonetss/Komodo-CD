import { Search, ShieldCheck, ShieldOff, X } from "lucide-react"
import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"

import { QueryErrorCard } from "@/components/shared/feedback/query-error-card"
import { StateCard } from "@/components/shared/feedback/state-card"
import { Segmented } from "@/components/shared/form/segmented"
import { PageHero } from "@/components/shared/layout/page-hero"
import { StatStrip } from "@/components/shared/layout/stat-strip"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { ImageRow } from "@/features/security/components/image-row"
import { useImages, useScan } from "@/features/security/hooks/use-security"
import {
  type ImageFilter,
  isScanPending,
  isUrgent,
  matchesImage,
} from "@/features/security/model/images"
import type { ImageSummary } from "@/lib/api-types"
import { withIsland } from "@/providers/island"

const EMPTY_IMAGES: ImageSummary[] = []

/**
 * Seguridad (`/security`): las imágenes de los stacks de Komodo escaneadas
 * con Trivy, de la más grave a la menos, cada una desplegable con sus
 * vulnerabilidades.
 */
const SecurityPageContent = () => {
  const { t } = useTranslation()
  const imagesQuery = useImages()
  const { scan, scanning } = useScan()
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState<ImageFilter>("all")
  const [open, setOpen] = useState<Set<string>>(() => new Set())

  const images = imagesQuery.data?.images ?? EMPTY_IMAGES
  const enabled = imagesQuery.data?.enabled ?? false

  const totals = useMemo(
    () => ({
      critical: images.reduce((n, i) => n + i.counts.critical, 0),
      high: images.reduce((n, i) => n + i.counts.high, 0),
      fixable: images.reduce((n, i) => n + i.fixable, 0),
      urgent: images.filter(isUrgent).length,
      failed: images.filter((i) => i.status === "failed").length,
    }),
    [images]
  )
  const shown = useMemo(
    () => images.filter((i) => matchesImage(i, { search, filter })),
    [images, search, filter]
  )

  const toggle = (image: string) =>
    setOpen((prev) => {
      const next = new Set(prev)
      if (!next.delete(image)) next.add(image)
      return next
    })

  const hero = (
    <PageHero
      title={t("security.title")}
      description={t("security.description")}
      meta={
        imagesQuery.isSuccess && images.length > 0 ? (
          <StatStrip
            items={[
              {
                label: t("security.counts.critical"),
                value: totals.critical,
                tone: totals.critical > 0 ? "signal" : "muted",
              },
              {
                label: t("security.counts.high"),
                value: totals.high,
                tone: totals.high > 0 ? "signal" : "muted",
              },
              { label: t("security.counts.fixable"), value: totals.fixable },
              {
                label: t("security.counts.failed"),
                value: totals.failed,
                tone: "muted",
              },
              {
                label: t("security.counts.images"),
                value: images.length,
                tone: "muted",
              },
            ]}
          />
        ) : null
      }
      action={
        enabled && images.length > 0 ? (
          <Button
            variant="outline"
            icon={ShieldCheck}
            loading={scanning === "all"}
            disabled={images.every(isScanPending)}
            onClick={() => scan()}
          >
            {t("security.scanAll")}
          </Button>
        ) : null
      }
    />
  )

  const configure = (
    <Button asChild>
      <a href="/credentials">{t("stacks.configure")}</a>
    </Button>
  )

  let content: React.ReactNode
  if (imagesQuery.isError) {
    content = (
      <QueryErrorCard
        query={imagesQuery}
        title={t("security.errorLoad")}
        actions={configure}
      />
    )
  } else if (!imagesQuery.isSuccess) {
    content = <ImagesSkeleton />
  } else if (images.length === 0) {
    content = (
      <StateCard
        icon={ShieldCheck}
        title={t("security.empty")}
        description={t("security.emptyDescription")}
      />
    )
  } else {
    content = (
      <div className="flex flex-col gap-6">
        {enabled ? null : (
          <StateCard
            icon={ShieldOff}
            title={t("security.disabled")}
            description={t("security.disabledDescription")}
            className="py-10"
          />
        )}

        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-3">
            <div className="relative w-full max-w-sm">
              <Search
                aria-hidden
                className="text-muted-foreground pointer-events-none absolute top-1/2 left-0 size-4 -translate-y-1/2"
              />
              <Input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Escape" && setSearch("")}
                placeholder={t("security.search")}
                aria-label={t("security.search")}
                className="pr-7 pl-6 [&::-webkit-search-cancel-button]:hidden"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  aria-label={t("security.clearSearch")}
                  className="text-muted-foreground hover:text-foreground focus-visible:ring-ring absolute top-1/2 right-0 flex size-6 -translate-y-1/2 cursor-pointer items-center justify-center outline-none focus-visible:ring-2"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>
            <Segmented
              value={filter}
              onChange={setFilter}
              aria-label={t("security.filter.label")}
              options={[
                { value: "all", label: t("security.filter.all") },
                {
                  value: "urgent",
                  label: t("security.filter.urgent"),
                  count: totals.urgent,
                  alert: true,
                },
                {
                  value: "failed",
                  label: t("security.filter.failed"),
                  count: totals.failed,
                },
              ]}
            />
          </div>

          {shown.length === 0 ? (
            <StateCard
              title={t("security.noMatch")}
              action={
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearch("")
                    setFilter("all")
                  }}
                >
                  {t("security.clearFilters")}
                </Button>
              }
            />
          ) : (
            <ul className="border-rule rule-t">
              {shown.map((image) => (
                <ImageRow
                  key={image.image}
                  image={image}
                  open={open.has(image.image)}
                  onToggle={() => toggle(image.image)}
                  canScan={enabled}
                  scanning={scanning === image.image}
                  onScan={() => scan(image.image)}
                />
              ))}
            </ul>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-10">
      {hero}
      {content}
    </div>
  )
}

function ImagesSkeleton() {
  return (
    <div className="divide-y border-y">
      {[0, 1, 2, 3].map((row) => (
        <div key={row} className="flex items-center justify-between py-5">
          <div className="space-y-2">
            <Skeleton className="h-4 w-72 max-w-full" />
            <Skeleton className="h-3 w-32" />
          </div>
          <Skeleton className="h-3 w-40" />
        </div>
      ))}
    </div>
  )
}

export const SecurityPage = withIsland(SecurityPageContent)
