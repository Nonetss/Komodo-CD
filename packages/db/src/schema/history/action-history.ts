import { sql } from "drizzle-orm"
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core"

/**
 * Registro de acciones de deploy. `userId` no lleva FK a propósito: el
 * historial se conserva aunque se borre el usuario o la API key.
 */
export const actionHistoryTable = sqliteTable(
  "action_history",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: text("user_id").notNull(),
    userName: text("user_name"),
    userEmail: text("user_email"),
    stack: text("stack").notNull(),
    action: text("action").notNull(),
    success: integer("success", { mode: "boolean" }).notNull(),
    message: text("message"),
    createdAt: integer("created_at", { mode: "timestamp" }).default(
      sql`(unixepoch())`
    ),
  },
  (table) => [
    index("action_history_createdAt_idx").on(table.createdAt),
    index("action_history_stack_idx").on(table.stack),
    index("action_history_userId_idx").on(table.userId),
  ]
)

export type ActionHistory = typeof actionHistoryTable.$inferSelect
export type NewActionHistory = typeof actionHistoryTable.$inferInsert
