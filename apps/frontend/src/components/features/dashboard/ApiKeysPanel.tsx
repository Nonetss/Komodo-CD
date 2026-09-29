import { useEffect, useState } from "react"
import "@/lib/i18n"
import { Check, Copy, Plus, RefreshCw, Trash2 } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { type ApiKey, apiKeysApi } from "@/lib/api"

const APP_URL =
  (import.meta.env.PUBLIC_APP_URL as string | undefined)?.replace(/\/$/, "") ??
  window.location.origin

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`bg-muted/60 animate-pulse rounded-md ${className}`} />
}

export const ApiKeysPanel = () => {
  const { t, i18n } = useTranslation()
  const [keys, setKeys] = useState<ApiKey[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [newKeyName, setNewKeyName] = useState("")
  const [showForm, setShowForm] = useState(false)
  const [createdKey, setCreatedKey] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  const fetchKeys = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await apiKeysApi.list()
      setKeys(res.data.keys)
    } catch {
      setError(t("apikeys.errorLoad"))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchKeys()
  }, [])

  useEffect(() => {
    if (!confirmDelete) return
    const t = setTimeout(() => setConfirmDelete(null), 3000)
    return () => clearTimeout(t)
  }, [confirmDelete])

  const handleCreate = async () => {
    if (!newKeyName.trim()) return
    setError(null)
    try {
      const res = await apiKeysApi.create(newKeyName.trim())
      setCreatedKey(res.data.key)
      setNewKeyName("")
      setShowForm(false)
      await fetchKeys()
    } catch {
      setError(t("apikeys.errorCreate"))
    }
  }

  const handleDelete = async (id: string) => {
    if (confirmDelete !== id) {
      setConfirmDelete(id)
      return
    }
    setConfirmDelete(null)
    setError(null)
    try {
      await apiKeysApi.delete(id)
      await fetchKeys()
    } catch {
      setError(t("apikeys.errorDelete"))
    }
  }

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-3">
        <CardTitle>{t("apikeys.title")}</CardTitle>
        <div className="flex shrink-0 gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={fetchKeys}
            disabled={loading}
            aria-label={t("apikeys.refresh")}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
          <Button
            size="sm"
            onClick={() => {
              setShowForm((v) => !v)
              setCreatedKey(null)
            }}
          >
            <Plus className="h-4 w-4" />
            {showForm ? t("apikeys.cancel") : t("apikeys.new")}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && <p className="text-destructive text-sm">{error}</p>}

        {createdKey && (
          <div className="space-y-3 rounded-lg border border-emerald-800 bg-emerald-950/20 p-4">
            <p className="text-sm font-medium text-emerald-400">
              {t("apikeys.keyCreated")}
            </p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                readOnly
                value={createdKey}
                className="font-mono text-xs"
              />
              <Button
                variant="outline"
                size="icon"
                className="shrink-0"
                onClick={() => handleCopy(createdKey)}
                aria-label={t("apikeys.copyKey")}
              >
                {copied ? (
                  <Check className="h-4 w-4 text-emerald-400" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-muted-foreground text-xs">
              {t("apikeys.useInGithubActions")}
            </p>
            <pre className="bg-muted overflow-x-auto rounded-md p-3 text-xs break-all whitespace-pre-wrap">
              {`curl -X POST ${APP_URL}/api/v0/deploy \\
  -H "x-api-key: ${createdKey}" \\
  -H "Content-Type: application/json" \\
  -d '{"stack":"mi-stack","action":"redeploy"}'`}
            </pre>
          </div>
        )}

        {showForm && (
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              placeholder={t("apikeys.namePlaceholder")}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            />
            <Button
              className="w-full shrink-0 sm:w-auto"
              onClick={handleCreate}
            >
              {t("apikeys.create")}
            </Button>
          </div>
        )}

        {/* Skeleton */}
        {loading && keys.length === 0 && (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="border-border flex items-center justify-between rounded-lg border p-3"
              >
                <div className="space-y-2">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-3 w-40" />
                  <Skeleton className="h-3 w-20" />
                </div>
                <Skeleton className="h-8 w-8 rounded-md" />
              </div>
            ))}
          </div>
        )}

        {keys.length === 0 && !loading && (
          <p className="text-muted-foreground text-sm">{t("apikeys.empty")}</p>
        )}

        <div className="space-y-2">
          {keys.map((k) => (
            <div
              key={k.id}
              className="border-border bg-card flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3"
            >
              <div className="min-w-0">
                <p className="font-medium">{k.name ?? "—"}</p>
                <p className="text-muted-foreground font-mono text-xs break-all">
                  {k.start ? `${k.start}...` : k.id}
                </p>
                <p className="text-muted-foreground text-xs">
                  {new Intl.DateTimeFormat(i18n.language, {
                    dateStyle: "short",
                  }).format(new Date(k.createdAt))}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {confirmDelete === k.id && (
                  <span className="text-destructive text-xs">
                    {t("apikeys.confirmDelete")}
                  </span>
                )}
                <Button
                  variant={confirmDelete === k.id ? "destructive" : "outline"}
                  size="icon"
                  onClick={() => handleDelete(k.id)}
                  aria-label={
                    confirmDelete === k.id
                      ? t("apikeys.confirmDeleteLabel")
                      : t("apikeys.deleteLabel")
                  }
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
