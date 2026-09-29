import {
  AlertTriangle,
  ChevronDown,
  CircleArrowUp,
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

// El punto ya lleva el color: el texto del estado solo se tiñe cuando pide
// atención, para que 40 filas "Running" no conviertan la lista en verde.
const STATE_TEXT: Record<ReturnType<typeof stateTone>, string> = {
  success: "text-muted-foreground",
  neutral: "text-muted-foreground",
  info: "text-info",
  warning: "text-warning",
  danger: "text-danger",
}

const EMPTY_STACKS: Stack[] = []

// ── Fila de stack ───────────────────────────────────────────────────────────

function StackRow({
  stack,
  expanded,
  onToggle,
  pendingAction,
  onAction,
}: {
  stack: Stack
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
    <li id={`row-${stack.name}`} className="scroll-mt-24">
      <div
        className={cn(
          "flex items-center gap-3 px-3 py-2.5 transition-colors sm:px-4",
          expanded ? "bg-muted/60" : "hover:bg-muted/40"
        )}
      >
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={expanded}
          aria-controls={detailsId}
          aria-label={expanded ? t("stacks.collapse") : t("stacks.expand")}
          className="focus-visible:ring-ring/40 -my-1 flex min-w-0 flex-1 cursor-pointer items-center gap-3 rounded-md py-1 text-left outline-none focus-visible:ring-2"
        >
          <StackStateDot state={info.state} />
          <span className="min-w-0 flex-1">
            <span className="flex items-center gap-1.5">
              <span className="truncate text-sm font-medium">{stack.name}</span>
              {problem && (
                <AlertTriangle className="text-danger size-3.5 shrink-0" />
              )}
            </span>
            <span className="text-muted-foreground mt-0.5 flex min-w-0 items-center gap-1.5 text-xs">
              <span className="tabular shrink-0">
                {t("stacks.services", { count: info.services.length })}
              </span>
              {info.repo && (
                <span className="hidden min-w-0 items-center gap-1.5 sm:flex">
                  <span aria-hidden className="text-muted-foreground/50">
                    ·
                  </span>
                  <span className="truncate font-mono text-[11px]">
                    {info.repo}
                    <span className="text-muted-foreground/70">
                      @{info.branch}
                    </span>
                  </span>
                </span>
              )}
              {update && (
                <span
                  className="bg-primary size-1.5 shrink-0 rounded-full sm:hidden"
                  title={t("stacks.updateAvailable")}
                />
              )}
            </span>
          </span>
          {update && (
            <span className="text-primary hidden shrink-0 items-center gap-1 text-xs font-medium sm:inline-flex">
              <CircleArrowUp className="size-3.5" />
              {t("stacks.updateAvailable")}
            </span>
          )}
          <span
            className={cn(
              "hidden w-20 shrink-0 text-xs md:block",
              STATE_TEXT[stateTone(info.state)]
            )}
          >
            {t(`stacks.states.${info.state}`, { defaultValue: info.state })}
          </span>
        </button>

        <div className="flex shrink-0 items-center gap-1">
          <div className="bg-card flex items-center divide-x overflow-hidden rounded-md border">
            {DEPLOY_ACTIONS.map((action) => {
              const Icon = ACTION_ICON[action]
              const label = t(`deploy.actions.${ACTION_I18N[action]}.label`)
              const running = pendingAction === action
              return (
                <Button
                  key={action}
                  type="button"
                  variant="ghost"
                  size="xs"
                  disabled={pendingAction !== null}
                  onClick={() => onAction(action)}
                  title={label}
                  aria-label={`${label} ${stack.name}`}
                  className="w-8 rounded-none px-0 focus-visible:ring-2 focus-visible:ring-inset lg:w-auto lg:px-2.5"
                >
                  {running ? <Loader2 className="animate-spin" /> : <Icon />}
                  <span className="hidden lg:inline">{label}</span>
                </Button>
              )
            })}
          </div>
          <button
            type="button"
            onClick={onToggle}
            tabIndex={-1}
            aria-hidden
            className="text-muted-foreground hover:text-foreground hidden size-7 cursor-pointer items-center justify-center rounded-md sm:flex"
          >
            <ChevronDown
              className={cn(
                "size-4 transition-transform duration-200",
                expanded && "rotate-180"
              )}
            />
          </button>
        </div>
      </div>

      {expanded && (
        <div
          id={detailsId}
          className="bg-muted/30 grid grid-cols-1 gap-6 border-t px-3 py-4 sm:px-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] md:pr-4 md:pb-5 md:pl-9"
        >
          <div className="min-w-0 space-y-4">
            <div className="flex items-center gap-2 md:hidden">
              <StackStateBadge state={info.state} />
              {info.status && (
                <span className="text-muted-foreground font-mono text-[11px]">
                  {info.status}
                </span>
              )}
            </div>

            {problem && (
              <div className="bg-danger/10 border-danger/20 text-danger flex items-start gap-2 rounded-md border px-3 py-2 text-xs">
                <AlertTriangle className="mt-px size-3.5 shrink-0" />
                <span className="wrap-break-word">
                  {info.project_missing
                    ? t("stacks.projectMissing")
                    : t("stacks.missingFiles", {
                        files: info.missing_files.join(", "),
                      })}
                </span>
              </div>
            )}

            <div className="space-y-2">
              <p className="section-label">{t("stacks.servicesTitle")}</p>
              <ul className="bg-card divide-y rounded-lg border">
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
              <dl className="text-muted-foreground grid grid-cols-[auto_1fr] gap-x-2.5 gap-y-1.5 text-xs">
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
              <p className="section-label">{t("stacks.ciTitle")}</p>
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
              className="bg-card"
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
        <section className="bg-card overflow-hidden rounded-xl border shadow-xs">
          <div className="flex flex-col gap-2 border-b p-2 sm:flex-row sm:items-center sm:p-2.5">
            <div className="relative min-w-0 flex-1">
              <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
              <Input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Escape" && setSearch("")}
                placeholder={t("stacks.search")}
                aria-label={t("stacks.search")}
                className="h-8 pr-8 pl-8.5 shadow-none [&::-webkit-search-cancel-button]:hidden"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  aria-label={t("stacks.clear")}
                  className="text-muted-foreground hover:text-foreground focus-visible:ring-ring/40 absolute top-1/2 right-1.5 flex size-5 -translate-y-1/2 cursor-pointer items-center justify-center rounded outline-none focus-visible:ring-2"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>
            <Segmented
              value={group}
              onChange={setGroup}
              aria-label={t("stacks.title")}
              className="w-full sm:w-auto [&>label]:flex-1 [&>label]:justify-center [&>label]:px-1.5 sm:[&>label]:flex-none sm:[&>label]:px-2.5"
              options={[
                {
                  value: "all",
                  label: t("stacks.filterAll"),
                  count: counts.all,
                },
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
            <div className="flex flex-col items-center gap-3 px-4 py-12 text-center">
              <p className="text-muted-foreground text-sm">
                {t("stacks.noMatch")}
              </p>
              <Button variant="outline" size="sm" onClick={clearFilters}>
                <X />
                {t("stacks.clear")}
              </Button>
            </div>
          ) : (
            <ul className="divide-y">
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
            </ul>
          )}
        </section>
      )}
    </div>
  )
}

function StacksSkeleton() {
  return (
    <div className="bg-card overflow-hidden rounded-xl border">
      <div className="flex flex-col gap-2 border-b p-2 sm:flex-row sm:p-2.5">
        <Skeleton className="h-8 flex-1" />
        <Skeleton className="h-8 w-72 max-w-full" />
      </div>
      <div className="divide-y">
        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
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
