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
