import { useTranslation } from "react-i18next"

import { Text } from "@/components/shared/brand/typography"
import { relativeTime } from "@/lib/relative-time"

/**
 * Un instante como "hace 3 minutos": `<time>` en rol `data` y tono apagado,
 * con la fecha completa en el `title` y el valor ISO para las máquinas.
 */
export function RelativeTime({
  date,
  className,
}: {
  date: Date | string
  className?: string
}) {
  const { i18n } = useTranslation()
  const value = typeof date === "string" ? new Date(date) : date

  return (
    <Text
      as="time"
      variant="data"
      tone="muted"
      className={className}
      dateTime={value.toISOString()}
      title={new Intl.DateTimeFormat(i18n.language, {
        dateStyle: "full",
        timeStyle: "medium",
      }).format(value)}
    >
      {relativeTime(value, i18n.language)}
    </Text>
  )
}
