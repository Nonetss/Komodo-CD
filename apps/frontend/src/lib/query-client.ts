import { ORPCError } from "@orpc/client"
import { QueryClient } from "@tanstack/react-query"

let browserQueryClient: QueryClient | undefined

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30 * 1000,
        refetchOnWindowFocus: false,
        // Si el backend responde con un error oRPC (401, Komodo sin
        // configurar…) reintentar no cambia nada: se muestra al momento.
        // Solo se reintentan fallos de red.
        retry: (failureCount, error) =>
          !(error instanceof ORPCError) && failureCount < 2,
      },
    },
  })
}

/**
 * QueryClient singleton en el navegador, para que las distintas islas de
 * Astro de una misma página compartan caché. En el servidor se crea uno por
 * petición.
 */
export function getQueryClient() {
  if (typeof window === "undefined") {
    return makeQueryClient()
  }
  if (!browserQueryClient) {
    browserQueryClient = makeQueryClient()
  }
  return browserQueryClient
}
