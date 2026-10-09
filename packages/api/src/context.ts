import type { AuthSession, AuthUser } from "@komodo-cd/auth"
import { logger } from "@komodo-cd/logger"
import type { Context as HonoContext } from "hono"

/** Lo que deja el middleware `requestLogger` del backend en cada petición. */
export type RequestScope = {
  id: string
  logger: typeof logger
}

export type CreateContextOptions = {
  context: HonoContext
}

/** Construye el contexto oRPC a partir de lo que dejó el middleware de sesión de Hono. */
export async function createContext({ context }: CreateContextOptions) {
  const user = (context.get("user") ?? null) as AuthUser | null
  const session = (context.get("session") ?? null) as AuthSession | null
  const scope = (context.get("requestScope") ?? null) as RequestScope | null

  return {
    user,
    session,
    headers: context.req.raw.headers,
    requestId: scope?.id ?? null,
    // Logger con el requestId: lo que se registre aquí se cruza con la línea
    // de la petición
    logger: scope?.logger ?? logger,
  }
}

export type Context = Awaited<ReturnType<typeof createContext>>
