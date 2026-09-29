import { Loader2, Rocket } from "lucide-react"
import { useId, useState } from "react"
import { useTranslation } from "react-i18next"

import { Text } from "@/components/shared/brand/typography"
import { CodeBlock } from "@/components/shared/data-display/code-block"
import { StatusDot } from "@/components/shared/data-display/status-dot"
import { FormField } from "@/components/shared/form/field-label"
import { PageHero } from "@/components/shared/layout/page-hero"
import { Button } from "@/components/ui/button"
import { ActionChoice } from "@/features/deploy/components/action-choice"
import { DeployCurlHint } from "@/features/deploy/components/deploy-curl-hint"
import { StackCombobox } from "@/features/deploy/components/stack-combobox"
import { useDeployTrigger } from "@/features/deploy/hooks/use-deploy"
import {
  ACTION_I18N,
  buildDeployCurl,
} from "@/features/deploy/model/deploy-actions"
import { useStacks } from "@/features/stacks"
import { useAppUrl } from "@/hooks/use-app-url"
import { useHydrated } from "@/hooks/use-hydrated"
import type { DeployAction } from "@/lib/api-types"
import { getErrorMessage } from "@/lib/orpc"
import { notifyError, notifySuccess } from "@/lib/toast"
import { cn } from "@/lib/utils"
import { withIsland } from "@/providers/island"

type Result = { success: boolean; message: string; stack: string }

const DeployPageContent = () => {
  const { t } = useTranslation()
  const stacksQuery = useStacks()
  const deployTrigger = useDeployTrigger()
  const stacks = stacksQuery.data ?? []
  const appUrl = useAppUrl()
  const hydrated = useHydrated()
  const errorId = useId()

  const [stack, setStack] = useState("")
  const [action, setAction] = useState<DeployAction>("pull-redeploy")
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
    <div className="flex flex-col gap-6">
      <PageHero
        surface="deploy"
        title={t("deploy.title")}
        description={t("deploy.description")}
      />

      <form
        method="post"
        onSubmit={onSubmit}
        noValidate
        className="bg-card/40 rounded-xl border"
      >
        <div className="space-y-6 p-5">
          <FormField
            label={t("deploy.stackLabel")}
            htmlFor="deploy-stack"
            error={invalid ? t("deploy.required") : undefined}
            errorId={errorId}
          >
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
          </FormField>

          <ActionChoice value={action} onChange={setAction} />
        </div>

        <div className="flex flex-col items-stretch gap-3 border-t px-5 py-4 sm:flex-row sm:items-center">
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
          <Button type="submit" disabled={!hydrated || loading}>
            {loading ? <Loader2 className="animate-spin" /> : <Rocket />}
            {loading ? t("deploy.executing") : t("deploy.submit")}
          </Button>
        </div>
      </form>

      <section aria-labelledby="deploy-ci" className="mt-4 space-y-3">
        <div>
          <Text as="h2" id="deploy-ci" variant="label" tone="muted">
            {t("deploy.ciTitle")}
          </Text>
          <Text as="p" variant="meta" tone="muted" className="mt-1 text-pretty">
            {t("deploy.ciDescription")}
          </Text>
        </div>
        <CodeBlock
          language="shell"
          label={`POST /api/v0/deploy · ${action}`}
          code={buildDeployCurl(appUrl, stack.trim() || "mi-stack", action)}
        />
        <DeployCurlHint />
      </section>
    </div>
  )
}

export const DeployPage = withIsland(DeployPageContent)
