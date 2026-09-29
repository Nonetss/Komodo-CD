import type { User } from "better-auth/types";
import { Context, Handler } from "hono";
import { db } from "@/core/config";
import { actionHistoryTable } from "@/db/models/action-history.table";
import { logger } from "@/lib/logger";
import { komodoService } from "@/services/komodo";

async function saveHistory(
	user: User,
	stack: string,
	action: string,
	success: boolean,
	message: string,
) {
	try {
		await db.insert(actionHistoryTable).values({
			userId: user.id,
			userName: user.name ?? null,
			userEmail: (user as any).email ?? null,
			stack,
			action,
			success,
			message,
		});
	} catch (err) {
		logger.error("❌ Error guardando historial:", err);
	}
}

export const triggerHandler: Handler = async (c: Context) => {
	const { stack, action } = await c.req.json();
	const user = c.get("user") as User;
	logger.info(`🚀 Deploy trigger — stack: ${stack}, action: ${action}`);

	try {
		if (action === "pull" || action === "pull-redeploy") {
			await komodoService.pullImage(stack);
		}
		if (action === "redeploy" || action === "pull-redeploy") {
			await komodoService.redeploy(stack);
		}

		const message = `Acción '${action}' completada para '${stack}'`;
		await saveHistory(user, stack, action, true, message);

		return c.json({ success: true, message, stack, action }, 200);
	} catch (error) {
		const message =
			error instanceof Error ? error.message : "Error desconocido";
		logger.error(`❌ Error en deploy — stack: ${stack}:`, error);
		await saveHistory(user, stack, action, false, message);

		return c.json({ success: false, message, stack, action }, 500);
	}
};
