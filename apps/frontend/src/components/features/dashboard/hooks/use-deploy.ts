import { useMutation, useQueryClient } from "@tanstack/react-query"
import { orpc } from "@/lib/orpc"
import { historyListKey } from "./use-history"
import { stacksListKey } from "./use-stacks"

/** Dispara una acción en Komodo y refresca el historial y el estado de los stacks. */
export const useDeployTrigger = () => {
  const queryClient = useQueryClient()
  return useMutation(
    orpc.v0.deploy.trigger.mutationOptions({
      onSettled: () => {
        queryClient.invalidateQueries({ queryKey: historyListKey })
        queryClient.invalidateQueries({ queryKey: stacksListKey })
      },
    })
  )
}
