import { komodoService } from "@komodo-cd/api/lib/komodo"
import { auth } from "@komodo-cd/auth"
import { seed } from "@komodo-cd/db/seed"
import { logger } from "@komodo-cd/logger"
import { Hono } from "hono"
import { cors } from "hono/cors"
import { logger as honoLogger } from "hono/logger"

import { type AuthVariables, sessionMiddleware } from "@/middlewares/auth"
import authRouter from "@/routers/auth"
import openapiRouter from "@/routers/openapi"
import rpcRouter from "@/routers/rpc"

const app = new Hono<{ Variables: AuthVariables }>()

app.use(
  "*",
  cors({
    origin: (origin) => origin || "*",
    credentials: true,
    allowHeaders: ["Content-Type", "Authorization", "x-api-key"],
    allowMethods: ["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  })
)
app.use("*", honoLogger())

app.get("/health-check", (c) => c.json({ message: "API is running" }))

app.route("/", authRouter)
app.use("*", sessionMiddleware)
app.route("/", rpcRouter)
app.route("/", openapiRouter)

// `bun --hot` re-ejecuta este módulo en cada cambio; globalThis sobrevive a
// los hot reloads, así que el bootstrap (migraciones, seed, Komodo) y los
// handlers de señales solo se registran una vez.
declare global {
  var __backendBootstrapped: boolean | undefined
}

if (!globalThis.__backendBootstrapped) {
  globalThis.__backendBootstrapped = true

  logger.info("🚀 Iniciando bootstrap...")
  await seed(auth)
  await komodoService.initialize()
  logger.info("✅ Bootstrap completado")

  for (const signal of ["SIGINT", "SIGTERM"] as const) {
    process.on(signal, () => {
      logger.info({ signal }, "🛑 Señal de apagado recibida, cerrando servidor")
      process.exit(0)
    })
  }

  logger.info("🌐 Servidor corriendo en http://localhost:3000")
}

export default {
  port: 3000,
  fetch: app.fetch,
}
