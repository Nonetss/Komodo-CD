import { Text } from "@/components/shared/brand/typography"
import { cn } from "@/lib/utils"

export interface StackedBarSegment {
  key: string
  label: string
  value: number
  /** Relleno del tramo y de su marca en la leyenda (`bg-…`) */
  fill: string
}

/**
 * Reparto de un total en una barra apilada: cada tramo, con su tono, ocupa
 * su parte y la leyenda de debajo dice el nombre y la cifra de cada uno. Un
 * tramo con valor no baja de 4px para que se vea aunque sea mínimo.
 */
export function StackedBar({ segments }: { segments: StackedBarSegment[] }) {
  return (
    <figure className="flex flex-col gap-3">
      <div aria-hidden className="flex h-3 gap-0.5">
        {segments.map((s) =>
          s.value > 0 ? (
            <span
              key={s.key}
              className={cn("min-w-1 last:rounded-r-sm", s.fill)}
              style={{ flexGrow: s.value }}
              title={`${s.label}: ${s.value}`}
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
                {s.label}
              </Text>
              <Text variant="data">{s.value}</Text>
            </li>
          ))}
        </ul>
      </figcaption>
    </figure>
  )
}
