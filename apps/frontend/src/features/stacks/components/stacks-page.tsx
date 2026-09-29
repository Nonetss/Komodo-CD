import { Layers, RefreshCw, Search, ServerCrash, X } from "lucide-react"
import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"

import { SoftCardList } from "@/components/shared/data-display/soft-card-list"
import { StateCard } from "@/components/shared/feedback/state-card"
import { Segmented } from "@/components/shared/form/segmented"
import { HeroCount, PageHero } from "@/components/shared/layout/page-hero"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { ACTION_I18N, useDeployTrigger } from "@/features/deploy"
import { StackRow } from "@/features/stacks/components/stack-row"
import { useStacks } from "@/features/stacks/hooks/use-stacks"
import { inGroup, type StackGroup } from "@/features/stacks/model/stack-groups"
import type { DeployAction, Stack } from "@/lib/api-types"
import { getErrorMessage } from "@/lib/orpc"
import { notifyError, notifySuccess } from "@/lib/toast"
import { cn } from "@/lib/utils"
import { withIsland } from "@/providers/island"

const EMPTY_STACKS: Stack[] = []

// ── Página ──────────────────────────────────────────────────────────────────

const StacksPageContent = () => {
  const { t } = useTranslation()
  const stacksQuery = useStacks()
  const deployTrigger = useDeployTrigger()
  const stacks = stacksQuery.data ?? EMPTY_STACKS
  const loading = stacksQuery.isLoading
  const refreshing = stacksQuery.isFetching

  const [search, setSearch] = useState("")
  const [group, setGroup] = useState<StackGroup>("all")
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [pending, setPending] = useState<Record<string, DeployAction | null>>(
    {}
  )

  const counts = useMemo(
    () => ({
      all: stacks.length,
      running: stacks.filter((s) => inGroup(s, "running")).length,
      stopped: stacks.filter((s) => inGroup(s, "stopped")).length,
      problems: stacks.filter((s) => inGroup(s, "problems")).length,
    }),
    [stacks]
  )

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return stacks
      .filter((s) => inGroup(s, group))
      .filter((s) => q === "" || s.name.toLowerCase().includes(q))
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [stacks, search, group])

  const toggle = (name: string) =>
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(name)) next.delete(name)
      else next.add(name)
      return next
    })

  const runAction = async (stack: string, action: DeployAction) => {
    const label = t(`deploy.actions.${ACTION_I18N[action]}.label`)
    setPending((p) => ({ ...p, [stack]: action }))
    try {
      const res = await deployTrigger.mutateAsync({ stack, action })
      notifySuccess(
        t("stacks.actionDone", { action: label, stack }),
        res.message
      )
    } catch (err) {
      notifyError(
        `${label} · ${stack}`,
        getErrorMessage(err, t("stacks.errorAction"))
      )
    } finally {
      setPending((p) => ({ ...p, [stack]: null }))
    }
  }

  const clearFilters = () => {
    setSearch("")
    setGroup("all")
  }

  let content: React.ReactNode
  if (stacksQuery.isError) {
    content = (
      <StateCard
        tone="destructive"
        icon={ServerCrash}
        title={t("stacks.errorLoad")}
        description={getErrorMessage(stacksQuery.error, "")}
        action={
          <div className="flex flex-wrap justify-center gap-2">
            <Button variant="outline" onClick={() => stacksQuery.refetch()}>
              {t("common.retry")}
            </Button>
            <Button asChild>
              <a href="/credentials">{t("stacks.configure")}</a>
            </Button>
          </div>
        }
      />
    )
  } else if (loading) {
    content = <StacksSkeleton />
  } else if (stacks.length === 0) {
    content = (
      <StateCard
        icon={Layers}
        title={t("stacks.empty")}
        description={t("stacks.emptyDescription")}
        action={
          <Button asChild>
            <a href="/credentials">{t("stacks.configure")}</a>
          </Button>
        }
      />
    )
  } else {
    content = (
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative min-w-0 flex-1">
            <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
            <Input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Escape" && setSearch("")}
              placeholder={t("stacks.search")}
              aria-label={t("stacks.search")}
              className="pr-8 pl-9 [&::-webkit-search-cancel-button]:hidden"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                aria-label={t("stacks.clear")}
                className="text-muted-foreground hover:text-foreground focus-visible:ring-ring/50 absolute top-1/2 right-2 flex size-5 -translate-y-1/2 cursor-pointer items-center justify-center rounded outline-none focus-visible:ring-2"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>
          <Segmented
            value={group}
            onChange={setGroup}
            aria-label={t("stacks.title")}
            className="w-full sm:w-auto [&>label]:flex-1 [&>label]:px-1.5 sm:[&>label]:flex-none sm:[&>label]:px-2.5"
            options={[
              { value: "all", label: t("stacks.filterAll"), count: counts.all },
              {
                value: "running",
                label: t("stacks.stats.running"),
                count: counts.running,
              },
              {
                value: "stopped",
                label: t("stacks.stats.stopped"),
                count: counts.stopped,
              },
              {
                value: "problems",
                label: t("stacks.stats.problems"),
                count: counts.problems,
                alert: true,
              },
            ]}
          />
        </div>

        {filtered.length === 0 ? (
          <StateCard
            icon={Search}
            title={t("stacks.noMatch")}
            action={
              <Button variant="outline" onClick={clearFilters}>
                <X />
                {t("stacks.clear")}
              </Button>
            }
          />
        ) : (
          <SoftCardList as="ul">
            {filtered.map((stack) => (
              <StackRow
                key={stack.id}
                stack={stack}
                expanded={expanded.has(stack.name)}
                onToggle={() => toggle(stack.name)}
                pendingAction={pending[stack.name] ?? null}
                onAction={(action) => runAction(stack.name, action)}
              />
            ))}
          </SoftCardList>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHero
        surface="stacks"
        title={t("stacks.title")}
        description={t("stacks.description")}
        meta={
          <HeroCount
            segments={[
              {
                count: counts.running,
                label: t("stacks.count.running"),
                tone: "success" as const,
              },
              ...(counts.problems > 0
                ? [
                    {
                      count: counts.problems,
                      label: t("stacks.count.problems"),
                      tone: "danger" as const,
                    },
                  ]
                : []),
              { count: counts.all, label: t("stacks.count.total") },
            ]}
          />
        }
        action={
          <Button
            variant="outline"
            onClick={() => stacksQuery.refetch()}
            disabled={refreshing}
            aria-label={t("stacks.refresh")}
          >
            <RefreshCw className={cn(refreshing && "animate-spin")} />
            <span className="hidden sm:inline">{t("common.refresh")}</span>
          </Button>
        }
      />
      {content}
    </div>
  )
}

function StacksSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 sm:flex-row">
        <Skeleton className="h-9 flex-1" />
        <Skeleton className="h-8 w-80 max-w-full self-center" />
      </div>
      <SoftCardList>
        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-3.5">
            <Skeleton className="size-1.5 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-3 w-52" />
            </div>
            <Skeleton className="h-6 w-24" />
          </div>
        ))}
      </SoftCardList>
    </div>
  )
}

export const StacksPage = withIsland(StacksPageContent)
