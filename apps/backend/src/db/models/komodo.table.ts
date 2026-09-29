import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const komodoTable = sqliteTable("komodo", {
	id: integer("id").primaryKey(),
	name: text("name"),
	url: text("url"),
	key: text("key"),
	secret: text("secret"),
	createdAt: integer("created_at", { mode: "timestamp" }).default(
		sql`CURRENT_TIMESTAMP`,
	),
	updatedAt: integer("updated_at", { mode: "timestamp" }).default(
		sql`CURRENT_TIMESTAMP`,
	),
});
