import type { RequestScope } from "@komodo-cd/api/context"
import { logger } from "@komodo-cd/logger"
import { createMiddleware } from "hono/factory"

import type { AuthVariables } from "@/middlewares/auth"

declare module "hono" {
  interface ContextVariableMap {
    /** Lo pone `requestLogger` en cada petición, antes de cualquier ruta. */
    requestScope: RequestScope
  }
}

/**
 * Una línea por petición con su estado y latencia, y un logger hijo con el
 * `requestId` que reutiliza oRPC (ver `createContext`), así que sus errores
 * llevan el mismo id. El id también vuelve en `x-request-id` para poder
 * cruzar un fallo del CI con los logs.
 */
export const requestLogger = createMiddleware<{ Variables: AuthVariables }>(
  async (c, next) => {
    // Generado aquí, nunca tomado de la petición: nadie elige los ids de los logs
    const requestId = crypto.randomUUID()
    const log = logger.child({
      requestId,
      method: c.req.method,
      path: c.req.path,
    })
    c.set("requestScope", { id: requestId, logger: log })
    const start = performance.now()

    await next()

    c.header("x-request-id", requestId)
    const status = c.res.status
    const fields = {
      status,
      latencyMs: Math.round(performance.now() - start),
      // Lo pone sessionMiddleware durante el `next()` de arriba
      userId: c.get("user")?.id,
    }
    if (status >= 500) log.error(fields, "request")
    else if (status >= 400) log.warn(fields, "request")
    // El healthcheck de compose llama cada pocos segundos: solo en debug
    else if (c.req.path === "/health-check") log.debug(fields, "request")
    else log.info(fields, "request")
  }
)
