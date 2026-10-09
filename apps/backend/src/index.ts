import { komodoService } from "@komodo-cd/api/lib/komodo"
import { auth } from "@komodo-cd/auth"
import { seed } from "@komodo-cd/db/seed"
import { env } from "@komodo-cd/env/server"
import { logger } from "@komodo-cd/logger"
import { Hono } from "hono"
import { bodyLimit } from "hono/body-limit"
import { cors } from "hono/cors"
import { logger as honoLogger } from "hono/logger"

import { type AuthVariables, sessionMiddleware } from "@/middlewares/auth"
import authRouter from "@/routers/auth"
import openapiRouter from "@/routers/openapi"
import rpcRouter from "@/routers/rpc"

// Ninguna petición legítima (JSON de la API, formularios de auth) se acerca
// a 1 MiB; el límite corta cuerpos enormes antes de parsearlos.
const MAX_BODY_SIZE = 1024 * 1024

const app = new Hono<{ Variables: AuthVariables }>()

app.use(
  "*",
  cors({
    // Solo el propio dashboard manda cookies: en Docker y en dev va por el
    // mismo origen (Caddy / proxy de Vite), y el CI usa curl, sin CORS.
    origin: env.BETTER_AUTH_URL,
    credentials: true,
    allowHeaders: ["Content-Type", "Authorization", "x-api-key"],
    allowMethods: ["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  })
)
app.use("*", honoLogger())
app.use(
  "*",
  bodyLimit({
    maxSize: MAX_BODY_SIZE,
    onError: (c) => c.json({ message: "Payload Too Large" }, 413),
  })
)

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
  maxRequestBodySize: MAX_BODY_SIZE,
}
