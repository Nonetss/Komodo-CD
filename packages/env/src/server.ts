import "dotenv/config"
import { createEnv } from "@t3-oss/env-core"
import { z } from "zod"

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
    BETTER_AUTH_URL: z.url(),
    // Clave para firmar sesiones y tokens: openssl rand -base64 32
    BETTER_AUTH_SECRET: z.string().min(1),
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
  runtimeEnv: process.env,
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  emptyStringAsUndefined: true,
})
