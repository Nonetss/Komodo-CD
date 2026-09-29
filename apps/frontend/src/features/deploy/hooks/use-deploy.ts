import { useMutation, useQueryClient } from "@tanstack/react-query"
import { historyListKey } from "@/features/history/hooks/use-history"
import { stacksListKey } from "@/features/stacks/hooks/use-stacks"
import { orpc } from "@/lib/orpc"

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
