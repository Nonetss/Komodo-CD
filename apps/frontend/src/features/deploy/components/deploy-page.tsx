import { zodResolver } from "@hookform/resolvers/zod"
import { Rocket } from "lucide-react"
import { useMemo, useState } from "react"
import { useForm, useWatch } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { z } from "zod"

import { Text } from "@/components/shared/brand/typography"
import { CodeBlock } from "@/components/shared/data-display/code-block"
import { StatusDot } from "@/components/shared/data-display/status-dot"
import { PageHero } from "@/components/shared/layout/page-hero"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  ACTION_I18N,
  buildDeployCurl,
  DEPLOY_ACTIONS,
  DeployCurlHint,
  useDeployTrigger,
} from "@/entities/deploy-action"
import { useStacks } from "@/entities/stack"
import { ActionChoice } from "@/features/deploy/components/action-choice"
import { StackCombobox } from "@/features/deploy/components/stack-combobox"
import { useAppUrl } from "@/hooks/use-app-url"
import { useHydrated } from "@/hooks/use-hydrated"
import type { DeployAction } from "@/lib/api-types"
import { getErrorMessage } from "@/lib/orpc"
import { notifyError, notifySuccess } from "@/lib/toast"
import { cn } from "@/lib/utils"
import { withIsland } from "@/providers/island"

type DeployFormValues = { stack: string; action: DeployAction }

type Result = { success: boolean; message: string; stack: string }

const DeployPageContent = () => {
  const { t, i18n } = useTranslation()
  const stacksQuery = useStacks()
  const deployTrigger = useDeployTrigger()
  const stacks = stacksQuery.data ?? []
  const appUrl = useAppUrl()
  const hydrated = useHydrated()
  const [result, setResult] = useState<Result | null>(null)

  const schema = useMemo(
    () =>
      z.object({
        stack: z.string().trim().min(1, t("deploy.required")),
        action: z.enum(DEPLOY_ACTIONS),
      }),
    [i18n.language]
  )

  const form = useForm<DeployFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { stack: "", action: "pull-redeploy" },
  })
  const [stack, action] = useWatch({
    control: form.control,
    name: ["stack", "action"],
  })

  // El resultado se muestra también en línea: aquí no vale toastMutation
  const onSubmit = async ({ stack: name, action }: DeployFormValues) => {
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
    <div className="flex flex-col gap-6">
      <PageHero
        title={t("deploy.title")}
        description={t("deploy.description")}
      />

      <Form {...form}>
        <form
          method="post"
          onSubmit={form.handleSubmit(onSubmit)}
          noValidate
          className="border-rule rule-t border-b"
        >
          <div className="space-y-6 py-5">
            <FormField
              control={form.control}
              name="stack"
              render={({ field }) => (
                <FormItem className="min-w-0">
                  <FormLabel>{t("deploy.stackLabel")}</FormLabel>
                  <FormControl>
                    <StackCombobox
                      {...field}
                      stacks={stacks}
                      loading={stacksQuery.isLoading}
                      onChange={(value) => {
                        field.onChange(value)
                        setResult(null)
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="action"
              render={({ field }) => (
                <ActionChoice value={field.value} onChange={field.onChange} />
              )}
            />
          </div>

          <div className="flex flex-col items-stretch gap-3 border-t py-4 sm:flex-row sm:items-center">
            <div role="status" className="min-w-0 flex-1">
              {result && (
                <p className="text-meta flex items-start gap-2">
                  <StatusDot
                    tone={result.success ? "success" : "danger"}
                    className="mt-1.5"
                  />
                  <span
                    className={cn(
                      "min-w-0 wrap-break-word",
                      result.success ? "text-muted-foreground" : "text-danger"
                    )}
                  >
                    {result.message}
                  </span>
                </p>
              )}
            </div>
            <Button
              type="submit"
              icon={Rocket}
              loading={deployTrigger.isPending}
              disabled={!hydrated}
            >
              {deployTrigger.isPending
                ? t("deploy.executing")
                : t("deploy.submit")}
            </Button>
          </div>
        </form>
      </Form>

      <section aria-labelledby="deploy-ci" className="mt-4 space-y-3">
        <div>
          <Text as="h2" id="deploy-ci" variant="caption">
            {t("deploy.ciTitle")}
          </Text>
          <Text as="p" variant="meta" tone="muted" className="mt-1 text-pretty">
            {t("deploy.ciDescription")}
          </Text>
        </div>
        <CodeBlock
          language="shell"
          label={`POST /api/v0/deploy · ${action}`}
          code={buildDeployCurl(
            appUrl,
            stack.trim() || t("deploy.exampleStack"),
            action
          )}
        />
        <DeployCurlHint />
      </section>
    </div>
  )
}

export const DeployPage = withIsland(DeployPageContent)
