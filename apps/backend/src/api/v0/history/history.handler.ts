import { desc } from "drizzle-orm";
import { Context, Handler } from "hono";
import { db } from "@/core/config";
import { actionHistoryTable } from "@/db/models/action-history.table";
import { logger } from "@/lib/logger";

export const historyHandler: Handler = async (c: Context) => {
	try {
		const rows = await db
			.select()
			.from(actionHistoryTable)
			.orderBy(desc(actionHistoryTable.createdAt))
			.limit(100);

		const history = rows.map((r) => ({
			id: r.id,
			userId: r.userId,
			userName: r.userName ?? null,
			userEmail: r.userEmail ?? null,
			stack: r.stack,
			action: r.action,
			success: r.success,
			message: r.message ?? null,
			createdAt: r.createdAt
				? r.createdAt.toISOString()
				: new Date().toISOString(),
		}));

		return c.json({ success: true, history });
	} catch (error) {
		logger.error("❌ Error obteniendo historial:", error);
		return c.json({ error: "Error al obtener historial" }, 500);
	}
};
