import { createContext } from "@komodo-cd/api/context"
import { appRouter } from "@komodo-cd/api/router"
import { OpenAPIHandler } from "@orpc/openapi/fetch"
import { OpenAPIReferencePlugin } from "@orpc/openapi/plugins"
import { ORPCError, onError } from "@orpc/server"
import { ZodToJsonSchemaConverter } from "@orpc/zod/zod4"
import { Hono, type MiddlewareHandler } from "hono"

import type { AuthVariables } from "@/middlewares/auth"

// API REST pública (/api/v0/*), la que usan GitHub/Gitea Actions con
// `x-api-key`, más la especificación en /doc y Scalar en /scalar.
const handler = new OpenAPIHandler(appRouter, {
  plugins: [
    new OpenAPIReferencePlugin({
      docsProvider: "scalar",
      schemaConverters: [new ZodToJsonSchemaConverter()],
      docsPath: "/scalar",
      specPath: "/doc",
      specGenerateOptions: {
        servers: [{ url: "/api" }],
        info: {
          title: "Komodo CD API",
          version: "1.0.0",
          description:
            "API para gestionar credenciales de Komodo y disparar deploys. " +
            "Todos los endpoints requieren autenticación mediante API Key (`x-api-key`) o sesión de usuario.",
        },
        security: [{ ApiKeyAuth: [] }],
        components: {
          securitySchemes: {
            ApiKeyAuth: {
              type: "apiKey",
              in: "header",
              name: "x-api-key",
              description:
                "API Key generada desde el dashboard. Pásala en el header `x-api-key`.",
            },
          },
        },
      },
    }),
  ],
  interceptors: [
    onError((err, { context }) => {
      // Los errores definidos (401, 400, 500 con mensaje…) ya los gestiona o
      // registra el propio procedimiento; aquí solo lo inesperado.
      if (err instanceof ORPCError && err.defined) return
      context.logger.error({ err }, "openapi error")
    }),
  ],
})

const router = new Hono<{ Variables: AuthVariables }>()

const handle =
  (prefix: `/${string}`): MiddlewareHandler<{ Variables: AuthVariables }> =>
  async (c, next) => {
    const context = await createContext({ context: c })
    const result = await handler.handle(c.req.raw, { prefix, context })
    if (result.matched) {
      return c.newResponse(result.response.body, result.response)
    }
    await next()
  }

router.use("/doc", handle("/"))
router.use("/scalar", handle("/"))
router.use("/api/*", handle("/api"))

export default router
