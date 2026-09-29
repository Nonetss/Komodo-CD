import { useEffect, useMemo, useRef, useState } from "react"
import "@/lib/i18n"
import { zodResolver } from "@hookform/resolvers/zod"
import { CheckCircle2, Layers, XCircle } from "lucide-react"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { type DeployAction, deployApi, stacksApi } from "@/lib/api"

type DeployFormValues = {
  stack: string
  action: DeployAction
}

export const DeployPanel = () => {
  const { t, i18n } = useTranslation()
  const [result, setResult] = useState<{
    success: boolean
    message: string
  } | null>(null)
  const [loading, setLoading] = useState(false)
  const [stackNames, setStackNames] = useState<string[]>([])
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const suggestionsRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const ACTIONS = useMemo(
    () => [
      {
        value: "pull" as DeployAction,
        label: "Pull",
        description: t("deploy.actions.pull.description"),
      },
      {
        value: "redeploy" as DeployAction,
        label: "Redeploy",
        description: t("deploy.actions.redeploy.description"),
      },
      {
        value: "pull-redeploy" as DeployAction,
        label: "Pull + Redeploy",
        description: t("deploy.actions.pullRedeploy.description"),
      },
    ],
    [i18n.language]
  )

  const deploySchema = useMemo(
    () =>
      z.object({
        stack: z.string().min(1, t("deploy.required")),
        action: z.enum(["pull", "redeploy", "pull-redeploy"]),
      }),
    [i18n.language]
  )

  useEffect(() => {
    stacksApi
      .list()
      .then((res) => {
        setStackNames(res.data.stacks.map((s) => s.name))
      })
      .catch(() => {})
  }, [])

  const form = useForm<DeployFormValues>({
    resolver: zodResolver(deploySchema),
    defaultValues: { stack: "", action: "redeploy" as const },
  })

  const watchedStack = form.watch("stack")

  useEffect(() => {
    const query = watchedStack.trim().toLowerCase()
    setSuggestions(
      query.length === 0
        ? stackNames
        : stackNames.filter((n) => n.toLowerCase().includes(query))
    )
  }, [watchedStack, stackNames])

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  const onSubmit = async (data: DeployFormValues) => {
    setResult(null)
    setLoading(true)
    try {
      const res = await deployApi.trigger(data)
      setResult({ success: res.data.success, message: res.data.message })
    } catch (err: any) {
      const msg = err?.response?.data?.error ?? t("deploy.error")
      setResult({ success: false, message: msg })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-2xl space-y-6">
      <div>
        <h2 className="text-xl font-semibold">{t("deploy.title")}</h2>
        <p className="text-muted-foreground mt-0.5 text-sm">
          {t("deploy.description")}
        </p>
      </div>

      <Card>
        <CardContent className="space-y-6 pt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Stack with autocomplete */}
              <FormField
                control={form.control}
                name="stack"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("deploy.stackLabel")}</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          {...field}
                          ref={inputRef}
                          placeholder={t("deploy.stackPlaceholder")}
                          autoComplete="off"
                          onFocus={() => setShowSuggestions(true)}
                          onChange={(e) => {
                            field.onChange(e)
                            setShowSuggestions(true)
                          }}
                        />
                        {showSuggestions && suggestions.length > 0 && (
                          <div
                            ref={suggestionsRef}
                            className="bg-card border-border absolute top-full right-0 left-0 z-50 mt-1 max-h-52 overflow-y-auto rounded-md border shadow-xl"
                          >
                            {suggestions.map((name) => (
                              <button
                                key={name}
                                type="button"
                                className="hover:bg-accent text-foreground flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm transition-colors"
                                onMouseDown={(e) => {
                                  e.preventDefault()
                                  field.onChange(name)
                                  setShowSuggestions(false)
                                }}
                              >
                                <Layers className="text-muted-foreground h-3.5 w-3.5 shrink-0" />
                                {name}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Action cards */}
              <FormField
                control={form.control}
                name="action"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("deploy.actionLabel")}</FormLabel>
                    <FormControl>
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        {ACTIONS.map((a) => (
                          <button
                            key={a.value}
                            type="button"
                            onClick={() => field.onChange(a.value)}
                            className={`flex flex-col items-start gap-1.5 rounded-lg border p-4 text-left transition-colors ${
                              field.value === a.value
                                ? "border-primary bg-primary/10"
                                : "border-border bg-muted/40 hover:bg-accent hover:border-border/80"
                            }`}
                          >
                            <span
                              className={`text-sm font-semibold ${field.value === a.value ? "text-primary" : ""}`}
                            >
                              {a.label}
                            </span>
                            <span className="text-muted-foreground text-xs leading-snug">
                              {a.description}
                            </span>
                          </button>
                        ))}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={loading}
              >
                {loading ? t("deploy.executing") : t("deploy.submit")}
              </Button>
            </form>
          </Form>

          {result && (
            <div
              className={`flex items-start gap-3 rounded-lg border p-4 text-sm ${
                result.success
                  ? "border-emerald-800 bg-emerald-950/20 text-emerald-400"
                  : "text-destructive border-red-900 bg-red-950/20"
              }`}
            >
              {result.success ? (
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
              ) : (
                <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
              )}
              {result.message}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
