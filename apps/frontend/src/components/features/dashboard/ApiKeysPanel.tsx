import {
  KeyRound,
  Loader2,
  Plus,
  ServerCrash,
  ShieldCheck,
  Trash2,
} from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"

import { CodeBlock } from "@/components/app/code-block"
import { CopyButton } from "@/components/app/copy-button"
import { EmptyState } from "@/components/app/empty-state"
import { PageHeader } from "@/components/app/page-header"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { useAppUrl } from "@/hooks/use-app-url"
import type { ApiKey } from "@/lib/api-types"
import { buildDeployCurl } from "@/lib/deploy-curl"
import { getErrorMessage } from "@/lib/orpc"
import { notifyError, notifySuccess } from "@/lib/toast"
import { withIsland } from "@/providers/island"
import {
  useApiKeyCreate,
  useApiKeyDelete,
  useApiKeys,
} from "./hooks/use-api-keys"

// ── Key recién creada (solo se muestra una vez) ─────────────────────────────

function CreatedKey({
  value,
  onDismiss,
}: {
  value: string
  onDismiss: () => void
}) {
  const { t } = useTranslation()
  const appUrl = useAppUrl()
  return (
    <div className="reveal border-success/30 bg-success/6 mb-6 space-y-4 rounded-xl border p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <span className="bg-success/15 text-success flex size-8 shrink-0 items-center justify-center rounded-md">
          <ShieldCheck className="size-4" />
        </span>
        <div>
          <p className="text-sm font-semibold">{t("apikeys.keyCreated")}</p>
          <p className="text-muted-foreground text-xs">
            {t("apikeys.keyCreatedHint")}
          </p>
        </div>
      </div>

      <div className="bg-card flex items-center gap-1 rounded-lg border py-1 pr-1 pl-3">
        <code className="min-w-0 flex-1 truncate text-[13px]">{value}</code>
        <CopyButton value={value} withLabel size="sm" />
      </div>

      <div className="space-y-2">
        <p className="text-muted-foreground text-xs">
          {t("apikeys.useInGithubActions")}
        </p>
        <CodeBlock
          label="POST /api/v0/deploy"
          code={buildDeployCurl(appUrl, "mi-stack", "redeploy", value)}
        />
      </div>

      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={onDismiss}>
          {t("apikeys.dismiss")}
        </Button>
      </div>
    </div>
  )
}

// ── Fila ────────────────────────────────────────────────────────────────────

function ApiKeyRow({ apiKey, index }: { apiKey: ApiKey; index: number }) {
  const { t, i18n } = useTranslation()
  const deleteKey = useApiKeyDelete()
  const [confirming, setConfirming] = useState(false)

  useEffect(() => {
    if (!confirming) return
    const timer = setTimeout(() => setConfirming(false), 3000)
    return () => clearTimeout(timer)
  }, [confirming])

  const remove = async () => {
    if (!confirming) {
      setConfirming(true)
      return
    }
    setConfirming(false)
    try {
      await deleteKey.mutateAsync({ id: apiKey.id })
      notifySuccess(t("apikeys.deleted"), apiKey.name ?? undefined)
    } catch (err) {
      notifyError(t("apikeys.errorDelete"), getErrorMessage(err, ""))
    }
  }

  const created = new Intl.DateTimeFormat(i18n.language, {
    dateStyle: "medium",
  }).format(new Date(apiKey.createdAt))

  return (
    <li
      className="reveal flex items-center gap-3 px-4 py-3"
      style={{ "--i": index } as React.CSSProperties}
    >
      <span className="bg-muted text-muted-foreground flex size-8 shrink-0 items-center justify-center rounded-md border">
        <KeyRound className="size-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{apiKey.name ?? "—"}</p>
        <p className="text-muted-foreground flex flex-wrap items-center gap-x-2 text-xs">
          <code className="text-[11px]">
            {apiKey.start ? `${apiKey.start}••••••` : apiKey.id}
          </code>
          <span className="text-border">/</span>
          <span>{t("apikeys.created", { date: created })}</span>
        </p>
      </div>
      <Button
        variant={confirming ? "destructive" : "ghost"}
        size={confirming ? "xs" : "icon-sm"}
        onClick={remove}
        disabled={deleteKey.isPending}
        aria-label={
          confirming ? t("common.confirmDelete") : t("apikeys.deleteLabel")
        }
        title={t("apikeys.deleteLabel")}
      >
        {deleteKey.isPending ? (
          <Loader2 className="animate-spin" />
        ) : (
          <Trash2 />
        )}
        {confirming && t("common.confirmDelete")}
      </Button>
    </li>
  )
}

// ── Panel ───────────────────────────────────────────────────────────────────

const ApiKeysPanelContent = () => {
  const { t } = useTranslation()
  const keysQuery = useApiKeys()
  const createKey = useApiKeyCreate()
  const keys = keysQuery.data ?? []

  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState("")
  const [createdKey, setCreatedKey] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (showForm) inputRef.current?.focus()
  }, [showForm])

  const create = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return
    try {
      const res = await createKey.mutateAsync({ name: trimmed })
      setCreatedKey(res.key)
      setName("")
      setShowForm(false)
    } catch (err) {
      notifyError(t("apikeys.errorCreate"), getErrorMessage(err, ""))
    }
  }

  return (
    <div>
      <PageHeader
        title={t("apikeys.title")}
        description={t("apikeys.description")}
        actions={
          !showForm && (
            <Button
              size="sm"
              onClick={() => {
                setShowForm(true)
                setCreatedKey(null)
              }}
            >
              <Plus />
              {t("apikeys.new")}
            </Button>
          )
        }
      />

      {createdKey && (
        <CreatedKey value={createdKey} onDismiss={() => setCreatedKey(null)} />
      )}

      {showForm && (
        <Card className="reveal mb-6 p-4">
          <form
            onSubmit={create}
            className="flex flex-col gap-3 sm:flex-row sm:items-end"
          >
            <div className="grid flex-1 gap-1.5">
              <label htmlFor="apikey-name" className="text-[13px] font-medium">
                {t("apikeys.nameLabel")}
              </label>
              <Input
                id="apikey-name"
                ref={inputRef}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("apikeys.namePlaceholder")}
                className="font-mono text-[13px]"
                onKeyDown={(e) => e.key === "Escape" && setShowForm(false)}
              />
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setShowForm(false)}
                className="flex-1 sm:flex-none"
              >
                {t("apikeys.cancel")}
              </Button>
              <Button
                type="submit"
                disabled={!name.trim() || createKey.isPending}
                className="flex-1 sm:flex-none"
              >
                {createKey.isPending && <Loader2 className="animate-spin" />}
                {createKey.isPending
                  ? t("apikeys.creating")
                  : t("apikeys.create")}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {keysQuery.isError ? (
        <EmptyState
          tone="danger"
          icon={ServerCrash}
          title={t("apikeys.errorLoad")}
          description={getErrorMessage(keysQuery.error, "")}
          action={
            <Button
              size="sm"
              variant="outline"
              onClick={() => keysQuery.refetch()}
            >
              {t("common.retry")}
            </Button>
          }
        />
      ) : keysQuery.isLoading ? (
        <div className="divide-y rounded-xl border">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3">
              <Skeleton className="size-8" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-3.5 w-32" />
                <Skeleton className="h-3 w-48" />
              </div>
            </div>
          ))}
        </div>
      ) : keys.length === 0 ? (
        !showForm && (
          <EmptyState
            icon={KeyRound}
            title={t("apikeys.empty")}
            description={t("apikeys.emptyDescription")}
            action={
              <Button size="sm" onClick={() => setShowForm(true)}>
                <Plus />
                {t("apikeys.new")}
              </Button>
            }
          />
        )
      ) : (
        <Card className="overflow-hidden">
          <ul className="divide-y">
            {keys.map((k, i) => (
              <ApiKeyRow key={k.id} apiKey={k} index={i} />
            ))}
          </ul>
        </Card>
      )}
    </div>
  )
}

export const ApiKeysPanel = withIsland(ApiKeysPanelContent)
