import { resolve } from "node:path"
import { createEnv } from "@t3-oss/env-core"
import { config } from "dotenv"
import { z } from "zod"

// El repo se configura con un único `.env` en la raíz (este fichero está en
// packages/env/src). En Docker no existe y las variables llegan de compose.
// Las que ya están definidas en el entorno nunca se sobrescriben.
config({ path: resolve(import.meta.dirname, "../../../.env"), quiet: true })

export const env = createEnv({
  server: {
    // Base de datos SQLite (libsql). En Docker: file:/data/db.sqlite
    DATABASE_URL: z
      .string()
      .regex(
        /^(file|libsql|https?|wss?):/,
        "debe ser una URL de SQLite/libsql (p. ej. file:./dev.db), no Postgres"
      ),
    // URL pública de la app (frontend). Se usa para CORS y trusted origins.
    // Si no se define se toma APP_URL, la misma variable que compose le pasa.
    BETTER_AUTH_URL: z.url(),
    // Clave para firmar sesiones y tokens: openssl rand -base64 32
    BETTER_AUTH_SECRET: z
      .string()
      .min(32, "debe tener al menos 32 caracteres: openssl rand -base64 32"),
    NODE_ENV: z
      .enum(["development", "production", "test"])
      .default("development"),
    LOG_LEVEL: z
      .enum(["fatal", "error", "warn", "info", "debug", "trace"])
      .default("info"),
    // Admin inicial: se crea al arrancar si no existe. Sin email o password
    // se omite la creación.
    SEED_ADMIN_EMAIL: z.email().optional(),
    SEED_ADMIN_NAME: z.string().default("Admin"),
    SEED_ADMIN_PASSWORD: z.string().min(8).optional(),
  },
  runtimeEnv: {
    ...process.env,
    BETTER_AUTH_URL: process.env.BETTER_AUTH_URL || process.env.APP_URL,
  },
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  emptyStringAsUndefined: true,
})
