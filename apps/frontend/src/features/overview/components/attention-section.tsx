import { useTranslation } from "react-i18next"

import { Text } from "@/components/shared/brand/typography"
import { SectionHeader } from "@/components/shared/layout/section-header"
import { Button } from "@/components/ui/button"
import { ACTION_ICON } from "@/entities/deploy-action"
import {
  problemKind,
  StackLink,
  StackStateTag,
  stackHref,
} from "@/entities/stack"
import type { DeployAction, Stack } from "@/lib/api-types"

/**
 * 01 · Requiere atención: un stack por fila con el motivo en una frase. Solo
 * se sugiere redeploy cuando puede arreglarlo (estado de peligro o
 * desconocido); si falta el proyecto o algún fichero, solo la ficha.
 */
export function AttentionSection({
  stacks,
  runningAction,
  onRedeploy,
}: {
  stacks: Stack[]
  runningAction: (name: string) => DeployAction | null
  onRedeploy: (name: string) => void
}) {
  const { t } = useTranslation()
  const RedeployIcon = ACTION_ICON.redeploy

  return (
    <section aria-labelledby="overview-attention" className="flex flex-col">
      <SectionHeader
        number={1}
        id="overview-attention"
        title={t("overview.attention.title")}
        aside={t("overview.stacksAside", { count: stacks.length })}
      />
      {stacks.length === 0 ? (
        <Text as="p" tone="muted" className="border-b py-5">
          {t("overview.attention.empty")}
        </Text>
      ) : (
        <ul className="divide-y border-b">
          {stacks.map((stack) => {
            const kind = problemKind(stack)
            const fixable = kind === "danger" || kind === "unknown"
            const running = runningAction(stack.name)
            const { info } = stack
            return (
              <li
                key={stack.id}
                className="flex flex-wrap items-center gap-x-8 gap-y-4 py-5"
              >
                <div className="flex min-w-0 flex-1 basis-96 flex-col gap-1.5">
                  <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                    <Text as="h3" variant="headline" className="text-xl">
                      <StackLink name={stack.name} />
                    </Text>
                    <StackStateTag state={info.state} />
                  </div>
                  {kind ? (
                    <Text as="p" className="max-w-prose text-pretty">
                      {t(`problems.${kind}`, {
                        files: info.missing_files.join(", "),
                      })}
                    </Text>
                  ) : null}
                  <Text
                    variant="data"
                    tone="muted"
                    className="flex flex-wrap gap-x-2"
                  >
                    <span>
                      {t("stacks.services", { count: info.services.length })}
                    </span>
                    {info.repo ? (
                      <span>
                        · {info.repo}@{info.branch}
                      </span>
                    ) : null}
                    {info.deployed_hash ? (
                      <span>· {info.deployed_hash}</span>
                    ) : null}
                  </Text>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button asChild variant="outline">
                    <a href={stackHref(stack.name)}>{t("overview.details")}</a>
                  </Button>
                  {fixable ? (
                    <Button
                      icon={RedeployIcon}
                      loading={running === "redeploy"}
                      disabled={running !== null}
                      onClick={() => onRedeploy(stack.name)}
                      aria-label={`${t("deploy.actions.redeploy.label")} ${stack.name}`}
                    >
                      {t("deploy.actions.redeploy.label")}
                    </Button>
                  ) : null}
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
