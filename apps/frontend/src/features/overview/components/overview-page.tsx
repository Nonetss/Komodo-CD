import { Layers } from "lucide-react"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"

import { QueryErrorCard } from "@/components/shared/feedback/query-error-card"
import { StateCard } from "@/components/shared/feedback/state-card"
import { RefreshButton } from "@/components/shared/form/refresh-button"
import { PageHero } from "@/components/shared/layout/page-hero"
import { StatStrip } from "@/components/shared/layout/stat-strip"
import { Button } from "@/components/ui/button"
import { useImages } from "@/entities/image-scan"
import {
  hasProblem,
  hasUpdate,
  inGroup,
  isRunning,
  useStacks,
} from "@/entities/stack"
import { ActivityBlock } from "@/features/overview/components/activity-block"
import { CompactSection } from "@/features/overview/components/compact-section"
import {
  ActivitySkeleton,
  BlockRowsSkeleton,
  HeaderSkeleton,
  StripSkeleton,
} from "@/features/overview/components/overview-skeletons"
import { SecurityBlock } from "@/features/overview/components/security-block"
import { StacksBlock } from "@/features/overview/components/stacks-block"
import {
  ACTIVITY_DAYS,
  useActivity,
} from "@/features/overview/hooks/use-activity"
import { inWindow, summarize } from "@/features/overview/model/activity"
import type { Stack } from "@/lib/api-types"
import { withIsland } from "@/providers/island"

const EMPTY_STACKS: Stack[] = []

// En dos columnas, los bloques de stacks y seguridad comparten sus cuatro
// filas (subgrid): cabecera, barra, cifras y listas quedan a la misma altura
// y los dos bloques miden lo mismo
const BLOCKS_GRID = "grid gap-x-12 gap-y-14 xl:grid-cols-2 xl:gap-y-6"
const BLOCK_ROWS =
  "flex flex-col gap-6 xl:row-span-4 xl:grid xl:grid-rows-subgrid"

/**
 * Resumen (`/`): las cifras de la instancia en tres bloques numerados
 * (stacks, seguridad y despliegues de los últimos 30 días) y, debajo, los
 * stacks en marcha y los parados.
 */
const OverviewPageContent = () => {
  const { t, i18n } = useTranslation()
  const stacksQuery = useStacks()
  const imagesQuery = useImages()
  const activityQuery = useActivity()
  const stacks = stacksQuery.data ?? EMPTY_STACKS

  const sorted = useMemo(
    () => [...stacks].sort((a, b) => a.name.localeCompare(b.name)),
    [stacks]
  )
  const attention = stacks.filter(hasProblem).length
  const updates = stacks.filter((s) => !hasProblem(s) && hasUpdate(s)).length
  const criticalImages = imagesQuery.data?.images.filter(
    (i) => i.counts.critical > 0
  ).length
  const successRate = activityQuery.data
    ? summarize(inWindow(activityQuery.data.events, ACTIVITY_DAYS)).successRate
    : null
  const percent = new Intl.NumberFormat(i18n.language, {
    style: "percent",
    maximumFractionDigits: 0,
  })

  // Un solo botón refresca las tres fuentes del resumen
  const queries = [stacksQuery, imagesQuery, activityQuery]
  const refresh = {
    isFetching: queries.some((q) => q.isFetching),
    refetch: () => Promise.all(queries.map((q) => q.refetch())),
  }

  const hero = (
    <PageHero
      title={t("overview.title")}
      description={t("overview.description")}
      meta={
        stacksQuery.isSuccess && stacks.length > 0 ? (
          <StatStrip
            items={[
              {
                label: t("overview.counts.attention"),
                value: attention,
                tone: attention > 0 ? "signal" : "muted",
              },
              {
                label: t("overview.counts.updates"),
                value: updates,
                tone: updates > 0 ? "default" : "muted",
              },
              {
                label: t("overview.counts.critical"),
                value: criticalImages ?? "—",
                tone: criticalImages ? "signal" : "muted",
              },
              {
                label: t("overview.counts.successRate", {
                  count: ACTIVITY_DAYS,
                }),
                value: successRate === null ? "—" : percent.format(successRate),
                tone: "muted",
              },
            ]}
          />
        ) : stacksQuery.isPending ? (
          <StripSkeleton cells={4} />
        ) : null
      }
      action={<RefreshButton query={refresh} label={t("overview.refresh")} />}
    />
  )

  const configure = (
    <Button asChild>
      <a href="/credentials">{t("stacks.configure")}</a>
    </Button>
  )

  let content: React.ReactNode
  if (stacksQuery.isError) {
    content = (
      <QueryErrorCard
        query={stacksQuery}
        title={t("stacks.errorLoad")}
        actions={configure}
      />
    )
  } else if (!stacksQuery.isSuccess) {
    content = <OverviewSkeleton />
  } else if (stacks.length === 0) {
    content = (
      <StateCard
        icon={Layers}
        title={t("stacks.empty")}
        description={t("stacks.emptyDescription")}
        action={configure}
      />
    )
  } else {
    content = (
      <>
        <div className={BLOCKS_GRID}>
          <StacksBlock stacks={sorted} className={BLOCK_ROWS} />
          <SecurityBlock className={BLOCK_ROWS} />
        </div>
        <ActivityBlock query={activityQuery} />
        <div className="flex flex-wrap gap-x-12 gap-y-14">
          <CompactSection
            number={4}
            id="overview-running"
            title={t("overview.running.title")}
            stacks={sorted.filter(isRunning)}
            className="flex-3 basis-lg"
          />
          <CompactSection
            number={5}
            id="overview-stopped"
            title={t("overview.stopped.title")}
            stacks={sorted.filter((s) => inGroup(s, "stopped"))}
            className="flex-1 basis-64"
          />
        </div>
      </>
    )
  }

  return (
    <div className="flex flex-col gap-14">
      {hero}
      {content}
    </div>
  )
}

/** La página mientras llegan los stacks, con la forma de los bloques. */
function OverviewSkeleton() {
  return (
    <>
      <div className={BLOCKS_GRID}>
        {[3, 4].map((cells) => (
          <div key={cells} className={BLOCK_ROWS}>
            <HeaderSkeleton />
            <BlockRowsSkeleton cells={cells} />
          </div>
        ))}
      </div>
      <div className="flex flex-col gap-6">
        <HeaderSkeleton />
        <ActivitySkeleton />
      </div>
    </>
  )
}

export const OverviewPage = withIsland(OverviewPageContent)
