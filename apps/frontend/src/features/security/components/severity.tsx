import { useTranslation } from "react-i18next"

import { Text } from "@/components/shared/brand/typography"
import {
  SEVERITIES,
  SEVERITY_INK,
  severityKey,
} from "@/features/security/model/severity"
import type { ImageSummary, VulnerabilitySeverity } from "@/lib/api-types"
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
 * Recuento por severidad de una imagen ("C 1 · H 3 · M 0 …"): cada cifra con
 * la inicial de su severidad, en tinta solo si es distinta de 0.
 */
export function SeverityCounts({
  counts,
  className,
}: {
  counts: ImageSummary["counts"]
  className?: string
}) {
  const { t } = useTranslation()
  return (
    <ul className={cn("flex flex-wrap gap-x-3 gap-y-1", className)}>
      {SEVERITIES.map((severity) => {
        const key = severityKey(severity)
        const value = counts[key]
        return (
          <li
            key={severity}
            title={`${t(`security.severity.${key}`)}: ${value}`}
          >
            <Text
              variant="label"
              className={cn(
                "tabular-nums",
                value > 0 ? SEVERITY_INK[severity] : "text-muted-foreground/60"
              )}
            >
              <span aria-hidden>{t(`security.severityShort.${key}`)}</span>
              <span className="sr-only">{t(`security.severity.${key}`)}</span>{" "}
              {value}
            </Text>
          </li>
        )
      })}
    </ul>
  )
}
