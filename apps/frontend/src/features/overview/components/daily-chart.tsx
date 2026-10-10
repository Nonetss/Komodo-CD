import { useTranslation } from "react-i18next"

import { Text } from "@/components/shared/brand/typography"
import type { DayBucket } from "@/features/overview/model/activity"
import { cn } from "@/lib/utils"

const SUCCESS_FILL = "bg-foreground/35"
const FAILED_FILL = "bg-danger"

function LegendKey({ fill, label }: { fill: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span aria-hidden className={cn("size-2 rounded-xs", fill)} />
      <Text variant="meta-sm" tone="muted">
        {label}
      </Text>
    </span>
  )
}

/**
 * Acciones por día en columnas apiladas: las correctas en tinta apagada y las
 * fallidas encima en rojo, que es lo que pide atención. Al pasar por una
 * columna, un tooltip dice su día y sus cifras. Para lectores de pantalla va
 * una tabla oculta con todos los días.
 */
export function DailyChart({ buckets }: { buckets: DayBucket[] }) {
  const { t, i18n } = useTranslation()
  const max = Math.max(1, ...buckets.map((b) => b.success + b.failed))
  const day = new Intl.DateTimeFormat(i18n.language, {
    day: "numeric",
    month: "short",
  })
  const first = buckets[0]

  return (
    <figure className="flex flex-col gap-2">
      <figcaption className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
        <Text variant="caption">{t("overview.activity.chart")}</Text>
        <span className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <LegendKey
            fill={SUCCESS_FILL}
            label={t("overview.activity.legendSuccess")}
          />
          <LegendKey
            fill={FAILED_FILL}
            label={t("overview.activity.legendFailed")}
          />
        </span>
      </figcaption>

      {/* El máximo de la escala, sobre la línea de arriba */}
      <Text variant="data" tone="muted" aria-hidden className="self-end">
        {max}
      </Text>

      <div
        aria-hidden
        className="border-border relative flex h-32 items-end gap-0.5 border-t border-b"
      >
        {buckets.map((b, i) => {
          const total = b.success + b.failed
          // El tooltip se abre hacia dentro para no salirse por los bordes
          const left = i < buckets.length / 2
          return (
            <div
              key={b.date.getTime()}
              className="group hover:bg-muted/60 relative flex h-full min-w-0 flex-1 flex-col items-center justify-end"
            >
              {total > 0 ? (
                <div
                  className="flex w-full max-w-6 flex-col gap-0.5"
                  style={{ height: `${(total / max) * 100}%` }}
                >
                  {b.failed > 0 ? (
                    <span
                      className={cn("min-h-0.5 rounded-t-sm", FAILED_FILL)}
                      style={{ flexGrow: b.failed }}
                    />
                  ) : null}
                  {b.success > 0 ? (
                    <span
                      className={cn(
                        "min-h-0.5",
                        b.failed > 0 ? "" : "rounded-t-sm",
                        SUCCESS_FILL
                      )}
                      style={{ flexGrow: b.success }}
                    />
                  ) : null}
                </div>
              ) : null}
              <span
                className={cn(
                  "bg-popover text-popover-foreground pointer-events-none absolute -top-2 z-10 hidden -translate-y-full rounded-md border px-2.5 py-1.5 whitespace-nowrap shadow-md group-hover:block",
                  left ? "left-0" : "right-0"
                )}
              >
                <Text variant="data">
                  {t("overview.activity.readout", {
                    date: day.format(b.date),
                    success: b.success,
                    failed: b.failed,
                  })}
                </Text>
              </span>
            </div>
          )
        })}
      </div>

      <div aria-hidden className="flex justify-between">
        <Text variant="data" tone="muted">
          {first ? day.format(first.date) : null}
        </Text>
        <Text variant="data" tone="muted">
          {t("overview.activity.today")}
        </Text>
      </div>

      {/* El sr-only va en un div: en la propia tabla no recorta el caption,
          que se pinta fuera de su caja y asomaba sobre el título */}
      <div className="sr-only">
        <table>
          <caption>{t("overview.activity.chart")}</caption>
          <thead>
            <tr>
              <th scope="col">{t("overview.activity.dayColumn")}</th>
              <th scope="col">{t("overview.activity.legendSuccess")}</th>
              <th scope="col">{t("overview.activity.legendFailed")}</th>
            </tr>
          </thead>
          <tbody>
            {buckets.map((b) => (
              <tr key={b.date.getTime()}>
                <th scope="row">{day.format(b.date)}</th>
                <td>{b.success}</td>
                <td>{b.failed}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </figure>
  )
}
