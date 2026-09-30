import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useHydratedQuery } from "@/hooks/use-hydrated-query"
import { orpc } from "@/lib/orpc"

export const ntfyConfigKey = orpc.v0.credentials.ntfy.get.queryKey()

export const useNtfyConfig = () =>
  useHydratedQuery(
    orpc.v0.credentials.ntfy.get.queryOptions({
      select: (data) => data.config,
    })
  )

const useInvalidateNtfy = () => {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: ntfyConfigKey })
}

export const useNtfySave = () => {
  const invalidate = useInvalidateNtfy()
  return useMutation(
    orpc.v0.credentials.ntfy.save.mutationOptions({ onSettled: invalidate })
  )
}

export const useNtfyDelete = () => {
  const invalidate = useInvalidateNtfy()
  return useMutation(
    orpc.v0.credentials.ntfy.remove.mutationOptions({ onSettled: invalidate })
  )
}

export const useNtfyTest = () =>
  useMutation(orpc.v0.credentials.ntfy.test.mutationOptions())
