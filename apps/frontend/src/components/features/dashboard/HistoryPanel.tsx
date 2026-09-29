import { useEffect, useState } from "react"
import "@/lib/i18n"
import { CheckCircle2, RefreshCw, XCircle } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { type HistoryItem, historyApi } from "@/lib/api"

const ACTION_LABELS: Record<string, string> = {
  pull: "Pull",
  redeploy: "Redeploy",
  "pull-redeploy": "Pull + Redeploy",
}

type TimeGroup = "last-hour" | "today" | "last-week" | "older"

function getTimeGroup(date: Date): TimeGroup {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffHours = diffMs / (1000 * 60 * 60)
  const diffDays = diffMs / (1000 * 60 * 60 * 24)

  if (diffHours < 1) return "last-hour"
  if (date.toDateString() === now.toDateString()) return "today"
  if (diffDays < 7) return "last-week"
  return "older"
}

function groupHistory(
  items: HistoryItem[]
): { group: TimeGroup; items: HistoryItem[] }[] {
  const groups: Record<TimeGroup, HistoryItem[]> = {
    "last-hour": [],
    today: [],
    "last-week": [],
    older: [],
  }

  for (const item of items) {
    groups[getTimeGroup(new Date(item.createdAt))].push(item)
  }

  const order: TimeGroup[] = ["last-hour", "today", "last-week", "older"]
  return order
    .filter((g) => groups[g].length > 0)
    .map((g) => ({ group: g, items: groups[g] }))
}

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`bg-muted/60 animate-pulse rounded-md ${className}`} />
}

export const HistoryPanel = () => {
  const { t, i18n } = useTranslation()
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchHistory = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await historyApi.list()
      setHistory(res.data.history)
    } catch {
      setError(t("history.error"))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchHistory()
  }, [])

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-3">
        <CardTitle>{t("history.title")}</CardTitle>
        <Button
          variant="outline"
          size="icon"
          onClick={fetchHistory}
          disabled={loading}
          aria-label={t("history.refresh")}
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </CardHeader>
      <CardContent>
        {error && <p className="text-destructive text-sm">{error}</p>}

        {/* Skeleton */}
        {loading && history.length === 0 && (
          <div className="space-y-0">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="border-border flex items-start gap-4 border-b py-3 last:border-0"
              >
                <Skeleton className="mt-0.5 h-4 w-4 shrink-0 rounded-md" />
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex gap-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-16 rounded-md" />
                  </div>
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!error && !loading && history.length === 0 && (
          <p className="text-muted-foreground text-sm">{t("history.empty")}</p>
        )}

        {groupHistory(history).map(({ group, items: groupItems }) => {
          const groupLabel: Record<TimeGroup, string> = {
            "last-hour": t("history.group.lastHour"),
            today: t("history.group.today"),
            "last-week": t("history.group.lastWeek"),
            older: t("history.group.older"),
          }

          return (
            <div key={group} className="mb-4 last:mb-0">
              <p className="text-muted-foreground mb-1 text-xs font-medium tracking-wide uppercase">
                {groupLabel[group]}
              </p>
              <div className="space-y-0">
                {groupItems.map((item, idx) => (
                  <div
                    key={item.id}
                    className={`flex items-start gap-4 py-3 text-sm ${
                      idx < groupItems.length - 1
                        ? "border-border border-b"
                        : ""
                    }`}
                  >
                    <div className="mt-0.5 shrink-0">
                      {item.success ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                      ) : (
                        <XCircle className="text-destructive h-4 w-4" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1 space-y-0.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold">{item.stack}</span>
                        <span className="bg-secondary border-border text-muted-foreground rounded-md border px-2 py-0.5 text-xs">
                          {ACTION_LABELS[item.action] ?? item.action}
                        </span>
                      </div>
                      {item.message && (
                        <p className="text-muted-foreground text-xs wrap-break-word">
                          {item.message}
                        </p>
                      )}
                      <div className="text-muted-foreground flex flex-wrap items-center gap-2 text-xs">
                        <span>
                          {item.userName ?? item.userEmail ?? item.userId}
                        </span>
                        <span>·</span>
                        <span>
                          {new Intl.DateTimeFormat(i18n.language, {
                            dateStyle: "short",
                            timeStyle: "short",
                          }).format(new Date(item.createdAt))}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
