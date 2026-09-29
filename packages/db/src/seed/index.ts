import { logger } from "@komodo-cd/logger"

import { type AuthLike, seedAdmin } from "#seed/admin"
import { runMigrations } from "#seed/migrate"

export async function seed(auth: AuthLike) {
  logger.info("📦 Aplicando migraciones...")
  await runMigrations()
  logger.info("✅ Migraciones aplicadas")

  try {
    const result = await seedAdmin(auth)
    if (result.created) {
      logger.info({ email: result.email }, "✅ Usuario admin creado")
    } else if (result.reason === "already-exists") {
      logger.info({ email: result.email }, "✅ Usuario admin ya existe")
    } else {
      logger.warn(
        "⚠️  SEED_ADMIN_EMAIL o SEED_ADMIN_PASSWORD no definidos, omitiendo creación de admin"
      )
    }
  } catch (err) {
    logger.error({ err }, "❌ Error creando usuario admin")
  }
}
