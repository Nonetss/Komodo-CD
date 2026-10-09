import { navigate } from "astro:transitions/client"
import { useMutation, useQueryClient } from "@tanstack/react-query"

import { stacksListKey } from "@/entities/stack"
import { orpc } from "@/lib/orpc"

/**
 * Borra un stack en Komodo y vuelve a `/stacks`. Primero se navega y luego se
 * refresca la lista: al revés, la ficha abierta pasaría un instante por el
 * estado de "no hay ningún stack llamado…".
 */
export const useStackDelete = () => {
  const queryClient = useQueryClient()
  return useMutation(
    orpc.v0.stacks.remove.mutationOptions({
      onSuccess: async () => {
        await navigate("/stacks")
        await queryClient.invalidateQueries({ queryKey: stacksListKey })
      },
    })
  )
}
