import { useTranslation } from "react-i18next"

import { Text } from "@/components/shared/brand/typography"
import { BlockLink } from "@/components/shared/layout/block-link"
import { SectionHeader } from "@/components/shared/layout/section-header"
import { StatStrip } from "@/components/shared/layout/stat-strip"
import {
  commitChanged,
  hasProblem,
  hasUpdate,
  isRunning,
  StackLink,
  StackStateTag,
} from "@/entities/stack"
import type { Stack } from "@/lib/api-types"
import { cn } from "@/lib/utils"

// Nombres a la vista en cada lista; el resto, tras "y N más"
const NAMES_SHOWN = 6

/**
 * Reparto en una barra apilada: en marcha, con problemas y el resto (parados
 * o de paso). Cada tramo lleva su tono de estado y la leyenda, las cifras.
 */
function StateBar({ stacks }: { stacks: Stack[] }) {
  const { t } = useTranslation()
  const problems = stacks.filter(hasProblem).length
  const running = stacks.filter((s) => !hasProblem(s) && isRunning(s)).length
  const segments = [
    { key: "running", value: running, fill: "bg-success" },
    { key: "problems", value: problems, fill: "bg-danger" },
    {
      key: "stopped",
      value: stacks.length - running - problems,
      fill: "bg-muted-foreground/40",
    },
  ] as const

  return (
    <figure className="flex flex-col gap-3">
      <div aria-hidden className="flex h-3 gap-0.5">
        {segments.map((s) =>
          s.value > 0 ? (
            <span
              key={s.key}
              className={cn("min-w-1 last:rounded-r-sm", s.fill)}
              style={{ flexGrow: s.value }}
              title={`${t(`overview.stacks.states.${s.key}`)}: ${s.value}`}
            />
          ) : null
        )}
      </div>
      <figcaption>
        <ul className="flex flex-wrap gap-x-5 gap-y-1">
          {segments.map((s) => (
            <li key={s.key} className="inline-flex items-center gap-1.5">
              <span aria-hidden className={cn("size-2 rounded-xs", s.fill)} />
              <Text variant="meta-sm" tone="muted">
                {t(`overview.stacks.states.${s.key}`)}
              </Text>
              <Text variant="data">{s.value}</Text>
            </li>
          ))}
        </ul>
      </figcaption>
    </figure>
  )
}

/** Lista corta de stacks enlazados con un detalle a la derecha. */
function StackNames({
  title,
  stacks,
  empty,
  detail,
}: {
  title: string
  stacks: Stack[]
  empty: string
  detail: (stack: Stack) => React.ReactNode
}) {
  const { t } = useTranslation()
  const hidden = stacks.length - NAMES_SHOWN
  return (
    <div className="flex min-w-0 flex-col gap-2">
      <Text as="h3" variant="caption">
        {title}
      </Text>
      {stacks.length === 0 ? (
        <Text as="p" variant="meta" tone="muted">
          {empty}
        </Text>
      ) : (
        <ul className="divide-y border-y">
          {stacks.slice(0, NAMES_SHOWN).map((stack) => (
            <li
              key={stack.id}
              className="flex min-w-0 items-center justify-between gap-3 py-2"
            >
              <StackLink
                name={stack.name}
                className="min-w-0 truncate font-semibold"
              />
              {detail(stack)}
            </li>
          ))}
          {hidden > 0 ? (
            <li className="py-2">
              <Text variant="meta-sm" tone="muted">
                {t("overview.stacks.more", { count: hidden })}
              </Text>
            </li>
          ) : null}
        </ul>
      )}
    </div>
  )
}

/**
 * 01 · Stacks: el reparto por estado, las cifras de servicios y novedades y
 * qué stacks piden atención o tienen algo nuevo que desplegar.
 */
export function StacksBlock({ stacks }: { stacks: Stack[] }) {
  const { t } = useTranslation()
  const sorted = [...stacks].sort((a, b) => a.name.localeCompare(b.name))
  const attention = sorted.filter(hasProblem)
  const updates = sorted.filter((s) => !hasProblem(s) && hasUpdate(s))
  const services = stacks.flatMap((s) => s.info.services)
  const newImages = services.filter((svc) => svc.update_available).length
  const pendingCommits = stacks.filter(commitChanged).length

  return (
    <section aria-labelledby="overview-stacks" className="flex flex-col gap-6">
      <SectionHeader
        number={1}
        id="overview-stacks"
        title={t("overview.stacks.title")}
        aside={t("overview.stacksAside", { count: stacks.length })}
        action={<BlockLink href="/stacks" label={t("overview.stacks.link")} />}
      />
      <StateBar stacks={stacks} />
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
        <StackNames
          title={t("overview.stacks.attention")}
          stacks={attention}
          empty={t("overview.stacks.noAttention")}
          detail={(s) => <StackStateTag state={s.info.state} />}
        />
        <StackNames
          title={t("overview.stacks.updates")}
          stacks={updates}
          empty={t("overview.stacks.noUpdates")}
          detail={(s) => {
            const images = s.info.services.filter(
              (svc) => svc.update_available
            ).length
            return (
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
            )
          }}
        />
      </div>
    </section>
  )
}
