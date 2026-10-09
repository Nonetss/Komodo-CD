import { useMutation, useQueryClient } from "@tanstack/react-query"

import { orpc } from "@/lib/orpc"

/**
 * Dispara una acción en Komodo y refresca el historial y el estado de los
 * stacks. Las claves parciales de oRPC cubren cualquier input de esas queries.
 */
export const useDeployTrigger = () => {
  const queryClient = useQueryClient()
  return useMutation(
    orpc.v0.deploy.trigger.mutationOptions({
      onSettled: () => {
        queryClient.invalidateQueries({ queryKey: orpc.v0.history.key() })
        queryClient.invalidateQueries({ queryKey: orpc.v0.stacks.key() })
      },
    })
  )
}
