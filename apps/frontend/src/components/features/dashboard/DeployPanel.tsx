import {
  CheckCircle2,
  ChevronsUpDown,
  Download,
  Loader2,
  Rocket,
  RotateCw,
  XCircle,
  Zap,
} from "lucide-react"
import { useEffect, useId, useMemo, useRef, useState } from "react"
import { useTranslation } from "react-i18next"

import { CodeBlock } from "@/components/app/code-block"
import { PageHeader } from "@/components/app/page-header"
import { StackStateDot } from "@/components/app/stack-state"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useAppUrl } from "@/hooks/use-app-url"
import { useHydrated } from "@/hooks/use-hydrated"
import type { DeployAction, Stack } from "@/lib/api-types"
import { ACTION_I18N, buildDeployCurl, DEPLOY_ACTIONS } from "@/lib/deploy-curl"
import { getErrorMessage } from "@/lib/orpc"
import { notifyError, notifySuccess } from "@/lib/toast"
import { cn } from "@/lib/utils"
import { withIsland } from "@/providers/island"
import { useDeployTrigger } from "./hooks/use-deploy"
import { useStacks } from "./hooks/use-stacks"

const ACTION_ICON = {
  pull: Download,
  redeploy: RotateCw,
  "pull-redeploy": Zap,
} as const

type Result = { success: boolean; message: string; stack: string }

// ── Selector de stack con sugerencias ───────────────────────────────────────

function StackCombobox({
  id,
  stacks,
  loading,
  value,
  onChange,
  invalid,
  describedBy,
}: {
  id: string
  stacks: Stack[]
  loading: boolean
  value: string
  onChange: (value: string) => void
  invalid: boolean
  describedBy?: string
}) {
  const { t } = useTranslation()
  const listId = useId()
  const [open, setOpen] = useState(false)
  const [highlight, setHighlight] = useState(0)
  const rootRef = useRef<HTMLDivElement>(null)

  const matches = useMemo(() => {
    const q = value.trim().toLowerCase()
    return [...stacks]
      .sort((a, b) => a.name.localeCompare(b.name))
      .filter((s) => q === "" || s.name.toLowerCase().includes(q))
      .slice(0, 50)
  }, [stacks, value])

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", close)
    return () => document.removeEventListener("mousedown", close)
  }, [])

  const select = (name: string) => {
    onChange(name)
    setOpen(false)
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setOpen(true)
      setHighlight((h) => Math.min(h + 1, matches.length - 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setHighlight((h) => Math.max(h - 1, 0))
    } else if (e.key === "Enter" && open && matches[highlight]) {
      e.preventDefault()
      select(matches[highlight].name)
    } else if (e.key === "Escape") {
      setOpen(false)
    }
  }

  const selected = stacks.find((s) => s.name === value)
  const TrailingIcon = loading ? Loader2 : ChevronsUpDown

  return (
    <div ref={rootRef} className="relative">
      <div className="relative">
        {selected && (
          <StackStateDot
            state={selected.info.state}
            className="absolute top-1/2 left-3 -translate-y-1/2"
          />
        )}
        <Input
          id={id}
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy}
          value={value}
          onChange={(e) => {
            onChange(e.target.value)
            setHighlight(0)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder={t("deploy.stackPlaceholder")}
          autoComplete="off"
          spellCheck={false}
          className={cn("h-10 pr-9", selected && "pl-8")}
        />
        <TrailingIcon
          className={cn(
            "text-muted-foreground pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2",
            loading && "animate-spin"
          )}
        />
      </div>

      {open && !loading && (
        <div
          id={listId}
          role="listbox"
          className="bg-popover animate-in fade-in-0 zoom-in-[0.98] absolute z-20 mt-1 max-h-64 w-full overflow-y-auto rounded-lg border p-1 shadow-lg"
        >
          {matches.length === 0 ? (
            <p className="text-muted-foreground px-2 py-3 text-center text-xs">
              {t("deploy.noStacks")}
            </p>
          ) : (
            matches.map((s, i) => (
              <button
                key={s.id}
                type="button"
                role="option"
                aria-selected={s.name === value}
                onMouseEnter={() => setHighlight(i)}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => select(s.name)}
                className={cn(
                  "flex w-full cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 text-left text-sm",
                  i === highlight && "bg-accent"
                )}
              >
                <StackStateDot state={s.info.state} />
                <span className="truncate">{s.name}</span>
                <span className="text-muted-foreground ml-auto text-xs">
                  {t(`stacks.states.${s.info.state}`, {
                    defaultValue: s.info.state,
                  })}
                </span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}

// ── Elección de acción ──────────────────────────────────────────────────────

function ActionChoice({
  value,
  onChange,
}: {
  value: DeployAction
  onChange: (action: DeployAction) => void
}) {
  const { t } = useTranslation()
  return (
    <fieldset>
      <legend className="text-label mb-2 font-medium">
        {t("deploy.actionLabel")}
      </legend>
      <div className="grid gap-2 sm:grid-cols-3">
        {DEPLOY_ACTIONS.map((a) => {
          const Icon = ACTION_ICON[a]
          const checked = value === a
          return (
            <label
              key={a}
              className={cn(
                "has-focus-visible:ring-ring/40 flex cursor-pointer flex-col gap-1 rounded-lg border px-3 py-2.5 transition-[border-color,background-color] has-focus-visible:ring-2",
                checked
                  ? "border-primary bg-primary/5"
                  : "hover:border-foreground/20 hover:bg-muted/40"
              )}
            >
              <input
                type="radio"
                name="action"
                value={a}
                checked={checked}
                onChange={() => onChange(a)}
                className="sr-only"
              />
              <span
                className={cn(
                  "flex items-center gap-2 text-sm font-medium",
                  checked && "text-primary"
                )}
              >
                <Icon
                  className={cn(
                    "size-4 shrink-0",
                    !checked && "text-muted-foreground"
                  )}
                />
                {t(`deploy.actions.${ACTION_I18N[a]}.label`)}
              </span>
              <span className="text-muted-foreground text-xs text-pretty">
                {t(`deploy.actions.${ACTION_I18N[a]}.description`)}
              </span>
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}

// ── Panel ───────────────────────────────────────────────────────────────────

const DeployPanelContent = () => {
  const { t } = useTranslation()
  const stacksQuery = useStacks()
  const deployTrigger = useDeployTrigger()
  const stacks = stacksQuery.data ?? []
  const appUrl = useAppUrl()
  const hydrated = useHydrated()
  const errorId = useId()

  const [stack, setStack] = useState("")
  const [action, setAction] = useState<DeployAction>("redeploy")
  const [touched, setTouched] = useState(false)
  const [result, setResult] = useState<Result | null>(null)

  const invalid = touched && stack.trim() === ""
  const loading = deployTrigger.isPending

  const onSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault()
    setTouched(true)
    const name = stack.trim()
    if (!name) return
    setResult(null)
    const label = t(`deploy.actions.${ACTION_I18N[action]}.label`)
    try {
      const res = await deployTrigger.mutateAsync({ stack: name, action })
      setResult({ success: true, message: res.message, stack: name })
      notifySuccess(t("stacks.actionDone", { action: label, stack: name }))
    } catch (err) {
      const message = getErrorMessage(err, t("deploy.error"))
      setResult({ success: false, message, stack: name })
      notifyError(`${label} · ${name}`, message)
    }
  }

  return (
    <div className="max-w-3xl">
      <PageHeader
        title={t("deploy.title")}
        description={t("deploy.description")}
      />

      <Card>
        <form method="post" onSubmit={onSubmit} noValidate>
          <CardContent className="space-y-6">
            <div className="grid gap-1.5">
              <label htmlFor="deploy-stack" className="text-label font-medium">
                {t("deploy.stackLabel")}
              </label>
              <StackCombobox
                id="deploy-stack"
                stacks={stacks}
                loading={stacksQuery.isLoading}
                value={stack}
                onChange={(v) => {
                  setStack(v)
                  setResult(null)
                }}
                invalid={invalid}
                describedBy={invalid ? errorId : undefined}
              />
              {invalid && (
                <p id={errorId} className="text-destructive text-xs">
                  {t("deploy.required")}
                </p>
              )}
            </div>

            <ActionChoice value={action} onChange={setAction} />
          </CardContent>

          <CardFooter className="flex-col items-stretch gap-3 sm:flex-row sm:items-center">
            <div role="status" className="min-w-0 flex-1">
              {result && (
                <p className="reveal flex items-start gap-2 text-sm">
                  {result.success ? (
                    <CheckCircle2 className="text-success mt-0.5 size-4 shrink-0" />
                  ) : (
                    <XCircle className="text-danger mt-0.5 size-4 shrink-0" />
                  )}
                  <span
                    className={cn(
                      "min-w-0 wrap-break-word",
                      !result.success && "text-danger"
                    )}
                  >
                    {result.message}
                  </span>
                </p>
              )}
            </div>
            <Button type="submit" disabled={!hydrated || loading}>
              {loading ? <Loader2 className="animate-spin" /> : <Rocket />}
              {loading ? t("deploy.executing") : t("deploy.submit")}
            </Button>
          </CardFooter>
        </form>
      </Card>

      <section aria-labelledby="deploy-ci" className="mt-10 space-y-3">
        <div className="space-y-0.5">
          <h2 id="deploy-ci" className="text-heading">
            {t("deploy.ciTitle")}
          </h2>
          <p className="text-muted-foreground text-label text-pretty">
            {t("deploy.ciDescription")}
          </p>
        </div>
        <CodeBlock
          label={`POST /api/v0/deploy · ${action}`}
          code={buildDeployCurl(appUrl, stack.trim() || "mi-stack", action)}
        />
        <p className="text-muted-foreground text-xs">{t("stacks.ciHint")}</p>
      </section>
    </div>
  )
}

export const DeployPanel = withIsland(DeployPanelContent)
