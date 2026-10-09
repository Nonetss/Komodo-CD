import { os } from "@orpc/server"

import type { Context } from "#context"
import { errorMap, errors } from "#errors"

export const o = os.$context<Context>().errors(errorMap)

export const publicProcedure = o

const requireAuth = o.middleware(async ({ context, next }) => {
  if (!context.user) {
    throw errors.UNAUTHORIZED()
  }
  return next({
    context: {
      ...context,
      user: context.user,
    },
  })
})

/** Requiere usuario: sesión de Better Auth o header `x-api-key` válido. */
export const protectedProcedure = publicProcedure.use(requireAuth)

/**
 * Requiere una sesión iniciada en el navegador: una API key (la del CI) no
 * puede tocar las credenciales de Komodo, ntfy ni las propias API keys.
 */
export const sessionProcedure = protectedProcedure.use(
  async ({ context, next }) => {
    // Con `x-api-key` hay usuario pero no sesión (ver resolveSession).
    if (!context.session) {
      throw errors.FORBIDDEN({
        message: "This endpoint requires a signed-in session, not an API key",
      })
    }
    return next({
      context: {
        ...context,
        session: context.session,
      },
    })
  }
)
