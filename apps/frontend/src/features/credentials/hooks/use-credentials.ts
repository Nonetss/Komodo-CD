import { useMutation, useQueryClient } from "@tanstack/react-query"
import { stacksListKey } from "@/features/stacks"
import { useHydratedQuery } from "@/hooks/use-hydrated-query"
import { orpc } from "@/lib/orpc"

export const credentialsListKey = orpc.v0.credentials.list.queryKey()

export const useCredentials = () =>
  useHydratedQuery(
    orpc.v0.credentials.list.queryOptions({
      select: (data) => data.credentials,
    })
  )

// Cambiar las credenciales cambia también la instancia de Komodo de la que
// salen los stacks.
const useInvalidateCredentials = () => {
  const queryClient = useQueryClient()
  return () => {
    queryClient.invalidateQueries({ queryKey: credentialsListKey })
    queryClient.invalidateQueries({ queryKey: stacksListKey })
  }
}

export const useCredentialsSave = () => {
  const invalidate = useInvalidateCredentials()
  return useMutation(
    orpc.v0.credentials.save.mutationOptions({ onSettled: invalidate })
  )
}

export const useCredentialsDelete = () => {
  const invalidate = useInvalidateCredentials()
  return useMutation(
    orpc.v0.credentials.remove.mutationOptions({ onSettled: invalidate })
  )
}
