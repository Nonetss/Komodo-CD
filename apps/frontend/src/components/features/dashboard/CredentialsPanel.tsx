import { useEffect, useMemo, useState } from "react"
import "@/lib/i18n"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  AlertTriangle,
  ExternalLink,
  Loader2,
  Pencil,
  PlugZap,
  Server,
  ServerCrash,
  Trash2,
} from "lucide-react"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { z } from "zod"

import { EmptyState } from "@/components/app/empty-state"
import { PageHeader } from "@/components/app/page-header"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import type { Credential } from "@/lib/api-types"
import { getErrorMessage } from "@/lib/orpc"
import { notifyError, notifySuccess } from "@/lib/toast"
import { cn } from "@/lib/utils"
import { withQueryProvider } from "@/providers/query-provider"
import {
  useCredentials,
  useCredentialsDelete,
  useCredentialsSave,
} from "./hooks/use-credentials"
import { useStacks } from "./hooks/use-stacks"

type SaveFormValues = {
  name: string
  url: string
  key: string
  secret: string
}

// ── Estado de la conexión (según responda la lista de stacks) ──────────────

function ConnectionStatus() {
  const { t } = useTranslation()
  const stacks = useStacks()

  if (stacks.isLoading || (stacks.isFetching && !stacks.data)) {
    return (
      <span className="text-muted-foreground inline-flex items-center gap-2 text-xs">
        <Loader2 className="size-3.5 animate-spin" />
        {t("credentials.checking")}
      </span>
    )
  }
  if (stacks.isError) {
    return (
      <span className="text-danger inline-flex min-w-0 items-center gap-2 text-xs">
        <span className="bg-danger led size-1.5 shrink-0 rounded-full" />
        <span className="truncate">
          {t("credentials.unreachable")}
          {" · "}
          {getErrorMessage(stacks.error, "")}
        </span>
      </span>
    )
  }
  return (
    <span className="text-success inline-flex items-center gap-2 text-xs">
      <span className="bg-success led size-1.5 rounded-full" />
      {t("credentials.connected")}
      <span className="text-muted-foreground tabular">
        · {t("credentials.stacksCount", { count: stacks.data?.length ?? 0 })}
      </span>
    </span>
  )
}

function ConnectionCard({
  credential,
  onReplace,
}: {
  credential: Credential
  onReplace: () => void
}) {
  const { t } = useTranslation()
  const deleteCredentials = useCredentialsDelete()
  const [confirming, setConfirming] = useState(false)

  useEffect(() => {
    if (!confirming) return
    const timer = setTimeout(() => setConfirming(false), 3000)
    return () => clearTimeout(timer)
  }, [confirming])

  const remove = async () => {
    if (!credential.name) return
    if (!confirming) {
      setConfirming(true)
      return
    }
    setConfirming(false)
    try {
      await deleteCredentials.mutateAsync({ name: credential.name })
      notifySuccess(t("credentials.deleted", { name: credential.name }))
    } catch (err) {
      notifyError(t("credentials.errorDelete"), getErrorMessage(err, ""))
    }
  }

  return (
    <Card className="reveal overflow-hidden">
      <CardContent className="flex items-start gap-4">
        <div className="bg-primary/10 text-primary border-primary/20 flex size-11 shrink-0 items-center justify-center rounded-lg border">
          <Server className="size-5" />
        </div>
        <div className="min-w-0 flex-1 space-y-1.5">
          <p className="font-display text-lg leading-tight font-semibold">
            {credential.name ?? "—"}
          </p>
          {credential.url && (
            <a
              href={credential.url}
              target="_blank"
              rel="noreferrer"
              className="text-muted-foreground hover:text-foreground inline-flex max-w-full items-center gap-1.5 font-mono text-xs transition-colors"
            >
              <span className="truncate">{credential.url}</span>
              <ExternalLink className="size-3 shrink-0" />
            </a>
          )}
          <div>
            <ConnectionStatus />
          </div>
        </div>
      </CardContent>
      <CardFooter className="bg-muted/30 justify-end">
        <Button
          variant={confirming ? "destructive" : "ghost"}
          size="sm"
          onClick={remove}
          disabled={deleteCredentials.isPending}
          aria-label={t("credentials.deleteLabel")}
        >
          {deleteCredentials.isPending ? (
            <Loader2 className="animate-spin" />
          ) : (
            <Trash2 />
          )}
          {confirming ? t("common.confirmDelete") : t("common.delete")}
        </Button>
        <Button variant="outline" size="sm" onClick={onReplace}>
          <Pencil />
          {t("credentials.replace")}
        </Button>
      </CardFooter>
    </Card>
  )
}

// ── Formulario ──────────────────────────────────────────────────────────────

function ConnectionForm({
  replacing,
  onCancel,
  onSaved,
}: {
  replacing: boolean
  onCancel?: () => void
  onSaved: () => void
}) {
  const { t, i18n } = useTranslation()
  const saveCredentials = useCredentialsSave()

  const schema = useMemo(
    () =>
      z.object({
        name: z.string().trim().min(1, t("credentials.required")),
        url: z.url(t("credentials.invalidUrl")),
        key: z.string().trim().min(1, t("credentials.required")),
        secret: z.string().trim().min(1, t("credentials.required")),
      }),
    [i18n.language]
  )

  const form = useForm<SaveFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", url: "", key: "", secret: "" },
  })

  const onSubmit = async (data: SaveFormValues) => {
    try {
      const res = await saveCredentials.mutateAsync(data)
      notifySuccess(t("credentials.saved"), res.message)
      form.reset()
      onSaved()
    } catch (err) {
      notifyError(t("credentials.errorSave"), getErrorMessage(err, ""))
    }
  }

  const fields: {
    name: keyof SaveFormValues
    type?: string
    mono?: boolean
    autoComplete?: string
  }[] = [
    { name: "name" },
    { name: "url", type: "url", mono: true },
    { name: "key", type: "password", mono: true, autoComplete: "off" },
    { name: "secret", type: "password", mono: true, autoComplete: "off" },
  ]

  const label = {
    name: t("credentials.nameLabel"),
    url: t("credentials.urlLabel"),
    key: t("credentials.apiKeyLabel"),
    secret: t("credentials.secretLabel"),
  }
  const placeholder = {
    name: t("credentials.namePlaceholder"),
    url: t("credentials.urlPlaceholder"),
    key: t("credentials.apiKeyPlaceholder"),
    secret: t("credentials.secretPlaceholder"),
  }

  return (
    <Card className="reveal">
      <CardHeader>
        <CardTitle>{t("credentials.newTitle")}</CardTitle>
        <CardDescription>{t("credentials.newDescription")}</CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
          <CardContent className="space-y-4">
            {replacing && (
              <div className="bg-warning/10 border-warning/25 text-warning flex items-start gap-2 rounded-md border px-3 py-2 text-xs">
                <AlertTriangle className="mt-px size-3.5 shrink-0" />
                {t("credentials.replaceWarning")}
              </div>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              {fields.map((f) => (
                <FormField
                  key={f.name}
                  control={form.control}
                  name={f.name}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{label[f.name]}</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type={f.type ?? "text"}
                          placeholder={placeholder[f.name]}
                          autoComplete={f.autoComplete}
                          spellCheck={false}
                          className={cn(f.mono && "font-mono text-[13px]")}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ))}
            </div>
          </CardContent>
          <CardFooter className="justify-end">
            {onCancel && (
              <Button type="button" variant="ghost" onClick={onCancel}>
                {t("credentials.cancel")}
              </Button>
            )}
            <Button type="submit" disabled={saveCredentials.isPending}>
              {saveCredentials.isPending ? (
                <Loader2 className="animate-spin" />
              ) : (
                <PlugZap />
              )}
              {saveCredentials.isPending
                ? t("credentials.saving")
                : t("credentials.save")}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  )
}

// ── Guía lateral ────────────────────────────────────────────────────────────

function HowTo() {
  const { t } = useTranslation()
  const steps = [
    t("credentials.howStep1"),
    t("credentials.howStep2"),
    t("credentials.howStep3"),
    t("credentials.howStep4"),
  ]
  return (
    <aside className="reveal" style={{ "--i": 3 } as React.CSSProperties}>
      <p className="label-mono mb-3">{t("credentials.howTitle")}</p>
      <ol className="space-y-3">
        {steps.map((step, i) => (
          <li key={step} className="flex gap-3 text-[13px]">
            <span className="text-muted-foreground bg-card tabular flex size-6 shrink-0 items-center justify-center rounded-md border font-mono text-[11px]">
              {i + 1}
            </span>
            <span className="text-muted-foreground pt-0.5 text-pretty">
              {step}
            </span>
          </li>
        ))}
      </ol>
    </aside>
  )
}

// ── Panel ───────────────────────────────────────────────────────────────────

const CredentialsPanelContent = () => {
  const { t } = useTranslation()
  const credentialsQuery = useCredentials()
  const credential = credentialsQuery.data?.[0]
  const [editing, setEditing] = useState(false)

  let main: React.ReactNode
  if (credentialsQuery.isError) {
    main = (
      <EmptyState
        tone="danger"
        icon={ServerCrash}
        title={t("credentials.errorLoad")}
        description={getErrorMessage(credentialsQuery.error, "")}
        action={
          <Button
            size="sm"
            variant="outline"
            onClick={() => credentialsQuery.refetch()}
          >
            {t("common.retry")}
          </Button>
        }
      />
    )
  } else if (credentialsQuery.isLoading) {
    main = <Skeleton className="h-36 rounded-xl" />
  } else if (credential && !editing) {
    main = (
      <ConnectionCard
        credential={credential}
        onReplace={() => setEditing(true)}
      />
    )
  } else if (!credential && !editing) {
    main = (
      <EmptyState
        icon={PlugZap}
        title={t("credentials.empty")}
        description={t("credentials.emptyDescription")}
        action={
          <Button size="sm" onClick={() => setEditing(true)}>
            <PlugZap />
            {t("credentials.add")}
          </Button>
        }
      />
    )
  } else {
    main = (
      <ConnectionForm
        replacing={!!credential}
        onCancel={() => setEditing(false)}
        onSaved={() => setEditing(false)}
      />
    )
  }

  return (
    <div>
      <PageHeader
        title={t("credentials.title")}
        description={t("credentials.description")}
      />
      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="min-w-0">{main}</div>
        <HowTo />
      </div>
    </div>
  )
}

export const CredentialsPanel = withQueryProvider(CredentialsPanelContent)
