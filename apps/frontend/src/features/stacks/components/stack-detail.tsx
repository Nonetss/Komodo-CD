import { ArrowLeft } from "lucide-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"

import { Text, textVariants } from "@/components/shared/brand/typography"
import { CodeBlock } from "@/components/shared/data-display/code-block"
import { ColumnHeader } from "@/components/shared/data-display/column-header"
import { Segmented } from "@/components/shared/form/segmented"
import { SectionHeader } from "@/components/shared/layout/section-header"
import { StatStrip } from "@/components/shared/layout/stat-strip"
import { Button } from "@/components/ui/button"
import {
  ACTION_I18N,
  ACTION_ICON,
  buildDeployCurl,
  DEPLOY_ACTIONS,
  DeployCurlHint,
} from "@/entities/deploy-action"
import {
  commitChanged,
  hasUpdate,
  ImageRef,
  problemKind,
  StackStateTag,
} from "@/entities/stack"
import { StackDelete } from "@/features/stacks/components/stack-delete"
import { StackProblem } from "@/features/stacks/components/stack-problem"
import { StackSecurity } from "@/features/stacks/components/stack-security"
import { useAppUrl } from "@/hooks/use-app-url"
import type { DeployAction, Stack } from "@/lib/api-types"
import { cn } from "@/lib/utils"

/** Enlace de vuelta a la lista; solo en pantallas pequeñas, donde no se ve */
export function BackToList() {
  const { t } = useTranslation()
  return (
    <a
      href="/stacks"
      className={cn(
        textVariants({ role: "label", tone: "muted" }),
        "hover:text-foreground inline-flex w-fit items-center gap-2 py-2 lg:hidden"
      )}
    >
      <ArrowLeft aria-hidden className="size-3.5" />
      {t("stacks.back")}
    </a>
  )
}

/**
 * Ficha de un stack: cabecera con el nombre y las acciones (borrar incluido),
 * el problema si lo hay, los commits, el `curl` para CI, los servicios con su
 * imagen y sus vulnerabilidades.
 */
export function StackDetail({
  stack,
  runningAction,
  onAction,
}: {
  stack: Stack
  runningAction: DeployAction | null
  onAction: (action: DeployAction) => void
}) {
  const { t } = useTranslation()
  const appUrl = useAppUrl()
  const [curlAction, setCurlAction] = useState<DeployAction>("pull-redeploy")
  const { info } = stack
  const pending = hasUpdate(stack)
  const changed = commitChanged(stack)
  // Komodo solo da los commits de los stacks que salen de un repo git
  const fromRepo = !!(info.repo || info.linked_repo)
  const problem = problemKind(stack)
  const actionLabel = (a: DeployAction) =>
    t(`deploy.actions.${ACTION_I18N[a]}.label`)

  return (
    <article className="flex flex-col gap-10" aria-labelledby="stack-title">
      <div className="flex flex-col gap-5">
        <BackToList />
        <Text
          as="p"
          variant="label"
          tone="muted"
          className="flex flex-wrap gap-x-2"
        >
          {info.repo ? (
            <span className="min-w-0 break-all">
              {info.repo_link ? (
                <a
                  href={info.repo_link}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-foreground underline-offset-4 hover:underline"
                >
                  {info.repo}
                </a>
              ) : (
                info.repo
              )}
              {info.branch ? ` · ${info.branch}` : null}
            </span>
          ) : null}
          {info.repo ? <span aria-hidden>·</span> : null}
          <span>{t("stacks.services", { count: info.services.length })}</span>
        </Text>
        <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-5">
          <div className="min-w-0">
            <Text
              as="h2"
              id="stack-title"
              variant="display"
              className="lg:text-6xl"
            >
              {stack.name}
            </Text>
            <StackStateTag state={info.state} className="mt-4" />
          </div>
          <div className="flex flex-wrap gap-2">
            <StackDelete name={stack.name} disabled={runningAction !== null} />
            {DEPLOY_ACTIONS.map((action) => {
              const main = action === "pull-redeploy"
              // Solo la acción principal lleva texto; el resto, icono y tooltip
              return (
                <Button
                  key={action}
                  type="button"
                  variant={main ? (pending ? "signal" : "default") : "outline"}
                  size={main ? "default" : "icon"}
                  icon={ACTION_ICON[action]}
                  loading={runningAction === action}
                  disabled={runningAction !== null}
                  onClick={() => onAction(action)}
                  title={main ? undefined : actionLabel(action)}
                  aria-label={`${actionLabel(action)} ${stack.name}`}
                >
                  {main ? actionLabel(action) : null}
                </Button>
              )
            })}
          </div>
        </div>
      </div>

      {problem ? <StackProblem stack={stack} kind={problem} /> : null}

      {fromRepo ? (
        <StatStrip
          items={[
            {
              label: t("stacks.deployed"),
              value: info.deployed_hash ?? "—",
              mono: true,
            },
            {
              label: t("stacks.latestCommit"),
              value: changed
                ? `→ ${info.latest_hash}`
                : (info.latest_hash ?? "—"),
              mono: true,
              tone: changed ? "signal" : "muted",
            },
          ]}
        />
      ) : null}

      <section aria-labelledby="stack-ci" className="flex flex-col gap-4">
        <SectionHeader
          as="h3"
          id="stack-ci"
          title={t("stacks.ciTitle")}
          action={
            <Segmented
              value={curlAction}
              onChange={setCurlAction}
              aria-label={t("stacks.ciTitle")}
              options={DEPLOY_ACTIONS.map((a) => ({
                value: a,
                label: actionLabel(a),
              }))}
            />
          }
        />
        <CodeBlock
          language="shell"
          code={buildDeployCurl(appUrl, stack.name, curlAction)}
        />
        <DeployCurlHint />
      </section>

      <section aria-labelledby="stack-services" className="flex flex-col">
        <SectionHeader
          as="h3"
          id="stack-services"
          title={t("stacks.servicesTitle")}
          aside={info.services.length}
        />
        <div className="overflow-x-auto">
          <table className="w-full min-w-136 border-collapse">
            <thead>
              <tr className="text-left">
                <ColumnHeader>{t("stacks.serviceColumn")}</ColumnHeader>
                <ColumnHeader>{t("stacks.imageColumn")}</ColumnHeader>
                <ColumnHeader align="right">
                  {t("stacks.statusColumn")}
                </ColumnHeader>
              </tr>
            </thead>
            <tbody>
              {info.services.map((svc) => (
                <tr key={svc.service} className="border-t">
                  <th
                    scope="row"
                    className="py-3.5 pr-4 text-left align-baseline"
                  >
                    <Text variant="headline">{svc.service}</Text>
                  </th>
                  <td className="max-w-0 py-3.5 pr-4 align-baseline">
                    <ImageRef image={svc.image} />
                  </td>
                  <td className="py-3.5 text-right align-baseline whitespace-nowrap">
                    <Text
                      variant="label"
                      tone={svc.update_available ? "signal" : "muted"}
                    >
                      {svc.update_available
                        ? t("stacks.newImage")
                        : t("stacks.upToDate")}
                    </Text>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <StackSecurity stack={stack} />
    </article>
  )
}
