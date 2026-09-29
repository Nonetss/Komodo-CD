import type { AuthSession, AuthUser } from "@komodo-cd/auth"
import { resolveSession } from "@komodo-cd/auth/session"
import { createMiddleware } from "hono/factory"

export type AuthVariables = {
  user: AuthUser | null
  session: AuthSession | null
}

/** Resuelve el usuario (sesión o `x-api-key`); la autorización la aplica cada procedimiento oRPC. */
export const sessionMiddleware = createMiddleware<{ Variables: AuthVariables }>(
  async (c, next) => {
    const { user, session } = await resolveSession(c.req.raw.headers)
    c.set("user", user)
    c.set("session", session)
    await next()
  }
)
