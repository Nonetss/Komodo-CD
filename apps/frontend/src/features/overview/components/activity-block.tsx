import { useMemo } from "react"
import { useTranslation } from "react-i18next"

import { Text, textVariants } from "@/components/shared/brand/typography"
import { BlockLink } from "@/components/shared/layout/block-link"
import { SectionHeader } from "@/components/shared/layout/section-header"
import { StatStrip } from "@/components/shared/layout/stat-strip"
import { ACTION_I18N } from "@/entities/deploy-action"
import { StackLink } from "@/entities/stack"
import { BarList } from "@/features/overview/components/bar-list"
import { DailyChart } from "@/features/overview/components/daily-chart"
import { ActivitySkeleton } from "@/features/overview/components/overview-skeletons"
import { ACTIVITY_DAYS } from "@/features/overview/hooks/use-activity"
import {
  bucketByDay,
  inWindow,
  summarize,
  topStacks,
} from "@/features/overview/model/activity"
import type { ActivityEvent } from "@/lib/api-types"
import { getErrorMessage } from "@/lib/orpc"
import { relativeTime } from "@/lib/relative-time"
import { cn } from "@/lib/utils"

// Filas de los rankings de stacks y de fallos
const TOP_SHOWN = 5

/**
 * 03 · Despliegues: cifras de los últimos 30 días (acciones, % de éxito, %
 * desde CI y la última), las acciones por día, los stacks más desplegados y
 * los últimos fallos.
 */
export function ActivityBlock({
  query,
}: {
  query: {
    data?: { events: ActivityEvent[]; truncated: boolean }
    error: unknown
    isError: boolean
    isSuccess: boolean
  }
}) {
  const { t, i18n } = useTranslation()
  const percent = new Intl.NumberFormat(i18n.language, {
    style: "percent",
    maximumFractionDigits: 0,
  })

  const view = useMemo(() => {
    if (!query.data) return null
    const events = inWindow(query.data.events, ACTIVITY_DAYS)
    return {
      buckets: bucketByDay(events, ACTIVITY_DAYS),
      summary: summarize(events),
      top: topStacks(events, TOP_SHOWN),
      failures: events.filter((e) => !e.success).slice(0, TOP_SHOWN),
    }
  }, [query.data])

  const actionLabel = (action: string) => {
    const key = ACTION_I18N[action as keyof typeof ACTION_I18N]
    return key ? t(`deploy.actions.${key}.label`) : action
  }

  let content: React.ReactNode
  if (query.isError) {
    content = (
      <Text as="p" tone="destructive">
        {getErrorMessage(query.error, t("overview.activity.errorLoad"))}
      </Text>
    )
  } else if (!view) {
    content = <ActivitySkeleton />
  } else if (view.summary.total === 0) {
    content = (
      <Text as="p" variant="meta" tone="muted">
        {t("overview.activity.empty")}
      </Text>
    )
  } else {
    const { summary } = view
    content = (
      <>
        <StatStrip
          items={[
            { label: t("overview.activity.total"), value: summary.total },
            {
              label: t("overview.activity.successRate"),
              value:
                summary.successRate === null
                  ? "—"
                  : percent.format(summary.successRate),
            },
            {
              label: t("overview.activity.failed"),
              value: summary.failed,
              tone: summary.failed > 0 ? "signal" : "muted",
            },
            {
              label: t("overview.activity.viaCi"),
              value:
                summary.ciShare === null
                  ? "—"
                  : percent.format(summary.ciShare),
              tone: "muted",
            },
            {
              label: t("overview.activity.last"),
              value: summary.lastAt
                ? relativeTime(summary.lastAt, i18n.language)
                : "—",
              tone: "muted",
              mono: true,
            },
          ]}
        />
        {query.data?.truncated ? (
          <Text as="p" variant="meta" tone="muted">
            {t("overview.activity.truncated")}
          </Text>
        ) : null}
        <DailyChart buckets={view.buckets} />
        <div className="grid gap-x-12 gap-y-6 md:grid-cols-2">
          <div className="flex min-w-0 flex-col gap-3">
            <Text as="h3" variant="caption">
              {t("overview.activity.topStacks")}
            </Text>
            <BarList
              items={view.top.map((s) => ({
                key: s.stack,
                label: <StackLink name={s.stack} />,
                value: s.count,
              }))}
            />
          </div>
          <div className="flex min-w-0 flex-col gap-2">
            <Text as="h3" variant="caption">
              {t("overview.activity.failures")}
            </Text>
            {view.failures.length === 0 ? (
              <Text as="p" variant="meta" tone="muted">
                {t("overview.activity.noFailures")}
              </Text>
            ) : (
              <ul className="divide-y border-y">
                {view.failures.map((e) => (
                  <li
                    key={`${e.createdAt}-${e.stack}-${e.action}`}
                    className="flex min-w-0 items-baseline gap-3 py-2"
                  >
                    <StackLink
                      name={e.stack}
                      className={cn(
                        textVariants({ role: "name" }),
                        "min-w-0 truncate"
                      )}
                    />
                    <Text variant="meta-sm" tone="muted" className="flex-1">
                      {actionLabel(e.action)}
                    </Text>
                    <Text
                      as="time"
                      variant="data"
                      tone="muted"
                      dateTime={e.createdAt}
                      className="shrink-0"
                    >
                      {relativeTime(new Date(e.createdAt), i18n.language)}
                    </Text>
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
      aria-labelledby="overview-activity"
      className="flex flex-col gap-6"
    >
      <SectionHeader
        number={3}
        id="overview-activity"
        title={t("overview.activity.title")}
        aside={t("overview.activity.aside", { count: ACTIVITY_DAYS })}
        action={
          <BlockLink href="/history" label={t("overview.activity.link")} />
        }
      />
      {content}
    </section>
  )
}
