import { zodResolver } from "@hookform/resolvers/zod"
import { useEffect, useMemo } from "react"
import { useForm, useWatch } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { z } from "zod"

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
import { useApiKeyCreate } from "@/features/api-keys/hooks/use-api-keys"
import { getErrorMessage } from "@/lib/orpc"
import { notifyError } from "@/lib/toast"

type CreateKeyValues = { name: string }

/** Alta de una API key: solo el nombre. La key creada la muestra la página. */
export function CreateKeyForm({
  onCreated,
  onCancel,
}: {
  onCreated: (key: string) => void
  onCancel: () => void
}) {
  const { t, i18n } = useTranslation()
  const createKey = useApiKeyCreate()

  const schema = useMemo(
    () =>
      z.object({ name: z.string().trim().min(1, t("credentials.required")) }),
    [i18n.language]
  )

  const form = useForm<CreateKeyValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "" },
  })
  const name = useWatch({ control: form.control, name: "name" })

  useEffect(() => {
    form.setFocus("name")
  }, [form])

  // Sin toast de éxito: la key recién creada se muestra en la página
  const onSubmit = async ({ name }: CreateKeyValues) => {
    try {
      const res = await createKey.mutateAsync({ name })
      onCreated(res.key)
    } catch (err) {
      notifyError(t("apikeys.errorCreate"), getErrorMessage(err, ""))
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        noValidate
        className="bg-surface flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-end sm:p-5"
      >
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem className="min-w-0 flex-1">
              <FormLabel>{t("apikeys.nameLabel")}</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder={t("apikeys.namePlaceholder")}
                  onKeyDown={(e) => e.key === "Escape" && onCancel()}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="flex-1 sm:flex-none"
          >
            {t("common.cancel")}
          </Button>
          <Button
            type="submit"
            disabled={!name.trim()}
            loading={createKey.isPending}
            className="flex-1 sm:flex-none"
          >
            {createKey.isPending ? t("apikeys.creating") : t("apikeys.create")}
          </Button>
        </div>
      </form>
    </Form>
  )
}
