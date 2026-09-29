import {
  AlertTriangle,
  ChevronDown,
  Download,
  GitBranch,
  GitCommitHorizontal,
  Layers,
  Loader2,
  RefreshCw,
  RotateCw,
  Search,
  ServerCrash,
  X,
  Zap,
} from "lucide-react"
import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"

import { CodeBlock } from "@/components/app/code-block"
import { EmptyState } from "@/components/app/empty-state"
import { PageHeader } from "@/components/app/page-header"
import { Segmented } from "@/components/app/segmented"
import {
  StackStateBadge,
  StackStateDot,
  stateTone,
} from "@/components/app/stack-state"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { useAppUrl } from "@/hooks/use-app-url"
import type { DeployAction, Stack, StackState } from "@/lib/api-types"
import { ACTION_I18N, buildDeployCurl, DEPLOY_ACTIONS } from "@/lib/deploy-curl"
import { getErrorMessage } from "@/lib/orpc"
import { notifyError, notifySuccess } from "@/lib/toast"
import { cn } from "@/lib/utils"
import { withIsland } from "@/providers/island"
import { useDeployTrigger } from "./hooks/use-deploy"
import { useStacks } from "./hooks/use-stacks"

type Group = "all" | "running" | "stopped" | "problems"

const STOPPED: StackState[] = ["stopped", "down", "paused", "created"]

const hasProblem = (s: Stack) =>
  stateTone(s.info.state) === "danger" ||
  s.info.state === "unknown" ||
  s.info.project_missing ||
  s.info.missing_files.length > 0

const inGroup = (s: Stack, group: Group) => {
  if (group === "all") return true
  if (group === "problems") return hasProblem(s)
  if (group === "stopped") return STOPPED.includes(s.info.state)
  return s.info.state === "running" || s.info.state === "deploying"
}

const hasUpdate = (s: Stack) =>
  s.info.services.some((svc) => svc.update_available) ||
  (!!s.info.latest_hash &&
    !!s.info.deployed_hash &&
    s.info.latest_hash !== s.info.deployed_hash)

const ACTION_ICON = {
  pull: Download,
  redeploy: RotateCw,
  "pull-redeploy": Zap,
} as const

const EMPTY_STACKS: Stack[] = []

// ── Regleta de estado: un segmento por stack ────────────────────────────────

const SEGMENT: Record<ReturnType<typeof stateTone>, string> = {
  success: "bg-success/80 hover:bg-success",
  warning: "bg-warning/80 hover:bg-warning",
  danger: "bg-danger/85 hover:bg-danger",
  info: "bg-info/80 hover:bg-info animate-pulse",
  neutral: "bg-muted-foreground/25 hover:bg-muted-foreground/45",
}

function StatusStrip({
  stacks,
  onPick,
}: {
  stacks: Stack[]
  onPick: (name: string) => void
}) {
  const sorted = useMemo(
    () => [...stacks].sort((a, b) => a.name.localeCompare(b.name)),
    [stacks]
  )
  return (
    <div className="flex h-2.5 gap-[3px]" aria-hidden>
      {sorted.map((s) => (
        <button
          key={s.id}
          type="button"
          tabIndex={-1}
          title={`${s.name} · ${s.info.state}`}
          onClick={() => onPick(s.name)}
          className={cn(
            "min-w-[3px] flex-1 cursor-pointer rounded-[2px] transition-colors",
            SEGMENT[stateTone(s.info.state)]
          )}
        />
      ))}
    </div>
  )
}

// ── Contadores (también filtran) ────────────────────────────────────────────

function StatTile({
  label,
  value,
  tone,
  active,
  onClick,
}: {
  label: string
  value: number
  tone: "neutral" | "success" | "danger" | "muted"
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "group bg-card flex cursor-pointer flex-col gap-1.5 rounded-lg border px-3 py-2.5 text-left transition-[border-color,background-color,box-shadow] sm:gap-2 sm:px-3.5 sm:py-3",
        active
          ? "border-primary/50 bg-primary/[0.04] ring-primary/20 ring-2"
          : "hover:border-foreground/15"
      )}
    >
      <span className="label-mono flex items-center gap-2">
        <span
          className={cn(
            "size-1.5 rounded-full",
            tone === "success" && "bg-success led text-success",
            tone === "danger" && "bg-danger led text-danger",
            tone === "muted" && "bg-muted-foreground/40",
            tone === "neutral" && "bg-primary"
          )}
        />
        {label}
      </span>
      <span className="font-display tabular text-xl leading-none font-semibold tracking-tight sm:text-2xl">
        {value}
      </span>
    </button>
  )
}

// ── Fila de stack ───────────────────────────────────────────────────────────

function StackRow({
  stack,
  index,
  expanded,
  onToggle,
  pendingAction,
  onAction,
}: {
  stack: Stack
  index: number
  expanded: boolean
  onToggle: () => void
  pendingAction: DeployAction | null
  onAction: (action: DeployAction) => void
}) {
  const { t } = useTranslation()
  const { info } = stack
  const update = hasUpdate(stack)
  const problem = info.project_missing || info.missing_files.length > 0
  const appUrl = useAppUrl()
  const [curlAction, setCurlAction] = useState<DeployAction>("redeploy")
  const detailsId = `stack-${stack.id}`

  return (
    <li
      id={`row-${stack.name}`}
      className="reveal group/row scroll-mt-24"
      style={{ "--i": index } as React.CSSProperties}
    >
      <div
        className={cn(
          "flex items-center gap-3 px-3 py-2.5 transition-colors sm:px-4",
          expanded ? "bg-accent/40" : "hover:bg-accent/30"
        )}
      >
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={expanded}
          aria-controls={detailsId}
          aria-label={expanded ? t("stacks.collapse") : t("stacks.expand")}
          className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 text-left outline-none"
        >
          <StackStateDot state={info.state} />
          <span className="min-w-0 flex-1">
            <span className="flex items-center gap-2">
              <span className="truncate text-sm font-medium">{stack.name}</span>
              {update && (
                <Badge variant="primary" className="hidden sm:inline-flex">
                  {t("stacks.updateAvailable")}
                </Badge>
              )}
              {problem && (
                <AlertTriangle className="text-danger size-3.5 shrink-0" />
              )}
            </span>
            <span className="text-muted-foreground mt-0.5 flex items-center gap-1.5 text-xs">
              <span className="tabular">
                {t("stacks.services", { count: info.services.length })}
              </span>
              {info.repo && (
                <>
                  <span className="text-border">/</span>
                  <span className="hidden min-w-0 truncate font-mono text-[11px] sm:inline">
                    {info.repo}
                    <span className="text-muted-foreground/60">
                      @{info.branch}
                    </span>
                  </span>
                </>
              )}
              {update && (
                <span className="bg-primary size-1.5 rounded-full sm:hidden" />
              )}
            </span>
          </span>
          <span className="hidden md:block">
            <StackStateBadge state={info.state} />
          </span>
        </button>

        <div className="flex shrink-0 items-center gap-1">
          {DEPLOY_ACTIONS.map((action) => {
            const Icon = ACTION_ICON[action]
            const label = t(`deploy.actions.${ACTION_I18N[action]}.label`)
            const running = pendingAction === action
            return (
              <Button
                key={action}
                type="button"
                variant="outline"
                size="xs"
                disabled={pendingAction !== null}
                onClick={() => onAction(action)}
                title={label}
                aria-label={`${label} ${stack.name}`}
                className="size-7 px-0 lg:w-auto lg:px-2"
              >
                {running ? <Loader2 className="animate-spin" /> : <Icon />}
                <span className="hidden lg:inline">{label}</span>
              </Button>
            )
          })}
          <button
            type="button"
            onClick={onToggle}
            tabIndex={-1}
            aria-hidden
            className="text-muted-foreground hover:text-foreground ml-0.5 hidden size-7 cursor-pointer items-center justify-center rounded-md sm:flex"
          >
            <ChevronDown
              className={cn(
                "size-4 transition-transform",
                expanded && "rotate-180"
              )}
            />
          </button>
        </div>
      </div>

      {expanded && (
        <div
          id={detailsId}
          className="bg-accent/20 grid grid-cols-1 gap-5 border-t border-dashed px-3 py-4 sm:px-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] md:px-11"
        >
          <div className="min-w-0 space-y-4">
            <div className="md:hidden">
              <StackStateBadge state={info.state} />
              {info.status && (
                <span className="text-muted-foreground ml-2 font-mono text-[11px]">
                  {info.status}
                </span>
              )}
            </div>

            {problem && (
              <div className="bg-danger/10 border-danger/20 text-danger flex items-start gap-2 rounded-md border px-3 py-2 text-xs">
                <AlertTriangle className="mt-px size-3.5 shrink-0" />
                <span className="break-words">
                  {info.project_missing
                    ? t("stacks.projectMissing")
                    : t("stacks.missingFiles", {
                        files: info.missing_files.join(", "),
                      })}
                </span>
              </div>
            )}

            <div className="space-y-2">
              <p className="label-mono">{t("stacks.servicesTitle")}</p>
              <ul className="divide-y rounded-lg border">
                {info.services.map((svc) => (
                  <li
                    key={svc.service}
                    className="flex items-center justify-between gap-3 px-3 py-2"
                  >
                    <span className="flex shrink-0 items-center gap-2 text-[13px] font-medium">
                      {svc.service}
                      {svc.update_available && (
                        <Badge variant="primary">update</Badge>
                      )}
                    </span>
                    <span
                      className="text-muted-foreground min-w-0 truncate font-mono text-[11px]"
                      title={svc.image}
                    >
                      {svc.image}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {info.repo && (
              <dl className="text-muted-foreground grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 text-xs">
                <dt className="flex items-center">
                  <GitBranch className="size-3.5" />
                </dt>
                <dd className="min-w-0 truncate font-mono text-[11px]">
                  {info.repo_link ? (
                    <a
                      href={info.repo_link}
                      target="_blank"
                      rel="noreferrer"
                      className="hover:text-foreground underline-offset-2 hover:underline"
                    >
                      {info.repo}
                    </a>
                  ) : (
                    info.repo
                  )}{" "}
                  · {info.branch}
                </dd>
                {(info.deployed_hash || info.latest_hash) && (
                  <>
                    <dt className="flex items-center">
                      <GitCommitHorizontal className="size-3.5" />
                    </dt>
                    <dd className="font-mono text-[11px]">
                      {t("stacks.deployed")} {info.deployed_hash ?? "—"}
                      {update && info.latest_hash && (
                        <span className="text-primary">
                          {" "}
                          → {t("stacks.latest")} {info.latest_hash}
                        </span>
                      )}
                    </dd>
                  </>
                )}
              </dl>
            )}
          </div>

          <div className="min-w-0 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="label-mono">{t("stacks.ciTitle")}</p>
              <Segmented
                value={curlAction}
                onChange={setCurlAction}
                aria-label={t("stacks.ciTitle")}
                options={DEPLOY_ACTIONS.map((a) => ({
                  value: a,
                  label: t(`deploy.actions.${ACTION_I18N[a]}.label`),
                }))}
              />
            </div>
            <CodeBlock
              label={`POST /api/v0/deploy · ${curlAction}`}
              code={buildDeployCurl(appUrl, stack.name, curlAction)}
            />
            <p className="text-muted-foreground text-[11px]">
              {t("stacks.ciHint")}
            </p>
          </div>
        </div>
      )}
    </li>
  )
}

// ── Panel ───────────────────────────────────────────────────────────────────

const StacksPanelContent = () => {
  const { t } = useTranslation()
  const stacksQuery = useStacks()
  const deployTrigger = useDeployTrigger()
  const stacks = stacksQuery.data ?? EMPTY_STACKS
  const loading = stacksQuery.isLoading
  const refreshing = stacksQuery.isFetching

  const [search, setSearch] = useState("")
  const [group, setGroup] = useState<Group>("all")
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

  const pick = (name: string) => {
    setGroup("all")
    setSearch("")
    setExpanded((prev) => new Set(prev).add(name))
    requestAnimationFrame(() =>
      document
        .getElementById(`row-${name}`)
        ?.scrollIntoView({ behavior: "smooth", block: "start" })
    )
  }

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

  const hasFilters = search.trim() !== "" || group !== "all"

  return (
    <div>
      <PageHeader
        title={t("stacks.title")}
        description={t("stacks.description")}
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => stacksQuery.refetch()}
            disabled={refreshing}
            aria-label={t("stacks.refresh")}
          >
            <RefreshCw className={cn(refreshing && "animate-spin")} />
            <span className="hidden sm:inline">{t("common.refresh")}</span>
          </Button>
        }
      />

      {stacksQuery.isError ? (
        <EmptyState
          tone="danger"
          icon={ServerCrash}
          title={t("stacks.errorLoad")}
          description={getErrorMessage(stacksQuery.error, "")}
          action={
            <div className="flex flex-wrap justify-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => stacksQuery.refetch()}
              >
                {t("common.retry")}
              </Button>
              <Button size="sm" asChild>
                <a href="/credentials">{t("stacks.configure")}</a>
              </Button>
            </div>
          }
        />
      ) : loading ? (
        <StacksSkeleton />
      ) : stacks.length === 0 ? (
        <EmptyState
          icon={Layers}
          title={t("stacks.empty")}
          description={t("stacks.emptyDescription")}
          action={
            <Button size="sm" asChild>
              <a href="/credentials">{t("stacks.configure")}</a>
            </Button>
          }
        />
      ) : (
        <div className="space-y-5">
          <section className="space-y-3">
            <StatusStrip stacks={stacks} onPick={pick} />
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
              <StatTile
                label={t("stacks.stats.total")}
                value={counts.all}
                tone="neutral"
                active={group === "all"}
                onClick={() => setGroup("all")}
              />
              <StatTile
                label={t("stacks.stats.running")}
                value={counts.running}
                tone="success"
                active={group === "running"}
                onClick={() => setGroup("running")}
              />
              <StatTile
                label={t("stacks.stats.stopped")}
                value={counts.stopped}
                tone="muted"
                active={group === "stopped"}
                onClick={() => setGroup("stopped")}
              />
              <StatTile
                label={t("stacks.stats.problems")}
                value={counts.problems}
                tone="danger"
                active={group === "problems"}
                onClick={() => setGroup("problems")}
              />
            </div>
          </section>

          <section className="bg-card overflow-hidden rounded-xl border shadow-xs">
            <div className="flex items-center gap-2 border-b p-2 sm:p-2.5">
              <div className="relative flex-1">
                <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                <Input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t("stacks.search")}
                  aria-label={t("stacks.search")}
                  className="bg-background/60 h-8 border-transparent pl-9 shadow-none"
                />
              </div>
              <span className="text-muted-foreground tabular hidden font-mono text-[11px] sm:inline">
                {filtered.length}/{stacks.length}
              </span>
              {hasFilters && (
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={() => {
                    setSearch("")
                    setGroup("all")
                  }}
                >
                  <X />
                  <span className="hidden sm:inline">{t("stacks.clear")}</span>
                </Button>
              )}
            </div>

            {filtered.length === 0 ? (
              <p className="text-muted-foreground px-4 py-10 text-center text-sm">
                {t("stacks.noMatch")}
              </p>
            ) : (
              <ul className="divide-y">
                {filtered.map((stack, i) => (
                  <StackRow
                    key={stack.id}
                    stack={stack}
                    index={i}
                    expanded={expanded.has(stack.name)}
                    onToggle={() => toggle(stack.name)}
                    pendingAction={pending[stack.name] ?? null}
                    onAction={(action) => runAction(stack.name, action)}
                  />
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </div>
  )
}

function StacksSkeleton() {
  return (
    <div className="space-y-5">
      <Skeleton className="h-2.5 w-full" />
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-[74px] rounded-lg" />
        ))}
      </div>
      <div className="divide-y rounded-xl border">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-3">
            <Skeleton className="size-2 rounded-full" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3.5 w-32" />
              <Skeleton className="h-3 w-48" />
            </div>
            <Skeleton className="h-7 w-24" />
          </div>
        ))}
      </div>
    </div>
  )
}

export const StacksPanel = withIsland(StacksPanelContent)
