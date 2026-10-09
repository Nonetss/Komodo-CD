// Precarga de `bun test` (bunfig.toml): corre antes de importar ningún módulo
// de la app, así que fija aquí el entorno que valida packages/env.
//
// Las variables se sobrescriben siempre, nunca se borran: dotenv rellenaría
// las que falten con el .env de la raíz. Las opcionales van a "", que
// `emptyStringAsUndefined` lee como sin definir.
Object.assign(process.env, {
  NODE_ENV: "test",
  LOG_LEVEL: "fatal",
  // Una base SQLite en memoria por proceso de test, con las migraciones reales
  DATABASE_URL: "file::memory:",
  BETTER_AUTH_URL: "http://localhost:4321",
  BETTER_AUTH_SECRET: "test-secret-test-secret-test-secret-0",
  SEED_ADMIN_EMAIL: "",
  SEED_ADMIN_PASSWORD: "",
})

const { runMigrations } = await import("@komodo-cd/db/seed")
await runMigrations()

export {}
