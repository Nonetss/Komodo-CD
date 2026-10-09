import { deployEvents } from "@komodo-cd/api/lib/deploy-events"
import { komodoService } from "@komodo-cd/api/lib/komodo"
import { auth } from "@komodo-cd/auth"
import { closeDb } from "@komodo-cd/db"
import { seed } from "@komodo-cd/db/seed"
import { env } from "@komodo-cd/env/server"
import { logger } from "@komodo-cd/logger"
import { Hono } from "hono"
import { bodyLimit } from "hono/body-limit"
import { cors } from "hono/cors"

import { type AuthVariables, sessionMiddleware } from "@/middlewares/auth"
import { requestLogger } from "@/middlewares/request-logger"
import authRouter from "@/routers/auth"
import openapiRouter from "@/routers/openapi"
import rpcRouter from "@/routers/rpc"

const PORT = 3000
// Docker manda SIGKILL a los 10 s del SIGTERM: el apagado entero cabe antes
const SHUTDOWN_TIMEOUT_MS = 8_000
// Lo que esperan las peticiones en curso antes de cortar sus conexiones
const HTTP_DRAIN_TIMEOUT_MS = 5_000

// Ninguna petición legítima (JSON de la API, formularios de auth) se acerca
// a 1 MiB; el límite corta cuerpos enormes antes de parsearlos.
const MAX_BODY_SIZE = 1024 * 1024

const app = new Hono<{ Variables: AuthVariables }>()

app.use(
  "*",
  cors({
    // Solo el propio dashboard manda cookies: en Docker y en dev va por el
    // mismo origen (gateway / proxy de Vite), y el CI usa curl, sin CORS.
    origin: env.BETTER_AUTH_URL,
    credentials: true,
    allowHeaders: ["Content-Type", "Authorization", "x-api-key"],
    allowMethods: ["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  })
)
app.use("*", requestLogger)
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
  var __backendServer: ReturnType<typeof Bun.serve> | undefined
}

async function stopHttpServer() {
  const server = globalThis.__backendServer
  if (!server) return

  let drainTimer: ReturnType<typeof setTimeout> | undefined
  const drained = await Promise.race([
    server.stop().then(() => true),
    new Promise<false>((resolve) => {
      drainTimer = setTimeout(() => resolve(false), HTTP_DRAIN_TIMEOUT_MS)
    }),
  ])
  clearTimeout(drainTimer)

  if (!drained) {
    logger.warn("http drain timed out, closing open connections")
    await server.stop(true)
  }
}

let shuttingDown = false

async function shutdown(signal: NodeJS.Signals) {
  if (shuttingDown) return
  shuttingDown = true
  logger.info({ signal }, "shutting down")

  // Sin unref a propósito: si un paso se cuelga, esto termina el proceso
  setTimeout(() => {
    logger.error("shutdown timed out")
    process.exit(1)
  }, SHUTDOWN_TIMEOUT_MS)

  let failed = false
  const step = async (name: string, run: () => unknown) => {
    try {
      await run()
    } catch (err) {
      failed = true
      logger.error({ err, step: name }, "shutdown step failed")
    }
  }

  // Antes que nada se cierran los streams de deploys: son conexiones que no
  // terminan solas y harían esperar al drenado de HTTP hasta su timeout.
  await step("events", () => deployEvents.close())
  // Después HTTP, para que ninguna petición nueva toque la base de datos; la
  // conexión al final, porque las peticiones en curso aún pueden usarla.
  await step("http", stopHttpServer)
  await step("database", closeDb)

  logger.info({ signal, failed }, "shutdown complete")
  process.exit(failed ? 1 : 0)
}

if (!globalThis.__backendBootstrapped) {
  globalThis.__backendBootstrapped = true

  try {
    await seed(auth)
    await komodoService.initialize()
  } catch (err) {
    logger.error({ err }, "bootstrap failed")
    process.exit(1)
  }

  for (const signal of ["SIGINT", "SIGTERM"] as const) {
    process.on(signal, () => void shutdown(signal))
  }
}

// Servido a mano, no con `export default`, para que el apagado tenga un
// servidor que parar. Se ejecuta en cada hot reload para coger el `fetch`
// nuevo; el `id` fijo hace que Bun recargue el servidor en marcha en lugar de
// volver a abrir el puerto.
globalThis.__backendServer = Bun.serve({
  id: "backend",
  port: PORT,
  fetch: app.fetch,
  maxRequestBodySize: MAX_BODY_SIZE,
})
logger.info({ port: PORT }, "server listening")
