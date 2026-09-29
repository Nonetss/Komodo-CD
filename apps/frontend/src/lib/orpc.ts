import type { AppRouterClient } from "@komodo-cd/api/router"
import { createORPCClient, ORPCError } from "@orpc/client"
import { RPCLink } from "@orpc/client/fetch"
import { createTanstackQueryUtils } from "@orpc/tanstack-query"

export const link = new RPCLink({
  // Se resuelve por petición para usar siempre el origen actual del navegador
  // (y no tocar `window` en SSR). Caddy (prod) / Vite (dev) hacen proxy de
  // `/rpc` al backend, así que todo es same-origin y sin CORS.
  url: () => `${window.location.origin}/rpc`,
  fetch(url, options) {
    return fetch(url, {
      ...options,
      credentials: "include",
    })
  },
})

/** Cliente oRPC plano para llamadas imperativas. */
export const client: AppRouterClient = createORPCClient(link)

/**
 * Utilidades de TanStack Query generadas desde el router:
 * `useHydratedQuery(orpc.v0.stacks.list.queryOptions())`,
 * `useMutation(orpc.v0.deploy.trigger.mutationOptions())`.
 */
export const orpc = createTanstackQueryUtils(client)

/** Mensaje legible de un error oRPC, o `fallback` si no viene del backend. */
export function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof ORPCError && error.message ? error.message : fallback
}
