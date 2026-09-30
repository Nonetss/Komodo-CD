import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2, Save, Send } from "lucide-react"
import { useMemo } from "react"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { z } from "zod"

import { Text } from "@/components/shared/brand/typography"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { useNtfySave, useNtfyTest } from "@/features/credentials/hooks/use-ntfy"
import type { NtfyConfig } from "@/lib/api-types"
import { getErrorMessage } from "@/lib/orpc"
import { notifyError, notifySuccess } from "@/lib/toast"

type NtfyFormValues = {
  url: string
  topic: string
  token: string
}

export function NtfyForm({
  current,
  onCancel,
  onSaved,
}: {
  /** Configuración que se está editando, si la hay */
  current?: NtfyConfig
  onCancel?: () => void
  onSaved: () => void
}) {
  const { t, i18n } = useTranslation()
  const save = useNtfySave()
  const test = useNtfyTest()

  const schema = useMemo(
    () =>
      z.object({
        url: z.url(t("credentials.invalidUrl")),
        topic: z
          .string()
          .trim()
          .regex(/^[-_A-Za-z0-9]{1,64}$/, t("ntfy.invalidTopic")),
        token: z.string().trim(),
      }),
    [i18n.language]
  )

  const form = useForm<NtfyFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      url: current?.url ?? "https://ntfy.sh",
      topic: current?.topic ?? "",
      token: "",
    },
  })

  // Con un token ya guardado, dejar el campo vacío lo conserva (el backend
  // interpreta `undefined` como "no tocar").
  const payload = (data: NtfyFormValues) => ({
    url: data.url,
    topic: data.topic,
    token: data.token || (current?.hasToken ? undefined : ""),
  })

  const onSubmit = async (data: NtfyFormValues) => {
    try {
      const res = await save.mutateAsync({
        ...payload(data),
        enabled: current?.enabled ?? true,
      })
      notifySuccess(t("ntfy.saved"), res.message)
      form.reset()
      onSaved()
    } catch (err) {
      notifyError(t("ntfy.errorSave"), getErrorMessage(err, ""))
    }
  }

  const onTest = form.handleSubmit(async (data) => {
    try {
      const res = await test.mutateAsync(payload(data))
      notifySuccess(t("ntfy.testSent"), res.message)
    } catch (err) {
      notifyError(t("ntfy.errorTest"), getErrorMessage(err, ""))
    }
  })

  return (
    <section className="bg-surface rounded-xl border">
      <header className="space-y-1.5 border-b px-5 py-4">
        <Text as="h3" variant="headline">
          {t("ntfy.formTitle")}
        </Text>
        <Text as="p" variant="meta" tone="muted" className="text-pretty">
          {t("ntfy.formDescription")}
        </Text>
      </header>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
          <div className="grid gap-4 p-5 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("ntfy.urlLabel")}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="url"
                      placeholder="https://ntfy.sh"
                      spellCheck={false}
                      className="font-mono md:text-xs"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="topic"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("ntfy.topicLabel")}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder={t("ntfy.topicPlaceholder")}
                      spellCheck={false}
                      className="font-mono md:text-xs"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="token"
              render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel>{t("ntfy.tokenLabel")}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="password"
                      placeholder={
                        current?.hasToken
                          ? t("ntfy.tokenKeep")
                          : t("ntfy.tokenPlaceholder")
                      }
                      autoComplete="off"
                      spellCheck={false}
                      className="font-mono md:text-xs"
                    />
                  </FormControl>
                  <FormDescription>{t("ntfy.tokenHint")}</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="flex flex-wrap justify-end gap-2 border-t px-5 py-4">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                {t("credentials.cancel")}
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              onClick={onTest}
              disabled={test.isPending}
            >
              {test.isPending ? <Loader2 className="animate-spin" /> : <Send />}
              {t("ntfy.test")}
            </Button>
            <Button type="submit" disabled={save.isPending}>
              {save.isPending ? <Loader2 className="animate-spin" /> : <Save />}
              {save.isPending ? t("credentials.saving") : t("ntfy.save")}
            </Button>
          </div>
        </form>
      </Form>
    </section>
  )
}
