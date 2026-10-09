import type { ActivityEvent } from "@/lib/api-types"

export type DayBucket = {
  /** Medianoche local del día */
  date: Date
  success: number
  failed: number
}

const startOfDay = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate())

/**
 * Un cubo por día local, del más antiguo a hoy, con las acciones correctas y
 * las fallidas. Se agrupa aquí y no en el backend porque solo el navegador
 * sabe en qué zona horaria cae la medianoche del usuario.
 */
export function bucketByDay(
  events: ActivityEvent[],
  days: number,
  now = new Date()
): DayBucket[] {
  const today = startOfDay(now)
  const buckets = Array.from({ length: days }, (_, i) => ({
    date: new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate() - (days - 1 - i)
    ),
    success: 0,
    failed: 0,
  }))
  const first = buckets[0]?.date.getTime() ?? 0
  for (const e of events) {
    const day = startOfDay(new Date(e.createdAt)).getTime()
    if (day < first) continue
    // Los días se cuentan por fecha y no por milisegundos: un cambio de hora
    // deja días de 23 o 25 horas
    const bucket = buckets.find((b) => b.date.getTime() === day)
    if (!bucket) continue
    if (e.success) bucket.success++
    else bucket.failed++
  }
  return buckets
}

/** Eventos desde la medianoche del primer día de la gráfica. */
export function inWindow(
  events: ActivityEvent[],
  days: number,
  now = new Date()
) {
  const today = startOfDay(now)
  const first = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate() - (days - 1)
  ).getTime()
  return events.filter((e) => Date.parse(e.createdAt) >= first)
}

/** Total, fallidas, % de éxito y % lanzadas con API key (CI). */
export function summarize(events: ActivityEvent[]) {
  const total = events.length
  const failed = events.filter((e) => !e.success).length
  const viaApiKey = events.filter((e) => e.via === "apiKey").length
  return {
    total,
    failed,
    successRate: total > 0 ? (total - failed) / total : null,
    ciShare: total > 0 ? viaApiKey / total : null,
    // Llegan del más reciente al más antiguo
    lastAt: events[0] ? new Date(events[0].createdAt) : null,
  }
}

/** Los `limit` stacks con más acciones, de más a menos. */
export function topStacks(events: ActivityEvent[], limit: number) {
  const counts = new Map<string, number>()
  for (const e of events) counts.set(e.stack, (counts.get(e.stack) ?? 0) + 1)
  return [...counts.entries()]
    .map(([stack, count]) => ({ stack, count }))
    .sort((a, b) => b.count - a.count || a.stack.localeCompare(b.stack))
    .slice(0, limit)
}
