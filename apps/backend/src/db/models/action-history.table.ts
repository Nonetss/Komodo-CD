import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const actionHistoryTable = sqliteTable("action_history", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	userId: text("user_id").notNull(),
	userName: text("user_name"),
	userEmail: text("user_email"),
	stack: text("stack").notNull(),
	action: text("action").notNull(),
	success: integer("success", { mode: "boolean" }).notNull(),
	message: text("message"),
	createdAt: integer("created_at", { mode: "timestamp" }).default(
		sql`CURRENT_TIMESTAMP`,
	),
});
