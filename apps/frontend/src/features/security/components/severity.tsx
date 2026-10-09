import { useTranslation } from "react-i18next"

import { Text } from "@/components/shared/brand/typography"
import { SEVERITY_INK, severityKey } from "@/features/security/model/severity"
import type { VulnerabilitySeverity } from "@/lib/api-types"
import { cn } from "@/lib/utils"

/** Severidad de una vulnerabilidad en micro-caps, teñida con su tono. */
export function SeverityTag({
  severity,
  className,
}: {
  severity: VulnerabilitySeverity
  className?: string
}) {
  const { t } = useTranslation()
  return (
    <Text
      variant="status"
      className={cn("whitespace-nowrap", SEVERITY_INK[severity], className)}
    >
      {t(`security.severity.${severityKey(severity)}`)}
    </Text>
  )
}

/**
 * Cifra de una columna de severidad: en su tono cuando hay alguna, un guion
 * apagado cuando es 0, para que salte a la vista lo que hay que mirar.
 */
export function SeverityCount({
  severity,
  value,
}: {
  severity: VulnerabilitySeverity
  value: number
}) {
  return value > 0 ? (
    <Text
      variant="data"
      className={cn("text-sm font-semibold", SEVERITY_INK[severity])}
    >
      {value}
    </Text>
  ) : (
    <Text variant="data" tone="muted" aria-label="0">
      —
    </Text>
  )
}
