import { Layers, Search, X } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"

import { SoftCardList } from "@/components/shared/data-display/soft-card-list"
import { QueryErrorCard } from "@/components/shared/feedback/query-error-card"
import { StateCard } from "@/components/shared/feedback/state-card"
import { RefreshButton } from "@/components/shared/form/refresh-button"
import { Segmented } from "@/components/shared/form/segmented"
import { HeroCount, PageHero } from "@/components/shared/layout/page-hero"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { ACTION_I18N, useDeployTrigger } from "@/entities/deploy-action"
import { useStacks } from "@/entities/stack"
import { StackRow } from "@/features/stacks/components/stack-row"
import { StacksBulkBar } from "@/features/stacks/components/stacks-bulk-bar"
import { BULK_CONCURRENCY, runPool } from "@/features/stacks/model/run-pool"
import { inGroup, type StackGroup } from "@/features/stacks/model/stack-groups"
import type { DeployAction, Stack } from "@/lib/api-types"
import { getErrorMessage } from "@/lib/orpc"
import { notifyError, notifySuccess, toastMutation } from "@/lib/toast"
import { withIsland } from "@/providers/island"

const EMPTY_STACKS: Stack[] = []

// ── Página ──────────────────────────────────────────────────────────────────

const StacksPageContent = () => {
  const { t } = useTranslation()
  const stacksQuery = useStacks()
  const deployTrigger = useDeployTrigger()
  const stacks = stacksQuery.data ?? EMPTY_STACKS
  const loading = stacksQuery.isLoading

  const [search, setSearch] = useState("")
  const [group, setGroup] = useState<StackGroup>("all")
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [pending, setPending] = useState<Record<string, DeployAction | null>>(
    {}
  )
  const [bulkAction, setBulkAction] = useState<DeployAction | null>(null)

  // Un stack que ya no existe en Komodo sale de la selección
  useEffect(() => {
    if (!stacksQuery.isSuccess) return
    const names = new Set(stacks.map((s) => s.name))
    setSelected((prev) => {
      const next = new Set([...prev].filter((n) => names.has(n)))
      return next.size === prev.size ? prev : next
    })
  }, [stacks, stacksQuery.isSuccess])

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

  const toggleSelected = (name: string) =>
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(name)) next.delete(name)
      else next.add(name)
      return next
    })

  const shownSelected = filtered.filter((s) => selected.has(s.name)).length
  const allShownSelected =
    filtered.length > 0 && shownSelected === filtered.length
  const hiddenSelected = selected.size - shownSelected

  // Marca o desmarca solo lo visible; lo que ocultan los filtros no se toca
  const toggleAllShown = () =>
    setSelected((prev) => {
      const next = new Set(prev)
      for (const s of filtered) {
        if (allShownSelected) next.delete(s.name)
        else next.add(s.name)
      }
      return next
    })

  const actionLabel = (action: DeployAction) =>
    t(`deploy.actions.${ACTION_I18N[action]}.label`)

  // En modo `silent` no hay toast: el error se relanza para quien llama
  const runAction = async (
    stack: string,
    action: DeployAction,
    { silent = false } = {}
  ) => {
    const label = actionLabel(action)
    const trigger = () => deployTrigger.mutateAsync({ stack, action })
    setPending((p) => ({ ...p, [stack]: action }))
    try {
      if (silent) return await trigger()
      return await toastMutation(trigger, {
        success: (res) => ({
          title: t("stacks.actionDone", { action: label, stack }),
          description: res.message,
        }),
        error: `${label} · ${stack}`,
        errorFallback: t("stacks.errorAction"),
      })
    } finally {
      setPending((p) => ({ ...p, [stack]: null }))
    }
  }

  const runBulk = async (action: DeployAction) => {
    const label = actionLabel(action)
    const names = [...selected].sort((a, b) => a.localeCompare(b))
    setBulkAction(action)
    const results = await runPool(names, BULK_CONCURRENCY, (name) =>
      runAction(name, action, { silent: true })
    )
    setBulkAction(null)

    const failed = results.filter((r) => !r.ok)
    if (failed.length === 0) {
      notifySuccess(
        t("stacks.bulk.done", { action: label, count: names.length })
      )
    } else {
      notifyError(
        t("stacks.bulk.failed", {
          action: label,
          count: failed.length,
          total: names.length,
        }),
        failed
          .map(
            (r) =>
              `${r.item}: ${getErrorMessage(r.error, t("stacks.errorAction"))}`
          )
          .join(" · ")
      )
    }
    // Los que fallan siguen seleccionados para poder reintentarlos
    const succeeded = new Set(results.filter((r) => r.ok).map((r) => r.item))
    setSelected((prev) => new Set([...prev].filter((n) => !succeeded.has(n))))
  }

  const bulkDisabled =
    bulkAction !== null || [...selected].some((n) => pending[n])

  const clearFilters = () => {
    setSearch("")
    setGroup("all")
  }

  let content: React.ReactNode
  if (stacksQuery.isError) {
    content = (
      <QueryErrorCard
        query={stacksQuery}
        title={t("stacks.errorLoad")}
        actions={
          <Button asChild>
            <a href="/credentials">{t("stacks.configure")}</a>
          </Button>
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
              <Button variant="outline" icon={X} onClick={clearFilters}>
                {t("stacks.clear")}
              </Button>
            }
          />
        ) : (
          <div className="flex flex-col gap-2">
            <label className="text-muted-foreground text-meta flex w-fit cursor-pointer items-center gap-3 px-4">
              <input
                type="checkbox"
                checked={allShownSelected}
                ref={(el) => {
                  if (el)
                    el.indeterminate = shownSelected > 0 && !allShownSelected
                }}
                onChange={toggleAllShown}
                className="accent-primary size-4 shrink-0 cursor-pointer"
              />
              {t("stacks.selectAll", { count: filtered.length })}
            </label>
            <SoftCardList as="ul">
              {filtered.map((stack) => (
                <StackRow
                  key={stack.id}
                  stack={stack}
                  expanded={expanded.has(stack.name)}
                  onToggle={() => toggle(stack.name)}
                  selected={selected.has(stack.name)}
                  onSelect={() => toggleSelected(stack.name)}
                  pendingAction={pending[stack.name] ?? null}
                  onAction={(action) => runAction(stack.name, action)}
                />
              ))}
            </SoftCardList>
          </div>
        )}

        {selected.size > 0 && (
          <StacksBulkBar
            count={selected.size}
            hidden={hiddenSelected}
            runningAction={bulkAction}
            disabled={bulkDisabled}
            onRun={runBulk}
            onClear={() => setSelected(new Set())}
          />
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
          <RefreshButton query={stacksQuery} label={t("stacks.refresh")} />
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
