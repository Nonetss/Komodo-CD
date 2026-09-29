import { sql } from "drizzle-orm"
import {
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core"

/** Credenciales de la instancia de Komodo (en la práctica, una sola fila). */
export const komodoTable = sqliteTable(
  "komodo",
  {
    id: integer("id").primaryKey(),
    name: text("name"),
    url: text("url"),
    key: text("key"),
    secret: text("secret"),
    createdAt: integer("created_at", { mode: "timestamp" }).default(
      sql`(unixepoch())`
    ),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .default(sql`(unixepoch())`)
      .$onUpdate(() => /* @__PURE__ */ new Date()),
  },
  (table) => [uniqueIndex("komodo_name_uidx").on(table.name)]
)

export type KomodoCredentials = typeof komodoTable.$inferSelect
export type NewKomodoCredentials = typeof komodoTable.$inferInsert
