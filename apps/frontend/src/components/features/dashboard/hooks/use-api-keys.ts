import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useHydratedQuery } from "@/hooks/use-hydrated-query"
import type { ApiKey } from "@/lib/api-types"
import { orpc } from "@/lib/orpc"

export const apiKeysListKey = orpc.v0.apiKey.list.queryKey()

export const useApiKeys = () =>
  useHydratedQuery(
    orpc.v0.apiKey.list.queryOptions({
      select: (data) => data.keys,
    })
  )

export const useApiKeyCreate = () => {
  const queryClient = useQueryClient()
  return useMutation(
    orpc.v0.apiKey.create.mutationOptions({
      onSettled: () =>
        queryClient.invalidateQueries({ queryKey: apiKeysListKey }),
    })
  )
}

type ApiKeysData = { success: boolean; keys: ApiKey[] }

/** Borrado optimista: la key desaparece al instante y vuelve si falla. */
export const useApiKeyDelete = () => {
  const queryClient = useQueryClient()
  return useMutation(
    orpc.v0.apiKey.remove.mutationOptions({
      onMutate: async ({ id }) => {
        await queryClient.cancelQueries({ queryKey: apiKeysListKey })
        const previous = queryClient.getQueryData<ApiKeysData>(apiKeysListKey)
        if (previous) {
          queryClient.setQueryData<ApiKeysData>(apiKeysListKey, {
            ...previous,
            keys: previous.keys.filter((k) => k.id !== id),
          })
        }
        return { previous }
      },
      onError: (_error, _input, context) => {
        if (context?.previous) {
          queryClient.setQueryData(apiKeysListKey, context.previous)
        }
      },
      onSettled: () =>
        queryClient.invalidateQueries({ queryKey: apiKeysListKey }),
    })
  )
}
