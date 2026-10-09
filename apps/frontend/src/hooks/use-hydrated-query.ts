import {
  type QueryKey,
  type UseQueryOptions,
  type UseQueryResult,
  useQuery,
} from "@tanstack/react-query"
import { useHydrated } from "@/hooks/use-hydrated"

/**
 * `useQuery` seguro para las islas `client:load` de Astro, que se renderizan
 * en SSR y luego hidratan.
 *
 * Hasta hidratar ignora la caché, así el cliente coincide con el estado
 * pendiente que pintó el servidor. Después usa al momento la caché compartida
 * del QueryClient del navegador (sin parpadeo de carga si ya había datos).
 */
export function useHydratedQuery<
  TQueryFnData = unknown,
  TError = Error,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  options: UseQueryOptions<TQueryFnData, TError, TData, TQueryKey>
): UseQueryResult<TData, TError> {
  const hydrated = useHydrated()
  const query = useQuery({
    ...options,
    enabled: hydrated && (options.enabled ?? true),
  })

  if (!hydrated) {
    return {
      ...query,
      data: undefined,
      error: null,
      isError: false,
      isPending: true,
      isLoading: true,
      isFetching: false,
      isSuccess: false,
      status: "pending",
      fetchStatus: "idle",
    } as UseQueryResult<TData, TError>
  }

  return query
}
