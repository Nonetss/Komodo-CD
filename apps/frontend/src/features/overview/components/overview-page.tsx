import { Layers } from "lucide-react"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"

import { QueryErrorCard } from "@/components/shared/feedback/query-error-card"
import { StateCard } from "@/components/shared/feedback/state-card"
import { RefreshButton } from "@/components/shared/form/refresh-button"
import { PageHero } from "@/components/shared/layout/page-hero"
import { StatStrip } from "@/components/shared/layout/stat-strip"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useDeployRunner } from "@/entities/deploy-action"
import { isRunning, type Urgency, urgency, useStacks } from "@/entities/stack"
import { AttentionSection } from "@/features/overview/components/attention-section"
import { CompactSection } from "@/features/overview/components/compact-section"
import { UpdatesSection } from "@/features/overview/components/updates-section"
import type { Stack } from "@/lib/api-types"
import { withIsland } from "@/providers/island"

const EMPTY_STACKS: Stack[] = []

/**
 * Resumen (`/`): los stacks agrupados por urgencia en secciones numeradas.
 * Cada stack cae en una sola (ver `urgency`) y su nombre lleva a su ficha.
 */
const OverviewPageContent = () => {
  const { t } = useTranslation()
  const stacksQuery = useStacks()
  const runner = useDeployRunner()
  const stacks = stacksQuery.data ?? EMPTY_STACKS

  const sections = useMemo(() => {
    const bySection: Record<Urgency, Stack[]> = {
      attention: [],
      updates: [],
      running: [],
      stopped: [],
    }
    const sorted = [...stacks].sort((a, b) => a.name.localeCompare(b.name))
    for (const s of sorted) bySection[urgency(s)].push(s)
    return bySection
  }, [stacks])

  const runningCount = stacks.filter(isRunning).length

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
                value: sections.attention.length,
                tone: sections.attention.length > 0 ? "signal" : "muted",
              },
              {
                label: t("overview.counts.updates"),
                value: sections.updates.length,
              },
              { label: t("overview.counts.running"), value: runningCount },
              {
                label: t("overview.counts.total"),
                value: stacks.length,
                tone: "muted",
              },
            ]}
          />
        ) : null
      }
      action={
        <RefreshButton query={stacksQuery} label={t("overview.refresh")} />
      }
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
        <AttentionSection
          stacks={sections.attention}
          runningAction={runner.runningAction}
          onRedeploy={(name) => runner.run(name, "redeploy")}
        />
        <UpdatesSection
          stacks={sections.updates}
          runningAction={runner.runningAction}
          bulkAction={runner.bulkAction}
          onRun={(name, action) => runner.run(name, action)}
          onRunAll={() =>
            runner.runBulk(
              sections.updates.map((s) => s.name),
              "pull-redeploy"
            )
          }
        />
        <div className="flex flex-wrap gap-x-12 gap-y-14">
          <CompactSection
            number={3}
            id="overview-running"
            title={t("overview.running.title")}
            stacks={sections.running}
            className="flex-3 basis-lg"
          />
          <CompactSection
            number={4}
            id="overview-stopped"
            title={t("overview.stopped.title")}
            stacks={sections.stopped}
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

function OverviewSkeleton() {
  return (
    <>
      {[0, 1].map((section) => (
        <div key={section} className="flex flex-col">
          <div className="border-rule flex gap-5 rule-b pb-3">
            <Skeleton className="h-3 w-5" />
            <Skeleton className="h-6 w-56" />
          </div>
          <div className="divide-y border-b">
            {[0, 1].map((row) => (
              <div key={row} className="space-y-2 py-5">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-4 w-80 max-w-full" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </>
  )
}

export const OverviewPage = withIsland(OverviewPageContent)
