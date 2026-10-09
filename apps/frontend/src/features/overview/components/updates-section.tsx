import { useState } from "react"
import { useTranslation } from "react-i18next"

import { Text } from "@/components/shared/brand/typography"
import { InlineConfirm } from "@/components/shared/feedback/inline-confirm"
import { SectionHeader } from "@/components/shared/layout/section-header"
import { Button } from "@/components/ui/button"
import {
  ACTION_I18N,
  ACTION_ICON,
  DEPLOY_ACTIONS,
} from "@/entities/deploy-action"
import { commitChanged, ImageRef, stackHref } from "@/entities/stack"
import type { DeployAction, Stack } from "@/lib/api-types"
import { cn } from "@/lib/utils"

const COLUMNS = [
  { key: "stack", width: "w-[22%]" },
  { key: "changes", width: "" },
  { key: "commit", width: "w-44" },
] as const

/**
 * 02 · Hay algo nuevo que desplegar: qué cambia en cada stack (los servicios
 * con imagen nueva y el commit), sus acciones y, en la cabecera, un "pull +
 * redeploy" sobre todos que pide confirmación en el sitio.
 */
export function UpdatesSection({
  stacks,
  runningAction,
  bulkAction,
  onRun,
  onRunAll,
}: {
  stacks: Stack[]
  runningAction: (name: string) => DeployAction | null
  /** Acción del lote en curso, o `null` */
  bulkAction: DeployAction | null
  onRun: (name: string, action: DeployAction) => void
  onRunAll: () => void
}) {
  const { t } = useTranslation()
  const [confirming, setConfirming] = useState(false)
  const actionLabel = (a: DeployAction) =>
    t(`deploy.actions.${ACTION_I18N[a]}.label`)
  const allDisabled =
    bulkAction !== null || stacks.some((s) => runningAction(s.name) !== null)

  let headerAction: React.ReactNode = null
  if (stacks.length > 0) {
    headerAction = confirming ? (
      <InlineConfirm
        className="basis-full sm:basis-auto"
        message={t("overview.updates.confirm", { count: stacks.length })}
        confirmLabel={t("stacks.bulk.run")}
        onConfirm={() => {
          setConfirming(false)
          onRunAll()
        }}
        onCancel={() => setConfirming(false)}
      />
    ) : (
      <Button
        variant="signal"
        size="sm"
        icon={ACTION_ICON["pull-redeploy"]}
        loading={bulkAction !== null}
        disabled={allDisabled}
        onClick={() => setConfirming(true)}
      >
        {t("overview.updates.all", { count: stacks.length })}
      </Button>
    )
  }

  return (
    <section aria-labelledby="overview-updates" className="flex flex-col">
      <SectionHeader
        number={2}
        id="overview-updates"
        title={t("overview.updates.title")}
        aside={
          stacks.length === 0
            ? t("overview.stacksAside", { count: 0 })
            : undefined
        }
        action={headerAction}
      />
      {stacks.length === 0 ? (
        <Text as="p" tone="muted" className="border-b py-5">
          {t("overview.updates.empty")}
        </Text>
      ) : (
        <div className="overflow-x-auto border-b">
          <table className="w-full min-w-176 border-collapse">
            <thead>
              <tr className="text-left">
                {COLUMNS.map(({ key, width }) => (
                  <th
                    key={key}
                    scope="col"
                    className={cn("py-3 pr-4 font-normal", width)}
                  >
                    <Text variant="label" tone="muted">
                      {t(`overview.updates.columns.${key}`)}
                    </Text>
                  </th>
                ))}
                <th scope="col" className="w-36 py-3 text-right font-normal">
                  <Text variant="label" tone="muted">
                    {t("overview.updates.columns.actions")}
                  </Text>
                </th>
              </tr>
            </thead>
            <tbody>
              {stacks.map((stack) => {
                const { info } = stack
                const changed = commitChanged(stack)
                const running = runningAction(stack.name)
                const services = info.services.filter((s) => s.update_available)
                return (
                  <tr key={stack.id} className="border-t align-top">
                    <th scope="row" className="py-4 pr-4 text-left">
                      <Text variant="headline">
                        <a
                          href={stackHref(stack.name)}
                          className="hover:text-signal underline-offset-4 hover:underline"
                        >
                          {stack.name}
                        </a>
                      </Text>
                    </th>
                    <td className="max-w-0 py-4 pr-4">
                      {services.length === 0 ? (
                        <Text variant="meta" tone="muted">
                          {t("overview.updates.commitOnly")}
                        </Text>
                      ) : (
                        <ul className="flex flex-col gap-1">
                          {services.map((svc) => (
                            <li
                              key={svc.service}
                              className="flex min-w-0 items-baseline gap-3"
                            >
                              <Text
                                variant="data"
                                tone="muted"
                                className="shrink-0"
                              >
                                {svc.service}
                              </Text>
                              <ImageRef image={svc.image} />
                            </li>
                          ))}
                        </ul>
                      )}
                    </td>
                    <td className="py-4 pr-4">
                      <Text variant="data">
                        {info.deployed_hash ?? "—"}
                        {changed ? (
                          <span className="text-signal">
                            {" "}
                            → {info.latest_hash}
                          </span>
                        ) : null}
                      </Text>
                    </td>
                    <td className="py-2.5 text-right whitespace-nowrap">
                      {DEPLOY_ACTIONS.map((action) => (
                        <Button
                          key={action}
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          icon={ACTION_ICON[action]}
                          loading={running === action}
                          disabled={running !== null}
                          onClick={() => onRun(stack.name, action)}
                          title={actionLabel(action)}
                          aria-label={`${actionLabel(action)} ${stack.name}`}
                          className={cn(
                            action === "pull-redeploy"
                              ? "text-signal hover:text-signal"
                              : "text-muted-foreground hover:text-foreground"
                          )}
                        />
                      ))}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
