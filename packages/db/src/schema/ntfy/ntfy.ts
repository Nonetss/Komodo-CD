import { sql } from "drizzle-orm"
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core"

/**
 * Destino de ntfy para avisar de despliegues fallidos (en la práctica, una
 * sola fila). `token` es opcional: solo hace falta en topics protegidos.
 */
export const ntfyTable = sqliteTable("ntfy", {
  id: integer("id").primaryKey(),
  url: text("url").notNull(),
  topic: text("topic").notNull(),
  token: text("token"),
  enabled: integer("enabled", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at", { mode: "timestamp" }).default(
    sql`(unixepoch())`
  ),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .default(sql`(unixepoch())`)
    .$onUpdate(() => /* @__PURE__ */ new Date()),
})

export type NtfyConfig = typeof ntfyTable.$inferSelect
export type NewNtfyConfig = typeof ntfyTable.$inferInsert
