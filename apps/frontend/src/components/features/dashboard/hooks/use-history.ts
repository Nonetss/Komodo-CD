import { useHydratedQuery } from "@/hooks/use-hydrated-query"
import { orpc } from "@/lib/orpc"

export const historyListKey = orpc.v0.history.list.queryKey()

export const useHistory = () =>
  useHydratedQuery(
    orpc.v0.history.list.queryOptions({
      select: (data) => data.history,
    })
  )
