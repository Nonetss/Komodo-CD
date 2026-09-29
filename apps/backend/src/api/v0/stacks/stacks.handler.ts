import { Context, Handler } from "hono";
import { logger } from "@/lib/logger";
import { komodoService } from "@/services/komodo";

export const stacksHandler: Handler = async (c: Context) => {
	try {
		const stacks = await komodoService.listAllStacks();
		return c.json({ success: true, stacks }, 200);
	} catch (error) {
		logger.error("❌ Error listando stacks:", error);
		return c.json(
			{ error: error instanceof Error ? error.message : "Error desconocido" },
			500,
		);
	}
};
