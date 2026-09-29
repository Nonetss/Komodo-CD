import { createContext } from "@komodo-cd/api/context"
import { appRouter } from "@komodo-cd/api/router"
import { logger } from "@komodo-cd/logger"
import { ORPCError, onError } from "@orpc/server"
import { RPCHandler } from "@orpc/server/fetch"
import { Hono } from "hono"

import type { AuthVariables } from "@/middlewares/auth"

// Protocolo RPC de oRPC: lo consume el frontend con el cliente tipado.
const handler = new RPCHandler(appRouter, {
  interceptors: [
    onError((err) => {
      // Los errores definidos (401, 400, 500 con mensaje…) ya los gestiona o
      // registra el propio procedimiento; aquí solo lo inesperado.
      if (err instanceof ORPCError && err.defined) return
      logger.error({ err }, "rpc error")
    }),
  ],
})

const router = new Hono<{ Variables: AuthVariables }>()

router.use("/rpc/*", async (c, next) => {
  const context = await createContext({ context: c })
  const result = await handler.handle(c.req.raw, { prefix: "/rpc", context })
  if (result.matched) {
    return c.newResponse(result.response.body, result.response)
  }
  await next()
})

export default router
