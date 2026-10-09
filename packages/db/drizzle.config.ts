import path from "node:path"
import dotenv from "dotenv"
import { defineConfig } from "drizzle-kit"

// El .env es el de la raíz del repo, pero sus rutas `file:./…` son relativas
// a apps/backend (desde donde corre el backend), no a packages/db.
const backendDir = path.resolve(import.meta.dirname, "../../apps/backend")
dotenv.config({
  path: path.resolve(import.meta.dirname, "../../.env"),
  quiet: true,
})

const url = process.env.DATABASE_URL || "file:./dev.db"

export default defineConfig({
  schema: "./src/schema/index.ts",
  out: "./src/migrations",
  dialect: "sqlite",
  dbCredentials: {
    url: url.startsWith("file:./")
      ? `file:${path.join(backendDir, url.slice("file:".length))}`
      : url,
  },
})
