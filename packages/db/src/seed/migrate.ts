import { fileURLToPath } from "node:url"
import { migrate } from "drizzle-orm/libsql/migrator"

import { db } from "#index"

// Resuelto respecto a este fichero, no al cwd: funciona igual con
// `bun run dev` desde apps/backend que dentro de la imagen Docker.
const migrationsFolder = fileURLToPath(
  new URL("../migrations", import.meta.url)
)

export async function runMigrations() {
  await migrate(db, { migrationsFolder })
}
