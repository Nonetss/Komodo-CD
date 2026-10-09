import { zodResolver } from "@hookform/resolvers/zod"
import { Save, Send } from "lucide-react"
import { useMemo } from "react"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { z } from "zod"

import { Panel } from "@/components/shared/layout/panel"
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
import { toastMutation } from "@/lib/toast"

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
    const saved = await toastMutation(
      () =>
        save.mutateAsync({
          ...payload(data),
          enabled: current?.enabled ?? true,
        }),
      { success: t("ntfy.saved"), error: t("ntfy.errorSave") }
    )
    if (!saved) return
    form.reset()
    onSaved()
  }

  const onTest = form.handleSubmit((data) =>
    toastMutation(() => test.mutateAsync(payload(data)), {
      success: t("ntfy.testSent"),
      error: t("ntfy.errorTest"),
    })
  )

  return (
    <Form {...form}>
      <Panel
        title={t("ntfy.formTitle")}
        description={t("ntfy.formDescription")}
        headingLevel="h3"
        form={{ onSubmit: form.handleSubmit(onSubmit), noValidate: true }}
        footer={
          <>
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                {t("common.cancel")}
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              icon={Send}
              loading={test.isPending}
              onClick={onTest}
            >
              {t("ntfy.test")}
            </Button>
            <Button type="submit" icon={Save} loading={save.isPending}>
              {save.isPending ? t("credentials.saving") : t("ntfy.save")}
            </Button>
          </>
        }
      >
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
      </Panel>
    </Form>
  )
}
