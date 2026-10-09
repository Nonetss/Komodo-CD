import { useHydratedQuery } from "@/hooks/use-hydrated-query"
import type { Stack } from "@/lib/api-types"
import { orpc } from "@/lib/orpc"

export const stacksListKey = orpc.v0.stacks.list.queryKey()

/** `enabled: false` aplaza la petición (p. ej. hasta que se usa el buscador) */
export const useStacks = ({ enabled = true }: { enabled?: boolean } = {}) =>
  useHydratedQuery(
    orpc.v0.stacks.list.queryOptions({
      select: (data) => data.stacks as Stack[],
      enabled,
    })
  )
