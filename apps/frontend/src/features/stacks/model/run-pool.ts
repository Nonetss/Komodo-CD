/** Máximo de acciones en vuelo a la vez en una ejecución en lote */
export const BULK_CONCURRENCY = 3

export type PoolResult<T, R> =
  | { item: T; ok: true; value: R }
  | { item: T; ok: false; error: unknown }

/**
 * Ejecuta `task` sobre cada elemento con como mucho `limit` en vuelo.
 * Nunca rechaza: devuelve un resultado por elemento, en el orden de entrada.
 */
export async function runPool<T, R>(
  items: readonly T[],
  limit: number,
  task: (item: T) => Promise<R>
): Promise<PoolResult<T, R>[]> {
  const results: PoolResult<T, R>[] = new Array(items.length)
  let next = 0

  const worker = async () => {
    while (next < items.length) {
      const index = next++
      const item = items[index] as T
      try {
        results[index] = { item, ok: true, value: await task(item) }
      } catch (error) {
        results[index] = { item, ok: false, error }
      }
    }
  }

  const workers = Math.max(1, Math.min(limit, items.length))
  await Promise.all(Array.from({ length: workers }, worker))
  return results
}
