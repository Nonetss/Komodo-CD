import { useHydratedQuery } from "@/hooks/use-hydrated-query"
import { orpc } from "@/lib/orpc"

/** Días que cubren las cifras de despliegues del resumen */
export const ACTIVITY_DAYS = 30

/** Deploys y pulls de los últimos `ACTIVITY_DAYS` días. */
export const useActivity = () =>
  useHydratedQuery(
    orpc.v0.history.activity.queryOptions({
      input: { days: ACTIVITY_DAYS },
    })
  )
