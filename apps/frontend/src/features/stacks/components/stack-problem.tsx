import { useTranslation } from "react-i18next"

import { Text } from "@/components/shared/brand/typography"
import type { ProblemKind } from "@/entities/stack"
import type { Stack } from "@/lib/api-types"

/** Franja "Requiere atención" de la ficha, entre dos trazos en el acento. */
export function StackProblem({
  stack,
  kind,
}: {
  stack: Stack
  kind: ProblemKind
}) {
  const { t } = useTranslation()
  return (
    <div className="border-signal flex flex-wrap items-baseline gap-x-5 gap-y-2 rule-y py-4">
      <Text variant="label" tone="signal">
        {t("problems.title")}
      </Text>
      <Text as="p" className="min-w-0 flex-1 basis-80 wrap-break-word">
        {t(`problems.${kind}`, {
          files: stack.info.missing_files.join(", "),
        })}
      </Text>
    </div>
  )
}
