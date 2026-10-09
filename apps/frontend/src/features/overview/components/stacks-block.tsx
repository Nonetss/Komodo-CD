import { useTranslation } from "react-i18next"

import { Text, textVariants } from "@/components/shared/brand/typography"
import { BlockLink } from "@/components/shared/layout/block-link"
import { SectionHeader } from "@/components/shared/layout/section-header"
import { StatStrip } from "@/components/shared/layout/stat-strip"
import {
  commitChanged,
  hasProblem,
  hasUpdate,
  isRunning,
  problemKind,
  StackLink,
  StackStateTag,
} from "@/entities/stack"
import { ShortList } from "@/features/overview/components/short-list"
import { StackedBar } from "@/features/overview/components/stacked-bar"
import type { Stack } from "@/lib/api-types"
import { cn } from "@/lib/utils"

/**
 * Motivo corto de un stack con problemas: el estado cuando el problema es el
 * estado (caído, desconocido…) y, si no, qué le falta.
 */
function ProblemTag({ stack }: { stack: Stack }) {
  const { t } = useTranslation()
  const kind = problemKind(stack)
  if (kind === "project-missing" || kind === "missing-files") {
    return (
      <Text variant="status" tone="destructive" className="shrink-0">
        {t(`overview.stacks.problem.${kind}`)}
      </Text>
    )
  }
  return <StackStateTag state={stack.info.state} className="shrink-0" />
}

/**
 * 01 · Stacks: el reparto por estado, las cifras de servicios y novedades y
 * qué stacks piden atención o tienen algo nuevo que desplegar. Sus cuatro
 * hijos son las filas que comparte con el bloque de seguridad (ver
 * `overview-page`).
 */
export function StacksBlock({
  stacks,
  className,
}: {
  /** Ordenados por nombre */
  stacks: Stack[]
  className?: string
}) {
  const { t } = useTranslation()
  const attention = stacks.filter(hasProblem)
  const updates = stacks.filter((s) => !hasProblem(s) && hasUpdate(s))
  const running = stacks.filter((s) => !hasProblem(s) && isRunning(s)).length
  const services = stacks.flatMap((s) => s.info.services)
  const newImages = services.filter((svc) => svc.update_available).length
  const pendingCommits = stacks.filter(commitChanged).length

  return (
    <section aria-labelledby="overview-stacks" className={className}>
      <SectionHeader
        number={1}
        id="overview-stacks"
        title={t("overview.stacks.title")}
        aside={t("overview.stacksAside", { count: stacks.length })}
        action={<BlockLink href="/stacks" label={t("overview.stacks.link")} />}
      />
      <StackedBar
        segments={[
          {
            key: "running",
            label: t("overview.stacks.states.running"),
            value: running,
            fill: "bg-success",
          },
          {
            key: "problems",
            label: t("overview.stacks.states.problems"),
            value: attention.length,
            fill: "bg-danger",
          },
          {
            key: "stopped",
            label: t("overview.stacks.states.stopped"),
            value: stacks.length - running - attention.length,
            fill: "bg-muted-foreground/40",
          },
        ]}
      />
      <StatStrip
        items={[
          { label: t("overview.stacks.services"), value: services.length },
          {
            label: t("overview.stacks.newImages"),
            value: newImages,
            tone: newImages > 0 ? "signal" : "muted",
          },
          {
            label: t("overview.stacks.pendingCommits"),
            value: pendingCommits,
            tone: pendingCommits > 0 ? "signal" : "muted",
          },
        ]}
      />
      <div className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
        <ShortList
          title={t("overview.stacks.attention")}
          items={attention}
          empty={t("overview.stacks.noAttention")}
          itemKey={(s) => s.id}
          renderItem={(s) => (
            <>
              <StackLink
                name={s.name}
                className={cn(
                  textVariants({ role: "name" }),
                  "min-w-0 truncate"
                )}
              />
              <ProblemTag stack={s} />
            </>
          )}
        />
        <ShortList
          title={t("overview.stacks.updates")}
          items={updates}
          empty={t("overview.stacks.noUpdates")}
          itemKey={(s) => s.id}
          renderItem={(s) => {
            const images = s.info.services.filter(
              (svc) => svc.update_available
            ).length
            return (
              <>
                <StackLink
                  name={s.name}
                  className={cn(
                    textVariants({ role: "name" }),
                    "min-w-0 truncate"
                  )}
                />
                <Text variant="data" tone="muted" className="shrink-0">
                  {[
                    images > 0
                      ? t("overview.stacks.imagesShort", { count: images })
                      : null,
                    commitChanged(s) ? t("overview.stacks.commitShort") : null,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </Text>
              </>
            )
          }}
        />
      </div>
    </section>
  )
}
