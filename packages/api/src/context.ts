import type { AuthSession, AuthUser } from "@komodo-cd/auth"
import type { Context as HonoContext } from "hono"

export type CreateContextOptions = {
  context: HonoContext
}

/** Construye el contexto oRPC a partir de lo que dejó el middleware de sesión de Hono. */
export async function createContext({ context }: CreateContextOptions) {
  const user = (context.get("user") ?? null) as AuthUser | null
  const session = (context.get("session") ?? null) as AuthSession | null

  return { user, session, headers: context.req.raw.headers }
}

export type Context = Awaited<ReturnType<typeof createContext>>
