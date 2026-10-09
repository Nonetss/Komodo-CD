import { useTranslation } from "react-i18next"

import { Text } from "@/components/shared/brand/typography"
import { SectionHeader } from "@/components/shared/layout/section-header"
import { StackLink, StackStateDot } from "@/entities/stack"
import type { Stack } from "@/lib/api-types"
import { cn } from "@/lib/utils"

/**
 * 03 · En marcha y 04 · Parados: lista compacta (punto, nombre enlazado y
 * nº de servicios) para lo que no pide nada. No se pinta si está vacía.
 */
export function CompactSection({
  number,
  id,
  title,
  stacks,
  className,
}: {
  number: number
  id: string
  title: string
  stacks: Stack[]
  className?: string
}) {
  const { t } = useTranslation()
  if (stacks.length === 0) return null

  return (
    <section
      aria-labelledby={id}
      className={cn("flex min-w-0 flex-col", className)}
    >
      <SectionHeader
        number={number}
        id={id}
        title={title}
        aside={t("overview.stacksAside", { count: stacks.length })}
      />
      <ul className="grid grid-cols-[repeat(auto-fill,minmax(13rem,1fr))] gap-x-8">
        {stacks.map((stack) => {
          const deploying = stack.info.state === "deploying"
          return (
            <li
              key={stack.id}
              className="flex min-w-0 items-center gap-2.5 border-b py-3"
            >
              <StackStateDot state={stack.info.state} />
              <StackLink
                name={stack.name}
                className="min-w-0 flex-1 truncate font-semibold"
              />
              <Text variant="data" tone={deploying ? "default" : "muted"}>
                {deploying
                  ? t("overview.deploying")
                  : t("overview.servicesShort", {
                      count: stack.info.services.length,
                    })}
              </Text>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
