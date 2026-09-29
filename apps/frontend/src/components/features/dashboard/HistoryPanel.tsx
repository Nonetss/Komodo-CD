import { useMemo, useState } from "react"
import "@/lib/i18n"
import {
  Check,
  History as HistoryIcon,
  KeyRound,
  RefreshCw,
  ServerCrash,
  User,
  X,
} from "lucide-react"
import { useTranslation } from "react-i18next"

import { EmptyState } from "@/components/app/empty-state"
import { PageHeader } from "@/components/app/page-header"
import { Segmented } from "@/components/app/segmented"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import type { HistoryItem } from "@/lib/api-types"
import { ACTION_I18N } from "@/lib/deploy-curl"
import { getErrorMessage } from "@/lib/orpc"
import { cn } from "@/lib/utils"
import { withQueryProvider } from "@/providers/query-provider"
import { useHistory } from "./hooks/use-history"

type TimeGroup = "last-hour" | "today" | "last-week" | "older"
type Filter = "all" | "success" | "failed"

const GROUP_ORDER: TimeGroup[] = ["last-hour", "today", "last-week", "older"]

function getTimeGroup(date: Date): TimeGroup {
  const now = new Date()
  const diffHours = (now.getTime() - date.getTime()) / 3_600_000
  if (diffHours < 1) return "last-hour"
  if (date.toDateString() === now.toDateString()) return "today"
  if (diffHours < 24 * 7) return "last-week"
  return "older"
}

function relativeTime(date: Date, lang: string) {
  const rtf = new Intl.RelativeTimeFormat(lang, { numeric: "auto" })
  const seconds = Math.round((date.getTime() - Date.now()) / 1000)
  const abs = Math.abs(seconds)
  if (abs < 60) return rtf.format(seconds, "second")
  if (abs < 3600) return rtf.format(Math.round(seconds / 60), "minute")
  if (abs < 86400) return rtf.format(Math.round(seconds / 3600), "hour")
  if (abs < 86400 * 7) return rtf.format(Math.round(seconds / 86400), "day")
  return new Intl.DateTimeFormat(lang, { dateStyle: "medium" }).format(date)
}

const API_KEY_PREFIX = "API Key"

function Actor({ item }: { item: HistoryItem }) {
  const name = item.userName ?? item.userEmail ?? item.userId
  const viaKey = name.startsWith(API_KEY_PREFIX)
  const Icon = viaKey ? KeyRound : User
  const label = viaKey ? name.replace(/^API Key:?\s*/, "") || "API Key" : name
  return (
    <span className="inline-flex min-w-0 items-center gap-1">
      <Icon className="size-3 shrink-0" />
      <span className={cn("truncate", viaKey && "font-mono text-[11px]")}>
        {label}
      </span>
    </span>
  )
}

function HistoryEntry({ item, index }: { item: HistoryItem; index: number }) {
  const { t, i18n } = useTranslation()
  const date = new Date(item.createdAt)
  const actionKey = ACTION_I18N[item.action as keyof typeof ACTION_I18N]

  return (
    <li
      className="reveal relative flex gap-3.5 py-3 pr-1 pl-0 sm:gap-4"
      style={{ "--i": index } as React.CSSProperties}
    >
      <span
        className={cn(
          "relative z-10 mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border",
          item.success
            ? "bg-success/12 border-success/30 text-success"
            : "bg-danger/12 border-danger/30 text-danger"
        )}
      >
        {item.success ? (
          <Check className="size-3.5" strokeWidth={2.5} />
        ) : (
          <X className="size-3.5" strokeWidth={2.5} />
        )}
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="font-mono text-[13px] font-medium">
            {item.stack}
          </span>
          <Badge variant="outline">
            {actionKey ? t(`deploy.actions.${actionKey}.label`) : item.action}
          </Badge>
          <time
            dateTime={item.createdAt}
            title={new Intl.DateTimeFormat(i18n.language, {
              dateStyle: "full",
              timeStyle: "medium",
            }).format(date)}
            className="text-muted-foreground tabular ml-auto text-xs whitespace-nowrap"
          >
            {relativeTime(date, i18n.language)}
          </time>
        </div>
        {item.message && (
          <p
            className={cn(
              "mt-1 text-xs break-words",
              item.success ? "text-muted-foreground" : "text-danger/90"
            )}
          >
            {item.message}
          </p>
        )}
        <p className="text-muted-foreground mt-1 flex items-center gap-1 text-xs">
          <Actor item={item} />
        </p>
      </div>
    </li>
  )
}

const HistoryPanelContent = () => {
  const { t } = useTranslation()
  const historyQuery = useHistory()
  const history = historyQuery.data ?? []
  const refreshing = historyQuery.isFetching
  const [filter, setFilter] = useState<Filter>("all")

  const counts = useMemo(
    () => ({
      all: history.length,
      success: history.filter((h) => h.success).length,
      failed: history.filter((h) => !h.success).length,
    }),
    [history]
  )

  const groups = useMemo(() => {
    const items = history.filter((h) =>
      filter === "all" ? true : filter === "success" ? h.success : !h.success
    )
    const byGroup = new Map<TimeGroup, HistoryItem[]>()
    for (const item of items) {
      const g = getTimeGroup(new Date(item.createdAt))
      byGroup.set(g, [...(byGroup.get(g) ?? []), item])
    }
    return GROUP_ORDER.filter((g) => byGroup.has(g)).map((g) => ({
      group: g,
      items: byGroup.get(g) ?? [],
    }))
  }, [history, filter])

  const groupLabel: Record<TimeGroup, string> = {
    "last-hour": t("history.group.lastHour"),
    today: t("history.group.today"),
    "last-week": t("history.group.lastWeek"),
    older: t("history.group.older"),
  }

  let running = 0

  return (
    <div>
      <PageHeader
        title={t("history.title")}
        description={t("history.description")}
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => historyQuery.refetch()}
            disabled={refreshing}
            aria-label={t("history.refresh")}
          >
            <RefreshCw className={cn(refreshing && "animate-spin")} />
            <span className="hidden sm:inline">{t("common.refresh")}</span>
          </Button>
        }
      />

      {historyQuery.isError ? (
        <EmptyState
          tone="danger"
          icon={ServerCrash}
          title={t("history.error")}
          description={getErrorMessage(historyQuery.error, "")}
          action={
            <Button
              size="sm"
              variant="outline"
              onClick={() => historyQuery.refetch()}
            >
              {t("common.retry")}
            </Button>
          }
        />
      ) : historyQuery.isLoading ? (
        <div className="space-y-4">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="flex gap-4">
              <Skeleton className="size-6 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-2/3" />
              </div>
            </div>
          ))}
        </div>
      ) : history.length === 0 ? (
        <EmptyState
          icon={HistoryIcon}
          title={t("history.empty")}
          description={t("history.emptyDescription")}
        />
      ) : (
        <div className="max-w-3xl space-y-6">
          <Segmented
            value={filter}
            onChange={setFilter}
            aria-label={t("history.title")}
            options={[
              {
                value: "all",
                label: `${t("history.filter.all")} · ${counts.all}`,
              },
              {
                value: "success",
                label: `${t("history.filter.success")} · ${counts.success}`,
              },
              {
                value: "failed",
                label: `${t("history.filter.failed")} · ${counts.failed}`,
              },
            ]}
          />

          {groups.length === 0 && (
            <p className="text-muted-foreground py-8 text-center text-sm">
              {t("history.empty")}
            </p>
          )}

          {groups.map(({ group, items }) => (
            <section key={group}>
              <h2 className="label-mono mb-1 font-mono">{groupLabel[group]}</h2>
              <ol className="relative before:bg-border before:absolute before:top-4 before:bottom-4 before:left-3 before:w-px">
                {items.map((item) => (
                  <HistoryEntry key={item.id} item={item} index={running++} />
                ))}
              </ol>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}

export const HistoryPanel = withQueryProvider(HistoryPanelContent)
