import { zodResolver } from "@hookform/resolvers/zod"
import { AlertTriangle, Loader2, Save } from "lucide-react"
import { useMemo } from "react"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { z } from "zod"

import { Text } from "@/components/shared/brand/typography"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { useCredentialsSave } from "@/features/credentials/hooks/use-credentials"
import { getErrorMessage } from "@/lib/orpc"
import { notifyError, notifySuccess } from "@/lib/toast"
import { cn } from "@/lib/utils"

type SaveFormValues = {
  name: string
  url: string
  key: string
  secret: string
}

export function ConnectionForm({
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
    <section className="bg-card/40 rounded-xl border">
      <header className="space-y-1.5 border-b px-5 py-4">
        <Text as="h2" variant="headline">
          {t("credentials.newTitle")}
        </Text>
        <Text as="p" variant="meta" tone="muted" className="text-pretty">
          {t("credentials.newDescription")}
        </Text>
      </header>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
          <div className="space-y-5 p-5">
            {replacing && (
              <p className="text-warning text-meta flex items-start gap-2">
                <AlertTriangle
                  aria-hidden
                  className="mt-0.5 size-3.5 shrink-0"
                />
                {t("credentials.replaceWarning")}
              </p>
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
                          className={cn(f.mono && "font-mono md:text-xs")}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2 border-t px-5 py-4">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                {t("credentials.cancel")}
              </Button>
            )}
            <Button type="submit" disabled={saveCredentials.isPending}>
              {saveCredentials.isPending ? (
                <Loader2 className="animate-spin" />
              ) : (
                <Save />
              )}
              {saveCredentials.isPending
                ? t("credentials.saving")
                : t("credentials.save")}
            </Button>
          </div>
        </form>
      </Form>
    </section>
  )
}
